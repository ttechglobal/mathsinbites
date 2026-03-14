import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── Claude call with logging ───────────────────────────────────────────────────
async function ask(prompt, maxTokens, label) {
  console.log(`[gen:${label}] starting, maxTokens=${maxTokens}`)
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = msg.content[0]?.text || ''
  const stopReason = msg.stop_reason
  console.log(`[gen:${label}] done, stop_reason=${stopReason}, raw_length=${raw.length}`)
  if (stopReason === 'max_tokens') throw new Error(`[gen:${label}] truncated at ${maxTokens} tokens`)
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

// ── Single SVG generation ──────────────────────────────────────────────────────
// Returns null for you_try slides (no image needed there — saves API credits)
async function genSvg(slideTitle, slideExplanation, slideType) {
  if (slideType === 'you_try') return null

  const isExample = slideType === 'worked_example'
  const isIntro = slideType === 'introduction'

  const contentRules = isIntro
    ? `You are drawing a REAL-WORLD SCENE that shows why this maths topic matters in Nigerian life.
- Draw a vivid everyday Nigerian scene: a market stall with prices, a keke napep with passengers, a phone showing recharge card credit, a field being measured, a buka restaurant bill, suya portions being shared, etc.
- The scene should make a child think "oh! this maths is in MY world"
- Include Nigerian names, ₦ naira signs, or familiar objects
- Make it warm, colourful, and relatable — not abstract`
    : isExample
    ? `You are drawing a VISUAL SOLUTION to a maths problem.
- Show the numbers and working visually: a table, a number line with jumps, objects being counted/grouped, arrows showing steps
- Use ₦ naira signs and Nigerian names where the problem uses them
- The child should see the answer path just by looking`
    : `You are drawing a CONCEPT DIAGRAM that makes one maths idea crystal clear.
- Think: how would a brilliant teacher draw this on a whiteboard to make a 10-year-old say "I get it!"
- Use: number lines with jumps, place-value blocks, fraction bars, geometric shapes with labels, bar models, arrays of objects, comparison diagrams
- Nigerian context where it fits naturally (sharing suya, stacking gala, measuring a room)
- Label every key part clearly
- ONE clear idea only — no clutter`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1800,
    messages: [{
      role: 'user',
      content: `You are creating an educational SVG for a Nigerian primary/secondary school maths lesson.

Slide title: "${slideTitle}"
Concept: "${(slideExplanation || '').slice(0, 350)}"

${contentRules}

GOAL: A child should look at this image for 3 seconds and understand the concept better — no reading required.

Return ONLY the raw SVG. No markdown, no explanation. Start with <svg, end with </svg>.

TECHNICAL RULES:
- viewBox="0 0 360 200" width="360" height="200"
- Background: <rect width="360" height="200" rx="12" fill="#F0F4FF"/>
- Main palette: #4F46E5 indigo (primary shapes), #10B981 green (correct/positive), #F59E0B amber (highlight/warm), #EF4444 red (contrast), #1E293B near-black (text)
- Accent fills: use light tints like #EEF2FF, #ECFDF5, #FEF3C7 for backgrounds of grouped elements
- font-family="system-ui, sans-serif" on all text
- font-size: 14 for main labels, 12 for secondary, 10 for small annotations
- font-weight="700" for emphasis on key numbers/labels
- Shapes: rect (rx="6" for rounded), circle, line, polyline, polygon, simple path
- Arrow heads: use a filled polygon triangle, e.g. <polygon points="x1,y1 x2,y2 x3,y3" fill="#4F46E5"/>
- NO foreignObject, NO clip-path, NO filter effects
- Keep all elements within x=10..350, y=10..190
- Make it RICH and detailed — empty space is wasted learning opportunity`,
    }],
  })
  const raw = (msg.content[0]?.text || '').trim()
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

// ── Nigerian context reference for prompts ────────────────────────────────────
const NIGERIAN_CONTEXTS = `
Nigerian names to use (draw from all regions): Emeka, Amina, Chidi, Ngozi, Tunde, Fatima, Bola, Kemi, Uche, Halima, Danladi, Ifunanya, Segun, Blessing, Musa, Chisom, Yusuf, Adaeze, Ola, Zainab, Biodun, Chiamaka, Ibrahim, Sade, Jide, Nkechi, Ladi, Taiwo, Efua, Dauda.
Nigerian cities & regions (use variety — not just Lagos): Lagos, Kano, Abuja, Enugu, Port Harcourt, Ibadan, Kaduna, Aba, Jos, Warri, Benin City, Calabar, Sokoto, Zaria, Onitsha, Abeokuta, Ilorin, Owerri, Asaba, Maiduguri, Makurdi.
Nigerian everyday contexts: naira (₦), market stalls, school fees, danfo/molue fare, boli and groundnut, suya, gala, recharge cards, okada, keke napep, NEPA blackout/generator, WAEC/NECO exams, farm produce, fish market, data bundles, Iya Basira's shop, buka restaurant, PTA levy, savings contributions (ajo/esusu).
`

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

  // ── CALL 1 + 2 in parallel: text content + questions ──────────────────────
  const textPrompt = `You are the most effective maths teacher in Nigeria. You have 20 years experience teaching children aged 8-17. You know how to explain ANY concept from absolute zero — no assumptions, no skipping steps. Context: ${ctx}.

Think of yourself explaining this to a 10-year-old child who has NEVER heard of this topic before. Every word must be simple. Every step must be shown. Use everyday Nigerian life to make it real.

Return ONLY a raw JSON object — no markdown fences, no text before or after.

CRITICAL WRITING RULES:
- Explanations: SHORT sentences. MAX 2 paragraphs of 2-3 sentences each per slide.
- Language: simple everyday English a primary school child can read. No big words.
- Start from the very beginning — assume the student knows NOTHING about this topic.
- Build up slowly, one tiny idea at a time.
- Use ^ for exponents (2^8), use _ for subscripts (a_n) — never unicode symbols.
- Nigerian context: weave in names, places, money (₦), everyday objects naturally.
- The SVG image does the heavy lifting — your text explains what the image shows.

{
  "lesson_title": "${title}",
  "lesson_summary": "One sentence a child can understand: what they will be able to DO after this lesson.",
  "hook": "2-3 friendly sentences. Paint a real Nigerian everyday moment that secretly uses ${title}. Make the child think — wait, I already know this? End with one simple question that sparks curiosity.",
  "slides": [
    {
      "order_index": 0,
      "type": "introduction",
      "title": "What is [topic]? — short, friendly title",
      "explanation": "Paragraph 1: One relatable Nigerian example that shows this topic in real life. Paragraph 2: In the simplest possible words, what this lesson is about. No maths yet — just the idea.",
      "formula": null,
      "formula_note": null,
      "hint": null,
      "steps": null
    },
    {
      "order_index": 1,
      "type": "concept",
      "title": "The very first idea — start from scratch",
      "explanation": "Paragraph 1: The simplest possible version of this concept. Use an analogy a child knows. Paragraph 2: One more sentence connecting it to maths. Keep it tiny.",
      "formula": "Key formula if needed — use ^ and _ notation. Or null.",
      "formula_note": "What each symbol means in plain English. Or null.",
      "hint": "One clever trick or rhyme the child can remember forever.",
      "steps": null
    }
  ]
}

SLIDE STRUCTURE — generate in this EXACT order:
1. ONE "introduction" slide — What is this topic? A real Nigerian life scene + the simplest possible intro. NO maths yet.
2. TWO to THREE "concept" slides — each builds ONE new idea on top of the last. Start from zero. Use the tiniest possible steps. Each slide: ONE idea only.
3. TWO "worked_example" slides — show a complete Nigerian problem solved step by step. explanation = the problem statement (simple, short). steps = array of {label, text} objects showing EVERY single step, written like you are explaining to a 9-year-old. No skipping. No shorthand.
4. ONE "you_try" slide — a fresh problem for the student. explanation = problem only. steps = complete solution shown simply (revealed when student taps).

WORKED EXAMPLE STEPS RULE — each step object must be:
{ "label": "Step 1 — short name", "text": "What we do AND why, in plain English. Show the number. Show the calculation. Explain the result." }
Never skip a step. Never say 'therefore' without showing the working. Imagine you are showing your working on paper.

Return ONLY the JSON. No markdown.

${NIGERIAN_CONTEXTS}`

  const questionsPrompt = `You are a patient Nigerian maths teacher creating practice questions for children aged 8-17. Context: ${ctx}.

Return ONLY a raw JSON object — no markdown fences, no text before or after.

{
  "questions": [
    {
      "order_index": 0,
      "question_text": "A simple question using everyday Nigerian life. Short. One idea.",
      "difficulty": "easy",
      "hint": "A gentle nudge — which step to start with, in plain English.",
      "explanation": "Walk through the FULL solution like you are explaining to a 9-year-old.\nStep 1: Start here because...\nStep 2: Now we do this...\nStep 3: So the answer is... because...",
      "options": [
        {"option_text": "The correct answer", "is_correct": true},
        {"option_text": "A wrong answer that is a common mistake students make", "is_correct": false},
        {"option_text": "Another plausible wrong answer", "is_correct": false},
        {"option_text": "Another plausible wrong answer", "is_correct": false}
      ]
    }
  ]
}

Generate exactly 3 questions: index 0 = easy, 1 = medium, 2 = hard.
Each: exactly 4 options, exactly 1 correct. Wrong options must be real mistakes children commonly make.

EXPLANATION RULE: Write like you are sitting next to a child. Use newlines to separate steps. Show EVERY calculation. Say WHY each step is done. Never say "obviously" or skip steps.
Use Nigerian contexts from across Nigeria — Kano, Enugu, Port Harcourt, Jos, Abuja, Ibadan, not just Lagos.
Return ONLY the JSON.

${NIGERIAN_CONTEXTS}`

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

  // ── CALL 3: SVGs in parallel ───────────────────────────────────────────────
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

  // ── Upsert lesson row ──────────────────────────────────────────────────────
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
      continue
    }
    lessonId = lesson.id
    console.log(`[gen] lesson upserted id=${lessonId} withHook=${withHook}`)
    break
  }

  return saveLesson(supabase, lessonId, slides, questions, subtopicId, user.id)
}