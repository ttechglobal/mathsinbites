import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildFMBitesPrompt, buildFMQuestionsPrompt } from '@/lib/claude/generateFM'

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
// Philosophy: SVG complements the text — it does NOT repeat it.
// The lesson text already does the heavy lifting (explanation, context, numbers).
// The SVG's only job: give the student ONE glance-able visual that makes the
// core idea click faster. Simple, clean, Nigerian-student-relevant when possible.
//
// We generate SVGs for 3 bite types only (observation, concept, rule).
// For each, we give the model the lesson's own title + content so it can
// draw something that actually matches what the student is reading.
//
// Context matching: if the lesson has a real-world context (savings, market,
// sports, data bundles, etc.), the SVG should reflect that scene — not an
// abstract diagram. If it's purely abstract maths, a clean diagram is fine.

async function genSvg(bite) {
  const SVG_TYPES = ['observation', 'concept', 'rule']
  if (!SVG_TYPES.includes(bite.type)) return null

  const typeInstructions = {

    observation:
`Your job: show a simple side-by-side or stacked comparison that makes the DATA pattern visible at a glance.

MATCH the context in the lesson content. Examples:
- If the lesson shows workers and hours → draw 2 rows of stick figures with time labels
- If it shows savings growing → draw 3 stacked money-bag icons getting bigger
- If it shows data bundle usage → draw a simple phone with bar levels going down
- If it is abstract numbers → draw 2–3 rows with the key values and ↑ ↓ arrows

Rules:
- 2–3 rows of information maximum
- Use ↑ or ↓ arrows to show direction of change
- Label the key numbers clearly (bold, large)
- Stick figures: draw as a circle (head) + short vertical line (body) only
- No tables, no complex grids
- No more than 8 visual elements total`,

    concept:
`Your job: draw ONE diagram that makes the core idea click in a single glance.

MATCH the context in the lesson content. Examples:
- If about compound interest/savings → a simple coin stack growing taller over 3 time steps
- If about ratio/proportion → two bars of different lengths with labels showing the ratio
- If about inverse proportion → one bar going up while another goes down (see-saw style)
- If about fractions → a rectangle split into equal parts, some shaded
- If about probability → a simple bag with dots (different colours)
- If about speed/distance → a road with a car icon and distance/time labels
- If about algebra (x unknown) → a balance scale, one side has x-box, other has a number

Rules:
- ONE idea only. ONE diagram. Do not split the canvas into multiple diagrams.
- Label the 2–3 most important values or words
- No background scenes (no sky, grass, buildings)
- No more than 8 visual elements total`,

    rule:
`Your job: show the formula or relationship rule cleanly — the student should be able to read the rule at a glance.

MATCH the context in the lesson content. Examples:
- Formula with symbols (A = P(1 + r)^n) → show it centred, large, with each letter labelled below
- Proportion rule (x × y = k) → show as a simple input→output arrow diagram
- Percentage rule → show the fraction bar with "part / whole × 100"
- If there is no formula, show a simple "IF [condition] → THEN [result]" box

Rules:
- Formula centred and large (font-size 22+)
- Each variable labelled with a short word below (font-size 12)
- Max 3 labels below the formula
- Clean white background
- No more than 6 elements total`,
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1400,
    messages: [{
      role: 'user',
      content: `Create a very simple SVG illustration for a Nigerian secondary school maths lesson.

Bite type: ${bite.type}
Lesson title: "${bite.title}"
Lesson content: "${(bite.explanation || '').slice(0, 280)}"

${typeInstructions[bite.type]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOAL: A 13-year-old Nigerian student glances at this for 2 seconds and the ONE key idea is immediately clear. The image COMPLEMENTS the text — it does not repeat it word for word. Keep it simple. The text already explains everything; this just makes it visual.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRICT SVG RULES (follow ALL of these exactly):
- viewBox="0 0 320 180" width="320" height="180"
- White background: <rect width="320" height="180" fill="white"/>
- Colour palette ONLY: #4F46E5 (blue/main), #10B981 (green/positive), #F97316 (orange/highlight), #EF4444 (red/decrease), #1E293B (dark text), #94A3B8 (muted), #F1F5F9 (light fill)
- font-family="system-ui, sans-serif"
- font-size="16" for main labels, font-size="12" for secondary labels
- font-weight="700" for numbers and key words
- Use only: rect, circle, line, polyline, polygon, text — NO path, NO foreignObject, NO clip-path, NO filter, NO gradient, NO image
- All elements within x=10..310, y=10..170
- Stick figures: circle r=6 (head) + line 12px (body) ONLY — nothing more
- Total SVG elements: aim for 6–10. Never more than 14.
- Return ONLY the raw SVG. No markdown, no explanation. Start with <svg`,
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
// Mix of Nigerian everyday + real-life applications + school life
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

REAL-LIFE APPLICATION CONTEXTS (use when the topic has direct real-world value):
These make topics feel relevant and worth learning — not just school exercises.

MONEY & FINANCE:
• Compound interest: "Chidi's mum put ₦50,000 in a savings account. After 3 years, how much has it grown?"
• Simple vs compound interest: comparing two savings plans, deciding which gives more money
• Percentage increase/decrease: sale prices, salary raises, price hikes at the market
• Profit and loss: selling phone credit, running a small tuck shop business
• VAT and tax: total cost of buying items after tax is added

DATA & DAILY LIFE:
• Statistics/mean/average: comparing exam scores, phone battery life across days
• Probability: chances of winning a raffle, likelihood of rain on sports day
• Ratio: mixing drinks, cement, paint — getting the proportions right
• Proportion: scaling a recipe up or down for more people

TIME, DISTANCE, SPEED:
• Journey planning: how long a bus ride takes at a certain speed
• Football training: calculating pace, laps needed in a given time

TECHNOLOGY & MODERN LIFE:
• Data bundles: how many days a 1GB plan lasts if you use 120MB/day
• Battery and charging: how long until a phone is fully charged
• Percentages in social media: post reach, follower growth

HEALTH & BODY:
• Body mass index (BMI): healthy weight ranges
• Medication dosage: calculating the right amount based on weight

BUILDING & MEASURING:
• Area and perimeter: tiling a room, fencing a compound
• Volume: water tanks, filling a bucket, cement mixing

RULES FOR USING CONTEXTS:
- Rotate contexts so no two consecutive bites use the same setting
- Prefer school/student settings for hook and examples
- For topics with clear real-life value (interest, percentages, statistics, ratio, speed), use a real-world hook
- Use simple, specific numbers (not large or awkward values)
- Use ₦ for money when in a market/buying/savings context
- Always name a specific person in examples
`

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { subtopicId, subject = 'maths' } = body
  if (!subtopicId) return Response.json({ error: 'subtopicId required' }, { status: 400 })
  const isFM = subject === 'further_maths'

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
  // ════════════════════════════════════════════════════════════════════════════
  const bitesPrompt = `You are generating a bite-sized maths lesson for MathsInBites.
Students: Nigerian secondary school, ${level} level. Context: ${ctx}
Platform philosophy: "Maths, one bite at a time." Make it feel relevant, not like a chore.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE YOU WRITE ANYTHING — answer these questions first:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. WHY DOES ${title} MATTER IN REAL LIFE?
   Think: where does a 13–17 year old actually encounter this?
   • Compound interest → their savings grow faster than they think. Banks use this.
   • LCM/HCF → tiling a floor, synchronising schedules, splitting things fairly.
   • Ratio/Proportion → mixing food, medicine dosage, resizing images.
   • Algebra → every unknown you ever need to find in real life.
   • Probability → understanding risk, games, weather forecasts.
   • Statistics → making sense of scores, health data, news.
   • Speed/Distance/Time → journey planning, sports performance.
   • Index/Powers → computer storage (KB, MB, GB), scientific notation.
   If it has a clear real-life application, USE IT in the hook and concept bite.

2. IS THIS TOPIC POTENTIALLY BORING?
   Some topics feel abstract or pointless unless you show WHY they matter.
   If the topic could seem dull, your hook MUST create curiosity or surprise.
   The student should think "oh — THIS is what that is?" not "why am I learning this?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RULES — follow ALL of these exactly:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student knows ZERO about this topic. Start from scratch.
2. ONE idea per screen. Never two.
3. explanation fields: 1–2 SHORT sentences max. No long paragraphs.
4. Language: friendly, simple, like talking to a 13-year-old. Not textbook.
5. Contexts: school life first (sharing, sports, tuck shop, library). Nigerian names.
   For topics with real-life value, use that real-world context in the hook.
6. The observation bite comes BEFORE the prediction bite. Students see data FIRST, then guess.
7. The prediction is a WARM-UP GUESS after seeing data — not a test.
8. Worked example steps MUST be pure mathematical working — not sentences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON FLOW — generate exactly this sequence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BITE 1 — "hook"
  title: Topic name, friendly (e.g. "Money That Grows", not "Compound Interest")
         Make the title sound interesting, not like a textbook chapter.
  explanation: EXACTLY 1 sentence. Must do ONE of these:
    A) Show a real-life moment where this topic matters directly to the student.
       E.g. for compound interest: "Amina saves ₦5,000 and watches it quietly grow
       into ₦6,250 in just 2 years — without doing anything."
    B) Create genuine surprise or curiosity about something familiar.
       E.g. for prime numbers: "Every time you lock your phone, prime numbers are
       keeping your data safe."
    C) A specific vivid student scene that secretly shows the concept at work.
       E.g. "Tunde notices that every time he doubles his running speed,
       the time to finish one lap is cut in half."

    NEVER: "Today we will learn about..." or generic textbook openers.
    NEVER: A bland scene with no connection to why the topic matters.

    ✓ GOOD HOOKS (real-world + curiosity):
      Compound interest: "Kemi's uncle invested ₦20,000 in a savings plan — and
       now, 5 years later, it has grown to ₦32,000 without him doing a thing."
      LCM: "Chidi realises his phone rings every 4 minutes and his alarm buzzes
       every 6 minutes — he wonders when they will both go off at the same time."
      Speed/Distance: "Ngozi runs the same route every morning — but today she
       wants to know exactly how fast she is going."
      Probability: "Segun and his friends argue about who should buy the next
       round of drinks — so they decide to flip a coin."
      Statistics: "Five friends compare their test scores and want to know who
       is performing best on average."

    ✗ BAD HOOKS:
      "In this lesson, we will explore compound interest."
      "Tunde has some oranges to share."  (too generic — could be any topic)
      "Amina is at the market buying tomatoes." (no connection to the topic)

BITE 2 — "observation"
  Purpose: Show the student DATA first — before any question or teaching.
  title: Short, inviting. E.g. "Look at what happens over time"
  explanation: 1 sentence. Tell them exactly which column to watch.
  table_headers: 2 short column names (max 3 words each)
  table_rows: 4–5 rows of REAL numbers showing the pattern clearly.
    Use clean, round numbers. No awkward decimals.

BITE 3 — "prediction"
  Purpose: NOW that the student has seen the data, ask them to name what they noticed.
  title: A simple question about what they just saw.
  explanation: 1 sentence referring back to the data they just looked at.
  options: 2–3 choices. 1 correct, others plausible misreadings.
  reveal: 1 warm, forward-pointing sentence. Never say "wrong".

BITE 4 — "pattern"
  title: "What do you notice?"
  explanation: 1 sentence asking them to describe the relationship more precisely.
  options: 3 choices. 1 correct, 2 plausible misreadings.
  reveal: 1–2 sentences confirming the pattern, connecting to the concept name.

BITE 5 — "concept"   ← DO NOT CHANGE THIS BITE TYPE
  title: The exact concept name
  explanation: Exactly 2 sentences.
    Sentence 1: What this is called + plain English definition.
    Sentence 2: ONE short real-world sentence showing why this matters in daily life.
    E.g. "Compound interest is when your savings earn interest on top of interest.
    Banks and savings apps use this — it is why starting to save early makes a
    huge difference."
    For abstract topics: connect to something they have already encountered.
    E.g. "A prime number is a number that can only be divided by 1 and itself.
    They are used in phone encryption — every time you lock your screen, primes
    are protecting your data."

BITE 6 — "rule"   ← DO NOT CHANGE THIS BITE TYPE
  title: "The Rule" or "How to use it"
  explanation: 1–2 sentences. How to apply it.
  formula: the formula using ^ _ notation. null if no formula.
  formula_note: what each symbol means. null if not needed.

BITE 7 — "worked_example"
  title: Name what is being found.
  explanation: The problem. 1–2 sentences. Student name, specific numbers.
               Prefer real-world contexts for topics with practical applications.
               E.g. for compound interest: savings growing over years.
               E.g. for ratio: mixing a drink, splitting bill.
               E.g. for speed: journey time calculation.
  steps: Array of step objects. EVERY step shown. Nothing skipped.

  ══════════════════════════════════════════════════════
  STEPS FORMAT — CRITICAL — THIS IS THE MOST IMPORTANT PART
  ══════════════════════════════════════════════════════

  This is a MATHS LEARNING PLATFORM. Solutions must look exactly like a
  teacher solving on a classroom board. One idea per line. Always.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THE GOLDEN RULE: ONE IDEA PER LINE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Every equation → its own line.
  Every sentence → its own line.
  After EVERY full stop → \\n (new line). No exceptions.
  Never use → arrows to chain steps horizontally.
  Never compress two operations into one line.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOW EACH LINE IS RENDERED ON SCREEN:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  The renderer detects each line type automatically:

  MATH LINE     → starts with a digit, variable, or operator
                  Rendered: large bold monospace (18px)
                  Example: "5x = 15"

  EXPLANATION   → starts with a capital letter, contains words, no = sign
                  Rendered: smaller italic Nunito (13px)
                  Example: "Subtract 10 from both sides."

  ANSWER LINE   → starts with "Answer:" or "Solution:"
                  Rendered: large bold accent colour (20px)
                  Example: "Answer: x = 3"

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CORRECT PATTERN — board working:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  step.label = "Set up"
  step.text  = "5x + 10 = 25"

  step.label = "Simplify"
  step.text  = "Subtract 10 from both sides.\\n5x = 25 - 10\\n5x = 15"

  step.label = "Solve"
  step.text  = "Divide both sides by 5.\\nx = 15 ÷ 5\\nx = 3"

  step.label = "Answer"
  step.text  = "Answer: x = 3"

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MORE CORRECT EXAMPLES:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Fractions (3/4 + 1/6):
  {"label": "Find LCD",   "text": "LCD of 4 and 6 = 12"}
  {"label": "Convert",    "text": "3/4 = 9/12\\n1/6 = 2/12"}
  {"label": "Add",        "text": "9/12 + 2/12 = 11/12"}
  {"label": "Answer",     "text": "Answer: 11/12"}

  Inverse proportion (Workers × Time):
  {"label": "Find k",     "text": "x × y = k\\n4 × 6 = 24\\nk = 24"}
  {"label": "Substitute", "text": "8 × t = 24"}
  {"label": "Solve",      "text": "Divide both sides by 8.\\nt = 24 ÷ 8\\nt = 3"}
  {"label": "Answer",     "text": "Answer: 3 hours"}

  Quadratic (factorising):
  {"label": "Set up",     "text": "x^2 + 5x + 6 = 0"}
  {"label": "Factorise",  "text": "Find two numbers that multiply to 6 and add to 5.\\n(x + 2)(x + 3) = 0"}
  {"label": "Solve",      "text": "x + 2 = 0  or  x + 3 = 0\\nx = -2  or  x = -3"}
  {"label": "Answer",     "text": "Answer: x = -2 or x = -3"}

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BAD EXAMPLES — NEVER DO THESE:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ "Subtract 10 from both sides to get 5x = 15, then divide by 5 to get x = 3."
  ✗ "4 × 6 = 24 → 8 × t = 24 → t = 3"
  ✗ "We substitute k = 24 into the formula and solve for t."
  ✗ "5x = 15. Divide both sides by 5. x = 3."

  RULES SUMMARY:
  - MINIMUM 3 steps, MAXIMUM 5 steps per example
  - label = 2–4 words: "Set up", "Simplify", "Solve", "Answer"
  - Final step ALWAYS: label = "Answer", text = "Answer: [value + units]"
  - Explanation lines: max 8 words, starts capital letter, ends with full stop
  - After every full stop: add \\n on the SAME step.text field
  ══════════════════════════════════════════════════════

BITE 8 — "worked_example"
  Same format as Bite 7. Different student name, different context, slightly harder numbers.
  If Bite 7 used a real-world context, use a different real-world context here.

BITE 9 — "you_try"
  title: "Your turn: [what to find]"
  explanation: Fresh problem only. 1–2 sentences. New context, specific numbers.
               Real-world context preferred for applicable topics.
  hint: 1 sentence. Gentle nudge toward the first step.
  steps: Complete worked solution. Same format as worked_example steps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — break any = lesson fails
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Never use "In this lesson you will learn..."
✗ Never use 3+ sentences in explanation
✗ Never use sentences in step.text — maths only
✗ Never skip a step — show every operation
✗ Never use placeholder numbers like [x] or [value] in table_rows
✗ Never use unicode superscripts — use ^ and _ notation only
✗ Never use the same setting in two consecutive bites
✗ Never write a hook that could apply to ANY topic — it must be specific to ${title}
✗ Never make the hook abstract — it must show a real person in a real moment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON. No markdown. No extra text.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "lesson_title": "${title}",
  "hook": "1 sentence. The student scene from Bite 1.",
  "bites": [
    {
      "order_index": 0,
      "type": "hook",
      "title": "Friendly, intriguing topic name — not a textbook title",
      "explanation": "Exactly 1 sentence. Real-world moment OR curiosity spark. Specific to ${title}."
    },
    {
      "order_index": 1,
      "type": "observation",
      "title": "Look at this data",
      "explanation": "1 sentence. Tell them what to watch.",
      "table_headers": ["Column 1", "Column 2"],
      "table_rows": [["val","val"],["val","val"],["val","val"],["val","val"],["val","val"]]
    },
    {
      "order_index": 2,
      "type": "prediction",
      "title": "What do you think is happening?",
      "explanation": "1 sentence referring back to the data above.",
      "options": [
        {"option_text": "Option A", "is_correct": false},
        {"option_text": "Option B — correct", "is_correct": true},
        {"option_text": "Option C", "is_correct": false}
      ],
      "reveal": "Great — keep going and we will see exactly what this is called! 👇"
    },
    {
      "order_index": 3,
      "type": "pattern",
      "title": "What do you notice?",
      "explanation": "1 sentence question about the pattern.",
      "options": [
        {"option_text": "Description A", "is_correct": false},
        {"option_text": "Correct description", "is_correct": true},
        {"option_text": "Description C", "is_correct": false}
      ],
      "reveal": "Confirm pattern. Connect to coming concept. 1–2 sentences."
    },
    {
      "order_index": 4,
      "type": "concept",
      "title": "Concept name",
      "explanation": "Sentence 1: name + definition. Sentence 2: why this matters in real life."
    },
    {
      "order_index": 5,
      "type": "rule",
      "title": "The Rule",
      "explanation": "1–2 sentences.",
      "formula": "formula using ^ _ or null",
      "formula_note": "symbol meanings or null"
    },
    {
      "order_index": 6,
      "type": "worked_example",
      "title": "Finding [what is being found]",
      "explanation": "Problem statement. 1–2 sentences. Student name + numbers. Real-world context where applicable.",
      "steps": [
        {"label": "Find k",     "text": "x × y = k\n4 workers × 6 hours = 24\nk = 24"},
        {"label": "Substitute", "text": "8 × t = 24"},
        {"label": "Solve",      "text": "Divide both sides by 8.\nt = 24 ÷ 8\nt = 3"},
        {"label": "Answer",     "text": "Answer: 3 hours"}
      ]
    },
    {
      "order_index": 7,
      "type": "worked_example",
      "title": "Another example",
      "explanation": "Different student, different real-world or school context, slightly harder.",
      "steps": [
        {"label": "Set up",     "text": "...equation on its own line..."},
        {"label": "Simplify",   "text": "Short explanation (max 8 words).\n...result on its own line..."},
        {"label": "Solve",      "text": "Short explanation.\n...working...\n...result..."},
        {"label": "Answer",     "text": "Answer: ..."}
      ]
    },
    {
      "order_index": 8,
      "type": "you_try",
      "title": "Your turn: [what to find]",
      "explanation": "New problem. 1–2 sentences. Real-world context preferred.",
      "hint": "1 sentence. Gentle first-step nudge.",
      "steps": [
        {"label": "Write what we know",  "text": "...actual maths..."},
        {"label": "Use the rule",        "text": "...actual maths..."},
        {"label": "Solve",               "text": "...actual maths..."},
        {"label": "Answer",              "text": "Answer: ..."}
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
- explanation: BOARD-STYLE WORKING. Use \\n between EVERY line. One idea per line.
  Pattern: equation → short explanation (ends with .) → result → explanation → answer
  After EVERY full stop in an explanation: add \\n immediately.
  Never chain steps with →. Never write a sentence paragraph.

  HOW THE RENDERER READS THIS:
  Lines starting with capital letters + words → rendered as italic explanation (small)
  Lines starting with digits/variables/operators → rendered as bold math (large)
  Lines starting with "Answer:" → rendered in accent colour (largest)

  CORRECT format (linear equation):
  "5x + 10 = 25\\nSubtract 10 from both sides.\\n5x = 15\\nDivide both sides by 5.\\nx = 3\\nAnswer: x = 3"

  CORRECT format (proportion):
  "x × y = k\\n3 × 8 = 24\\nk = 24\\n6 × y = 24\\nDivide both sides by 6.\\ny = 4\\nAnswer: 4 hours"

  CORRECT format (fractions):
  "LCD = 12\\n3/4 = 9/12\\n1/6 = 2/12\\n9/12 + 2/12 = 11/12\\nAnswer: 11/12"

  WRONG (never do this):
  "First subtract 10 from both sides to get 5x = 15, then divide by 5 to find x = 3."
  "4 × 6 = 24 → 8 × t = 24 → t = 3"

  Every line = short equation OR short explanation (max 8 words, ends with full stop).
  Final line ALWAYS: "Answer: [value + units]"

Return ONLY valid JSON. No markdown.

{
  "questions": [
    {
      "order_index": 0,
      "question_text": "Short question with student context and specific numbers.",
      "difficulty": "easy",
      "hint": "One gentle nudge toward the first step.",
      "explanation": "x × y = k\n3 × 8 = 24\nk = 24\n6 × y = 24\nDivide both sides by 6.\ny = 4\nAnswer: 4 hours",
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

  // ── Dispatch to FM or Maths prompts ──────────────────────────────────────
  const activeBitesPrompt     = isFM ? buildFMBitesPrompt(ctx, title, level)     : bitesPrompt
  const activeQuestionsPrompt = isFM ? buildFMQuestionsPrompt(ctx, level)        : questionsPrompt

  // ── Generate bites + questions in parallel ────────────────────────────────
  let bitesData, questionsData
  try {
    ;[bitesData, questionsData] = await Promise.all([
      ask(activeBitesPrompt,     isFM ? 6000 : 7000, 'bites'),
      ask(activeQuestionsPrompt, 3000, 'questions'),
    ])
  } catch (err) {
    console.error('[gen] generation failed:', err.message)
    return Response.json({ error: 'Generation failed', detail: err.message }, { status: 500 })
  }

  const bites     = bitesData.bites        || []
  const questions = questionsData.questions || []
  console.log(`[gen] bites=${bites.length}, questions=${questions.length}`)

  // ── Generate SVGs ─────────────────────────────────────────────────────────
  // Maths: observation, concept, rule get SVGs.
  // Further Maths: hook only (and only if the type is eligible — genSvg checks internally).
  // FM slides like method_picker, worked_example, you_try never get SVGs.
  const svgResults = await Promise.allSettled(
    bites.map((b, i) => {
      // FM: skip SVG for everything except hook
      if (isFM && b.type !== 'hook') return Promise.resolve(null)
      return genSvg(b).then(svg => {
        if (svg) console.log(`[gen] svg[${i}] ${b.type} ok, length=${svg.length}`)
        return svg
      })
    })
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
      subject:     subject,
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