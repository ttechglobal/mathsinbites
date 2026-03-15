import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function ask(prompt, maxTokens, label) {
  console.log(`[gen:${label}] starting`)
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = msg.content[0]?.text || ''
  if (msg.stop_reason === 'max_tokens') throw new Error(`[gen:${label}] truncated`)
  const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()
  try { return JSON.parse(clean) }
  catch (e) {
    console.error(`[gen:${label}] parse fail. head: ${clean.slice(0,200)}`)
    throw e
  }
}

// ── SVG generation ────────────────────────────────────────────────────────────
// Spec: "2–3 visuals per lesson max", "very simple", "one idea only", "not cluttered"
// We only generate SVG for the 3 bite types where a visual most helps:
//   observation  → the data table visual
//   concept      → the core idea diagram
//   rule         → the formula/relationship diagram
// All other types get no SVG — keeping the lesson clean.

async function genSvg(bite) {
  const SVG_TYPES = ['observation', 'concept', 'rule']
  if (!SVG_TYPES.includes(bite.type)) return null

  const typeInstructions = {

    observation:
`Draw a SIMPLE COMPARISON showing two things changing together.
Use basic icons or shapes — not a complex table.
Example style: show 2 stick figures next to "6 hours", then 4 stick figures next to "3 hours".
Keep it to 2–3 rows of information maximum.
Use arrows (↑ or ↓) to show direction of change.
Label the key numbers clearly.
No more than 6 elements total.`,

    concept:
`Draw ONE simple diagram that makes the core idea unmistakable.
Good options:
- Two bar lengths showing a ratio
- A simple arrow showing direction (goes up / goes down)
- A balance scale tipping one way
- A simple fraction bar split into equal parts
- A number line with a clear jump pattern
ONE idea only. Label the 2–3 most important numbers or words.
No more than 5 elements total. No background scenes.`,

    rule:
`Draw a simple formula layout or rule diagram.
Show the formula centred, with each letter or symbol labelled simply below it.
Example: y = k × x — label y, k, x each with a short word.
Or show a simple input→output arrow if it is a proportion relationship.
Keep it clean: formula + 3 short labels maximum.
No more than 5 elements.`,
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Create a very simple SVG for a school maths lesson screen.

Type: ${bite.type}
Title: "${bite.title}"
Content: "${(bite.explanation || '').slice(0, 200)}"

${typeInstructions[bite.type]}

GOAL: A student glances at this and instantly understands ONE idea. Nothing more.

STRICT SVG RULES:
- viewBox="0 0 320 180" width="320" height="180"
- White background: <rect width="320" height="180" fill="white"/>
- Palette: #4F46E5 (blue, main), #10B981 (green, positive), #EF4444 (red, decrease), #1E293B (dark text)
- font-family="system-ui, sans-serif"
- font-size: 16 for main labels, 12 for secondary
- font-weight="700" for numbers and key words
- Shapes: rect, circle, line, polyline — keep them simple
- NO foreignObject, NO clip-path, NO filters, NO gradients
- All elements within x=10..310, y=10..170
- Total elements: aim for 5–10. Never more than 15.
- Return ONLY the raw SVG tag. No markdown. Start with <svg.`,
    }],
  })
  const raw = (msg.content[0]?.text || '').trim()
  const match = raw.match(/<svg[\s\S]*?<\/svg>/i)
  return match ? match[0] : null
}

// ── Save to Supabase ──────────────────────────────────────────────────────────
async function saveLesson(supabase, lessonId, bites, questions, subtopicId, userId) {
  await supabase.from('slides').delete().eq('lesson_id', lessonId)
  await supabase.from('questions').delete().eq('lesson_id', lessonId)

  // Encode bites cleanly — interactive bites (prediction, pattern, observation)
  // store their options/table data inside the steps column as a tagged JSON object.
  // The LessonPlayer decoder reads this back using the _type sentinel key.
  const cleanSlideRows = bites.map(b => {
    let stepsField = null
    if (b.options || b.reveal || b.table_headers) {
      stepsField = JSON.stringify({
        _type:          b.type,
        _options:       b.options         || null,
        _reveal:        b.reveal          || null,
        _table_headers: b.table_headers   || null,
        _table_rows:    b.table_rows      || null,
        _steps:         b.steps           || null,
      })
    } else if (b.steps) {
      stepsField = JSON.stringify(b.steps)
    }
    return {
      lesson_id:        lessonId,
      order_index:      b.order_index ?? 0,
      type:             b.type         || 'concept',
      title:            b.title        || '',
      explanation:      b.explanation  || '',
      formula:          b.formula      || null,
      formula_note:     b.formula_note || null,
      hint:             b.hint         || null,
      svg_code:         b.svg_code     || null,
      has_illustration: !!(b.svg_code),
      steps:            stepsField,
    }
  })

  const { error: slidesErr } = await supabase.from('slides').insert(cleanSlideRows)
  if (slidesErr) console.error('[gen] slides insert error:', slidesErr.message)

  for (const q of questions) {
    const { data: qRow, error: qErr } = await supabase.from('questions').insert({
      lesson_id:     lessonId,
      order_index:   q.order_index ?? 0,
      question_text: q.question_text,
      difficulty:    q.difficulty   || 'medium',
      hint:          q.hint         || null,
      explanation:   q.explanation  || null,
    }).select().single()
    if (qErr) { console.error('[gen] question error:', qErr.message); continue }
    const shuffled = [...(q.options || [])].sort(() => Math.random() - 0.5)
    await supabase.from('question_options').insert(
      shuffled.map(o => ({ question_id: qRow.id, option_text: o.option_text, is_correct: o.is_correct }))
    )
  }

  await supabase.from('generation_logs').insert({
    subtopic_id: subtopicId, lesson_id: lessonId, generated_by: userId,
    slide_count: cleanSlideRows.length, question_count: questions.length,
  }).then(({ error }) => { if (error) console.warn('[gen] log:', error.message) })

  await supabase.from('subtopics')
    .update({ is_published: true, generated_at: new Date().toISOString() })
    .eq('id', subtopicId)
    .then(({ error }) => { if (error) console.warn('[gen] subtopic update:', error.message) })

  console.log(`[gen] saved: ${cleanSlideRows.length} bites, ${questions.length} questions`)
  return Response.json({ success: true, lessonId, slideCount: cleanSlideRows.length, questionCount: questions.length })
}

// ── Nigerian student context bank ─────────────────────────────────────────────
// Spec: "wide range of relatable contexts", "familiar to student aged 12–17"
// Mix of Nigerian everyday + universal school life
const STUDENT_CONTEXTS = `
NAMES (use variety across all ethnic groups):
Emeka, Amina, Chidi, Ngozi, Tunde, Fatima, Bola, Kemi, Uche, Halima, Segun, Blessing, Musa, Chisom, Yusuf, Adaeze, Ladi, Taiwo, Nkechi, Danladi.

SCHOOL AND STUDENT LIFE CONTEXTS (prefer these — they feel most relatable):
• Sharing food or snacks equally among classmates
• Pocket money and what it can buy
• Sports practice: laps around a field, goals scored, team sizes
• Classroom activities: sharing pencils, counting books, arranging chairs
• School tuck shop: buying snacks, getting change
• Library books: borrowing, returning, counting
• School projects: splitting tasks among group members
• Running or walking to school: time and distance
• Homework: pages to read, questions to answer
• School events: prizes, medals, positions in a race
• Playing games: scores, turns, fair shares
• Travel time: bus rides between school and home

NIGERIAN EVERYDAY CONTEXTS (use occasionally for variety):
• Market: buying tomatoes, oranges, bread — prices in ₦
• Recharge cards and data bundles
• Sharing suya, gala, or boli among friends
• Keke napep or danfo fare
• Saving pocket money (ajo/esusu style)

RULES FOR USING CONTEXTS:
- Rotate contexts so no two consecutive bites use the same setting
- Prefer school/student settings for hook and examples
- Use simple, specific numbers (not large or awkward values)
- Use ₦ for money when in a market/buying context
- Always name a specific person in examples
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
  const term  = subtopic.topic?.unit?.term?.name        || 'Term 1'
  const unit  = subtopic.topic?.unit?.name              || ''
  const topic = subtopic.topic?.name                    || ''
  const title = subtopic.title
  const ctx   = `${level} | ${term} | Unit: ${unit} | Topic: ${topic} | Subtopic: ${title}`

  // ════════════════════════════════════════════════════════════════════════════
  // BITES PROMPT
  // Spec: 8–12 bites, one idea per screen, minimal text, guided discovery,
  //       Observation → Thinking → Explanation → Practice flow
  // ════════════════════════════════════════════════════════════════════════════
  const bitesPrompt = `You are building a bite-sized interactive maths lesson for a platform called MathsInBites.
The lesson is for Nigerian secondary school students (context: ${ctx}).
Philosophy: "Maths, one bite at a time."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE PRINCIPLES — follow these strictly:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Assume the student knows NOTHING about this topic.
2. One idea per screen. One. Never two.
3. Text: maximum 2 short sentences per bite. Short = a 12-year-old can say it in one breath.
4. Guide discovery: student observes → thinks → discovers → sees the name.
   Never reveal the concept before the student has seen and thought about it.
5. Interact early: the 2nd bite must be interactive (prediction).
   Interaction means student makes a choice, not just reads.
6. Language: friendly, simple, conversational. Not textbook.
7. Examples must feel like real student life (school, sports, sharing food, pocket money).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEARNING FLOW — generate bites in THIS ORDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BITE 1 — type: "hook"
What it does: Opens with a real everyday moment. No maths. Just curiosity.
title: The lesson topic name written in a friendly way (e.g. "Sharing Equally" not "Division")
explanation: EXACTLY 1 sentence. Describe a specific student moment that secretly uses ${title}.
             Use a student's name. Use a school/sports/everyday context.
             Example style: "Tunde and 3 friends want to share 24 oranges equally after football practice."
             NOT: "In this lesson we will learn about..."

BITE 2 — type: "prediction"
What it does: Student predicts before they know the answer. Commits to a guess.
title: A short question. E.g. "What do you think happens?"
explanation: 1 sentence setting up the prediction scenario. Different context from Bite 1.
options: 2–3 choices. Exactly 1 correct. Others must be plausible wrong guesses.
reveal: 1 sentence. Shown after they answer (whether right or wrong). Warm. Forward-pointing.
        E.g. "Good thinking! Let's look at the numbers to find out."

BITE 3 — type: "observation"
What it does: Shows a data table. Student looks and reads. No answer required.
title: Short. E.g. "Look at this pattern"
explanation: 1 sentence. Tell them what column to focus on.
table_headers: Array of 2 column names. Keep names short (3 words max each).
table_rows: 4–5 rows. Use REAL numbers that clearly show the mathematical pattern.
            For inverse proportion: as first column doubles, second column halves.
            For direct proportion: both columns increase together.
            Use simple round numbers. No decimals unless essential.

BITE 4 — type: "pattern"
What it does: Student identifies what they noticed in the table. Interactive.
title: "What do you notice?"
explanation: 1 sentence asking them to describe the relationship they saw.
options: 3 choices. 1 correct (accurate description of pattern). 2 wrong (plausible misreadings).
reveal: 1–2 sentences. Confirm the pattern. Connect it to what comes next.
        E.g. "Exactly! When one number doubles, the other halves. There's a name for this..."

BITE 5 — type: "concept"
What it does: Reveals the concept name. The "aha!" moment.
title: The concept name. Bold and clear.
explanation: EXACTLY 2 short sentences.
             Sentence 1: What this type of relationship is called.
             Sentence 2: One-line plain English definition using the pattern they just saw.
             Example: "This is called Inverse Proportion. When one quantity goes up, the other goes down by the same factor."

BITE 6 — type: "rule"
What it does: States the mathematical rule and formula.
title: "The Rule" or "How to use it"
explanation: 1–2 sentences. How to apply this in calculations.
formula: The formula in ^ and _ notation. E.g. "x × y = k" or "y = k/x". Or null if no formula.
formula_note: One plain-English line explaining what each letter means. Or null.

BITE 7 — type: "worked_example"
What it does: Walks through one complete example step by step.
title: Name the specific problem. E.g. "Finding the missing value"
explanation: The problem. 1–2 sentences. School/student context. Name a student. Specific numbers.
             Example: "Amina takes 4 minutes to run 1 lap of the field. How long for 3 laps?"
steps: Array of step objects. EVERY step shown. Nothing skipped.
       Each step: { "label": "Step 1 — short name", "text": "Show the number. Show the operation. Explain in plain English why." }
       Minimum 3 steps. Maximum 5.

BITE 8 — type: "worked_example"
What it does: A second example. Different context. Slightly harder.
title: Different angle on the same concept.
explanation: 1–2 sentences. Different student name, different everyday situation.
steps: Same format. Show all working clearly.

BITE 9 — type: "you_try"
What it does: Student attempts a fresh problem on their own, then reveals solution.
title: "Your turn: [what they need to find]"
explanation: The problem ONLY. 1–2 sentences. Fresh context, specific numbers.
hint: 1 sentence. Gentle nudge toward the first step. E.g. "Start by identifying which value is changing."
steps: Complete worked solution (shown when student taps "Show Solution").
       Same step format as above. All working shown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — break any of these and the lesson fails:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ Never write "In this lesson you will learn..."
✗ Never write "By the end of this lesson..."
✗ Never put 2 ideas in 1 bite
✗ Never use 3+ sentences in explanation
✗ Never skip a worked example step
✗ Never use the same context/setting twice in a row
✗ Never use placeholder values like "X", "Y", "[value]" in table_rows — use real numbers
✗ Never use unicode superscripts — use ^ and _ notation only

CONTEXT RULE: Use school and student life contexts first. Rotate settings.
Good: sharing pencils, football practice, buying snacks, library books, race positions.
Okay: market stalls, keke fare, suya (use sparingly for variety).
Bad: "a company distributes tasks", "servers process requests", "a factory produces units".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON below. No markdown. No extra text.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "lesson_title": "${title}",
  "hook": "One sentence. The key student moment from Bite 1.",
  "bites": [
    {
      "order_index": 0,
      "type": "hook",
      "title": "Lesson topic name — friendly",
      "explanation": "One sentence. Specific student scene."
    },
    {
      "order_index": 1,
      "type": "prediction",
      "title": "What do you think happens?",
      "explanation": "1-sentence setup.",
      "options": [
        {"option_text": "Option A", "is_correct": false},
        {"option_text": "Option B — correct", "is_correct": true},
        {"option_text": "Option C", "is_correct": false}
      ],
      "reveal": "1 sentence after answering."
    },
    {
      "order_index": 2,
      "type": "observation",
      "title": "Look at the numbers",
      "explanation": "1-sentence prompt.",
      "table_headers": ["Header 1", "Header 2"],
      "table_rows": [["val","val"],["val","val"],["val","val"],["val","val"]]
    },
    {
      "order_index": 3,
      "type": "pattern",
      "title": "What do you notice?",
      "explanation": "1-sentence question.",
      "options": [
        {"option_text": "Description A", "is_correct": false},
        {"option_text": "Description B — correct", "is_correct": true},
        {"option_text": "Description C", "is_correct": false}
      ],
      "reveal": "Confirm the pattern. 1–2 sentences."
    },
    {
      "order_index": 4,
      "type": "concept",
      "title": "Concept name",
      "explanation": "Exactly 2 short sentences."
    },
    {
      "order_index": 5,
      "type": "rule",
      "title": "The Rule",
      "explanation": "1–2 sentences.",
      "formula": "formula or null",
      "formula_note": "what each symbol means, or null"
    },
    {
      "order_index": 6,
      "type": "worked_example",
      "title": "Example title",
      "explanation": "Problem. 1–2 sentences. Student context.",
      "steps": [
        {"label": "Step 1 — label", "text": "Show working clearly."},
        {"label": "Step 2 — label", "text": "Continue."},
        {"label": "Step 3 — label", "text": "Final answer with reason."}
      ]
    },
    {
      "order_index": 7,
      "type": "worked_example",
      "title": "Another example",
      "explanation": "Different student context, different numbers.",
      "steps": [
        {"label": "Step 1 — label", "text": "..."},
        {"label": "Step 2 — label", "text": "..."},
        {"label": "Step 3 — label", "text": "..."}
      ]
    },
    {
      "order_index": 8,
      "type": "you_try",
      "title": "Your turn: [what to find]",
      "explanation": "Fresh problem. 1–2 sentences.",
      "hint": "One gentle nudge.",
      "steps": [
        {"label": "Step 1", "text": "..."},
        {"label": "Step 2", "text": "..."},
        {"label": "Step 3", "text": "..."}
      ]
    }
  ]
}

${STUDENT_CONTEXTS}`

  // ════════════════════════════════════════════════════════════════════════════
  // QUESTIONS PROMPT
  // Spec: student-life contexts, 3 questions easy/medium/hard,
  //       real common-mistake wrong options, clear step-by-step explanation
  // ════════════════════════════════════════════════════════════════════════════
  const questionsPrompt = `Write 3 practice questions for a MathsInBites lesson on: ${ctx}.

These questions appear at the end of the lesson as the final practice section.
Students are aged 12–17 in Nigerian secondary school.

CONTEXT RULES:
- Use school and student life situations (sharing, sports, classroom, pocket money, travel)
- Use Nigerian student names
- Use ₦ only when the scenario involves buying/paying. Otherwise no currency needed.
- Use simple, clean numbers. Nothing awkward.
- Rotate contexts so all 3 questions feel different.

QUESTION RULES:
- question_text: 1–2 short sentences. State the full scenario and what to find.
- difficulty: "easy" (index 0), "medium" (index 1), "hard" (index 2)
- 4 options each, exactly 1 correct
- Wrong options must be real mistakes students make (e.g. adding instead of dividing, forgetting to invert, using wrong formula step)
- hint: 1 gentle sentence pointing toward the first step
- explanation: step-by-step. Each step on a new line using \\n. Show every calculation. Say why. Write like you are sitting next to the student.

Return ONLY valid JSON. No markdown.

{
  "questions": [
    {
      "order_index": 0,
      "question_text": "Short question with student context and specific numbers.",
      "difficulty": "easy",
      "hint": "One gentle nudge toward the first step.",
      "explanation": "Step 1: [what we do and why] → [calculation]\\nStep 2: [next step] → [calculation]\\nAnswer: [value] because [brief reason].",
      "options": [
        {"option_text": "Correct answer", "is_correct": true},
        {"option_text": "Common mistake 1", "is_correct": false},
        {"option_text": "Common mistake 2", "is_correct": false},
        {"option_text": "Common mistake 3", "is_correct": false}
      ]
    }
  ]
}

${STUDENT_CONTEXTS}`

  // ── Generate bites + questions in parallel ────────────────────────────────
  let bitesData, questionsData
  try {
    ;[bitesData, questionsData] = await Promise.all([
      ask(bitesPrompt,     7000, 'bites'),
      ask(questionsPrompt, 3000, 'questions'),
    ])
  } catch (err) {
    console.error('[gen] generation failed:', err.message)
    return Response.json({ error: 'Generation failed', detail: err.message }, { status: 500 })
  }

  const bites     = bitesData.bites        || []
  const questions = questionsData.questions || []
  console.log(`[gen] bites=${bites.length}, questions=${questions.length}`)

  // ── Generate SVGs for the 3 types that benefit from a visual ─────────────
  // Only observation, concept, and rule get SVGs — max 3 per lesson.
  // This keeps the lesson clean per spec: "2–3 visuals per lesson is enough."
  const svgResults = await Promise.allSettled(
    bites.map((b, i) => genSvg(b).then(svg => {
      if (svg) console.log(`[gen] svg[${i}] ${b.type} ok, length=${svg.length}`)
      return svg
    }))
  )
  bites.forEach((b, i) => {
    const r = svgResults[i]
    b.svg_code = r.status === 'fulfilled' ? (r.value || null) : null
    if (r.status === 'rejected') console.warn(`[gen] svg[${i}] failed:`, r.reason?.message)
  })

  const svgCount = bites.filter(b => b.svg_code).length
  console.log(`[gen] SVGs generated: ${svgCount}`)

  // ── Upsert lesson row ─────────────────────────────────────────────────────
  let lessonId
  for (const withHook of [true, false]) {
    const upsertData = {
      subtopic_id: subtopicId,
      title:       bitesData.lesson_title || title,
      summary:     `Learn about ${title} step by step.`,
      ...(withHook && bitesData.hook ? { hook: bitesData.hook } : {}),
    }
    const { data: lesson, error } = await supabase
      .from('lessons')
      .upsert(upsertData, { onConflict: 'subtopic_id' })
      .select('id')
      .single()
    if (error) {
      console.error(`[gen] lesson upsert failed (withHook=${withHook}):`, error.message)
      if (!withHook) return Response.json({ error: 'Failed to save lesson', detail: error.message }, { status: 500 })
      continue
    }
    lessonId = lesson.id
    break
  }

  return saveLesson(supabase, lessonId, bites, questions, subtopicId, user.id)
}