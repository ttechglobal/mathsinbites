import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

function getExamName(classLevel) {
  if (classLevel === 'JSS3') return 'BECE (Basic Education Certificate Examination, Nigeria)'
  if (classLevel === 'SS3')  return 'WAEC, NECO, and JAMB'
  if (['SS1','SS2'].includes(classLevel)) return 'WAEC and NECO'
  return null
}

async function ask(prompt, maxTokens, label) {
  console.log(`[pq:${label}] starting`)
  const comp = await deepseek.chat.completions.create({
    model: 'deepseek-chat', max_tokens: maxTokens, temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = comp.choices[0].message.content || ''
  if (comp.choices[0].finish_reason === 'length') throw new Error(`[pq:${label}] truncated`)
  console.log(`[pq:${label}] done, len=${raw.length}`)
  const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()
  try { return JSON.parse(clean) }
  catch(e) { console.error(`[pq:${label}] parse fail, tail: ${clean.slice(-200)}`); throw e }
}

async function fetchExamQuestions(topicTitle, classLevel, examName, count) {
  console.log(`[pq:exam] searching for ${examName} on "${topicTitle}"`)
  try {
    const arr = await ask(`Search your knowledge for ${count} real past examination questions on "${topicTitle}" from ${examName} for Nigerian ${classLevel} students.

Return ONLY a raw JSON array:
[{
  "question_text": "question text",
  "options": [
    {"option_text": "A. ...", "is_correct": false},
    {"option_text": "B. ...", "is_correct": true},
    {"option_text": "C. ...", "is_correct": false},
    {"option_text": "D. ...", "is_correct": false}
  ],
  "explanation": "full worked solution",
  "difficulty": "medium",
  "exam_tag": "WAEC",
  "exam_year": "2019"
}]

Use real recalled questions where possible (set actual year). If constructing in exam style, set exam_year to "style". Return ONLY the JSON array.`, 3000, 'exam')
    return Array.isArray(arr) ? arr : []
  } catch(e) { console.warn('[pq:exam] failed:', e.message); return [] }
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 })

  const { topicId, subtopicId, count = 20, includeExam = true } = await request.json()
  if (!topicId) return Response.json({ error: 'topicId required' }, { status: 400 })

  const { data: topic } = await supabase
    .from('topics')
    .select('*, unit:units(*, term:terms(*, level:levels(*)))')
    .eq('id', topicId).single()
  if (!topic) return Response.json({ error: 'Topic not found' }, { status: 404 })

  let subtopic = null
  if (subtopicId) {
    const { data } = await supabase.from('subtopics').select('*').eq('id', subtopicId).single()
    subtopic = data
  }

  const classLevel  = topic.unit?.term?.level?.name || 'JSS1'
  const topicTitle  = subtopic ? `${topic.title} — ${subtopic.title}` : topic.title
  const examName    = getExamName(classLevel)
  const ctx         = `${classLevel} | ${topic.unit?.term?.name || ''} | Topic: ${topicTitle}`

  const examCount   = (examName && includeExam) ? Math.ceil(count * 0.3) : 0
  const customCount = count - examCount
  const easyCount   = Math.round(customCount * 0.35)
  const medCount    = Math.round(customCount * 0.40)
  const hardCount   = customCount - easyCount - medCount

  const customPrompt = `You are an expert Nigerian secondary school maths teacher. Context: ${ctx}. NERDC curriculum.

Generate exactly ${customCount} practice questions on "${topicTitle}" for ${classLevel} students.
Distribution: ${easyCount} easy, ${medCount} medium, ${hardCount} hard.
Use Nigerian contexts: Naira, Lagos, Abuja, names like Emeka, Amina, Chidi, Ngozi, Tunde.
Wrong options must be plausible common student errors.

Return ONLY a raw JSON array — no markdown:
[{
  "question_text": "question",
  "options": [
    {"option_text": "option A", "is_correct": true},
    {"option_text": "option B", "is_correct": false},
    {"option_text": "option C", "is_correct": false},
    {"option_text": "option D", "is_correct": false}
  ],
  "explanation": "Full worked solution every step",
  "hint": "starting approach hint",
  "difficulty": "easy"
}]`

  const tasks = [ask(customPrompt, 6000, 'custom')]
  if (examCount > 0) tasks.push(fetchExamQuestions(topicTitle, classLevel, examName, examCount))

  let customQs = [], examQs = []
  try {
    const results = await Promise.allSettled(tasks)
    customQs = results[0].status === 'fulfilled' ? (results[0].value || []) : []
    examQs   = results[1]?.status === 'fulfilled' ? (results[1].value || []) : []
    if (results[0].status === 'rejected') throw results[0].reason
  } catch(err) {
    return Response.json({ error: 'Generation failed', detail: err.message }, { status: 500 })
  }

  const allQs = [
    ...customQs.map(q => ({ ...q, exam_tag: null, exam_year: null })),
    ...examQs,
  ]

  let saved = 0, failed = 0
  for (const q of allQs) {
    const { data: pq, error: pqErr } = await supabase
      .from('practice_questions')
      .insert({
        topic_id: topicId, subtopic_id: subtopicId || null,
        class_level: classLevel, question_text: q.question_text,
        difficulty: q.difficulty || 'medium', hint: q.hint || null,
        explanation: q.explanation || null, exam_tag: q.exam_tag || null,
        exam_year: q.exam_year || null, is_active: true, is_reviewed: false,
        generated_by: user.id,
      })
      .select('id').single()

    if (pqErr) { failed++; continue }

    await supabase.from('practice_question_options').insert(
      (q.options || []).map(o => ({ question_id: pq.id, option_text: o.option_text, is_correct: o.is_correct }))
    )
    saved++
  }

  return Response.json({ success: true, saved, failed, customCount: customQs.length, examCount: examQs.length })
}