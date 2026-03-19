// ── Further Maths lesson generation prompt ────────────────────────────────────
// Key differences from regular Maths:
//   • No observation / prediction / pattern slides — FM students know the topic exists
//   • Flow: hook → method_picker → concept → rule → worked_example × 2 → you_try
//   • Every worked_example has a mistake_callout field — common exam error shown explicitly
//   • Steps are fully annotated — every line, nothing skipped
//   • SVG only on hook (if helpful) — not on concept or rule
//   • Language: simplified, like explaining to a bright student who finds FM intimidating
//   • Real-life application in hook + concept, but the meat is the working

export const FM_STUDENT_CONTEXTS = `
NAMES (vary across ethnic groups):
Emeka, Amina, Chidi, Ngozi, Tunde, Fatima, Bola, Kemi, Uche, Halima, Segun, Blessing, Musa, Chisom, Yusuf, Adaeze, Ladi, Taiwo, Nkechi, Danladi.

FURTHER MATHS CONTEXTS — real applications that show WHY this topic matters:
• Vectors: GPS coordinates, forces on a bridge, velocity of a car
• Sequences/Series: savings growing year-on-year, population growth, loan repayments
• Functions: machine input/output, phone battery discharge rate
• Calculus (differentiation): rate of change — how fast a car is accelerating, how fast water drains
• Calculus (integration): total area under a curve — total distance from a velocity graph
• Matrices: encoding messages, rotating shapes in graphics
• Complex Numbers: electrical engineering, signal processing
• Probability distributions: predicting exam scores, quality control in factories
• Statistics (Further): regression lines on real data, hypothesis testing
• Mechanics: forces, Newton's laws, projectile motion

EXAM CONTEXT:
• Students are preparing for WAEC, NECO, or JAMB Further Maths papers
• Questions follow predictable patterns — highlight the method, not just the answer
• "Where marks are lost" is as important as "how to get the answer"
`

export function buildFMBitesPrompt(ctx, title, level) {
  return `You are generating a Further Mathematics lesson for MathsInBites.
Students: Nigerian secondary school, ${level} level. Context: ${ctx}
Subject: FURTHER MATHEMATICS — deeper, more abstract, exam-focused.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHILOSOPHY FOR FURTHER MATHS LESSONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Further Maths students are not discovering a concept for the first time.
They need to understand HOW to execute a method, step by step, and WHERE
students commonly lose marks in exams.

The lesson must feel like a master teacher sitting next to the student
and walking them through the problem — clear, calm, and step by step.
Not intimidating. Not rushed. Every line explained.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON FLOW — generate exactly this sequence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BITE 1 — "hook"
  title: Friendly, specific topic name. E.g. "Vectors that point the way"
  explanation: EXACTLY 1 sentence. A real-world or exam moment. MUST be specific to ${title}.
  Examples of good FM hooks:
    Vectors: "Emeka's GPS tracks his position as a vector — direction and distance combined."
    Differentiation: "Chidi is driving at 60 km/h — differentiation tells him exactly how his speed is changing at any second."
    Matrices: "Ngozi encrypts her school project using matrix multiplication so only her partner can decode it."
    Sequences: "Tunde's scholarship doubles every year — by year 5, he wants to know exactly how much it will be."
  NEVER: "In this lesson we will learn..." or generic openers.

BITE 2 — "method_picker"
  title: "How do we approach this?"
  explanation: 1 sentence. Present the problem scenario before asking for the approach.
  options: 3 choices — the correct method + 2 common wrong approaches students pick in exams.
  reveal: 1–2 sentences confirming the correct method and briefly explaining WHY the wrong ones fail.
  Note: This is the key FM slide — it targets the moment students freeze in exams.

BITE 3 — "concept"
  title: The exact concept name
  explanation: EXACTLY 2 sentences.
    Sentence 1: Plain English definition — like explaining to someone who has never heard the word.
    Sentence 2: One real-life application. Short. Specific.
  Keep this SHORT — the working slides are where the learning happens.

BITE 4 — "rule"
  title: "The Rule" or "The Formula"
  explanation: 1–2 sentences. What the formula is for and when to use it.
  formula: The formula in ^ _ notation. Include all variants if needed. null if no formula.
  formula_note: What each symbol means. null if not needed.

BITE 5 — "worked_example"
  title: "Finding [exactly what is being found]"
  explanation: Exam-style problem statement. 1–2 sentences. Student name + specific numbers.
               Mirror the style of a WAEC/NECO question.
  steps: FULLY ANNOTATED working. See format below.
  mistake_callout: The single most common exam error on this specific calculation.
    Format: "Students often write [wrong thing]. This is wrong because [reason]. Always [correct approach]."
    Keep it to 2–3 sentences max.

BITE 6 — "worked_example"
  Same format as Bite 5.
  Slightly harder numbers or a twist (e.g. finding a different unknown, or a 3-part question).
  Different student name, different context.
  Include its own mistake_callout.

BITE 7 — "you_try"
  title: "Your turn: [what to find]"
  explanation: Exam-style problem. 1–2 sentences. New context, specific numbers.
  hint: 1 sentence. Nudge toward the first step only.
  steps: Complete worked solution. Same format as worked_example.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEPS FORMAT — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every step on its own line. Every equation on its own line.
Explanation lines (italic) explain WHAT you are doing before the maths.
Math lines show the actual working.
Answer line always starts with "Answer:".
After every full stop: \\n (new line). No exceptions.

CORRECT:
{"label": "Identify",   "text": "Write down what we know.\\na = 3i + 4j\\nb = i − 2j"}
{"label": "Subtract",   "text": "Subtract components separately.\\na − b = (3−1)i + (4−(−2))j\\na − b = 2i + 6j"}
{"label": "Magnitude",  "text": "Apply Pythagoras to find |a − b|.\\n|a − b| = √(2^2 + 6^2)\\n= √(4 + 36)\\n= √40\\n= 2√10"}
{"label": "Answer",     "text": "Answer: 2√10"}

RULES:
- MINIMUM 4 steps, MAXIMUM 6 steps per worked example
- Every explanation line: max 8 words, starts capital, ends with full stop
- Final step ALWAYS: label = "Answer", text = "Answer: [value + units]"
- NEVER skip a step — show every single operation
- NEVER chain steps with arrows: ✗ "= 5 → divide by 2 → = 2.5"
- NEVER write sentences inside the maths working
- Use ^ for powers (x^2), _ for subscripts (a_1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SVG RULES FOR FURTHER MATHS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SVG is ONLY allowed on the hook slide, and ONLY if it genuinely aids understanding.
Examples where SVG helps:
  - Vectors: show two arrows on a coordinate plane
  - Mechanics: show a force diagram
  - Sequences: show a simple number line with growth
Examples where SVG does NOT help (omit it):
  - Algebra / equation solving
  - Pure number topics (series sums, binomial theorem)
  - Anything where the working IS the lesson
For all non-hook slides: do NOT include svg_code. Leave it out entirely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON. No markdown. No extra text.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "lesson_title": "${title}",
  "hook": "1 sentence. The real-world or exam moment from Bite 1.",
  "bites": [
    {
      "order_index": 0,
      "type": "hook",
      "title": "Friendly topic name",
      "explanation": "1 sentence. Real-world or exam moment. Specific to ${title}."
    },
    {
      "order_index": 1,
      "type": "method_picker",
      "title": "How do we approach this?",
      "explanation": "1 sentence. The problem scenario.",
      "options": [
        {"option_text": "Correct method name", "is_correct": true},
        {"option_text": "Wrong method A — common exam mistake", "is_correct": false},
        {"option_text": "Wrong method B — another common mistake", "is_correct": false}
      ],
      "reveal": "Confirm correct method. 1–2 sentences explaining why the wrong ones fail."
    },
    {
      "order_index": 2,
      "type": "concept",
      "title": "Exact concept name",
      "explanation": "Sentence 1: plain English definition. Sentence 2: one real-life application."
    },
    {
      "order_index": 3,
      "type": "rule",
      "title": "The Rule",
      "explanation": "1–2 sentences on when and how to use it.",
      "formula": "formula in ^ _ notation or null",
      "formula_note": "symbol meanings or null"
    },
    {
      "order_index": 4,
      "type": "worked_example",
      "title": "Finding [what is being found]",
      "explanation": "Exam-style problem. 1–2 sentences. Student name + numbers.",
      "steps": [
        {"label": "Identify",  "text": "Write down what we know.\\n...maths..."},
        {"label": "Set up",    "text": "Short explanation.\\n...maths..."},
        {"label": "Solve",     "text": "Short explanation.\\n...maths..."},
        {"label": "Answer",    "text": "Answer: ..."}
      ],
      "mistake_callout": "Students often write [wrong]. This is wrong because [reason]. Always [correct approach]."
    },
    {
      "order_index": 5,
      "type": "worked_example",
      "title": "A harder example",
      "explanation": "Different student, slightly harder or different unknown.",
      "steps": [
        {"label": "Identify",  "text": "..."},
        {"label": "Set up",    "text": "..."},
        {"label": "Solve",     "text": "..."},
        {"label": "Answer",    "text": "Answer: ..."}
      ],
      "mistake_callout": "Students often write [wrong]. This is wrong because [reason]. Always [correct approach]."
    },
    {
      "order_index": 6,
      "type": "you_try",
      "title": "Your turn: [what to find]",
      "explanation": "Exam-style problem. 1–2 sentences.",
      "hint": "1 sentence. First-step nudge only.",
      "steps": [
        {"label": "Identify",  "text": "..."},
        {"label": "Set up",    "text": "..."},
        {"label": "Solve",     "text": "..."},
        {"label": "Answer",    "text": "Answer: ..."}
      ]
    }
  ]
}

${FM_STUDENT_CONTEXTS}`
}

export function buildFMQuestionsPrompt(ctx, level) {
  return `Write 3 practice questions for a MathsInBites Further Mathematics lesson on: ${ctx}.
Students: Nigerian secondary school, ${level} level, preparing for WAEC/NECO/JAMB Further Maths.

QUESTION RULES:
- Mirror WAEC/NECO Further Maths question style exactly
- 3 questions: easy (method recognition) → medium (full working needed) → hard (multi-step or trick)
- Use Nigerian student names and Nigerian contexts where natural
- Wrong options must be REALISTIC exam mistakes — not obviously wrong
- explanation field: full step-by-step working showing every line (same format as lesson steps)
- Use ^ for powers, _ for subscripts

Return ONLY valid JSON. No markdown. No extra text.

{
  "questions": [
    {
      "question_text": "Full question text. No placeholders.",
      "difficulty": "easy",
      "options": [
        {"option_text": "Correct answer", "is_correct": true},
        {"option_text": "Common mistake A", "is_correct": false},
        {"option_text": "Common mistake B", "is_correct": false},
        {"option_text": "Common mistake C", "is_correct": false}
      ],
      "explanation": "Step 1 label.\\nStep 1 maths.\\nStep 2 label.\\nStep 2 maths.\\nAnswer: value",
      "hint": "1 sentence. First-step nudge only."
    },
    {
      "question_text": "...",
      "difficulty": "medium",
      "options": [...],
      "explanation": "...",
      "hint": "..."
    },
    {
      "question_text": "...",
      "difficulty": "hard",
      "options": [...],
      "explanation": "...",
      "hint": "..."
    }
  ]
}`
}