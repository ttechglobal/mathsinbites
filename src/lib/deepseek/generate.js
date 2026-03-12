import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })
}

export async function generateLesson(subtopic, classLevel) {
  const client = getClient()

  const prompt = `
You are an expert Nigerian mathematics teacher creating a bite-sized lesson for ${classLevel} students.

SUBTOPIC: ${subtopic.title}
LEARNING OBJECTIVES: ${subtopic.learning_objectives?.join(', ')}
CLASS LEVEL: ${classLevel}

Generate a complete lesson following this EXACT JSON structure. Return ONLY valid JSON, no markdown, no explanation.

{
  "slides": [
    {
      "order_index": 0,
      "type": "concept",
      "title": "Slide title — one clear concept",
      "explanation": "Clear 2-3 sentence explanation. Simple language. Relatable to Nigerian students.",
      "has_illustration": true,
      "svg_code": "<svg viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'><!-- meaningful SVG illustration --></svg>",
      "worked_examples": []
    },
    {
      "order_index": 1,
      "type": "worked_example",
      "title": "Worked Examples",
      "explanation": "",
      "has_illustration": false,
      "svg_code": "",
      "worked_examples": [
        {
          "order_index": 0,
          "problem": "Example problem 1 — straightforward",
          "steps": [
            {"step": 1, "text": "First we do X because..."},
            {"step": 2, "text": "Then we do Y which gives us..."},
            {"step": 3, "text": "Therefore the answer is..."}
          ],
          "final_answer": "The final answer",
          "is_student_attempt": false
        },
        {
          "order_index": 1,
          "problem": "Example problem 2 — slightly harder",
          "steps": [
            {"step": 1, "text": "First we do X because..."},
            {"step": 2, "text": "Then we do Y which gives us..."},
            {"step": 3, "text": "Therefore the answer is..."}
          ],
          "final_answer": "The final answer",
          "is_student_attempt": false
        },
        {
          "order_index": 2,
          "problem": "Now you try: similar problem for student to attempt",
          "steps": [
            {"step": 1, "text": "First identify what we are solving for..."},
            {"step": 2, "text": "Apply the method we learned..."},
            {"step": 3, "text": "The answer is..."}
          ],
          "final_answer": "The final answer",
          "is_student_attempt": true
        }
      ]
    }
  ],
  "questions": [
    {
      "question_text": "Question 1 — tests understanding of the concept",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "a",
      "explanation": "Option A is correct because...",
      "difficulty": "easy"
    },
    {
      "question_text": "Question 2 — requires applying the concept",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "b",
      "explanation": "Option B is correct because...",
      "difficulty": "medium"
    }
  ]
}

IMPORTANT RULES:
- Generate 3-6 slides depending on concept complexity
- First slide is always a concept explanation with SVG illustration
- SVG viewBox must be "0 0 400 200", use colors #00E676 for highlights, white for text
- Worked examples must use Nigerian names (Emeka, Amina, Chidi, Ngozi, Tunde, Fatima)
- Word problems must reference Nigerian contexts (naira, Lagos, Abuja, market, school fees)
- Steps must show ALL working clearly
- Generate exactly 2 quick check questions
- Return ONLY the JSON object. Nothing else. No markdown.
`

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  const clean = content.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch (err) {
    console.error('DeepSeek response was not valid JSON:', clean)
    throw new Error('AI returned invalid JSON. Please try again.')
  }
}

export async function generatePracticeQuestions(topic, classLevel, count = 10) {
  const client = getClient()

  const prompt = `
You are an expert Nigerian mathematics teacher creating practice questions.

TOPIC: ${topic.title}
CLASS LEVEL: ${classLevel}
NUMBER OF QUESTIONS: ${count}

Generate ${count} practice questions. Mix of difficulty: 40% easy, 40% medium, 20% hard.
Use Nigerian names and contexts in word problems.
Return ONLY valid JSON array, no markdown, no explanation.

[
  {
    "question_text": "Question here",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "correct_option": "a",
    "explanation": "Why this answer is correct",
    "difficulty": "easy"
  }
]
`

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  const clean = content.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch (err) {
    console.error('DeepSeek response was not valid JSON:', clean)
    throw new Error('AI returned invalid JSON. Please try again.')
  }
}