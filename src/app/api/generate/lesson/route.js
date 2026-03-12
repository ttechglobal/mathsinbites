import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { subtopicId } = body
  if (!subtopicId) return Response.json({ error: 'subtopicId required' }, { status: 400 })

  // Get subtopic + topic + level context
  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('*, topic:topics(*, unit:units(*, term:terms(*, level:levels(*))))')
    .eq('id', subtopicId)
    .single()

  if (!subtopic) return Response.json({ error: 'Subtopic not found' }, { status: 404 })

  const levelName  = subtopic.topic?.unit?.term?.level?.name || 'JSS1'
  const termName   = subtopic.topic?.unit?.term?.name || 'Term 1'
  const unitName   = subtopic.topic?.unit?.name || ''
  const topicName  = subtopic.topic?.name || ''
  const subtopicTitle = subtopic.title

  // Build rich generation prompt
  const prompt = `You are an expert Nigerian mathematics teacher creating lesson content for ${levelName} (${termName}) students aged 11-14.

Topic: ${topicName}
Unit: ${unitName}  
Subtopic: ${subtopicTitle}
Curriculum: Nigerian Secondary School (NERDC)

Generate a complete, engaging lesson in JSON format with this EXACT structure:

{
  "lesson_title": "${subtopicTitle}",
  "lesson_summary": "One sentence describing what students will learn",
  "slides": [
    {
      "order_index": 0,
      "type": "concept",
      "title": "Catchy slide title — make it feel like a revelation",
      "explanation": "2-3 paragraphs. Start with a real-world hook relevant to Nigerian students (market, football, school, cooking, etc). Explain the concept clearly using everyday language. Use short sentences. End with WHY this matters.",
      "formula": "KEY FORMULA or RULE here (use proper math notation, e.g. A = ½ × b × h). Use newlines for multiple lines.",
      "formula_note": "Brief note explaining each variable in the formula",
      "hint": "One sharp, memorable tip or trick students can use to remember this",
      "steps": null
    },
    {
      "order_index": 1,
      "type": "definition",
      "title": "Key Terms You Must Know",
      "explanation": "Define 3-4 key vocabulary words students need. Format each as: TERM: definition. Make definitions simple and concrete.",
      "formula": null,
      "formula_note": null,
      "hint": "One memory trick for the hardest term",
      "steps": null
    },
    {
      "order_index": 2,
      "type": "worked_example",
      "title": "Let's Solve One Together",
      "explanation": "Present a worked example problem. State the problem clearly first.",
      "formula": null,
      "formula_note": null,
      "hint": "Common mistake to avoid in this type of problem",
      "steps": [
        { "label": "Step 1: Write down what you know", "text": "Identify the given values and what you need to find" },
        { "label": "Step 2: Choose the right method", "text": "Which formula or approach applies here?" },
        { "label": "Step 3: Substitute and solve", "text": "Show the working clearly, line by line" },
        { "label": "Step 4: State your answer", "text": "Write the final answer with correct units" },
        { "label": "Step 5: Check it makes sense", "text": "Does this answer seem reasonable? Verify it." }
      ]
    }
  ],
  "questions": [
    {
      "order_index": 0,
      "question_text": "Direct question testing the core concept. Use a real-world Nigerian context when possible.",
      "difficulty": "easy",
      "hint": "Which formula should you start with?",
      "explanation": "Full worked solution: show every step of how to reach the answer.",
      "options": [
        { "option_text": "Correct answer here", "is_correct": true },
        { "option_text": "Plausible wrong answer — common mistake", "is_correct": false },
        { "option_text": "Another plausible wrong answer", "is_correct": false },
        { "option_text": "Another plausible wrong answer", "is_correct": false }
      ]
    },
    {
      "order_index": 1,
      "question_text": "Second question — slightly harder, tests understanding not just recall.",
      "difficulty": "medium",
      "hint": "Think about what changes when...",
      "explanation": "Full worked solution with every step shown.",
      "options": [
        { "option_text": "Correct answer", "is_correct": true },
        { "option_text": "Wrong answer A", "is_correct": false },
        { "option_text": "Wrong answer B", "is_correct": false },
        { "option_text": "Wrong answer C", "is_correct": false }
      ]
    },
    {
      "order_index": 2,
      "question_text": "Third question — applies the concept in a new or extended situation.",
      "difficulty": "hard",
      "hint": "Start by identifying all the given information.",
      "explanation": "Full step-by-step worked solution.",
      "options": [
        { "option_text": "Correct answer", "is_correct": true },
        { "option_text": "Wrong answer A", "is_correct": false },
        { "option_text": "Wrong answer B", "is_correct": false },
        { "option_text": "Wrong answer C", "is_correct": false }
      ]
    }
  ]
}

RULES:
- All 3 slides must be fully populated with rich, accurate content specific to ${subtopicTitle}
- The worked_example MUST have real numbers and a real problem (not placeholders)
- All 3 questions must have exactly 4 options each, exactly 1 correct per question
- Wrong answer options should be plausible (common errors, not obviously wrong)
- Explanations for questions must show full working — students need to learn from mistakes
- Use Nigerian contexts: Naira, Nigerian cities, Nigerian foods, Nigerian sports where appropriate
- Write at the right level for ${levelName} — not too simple, not too advanced
- Respond with ONLY the JSON object. No markdown, no preamble, no explanation.`

  let generated
  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices[0].message.content
    // Strip any markdown fences if DeepSeek wraps it
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    generated = JSON.parse(cleaned)
  } catch (err) {
    console.error('DeepSeek generation/parse error:', err)
    return Response.json({ error: 'Generation failed', detail: err.message }, { status: 500 })
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────────

  // 1. Upsert lesson row
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .upsert({ subtopic_id: subtopicId, title: generated.lesson_title, summary: generated.lesson_summary }, { onConflict: 'subtopic_id' })
    .select()
    .single()

  if (lessonErr) return Response.json({ error: 'Failed to save lesson', detail: lessonErr.message }, { status: 500 })

  const lessonId = lesson.id

  // 2. Delete old slides + questions for this lesson (clean regenerate)
  await supabase.from('slides').delete().eq('lesson_id', lessonId)
  await supabase.from('questions').delete().eq('lesson_id', lessonId)

  // 3. Insert slides
  const slideRows = (generated.slides || []).map(s => ({
    lesson_id:    lessonId,
    order_index:  s.order_index ?? 0,
    type:         s.type || 'concept',
    title:        s.title,
    explanation:  s.explanation,
    formula:      s.formula || null,
    formula_note: s.formula_note || null,
    hint:         s.hint || null,
    steps:        s.steps ? JSON.stringify(s.steps) : null,
    has_illustration: false,
  }))

  const { error: slidesErr } = await supabase.from('slides').insert(slideRows)
  if (slidesErr) console.error('Slides insert error:', slidesErr.message)

  // 4. Insert questions + options
  for (const q of (generated.questions || [])) {
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
      .select()
      .single()

    if (qErr) { console.error('Question insert error:', qErr.message); continue }

    const optRows = (q.options || []).map(o => ({
      question_id: qRow.id,
      option_text: o.option_text,
      is_correct:  o.is_correct,
    }))
    const { error: optErr } = await supabase.from('question_options').insert(optRows)
    if (optErr) console.error('Options insert error:', optErr.message)
  }

  // 5. Log generation
  await supabase.from('generation_logs').insert({
    subtopic_id:  subtopicId,
    lesson_id:    lessonId,
    generated_by: user.id,
    slide_count:  slideRows.length,
    question_count: generated.questions?.length || 0,
  }).select()

  return Response.json({
    success: true,
    lessonId,
    slideCount: slideRows.length,
    questionCount: generated.questions?.length || 0,
  })
}