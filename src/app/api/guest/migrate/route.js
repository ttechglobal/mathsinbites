// src/app/api/guest/migrate/route.js
// Called after signup — transfers guest localStorage progress to the new account

import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { completedSubtopicIds = [], xp = 0 } = await request.json()

  if (!completedSubtopicIds.length && xp === 0) {
    return Response.json({ ok: true, migrated: 0 })
  }

  // Get the active student for this user
  const { data: profile } = await supabase
    .from('profiles').select('active_student_id').eq('id', user.id).single()
  if (!profile?.active_student_id) {
    return Response.json({ error: 'No active student' }, { status: 404 })
  }
  const studentId = profile.active_student_id

  // Insert progress rows for each completed subtopic
  let migrated = 0
  for (const subtopicId of completedSubtopicIds) {
    const { error } = await supabase.from('student_progress').upsert({
      student_id:   studentId,
      subtopic_id:  subtopicId,
      status:       'completed',
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,subtopic_id' })
    if (!error) migrated++
  }

  // Add XP to student
  if (xp > 0) {
    const { data: stu } = await supabase
      .from('students').select('xp, monthly_xp').eq('id', studentId).single()
    await supabase.from('students').update({
      xp:         (stu?.xp         || 0) + xp,
      monthly_xp: (stu?.monthly_xp || 0) + xp,
    }).eq('id', studentId)
  }

  return Response.json({ ok: true, migrated, xp })
}