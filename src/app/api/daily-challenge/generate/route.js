// src/app/api/admin/daily-challenge/generate/route.js

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const REAL_WORLD_CONTEXTS = `
REAL-WORLD CONTEXTS TO USE (pick the most natural fit for the topic):

💰 MONEY & BUSINESS
- Savings account interest, loan repayment, bank charges
- Running a small business: profit/loss on selling items at market
- Salary calculations, tax deductions, percentage increase
- Comparing prices at two shops, finding the better deal
- Mobile data bundle: how long does 2GB last at 150MB/day?

🏗️ CONSTRUCTION & HOME
- Tiling a room: how many tiles needed, cost calculation
- Fencing a compound: perimeter, cost per metre
- Paint for a wall: area, litres needed, cost
- Water tank volume, how long to fill at a given rate

🚗 TRAVEL & TRANSPORT
- Bus fare from Lagos to Ibadan vs Abuja: distance, time, speed
- Keke napep trip: distance × rate, sharing cost among passengers
- Fuel consumption: litres per km, cost for a road trip

🍎 FOOD & HEALTH
- Sharing suya, rice, or meat among a group
- Recipe scaling: ingredients for 8 people vs 3
- BMI or medication dosage based on weight
- Nutrition: calories in a meal, daily target

📊 DATA & STATISTICS
- Class exam scores: mean, median, range
- Football league table: points, goal difference
- Polling/survey results: percentages, ratios
- Phone battery: percentage left after usage

🌱 FARMING & NATURE
- Crop yield per hectare, profit from harvest
- Mixing fertiliser in correct ratio
- Time for a plant to grow at a given rate
`

export async function POST(request) {
  const { class_level, topic } = await request.json()
  if (!class_level || !topic) {
    return Response.json({ error: 'class_level and topic required' }, { status: 400 })
  }

  const isJSS = class_level.startsWith('JSS')
  const examCtx = class_level === 'SS3'
    ? 'WAEC/NECO/JAMB exam style'
    : class_level.startsWith('SS')
    ? 'WAEC/NECO exam style'
    : 'BECE exam style'

  const prompt = `You are an expert Nigerian secondary school maths teacher writing a DAILY CHALLENGE question.

Class: ${class_level} | Topic: ${topic} | Exam context: ${examCtx}

CRITICAL RULES:
1. The question MUST be set in a REAL-WORLD situation — not abstract "find x" or "simplify"
2. The situation must be something a Nigerian teenager actually encounters or can picture
3. Medium-to-hard difficulty: requires thinking, not just formula recall
4. The numerical answer must be clean and unambiguous (one correct value)
5. Use Nigerian names: Emeka, Amina, Chidi, Tunde, Ngozi, Fatima, Bola, Seun
6. Use Nigerian contexts: Lagos, Abuja, market, school, recharge card, keke, Danfo

${REAL_WORLD_CONTEXTS}

QUESTION STRUCTURE:
- Set up a real scenario in 1-2 sentences (who, what, where, numbers)
- Ask ONE clear question at the end
- The scenario should make the student think "oh, this is actually useful to know"

HINTS — progressive, each reveals more:
- Hint 1: Which approach/formula to use (no numbers)
- Hint 2: The first calculation to do (with numbers)  
- Hint 3: The second-to-last step (almost there)

WORKED SOLUTION — step by step, each step on its own line using \\n:
- Show all working clearly
- Use plain arithmetic notation (×, ÷, +, -)
- Final line must be: Answer: [value with units e.g. ₦12,500 or 24 litres or 3 hours]

Return ONLY valid JSON, no markdown:
{
  "question_text": "Scenario + question in 2-3 sentences. Real Nigerian context with specific numbers.",
  "correct_answer": "Just the value e.g. '₦12500' or '24' or '3.5 hours'",
  "hint_1": "What formula or method to use (no spoilers)",
  "hint_2": "The first step: [specific calculation to start with]",
  "hint_3": "You're nearly there — now calculate [final step]",
  "worked_solution": "Line 1\\nLine 2\\nLine 3\\nAnswer: value",
  "difficulty": "medium"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw   = msg.content[0]?.text || ''
  const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()

  try {
    const data = JSON.parse(clean)
    return Response.json(data)
  } catch {
    return Response.json({ error: 'AI returned invalid JSON. Try again.' }, { status: 500 })
  }
}