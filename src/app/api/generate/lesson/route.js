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
async function genSvg(slideTitle, slideExplanation, slideType) {
  const isExample = ['worked_example', 'you_try'].includes(slideType)
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1600,
    messages: [{
      role: 'user',
      content: `You are creating an educational SVG illustration for a Nigerian secondary school maths lesson.

Slide title: "${slideTitle}"
Concept: "${(slideExplanation || '').slice(0, 300)}"
Slide type: "${slideType}"

GOAL: The illustration must make the concept INSTANTLY clear without reading text. A student should glance at it and say "oh, I get it now."

Return ONLY the raw SVG element — no markdown, no backticks, no explanation. Start with <svg and end with </svg>.

TECHNICAL RULES:
- viewBox="0 0 360 190" width="360" height="190"
- Background: <rect width="360" height="190" rx="10" fill="#F8F9FF"/>
- Palette: #4F46E5 (primary), #EF4444 (highlight/wrong), #10B981 (correct/green), #F59E0B (warm), #1E293B (dark text)
- font-family="system-ui, sans-serif"
- Labels: font-size="12" or "14" for titles, font-size="11" for small text
- Elements: rect, circle, line, polyline, polygon, path (simple), text only
- NO complex clip-paths, NO filters, NO foreignObject

CONTENT RULES:
${isExample ? `- Show the worked problem visually: numbers, arrows, steps or a table
- Use Nigerian currency ₦ or Nigerian names if relevant to the problem` : `- Show a clear visual metaphor or diagram that represents this specific concept
- Use Nigerian context where natural (market stall, phone credit, building floors, football pitch)
- If the concept involves numbers/counting: draw actual objects, blocks, or a number line
- If the concept involves shapes/geometry: draw clean labeled diagrams
- If the concept involves data/graphs: draw a simple bar chart or number line
- ALWAYS label key parts with text inside the SVG
- Use arrows to show relationships or direction`}
- Make it rich and specific to THIS concept — not generic`,
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
Nigerian names (draw from all regions): Emeka, Amina, Chidi, Ngozi, Tunde, Fatima, Bola, Kemi, Uche, Halima, Danladi, Ifunanya, Segun, Blessing, Musa, Chisom, Yusuf, Adaeze, Ola, Zainab, Biodun, Chiamaka, Ibrahim, Sade, Jide, Nkechi, Ladi, Taiwo, Efua, Dauda.
Nigerian cities & regions (use variety — not just Lagos): Lagos, Kano, Abuja, Enugu, Port Harcourt, Ibadan, Kaduna, Aba, Jos, Warri, Benin City, Calabar, Sokoto, Zaria, Onitsha, Abeokuta, Ilorin, Owerri, Asaba, Maiduguri, Makurdi.
Nigerian everyday contexts: naira (₦), market stalls, school fees, danfo/molue fare, boli and groundnut, suya, gala, recharge cards, okada, keke napep, NEPA blackout/generator, WAEC/NECO exams, farm produce, fish market, data bundles, Iya Basira's shop, buka restaurant, PTA levy, savings (ajo/esusu).
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
  const textPrompt = `You are an expert Nigerian secondary school maths teacher creating a bite-sized digital lesson. Context: ${ctx}. Students aged 11-14, NERDC curriculum.

Return ONLY a raw JSON object — no markdown fences, no text before or after.

CRITICAL RULES FOR EXPLANATION TEXT:
- Each slide must have SHORT, punchy explanation text — MAX 3 sentences per paragraph, max 2 paragraphs total
- The SVG illustration does the heavy lifting — text only adds what the image cannot show
- Write like you are texting a smart teenager, not writing a textbook
- Use ^ for exponents: write 2^8 not 2⁸, write x_2 not x₂
- Nigerian contexts: use names, places, everyday situations from across Nigeria

{
  "lesson_title": "${title}",
  "lesson_summary": "One sentence: what students will be able to DO after this lesson.",
  "hook": "2-3 lively sentences. A real Nigerian everyday scenario that connects to ${title}. Use something from daily life — market arithmetic, recharge cards, measuring land, sharing suya, football stats. Draw from different parts of Nigeria. End with one punchy question that makes the student curious.",
  "slides": [
    {
      "order_index": 0,
      "type": "concept",
      "title": "Short punchy title — one idea only",
      "explanation": "MAX 2 short paragraphs. First: one-sentence Nigerian hook. Second: the concept explained simply. The SVG will show the visual — keep text minimal.",
      "formula": "The key formula or rule — use ^ for exponents e.g. 2^8, use _ for subscripts e.g. a_n. Or null if no formula.",
      "formula_note": "One line explaining each variable. Or null.",
      "hint": "One memorable shortcut or trick a student can tattoo on their brain.",
      "steps": null
    }
  ]
}

SLIDE STRUCTURE — generate in this exact order:
1. ONE "introduction" slide — Nigerian hook + what this topic is, with a vivid SVG showing the real-world context
2. TWO to THREE "concept" slides — one clear idea each, building from simple to complex. Each MUST have a strong SVG that shows the concept visually (diagrams, number lines, worked visuals, labeled drawings)
3. TWO "worked_example" slides — real Nigerian names/places; explanation = the problem statement only (short); steps = array of objects {label, text} showing full solution step by step
4. ONE "you_try" slide — fresh problem; explanation = problem statement only; steps = full solution (revealed only when student taps)

Return ONLY the JSON. No markdown.

${NIGERIAN_CONTEXTS}`

  const questionsPrompt = `You are an expert Nigerian secondary school maths teacher. Context: ${ctx}. Students aged 11-14, NERDC curriculum.

Return ONLY a raw JSON object — no markdown fences, no text before or after.

{
  "questions": [
    {
      "order_index": 0,
      "question_text": "Question using a Nigerian context",
      "difficulty": "easy",
      "hint": "What formula or first step to use?",
      "explanation": "Full worked solution — every step shown clearly",
      "options": [
        {"option_text": "Correct answer", "is_correct": true},
        {"option_text": "Plausible wrong — a common student error", "is_correct": false},
        {"option_text": "Plausible wrong", "is_correct": false},
        {"option_text": "Plausible wrong", "is_correct": false}
      ]
    }
  ]
}

Generate exactly 3 questions: index 0 = easy, 1 = medium, 2 = hard.
Each question: exactly 4 options, exactly 1 correct. Wrong answers = common student errors.
Questions should be quick and focused — test one idea at a time.
Use Nigerian names and settings from ACROSS Nigeria — not just Lagos.
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