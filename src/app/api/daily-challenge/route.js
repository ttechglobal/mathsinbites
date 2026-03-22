// src/app/api/daily-challenge/route.js
// GET  — fetch today's question scoped to student's progress
// POST — submit answer or reveal

import { createClient } from '@/lib/supabase/server'

const CHALLENGE_XP = 15
const TODAY = () => new Date().toISOString().slice(0, 10)

// Smart answer matcher — strips ₦, commas, spaces, trailing .0, leading zeros
function answersMatch(given, correct) {
  const normalise = s => String(s)
    .toLowerCase()
    .replace(/[₦,\s]/g, '')
    .replace(/\.0+$/, '')
    .replace(/^0+(\d)/, '$1')
    .trim()
  return normalise(given) === normalise(correct)
}

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('active_student_id').eq('id', user.id).single()
  if (!profile?.active_student_id) return Response.json({ error: 'No student' }, { status: 404 })

  const { data: student } = await supabase
    .from('students').select('id, class_level').eq('id', profile.active_student_id).single()
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  const today = TODAY()

  // ── Check if student already has an attempt today ──────────────────────────
  const { data: existingAttempt } = await supabase
    .from('daily_challenge_attempts')
    .select('*, daily_challenge_questions(*)')
    .eq('student_id', student.id)
    .eq('challenge_date', today)
    .maybeSingle()

  if (existingAttempt?.question_id) {
    // Student already has today's question — load it
    const { data: q } = await supabase
      .from('daily_challenge_questions')
      .select('*').eq('id', existingAttempt.question_id).single()

    const safe = { ...q }
    if (!existingAttempt.solved && !existingAttempt.revealed_answer) {
      delete safe.correct_answer
      delete safe.worked_solution
    }

    const { count: solversCount } = await supabase
      .from('daily_challenge_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', q.id)
      .eq('challenge_date', today)
      .eq('solved', true)

    return Response.json({ question: safe, attempt: existingAttempt, solversCount: solversCount || 0 })
  }

  // ── Find question scoped to student's completed topics ────────────────────
  // Step 1: get student's completed subtopics
  const { data: progress } = await supabase
    .from('student_progress')
    .select('subtopic_id')
    .eq('student_id', student.id)
    .eq('status', 'completed')

  // Step 2: get the topics those subtopics belong to
  let completedTopicTitles = []
  if (progress?.length) {
    const subIds = progress.map(p => p.subtopic_id)
    const { data: subtopics } = await supabase
      .from('subtopics')
      .select('topic:topics(title)')
      .in('id', subIds)
    completedTopicTitles = [...new Set(
      (subtopics || []).map(s => s.topic?.title).filter(Boolean)
    )]
  }

  // Step 3: find a question matching class_level AND topic in completed list
  // Priority order:
  // 1. A question date_assigned = today for this class (already committed for today)
  // 2. An unassigned question whose topic is in completed topics
  // 3. Fallback: any question for this class (if student has no progress yet)
  let question = null

  // Priority 1: already assigned today for this class
  const { data: todayQ } = await supabase
    .from('daily_challenge_questions')
    .select('*')
    .eq('class_level', student.class_level)
    .eq('date_assigned', today)
    .eq('is_active', true)
    .maybeSingle()

  if (todayQ) {
    question = todayQ
  }

  // Priority 2: unassigned question matching student's completed topics
  if (!question && completedTopicTitles.length > 0) {
    const { data: progressQ } = await supabase
      .from('daily_challenge_questions')
      .select('*')
      .eq('class_level', student.class_level)
      .eq('is_active', true)
      .is('date_assigned', null)
      .in('topic', completedTopicTitles)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (progressQ) {
      // Assign to today so all students in this class get the same question
      await supabase
        .from('daily_challenge_questions')
        .update({ date_assigned: today })
        .eq('id', progressQ.id)
      question = { ...progressQ, date_assigned: today }
    }
  }

  // Priority 3: any unassigned question for this class (no progress yet / no match)
  if (!question) {
    const { data: anyQ } = await supabase
      .from('daily_challenge_questions')
      .select('*')
      .eq('class_level', student.class_level)
      .eq('is_active', true)
      .is('date_assigned', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (anyQ) {
      await supabase
        .from('daily_challenge_questions')
        .update({ date_assigned: today })
        .eq('id', anyQ.id)
      question = { ...anyQ, date_assigned: today }
    }
  }

  if (!question) {
    return Response.json({ question: null, attempt: null })
  }

  // Don't expose answer/solution yet
  const safe = { ...question }
  delete safe.correct_answer
  delete safe.worked_solution

  const { count: solversCount } = await supabase
    .from('daily_challenge_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', question.id)
    .eq('challenge_date', today)
    .eq('solved', true)

  return Response.json({ question: safe, attempt: null, solversCount: solversCount || 0 })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('active_student_id').eq('id', user.id).single()
  if (!profile?.active_student_id) return Response.json({ error: 'No student' }, { status: 404 })

  const { data: student } = await supabase
    .from('students').select('id, class_level, xp, monthly_xp').eq('id', profile.active_student_id).single()
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  const { action, answer, questionId } = await request.json()
  const today = TODAY()

  // Check existing attempt
  const { data: existing } = await supabase
    .from('daily_challenge_attempts')
    .select('*')
    .eq('student_id', student.id)
    .eq('challenge_date', today)
    .maybeSingle()

  if (existing?.solved || existing?.revealed_answer) {
    return Response.json({ error: 'Already completed today' }, { status: 400 })
  }

  const { data: q } = await supabase
    .from('daily_challenge_questions')
    .select('correct_answer, worked_solution')
    .eq('id', questionId).single()

  if (action === 'reveal') {
    await supabase.from('daily_challenge_attempts').upsert({
      student_id:      student.id,
      question_id:     questionId,
      challenge_date:  today,
      revealed_answer: true,
      solved:          false,
      xp_earned:       0,
    }, { onConflict: 'student_id,challenge_date' })

    return Response.json({
      revealed:        true,
      correct_answer:  q.correct_answer,
      worked_solution: q.worked_solution,
    })
  }

  if (action === 'submit') {
    const correct = answersMatch(answer, q.correct_answer)

    await supabase.from('daily_challenge_attempts').upsert({
      student_id:     student.id,
      question_id:    questionId,
      challenge_date: today,
      solved:         correct,
      revealed_answer: false,
      answer_given:   answer,
      xp_earned:      correct ? CHALLENGE_XP : 0,
    }, { onConflict: 'student_id,challenge_date' })

    if (correct) {
      await supabase.from('students').update({
        xp:         (student.xp || 0) + CHALLENGE_XP,
        monthly_xp: (student.monthly_xp || 0) + CHALLENGE_XP,
      }).eq('id', student.id)
    }

    return Response.json({
      correct,
      worked_solution: correct ? q.worked_solution : null,
      correct_answer:  correct ? q.correct_answer  : null,
      xp_earned:       correct ? CHALLENGE_XP : 0,
    })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}