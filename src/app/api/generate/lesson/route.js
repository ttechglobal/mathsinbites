import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

// ── DeepSeek call with logging ────────────────────────────────────────────────
async function ask(prompt, maxTokens, label) {
  console.log(`[gen:${label}] starting, maxTokens=${maxTokens}`)
  const comp = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: maxTokens,
    temperature: 0.6,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = comp.choices[0].message.content || ''
  const reason = comp.choices[0].finish_reason
  console.log(`[gen:${label}] done, finish_reason=${reason}, raw_length=${raw.length}`)
  if (reason === 'length') throw new Error(`[gen:${label}] truncated at ${maxTokens} tokens`)
  const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()
  try {
    return JSON.parse(clean)
  } catch (e) {
    console.error(`[gen:${label}] JSON parse error: ${e.message}`)
    console.error(`[gen:${label}] head: ${clean.slice(0,300)}`)
    console.error(`[gen:${label}] tail: ${clean.slice(-300)}`)
    throw e
  }
}

// ── Single SVG generation ─────────────────────────────────────────────────────
async function genSvg(slideTitle, slideExplanation, slideType) {
  const comp = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 1200,
    temperature: 0.5,
    messages: [{
      role: 'user',
      content: `Create one educational SVG diagram for a Nigerian secondary school maths student.

Slide title: "${slideTitle}"
Concept: "${(slideExplanation || '').slice(0, 250)}"

Return ONLY the raw SVG — no markdown, no explanation.
- viewBox="0 0 340 180" width="340" height="180"
- First element: <rect width="340" height="180" fill="#FAFAFA"/>
- Draw a clear educational diagram showing this specific concept
- Colours: #5C6BC0 shapes, #EF5350 highlights, #26A69A secondary, #222 labels
- font-size="13" font-family="sans-serif" for labels
- Simple elements only: rect, circle, line, polygon, text — no complex paths
- Include labels and numbers that aid understanding`,
    }],
  })
  const raw = (comp.choices[0].message.content || '').trim()
  const match = raw.match(/<svg[\s\S]*?<\/svg>/i)
  return match ? match[0] : null
}

// ── Save slides + questions to Supabase ───────────────────────────────────────
async function saveLesson(supabase, lessonId, slides, questions, subtopicId, userId) {
  await supabase.from('slides').delete().eq('lesson_id', lessonId)
  await supabase.from('questions').delete().eq('lesson_id', lessonId)

  const slideRows = slides.map(s => ({
    lesson_id:        lessonId,
    order_index:      s.order_index ?? 0,
    type:             s.type || 'concept',
    title:            s.title || '',
    explanation:      s.explanation || '',
    formula:          s.formula || null,
    formula_note:     s.formula_note || null,
    hint:             s.hint || null,
    steps:            s.steps ? JSON.stringify(s.steps) : null,
    svg_code:         s.svg_code || null,
    has_illustration: !!(s.svg_code),
  }))

  const { error: slidesErr } = await supabase.from('slides').insert(slideRows)
  if (slidesErr) console.error('[gen] slides insert error:', slidesErr.message, JSON.stringify(slidesErr))

  for (const q of questions) {
    const { data: qRow, error: qErr } = await supabase
      .from('questions')
      .insert({
        lesson_id:     lessonId,
        order_index:   q.order_index ?? 0,
        question_text: q.question_text,
        difficulty:    q.difficulty || 'medium',
        hint:          q.hint || null,
        explanation:   q.explanation || null,
      })
      .select().single()
    if (qErr) { console.error('[gen] question insert error:', qErr.message); continue }
    await supabase.from('question_options').insert(
      (q.options || []).map(o => ({ question_id: qRow.id, option_text: o.option_text, is_correct: o.is_correct }))
    )
  }

  await supabase.from('generation_logs').insert({
    subtopic_id:    subtopicId,
    lesson_id:      lessonId,
    generated_by:   userId,
    slide_count:    slideRows.length,
    question_count: questions.length,
  }).then(({ error }) => { if (error) console.warn('[gen] log insert:', error.message) })

  await supabase.from('subtopics')
    .update({ is_published: true, generated_at: new Date().toISOString() })
    .eq('id', subtopicId)
    .then(({ error }) => { if (error) console.warn('[gen] subtopic update:', error.message) })

  console.log(`[gen] saved: ${slideRows.length} slides, ${questions.length} questions`)
  return Response.json({ success: true, lessonId, slideCount: slideRows.length, questionCount: questions.length })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { subtopicId } = await request.json()
  if (!subtopicId) return Response.json({ error: 'subtopicId required' }, { status: 400 })

  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('*, topic:topics(*, unit:units(*, term:terms(*, level:levels(*))))')
    .eq('id', subtopicId)
    .single()
  if (!subtopic) return Response.json({ error: 'Subtopic not found' }, { status: 404 })

  const level = subtopic.topic?.unit?.term?.level?.name || 'JSS1'
  const term  = subtopic.topic?.unit?.term?.name || 'Term 1'
  const unit  = subtopic.topic?.unit?.name || ''
  const topic = subtopic.topic?.name || ''
  const title = subtopic.title
  const ctx   = `${level} | ${term} | Unit: ${unit} | Topic: ${topic} | Subtopic: ${title}`

  // ── CALL 1 + 2 in parallel: text content + questions ─────────────────────
  const textPrompt = `You are an expert Nigerian secondary school maths teacher. Context: ${ctx}. Students aged 11-14, NERDC curriculum.

Return ONLY a raw JSON object — no markdown fences, no text before or after.

{
  "lesson_title": "${title}",
  "lesson_summary": "One sentence: what students will understand and be able to do after this lesson.",
  "hook": "2-3 sentences. Vivid Nigerian real-world scenario for ${title} — Iya Basira's market stall, WAEC prep, football scores, data bundles. End with a question that hooks the student.",
  "slides": [
    {
      "order_index": 0,
      "type": "concept",
      "title": "Catchy title — feels like a revelation",
      "explanation": "3 short paragraphs. Nigerian hook first, then the concept clearly explained, then why it matters. Short sentences.",
      "formula": "key formula string or null",
      "formula_note": "brief variable guide or null",
      "hint": "one sharp memorable trick",
      "steps": null
    }
  ]
}

Slides order:
1. Three to four slides type "concept" or "definition" — build concept from simple to complex
2. Two slides type "worked_example" — real Nigerian names/numbers; explanation = problem statement; steps = 4 objects {label, text} showing full working
3. One slide type "you_try" — new problem; explanation = problem statement; steps = full solution (shown only when student requests)

Sequential order_index from 0. Return ONLY the JSON.`

  const questionsPrompt = `You are an expert Nigerian secondary school maths teacher. Context: ${ctx}. Students aged 11-14, NERDC curriculum.

Return ONLY a raw JSON object — no markdown fences, no text before or after.

{
  "questions": [
    {
      "order_index": 0,
      "question_text": "Question with Nigerian context (Naira, Lagos, market, school)",
      "difficulty": "easy",
      "hint": "Which formula or step to start with?",
      "explanation": "Full worked solution — every step shown",
      "options": [
        {"option_text": "Correct answer", "is_correct": true},
        {"option_text": "Plausible wrong — common student error", "is_correct": false},
        {"option_text": "Plausible wrong", "is_correct": false},
        {"option_text": "Plausible wrong", "is_correct": false}
      ]
    }
  ]
}

Exactly 5 questions: index 0-1 easy, 2-3 medium, 4 hard.
Each: exactly 4 options, exactly 1 correct. Wrong answers = plausible common errors.
Return ONLY the JSON.`

  let textData, questionsData
  try {
    ;[textData, questionsData] = await Promise.all([
      ask(textPrompt, 6000, 'slides'),
      ask(questionsPrompt, 3000, 'questions'),
    ])
  } catch (err) {
    console.error('[gen] generation failed:', err.message)
    return Response.json({ error: 'Generation failed', detail: err.message }, { status: 500 })
  }

  const slides    = textData.slides    || []
  const questions = questionsData.questions || []
  console.log(`[gen] slides=${slides.length}, questions=${questions.length}`)

  // ── CALL 3: SVGs in parallel ──────────────────────────────────────────────
  console.log(`[gen] generating ${slides.length} SVGs in parallel`)
  const svgResults = await Promise.allSettled(
    slides.map((s, i) => genSvg(s.title, s.explanation, s.type).then(svg => {
      console.log(`[gen] svg[${i}] ok, length=${svg?.length}`)
      return svg
    }))
  )
  slides.forEach((s, i) => {
    const r = svgResults[i]
    s.svg_code = r.status === 'fulfilled' ? r.value : null
    if (r.status === 'rejected') console.warn(`[gen] svg[${i}] failed:`, r.reason?.message)
  })
  console.log('[gen] SVGs done')

  // ── Upsert lesson row ─────────────────────────────────────────────────────
  // Try with hook first, fall back without it if column missing
  let lessonId
  for (const withHook of [true, false]) {
    const upsertData = {
      subtopic_id: subtopicId,
      title:       textData.lesson_title   || title,
      summary:     textData.lesson_summary || `Learn about ${title}`,
      ...(withHook && textData.hook ? { hook: textData.hook } : {}),
    }
    const { data: lesson, error } = await supabase
      .from('lessons')
      .upsert(upsertData, { onConflict: 'subtopic_id' })
      .select('id')
      .single()

    if (error) {
      console.error(`[gen] lesson upsert failed (withHook=${withHook}):`, error.message, error.code)
      if (!withHook) return Response.json({ error: 'Failed to save lesson', detail: error.message }, { status: 500 })
      continue // retry without hook
    }
    lessonId = lesson.id
    console.log(`[gen] lesson upserted id=${lessonId} withHook=${withHook}`)
    break
  }

  return saveLesson(supabase, lessonId, slides, questions, subtopicId, user.id)
}