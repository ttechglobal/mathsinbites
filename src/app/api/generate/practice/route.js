import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

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

  const prompt = `Nigerian secondary school maths teacher. Generate exactly ${batchCount} MCQ questions on "${topicTitle}" for ${classLevel} (NERDC).

Distribution: ${easyCount} easy, ${medCount} medium, ${hardCount} hard.
Nigerian names (Emeka, Amina, Chidi) and contexts (Naira, Lagos, market).
Wrong options = plausible student errors.

Return ONLY valid JSON array:
[{"question_text":"...","difficulty":"easy","hint":"...","explanation":"1. Step.\n2. Step.\n3. Answer.","options":[{"option_text":"...","is_correct":false},{"option_text":"...","is_correct":true},{"option_text":"...","is_correct":false},{"option_text":"...","is_correct":false}]}]

Rules: vary correct answer position (not always first). Numbered explanation steps. JSON array only.`

  console.log(`[pq:${label}] calling deepseek, count=${batchCount}`)
  const comp = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 3000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw    = comp.choices[0].message.content || ''
  const reason = comp.choices[0].finish_reason
  console.log(`[pq:${label}] done finish=${reason} len=${raw.length}`)

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

    const { topicId, subtopicId, count = 20, includeExam = true } = await request.json()
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

    const classLevel = topic.unit?.term?.level?.name || 'JSS1'
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