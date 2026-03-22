// src/app/api/generate/lesson-batch/route.js
// Submits multiple subtopics to Claude's Message Batches API
// POST { subtopicIds: [...] } → { batchId }
// GET  ?batchId=xxx           → { status, succeeded: [...subtopicIds], request_counts }

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 60  // submission is fast; polling is client-driven

// ── POST: submit batch ────────────────────────────────────────────────────────
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { subtopicIds = [] } = await request.json()
  if (!subtopicIds.length) return Response.json({ error: 'No subtopicIds' }, { status: 400 })

  // Load all subtopics with full context in one query
  const { data: subtopics } = await supabase
    .from('subtopics')
    .select('id, title, topic:topics(title, unit:units(title, term:terms(title, level:levels(name))))')
    .in('id', subtopicIds)

  if (!subtopics?.length) return Response.json({ error: 'Subtopics not found' }, { status: 404 })

  // Build one batch request per subtopic
  const requests = subtopics.map(sub => {
    const level = sub.topic?.unit?.term?.level?.name || 'JSS1'
    const term  = sub.topic?.unit?.term?.title       || 'Term 1'
    const unit  = sub.topic?.unit?.title             || ''
    const topic = sub.topic?.title                   || ''
    const title = sub.title
    const ctx   = `${level} | ${term} | Unit: ${unit} | Topic: ${topic} | Subtopic: ${title}`

    return {
      custom_id: sub.id,  // we use subtopicId as the custom_id to match results later
      params: {
        model: 'claude-sonnet-4-6',
        max_tokens: 7000,
        messages: [{
          role: 'user',
          content: buildBitesPrompt(ctx, level, title),
        }],
      },
    }
  })

  // Submit to Claude Batch API
  const batch = await anthropic.messages.batches.create({ requests })

  // Store batchId + subtopicId mapping in DB so we can process results
  await supabase.from('batch_jobs').upsert({
    batch_id:    batch.id,
    user_id:     user.id,
    subtopic_ids: subtopicIds,
    status:      'in_progress',
    created_at:  new Date().toISOString(),
  }, { onConflict: 'batch_id' })

  return Response.json({ batchId: batch.id, count: requests.length })
}

// ── GET: poll status + process results ───────────────────────────────────────
export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batchId')
  if (!batchId) return Response.json({ error: 'batchId required' }, { status: 400 })

  const batch = await anthropic.messages.batches.retrieve(batchId)

  if (batch.processing_status !== 'ended') {
    return Response.json({
      status: batch.processing_status,
      request_counts: batch.request_counts,
    })
  }

  // Batch is done — stream results and save lessons
  const succeeded = []
  const failed    = []

  for await (const result of await anthropic.messages.batches.results(batchId)) {
    const subtopicId = result.custom_id

    if (result.result.type !== 'succeeded') {
      failed.push(subtopicId)
      continue
    }

    const raw = result.result.message.content[0]?.text || ''
    try {
      const clean   = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed  = JSON.parse(clean)
      await saveLesson(supabase, subtopicId, parsed, user.id)
      succeeded.push(subtopicId)
    } catch (e) {
      console.error(`[batch] failed to save ${subtopicId}:`, e.message)
      failed.push(subtopicId)
    }
  }

  // Mark batch job done
  await supabase.from('batch_jobs')
    .update({ status: 'ended', succeeded_count: succeeded.length })
    .eq('batch_id', batchId)

  return Response.json({
    status: 'ended',
    succeeded,
    failed,
    request_counts: batch.request_counts,
  })
}

// ── Save lesson (same logic as generate/lesson/route.js) ──────────────────────
async function saveLesson(supabase, subtopicId, biteData, userId) {
  const bites     = biteData.bites     || []
  const questions = biteData.questions || []

  // Upsert lesson row
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .upsert({
      subtopic_id: subtopicId,
      title:       biteData.lesson_title || subtopicId,
      summary:     `Learn step by step.`,
      ...(biteData.hook ? { hook: biteData.hook } : {}),
    }, { onConflict: 'subtopic_id' })
    .select('id').single()

  if (lessonErr) throw new Error(lessonErr.message)
  const lessonId = lesson.id

  // Delete old slides + questions
  await supabase.from('slides').delete().eq('lesson_id', lessonId)
  await supabase.from('questions').delete().eq('lesson_id', lessonId)

  // Insert slides
  if (bites.length) {
    const slideRows = bites.map((b, i) => ({
      lesson_id:    lessonId,
      subtopic_id:  subtopicId,
      order_index:  i,
      type:         b.type         || 'concept',
      title:        b.title        || '',
      explanation:  b.explanation  || '',
      svg_code:     b.svg_code     || '',
      worked_examples: b.worked_examples || [],
    }))
    await supabase.from('slides').insert(slideRows)
  }

  // Insert questions
  for (const q of questions) {
    const { data: qRow } = await supabase.from('questions').insert({
      lesson_id:    lessonId,
      subtopic_id:  subtopicId,
      question_text: q.question_text,
      correct_option: q.correct_option,
      explanation:  q.explanation,
      hint:         q.hint || null,
      difficulty:   q.difficulty || 'medium',
      order_index:  q.order_index ?? 0,
    }).select('id').single()

    if (qRow) {
      const opts = ['a','b','c','d'].map(letter => ({
        question_id: qRow.id,
        option_text: q[`option_${letter}`] || '',
        option_letter: letter,
        is_correct: q.correct_option === letter,
      }))
      await supabase.from('question_options').insert(opts)
    }
  }

  // Mark subtopic as published
  await supabase.from('subtopics').update({ is_published: true }).eq('id', subtopicId)
}

// ── Prompt (same as generate/lesson/route.js bites prompt) ───────────────────
function buildBitesPrompt(ctx, level, title) {
  return `You are generating a bite-sized maths lesson for MathsInBites.
Students: Nigerian secondary school, ${level} level. Context: ${ctx}
Platform philosophy: "Maths, one bite at a time." Make it feel relevant, not like a chore.

Generate a complete lesson as valid JSON only. No markdown, no explanation. Return this exact structure:

{
  "lesson_title": "Short engaging title",
  "hook": "One sentence that makes the student curious about this topic",
  "bites": [
    {
      "type": "concept",
      "title": "Clear concept title",
      "explanation": "2-3 sentence explanation. Simple language. Relatable to Nigerian students.",
      "svg_code": "<svg viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'><!-- illustration --></svg>",
      "worked_examples": []
    },
    {
      "type": "worked_example",
      "title": "Worked Examples",
      "explanation": "",
      "svg_code": "",
      "worked_examples": [
        {
          "order_index": 0,
          "problem": "Example problem with Nigerian context and names",
          "steps": [{"step": 1, "text": "Step explanation"}, {"step": 2, "text": "Next step"}],
          "final_answer": "The answer",
          "is_student_attempt": false
        }
      ]
    }
  ],
  "questions": [
    {
      "order_index": 0,
      "question_text": "Question testing understanding of ${title}",
      "difficulty": "easy",
      "hint": "One gentle nudge toward the first step",
      "explanation": "Why this answer is correct\\nStep by step working",
      "option_a": "Correct answer",
      "option_b": "Common mistake 1",
      "option_c": "Common mistake 2",
      "option_d": "Common mistake 3",
      "correct_option": "a"
    },
    {
      "order_index": 1,
      "question_text": "Second question applying ${title}",
      "difficulty": "medium",
      "hint": "Think about what formula applies here",
      "explanation": "Working shown clearly",
      "option_a": "Option A",
      "option_b": "Correct answer",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "b"
    }
  ]
}

RULES:
- Generate 2-4 bites depending on concept complexity
- First bite is always a concept explanation with SVG illustration
- SVG viewBox must be "0 0 400 200", use #00E676 for highlights
- Use Nigerian names (Emeka, Amina, Chidi, Ngozi, Tunde, Fatima)
- Use Nigerian contexts (naira, Lagos, Abuja, market, school fees)
- Questions must ONLY test "${title}" — nothing from other subtopics
- Return ONLY valid JSON. No markdown.`
}