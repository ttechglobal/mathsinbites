// src/app/api/admin/daily-challenge/route.js
// GET — list all questions
// POST — create question
// DELETE ?id= — delete question

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_challenge_questions')
    .select('*')
    .order('created_at', { ascending: false })
  return Response.json(data || [])
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    console.log('[daily-challenge] saving:', JSON.stringify({
      class_level: body.class_level,
      topic: body.topic,
      has_question: !!body.question_text,
      has_answer: !!body.correct_answer,
      has_hint1: !!body.hint_1,
      has_solution: !!body.worked_solution,
    }))
    const { data, error } = await supabase
      .from('daily_challenge_questions')
      .insert({
        class_level:     body.class_level,
        topic:           body.topic,
        question_text:   body.question_text,
        correct_answer:  body.correct_answer,
        hint_1:          body.hint_1 || '',
        hint_2:          body.hint_2 || '',
        hint_3:          body.hint_3 || '',
        worked_solution: body.worked_solution,
        difficulty:      body.difficulty || 'medium',
        date_assigned:   body.date_assigned || null,
      })
      .select().single()
    if (error) {
      console.error('[daily-challenge] Supabase insert error:', error.message, error.details, error.hint)
      return Response.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 })
    }
    return Response.json({ question: data })
  } catch (err) {
    console.error('[daily-challenge] POST crash:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await supabase.from('daily_challenge_questions').delete().eq('id', id)
  return Response.json({ ok: true })
}