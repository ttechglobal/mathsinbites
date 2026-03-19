import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getDeepSeek() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })
}

export const maxDuration = 300

function getExamName(classLevel) {
  if (classLevel === 'JSS3') return 'BECE Nigeria'
  if (classLevel === 'SS3')  return 'WAEC/NECO/JAMB'
  if (['SS1','SS2'].includes(classLevel)) return 'WAEC/NECO'
  return null
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

async function generateBatch(topicTitle, classLevel, batchCount, label) {
  const easyCount = Math.round(batchCount * 0.35)
  const medCount  = Math.round(batchCount * 0.40)
  const hardCount = batchCount - easyCount - medCount

  const prompt = `You are an expert Nigerian secondary school maths teacher creating practice questions for ${classLevel} students (NERDC curriculum).

Topic: "${topicTitle}"
Generate exactly ${batchCount} questions: ${easyCount} easy, ${medCount} medium, ${hardCount} hard.

NIGERIAN CONTEXT RULES — draw from ALL of Nigeria, not just Lagos:
- Names: Emeka, Amina, Chidi, Ngozi, Tunde, Fatima, Bola, Kemi, Uche, Halima, Danladi, Ifunanya, Segun, Blessing, Musa, Chisom, Yusuf, Adaeze, Taiwo, Zainab, Biodun, Ibrahim, Sade, Nkechi, Ladi, Efua, Dauda
- Cities: Lagos, Kano, Abuja, Enugu, Port Harcourt, Ibadan, Kaduna, Aba, Jos, Warri, Benin City, Calabar, Sokoto, Onitsha, Abeokuta, Ilorin, Owerri, Maiduguri, Makurdi
- Contexts: naira (₦) prices, market stalls, school fees, danfo/keke fare, farm produce, recharge cards, suya portions, sharing gala, WAEC prep, ajo/esusu savings, okada fare, NEPA bills, data bundles, buka restaurant

QUESTION VARIETY — mix these types across the ${batchCount} questions:
- Word problems using everyday Nigerian scenarios
- Direct calculation (find the value, simplify, solve)
- Conceptual (which of the following is true/false)
- Pattern/sequence recognition
- Application (calculate total, find percentage, determine cost)

ANSWER POSITION — CRITICAL: Vary the correct answer position across ALL questions.
Target: ~25% correct in position A, 25% in B, 25% in C, 25% in D.
NEVER put all correct answers in position A. Mix it up every question.

WRONG OPTIONS must be real mistakes students make: off-by-one, sign errors, wrong formula, correct method wrong arithmetic.

EXPLANATION — write like explaining to a 10-year-old, newline between each step:
"Step 1: First identify what we need...\nStep 2: Apply the method...\nStep 3: Calculate...\nStep 4: The answer is..."

Return ONLY a valid JSON array. No markdown, no extra text:
[{"question_text":"...","difficulty":"easy","hint":"Which formula or first step to use?","explanation":"Step 1: ...\nStep 2: ...\nStep 3: ...","options":[{"option_text":"...","is_correct":false},{"option_text":"...","is_correct":true},{"option_text":"...","is_correct":false},{"option_text":"...","is_correct":false}]}]`

  console.log(`[pq:${label}] calling deepseek, count=${batchCount}`)
  const deepseek  = getDeepSeek()
  const response  = await deepseek.chat.completions.create({
    model:      'deepseek-chat',
    max_tokens: 3000,
    temperature: 0.7,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0]?.message?.content || ''
  console.log(`[pq:${label}] done len=${raw.length}`)

  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(clean)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    const lastBrace = clean.lastIndexOf('},')
    if (lastBrace > 0) {
      try {
        const partial = JSON.parse(clean.slice(0, lastBrace + 1) + ']')
        console.warn(`[pq:${label}] salvaged ${partial.length} from partial`)
        return Array.isArray(partial) ? partial : []
      } catch { /* ignore */ }
    }
    console.error(`[pq:${label}] parse failed`)
    return []
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 })

    const { topicId, subtopicId, count = 20, includeExam = true, subject = 'maths' } = await request.json()
    if (!topicId) return Response.json({ error: 'topicId required' }, { status: 400 })

    const { data: topic, error: topicErr } = await supabase
      .from('topics')
      .select('*, unit:units(*, term:terms(*, level:levels(*)))')
      .eq('id', topicId)
      .single()

    if (topicErr || !topic) return Response.json({ error: 'Topic not found' }, { status: 404 })

    let subtopic = null
    if (subtopicId) {
      const { data } = await supabase.from('subtopics').select('*').eq('id', subtopicId).single()
      subtopic = data
    }

    const classLevel = topic.unit?.term?.level?.code || topic.unit?.term?.level?.name || 'JSS1'
    const topicTitle = subtopic ? `${topic.title} — ${subtopic.title}` : topic.title
    const examName   = getExamName(classLevel)

    console.log(`[pq] start: "${topicTitle}" ${classLevel} count=${count}`)

    const BATCH_SIZE = 10
    const examCount  = (examName && includeExam) ? Math.min(Math.ceil(count * 0.3), 6) : 0
    const mainCount  = count - examCount

    // Split into batches of 10 max
    const batches = []
    let remaining = mainCount
    while (remaining > 0) {
      batches.push(Math.min(remaining, BATCH_SIZE))
      remaining -= BATCH_SIZE
    }

    console.log(`[pq] batches: ${batches.join('+')} custom + ${examCount} exam — running in parallel`)

    // All batches run in parallel
    const batchPromises = batches.map((batchCount, i) =>
      generateBatch(topicTitle, classLevel, batchCount, `batch${i+1}`)
        .catch(e => { console.error(`[pq] batch${i+1} failed:`, e.message); return [] })
    )

    if (examCount > 0 && examName) {
      batchPromises.push(
        generateBatch(topicTitle, classLevel, examCount, 'exam')
          .then(qs => qs.map(q => ({ ...q, exam_tag: examName.split('/')[0], exam_year: 'style' })))
          .catch(e => { console.error('[pq] exam failed:', e.message); return [] })
      )
    }

    const batchResults = await Promise.all(batchPromises)

    const customQs = batchResults.slice(0, batches.length).flat()
    const examQs   = examCount > 0 ? (batchResults[batchResults.length - 1] || []) : []

    console.log(`[pq] generated: ${customQs.length} custom + ${examQs.length} exam`)

    if (customQs.length === 0 && examQs.length === 0) {
      return Response.json({ error: 'Generation produced no questions — try again' }, { status: 500 })
    }

    const allQs = [
      ...customQs.map(q => ({ ...q, exam_tag: null, exam_year: null })),
      ...examQs,
    ]

    let saved = 0, failed = 0
    for (const q of allQs) {
      if (!q?.question_text || !Array.isArray(q?.options) || q.options.length < 2) {
        failed++
        continue
      }

      const { data: pq, error: pqErr } = await supabase
        .from('practice_questions')
        .insert({
          topic_id:      topicId,
          subtopic_id:   subtopicId || null,
          class_level:   classLevel,
          subject:       subject,
          question_text: q.question_text,
          difficulty:    q.difficulty || 'medium',
          hint:          q.hint || null,
          explanation:   q.explanation || null,
          exam_tag:      q.exam_tag || null,
          exam_year:     q.exam_year || null,
          is_active:     true,
          is_reviewed:   false,
          generated_by:  user.id,
        })
        .select('id')
        .single()

      if (pqErr) { console.error('[pq] insert error:', pqErr.message); failed++; continue }

      await supabase
        .from('practice_question_options')
        .insert(shuffleArray(q.options).map(o => ({
          question_id: pq.id,
          option_text: o.option_text,
          is_correct:  !!o.is_correct,
        })))

      saved++
    }

    console.log(`[pq] done: saved=${saved} failed=${failed}`)
    return Response.json({ success: true, saved, failed, customCount: customQs.length, examCount: examQs.length })

  } catch (err) {
    console.error('[pq] fatal:', err.message)
    return Response.json({ error: 'Internal server error', detail: err.message }, { status: 500 })
  }
}