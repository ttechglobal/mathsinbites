// src/app/admin/students/page.js
import { createClient } from '@/lib/supabase/server'
import StudentsPage from '@/components/admin/StudentsPage'

export default async function AdminStudents() {
  const supabase = await createClient()

  // Fetch students — no join on profiles (avoids RLS issues)
  const { data: students, error: studErr } = await supabase
    .from('students')
    .select('id, display_name, class_level, school, xp, monthly_xp, streak_days, created_at, profile_id')
    .order('xp', { ascending: false })

  if (studErr) console.error('[admin/students] fetch error:', studErr.message)

  // Fetch profiles separately to get emails (admin-only RLS)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, role')

  const profileMap = {}
  for (const p of profiles || []) profileMap[p.id] = p

  // Attach profile to each student
  const studentsWithProfile = (students || []).map(s => ({
    ...s,
    profile: profileMap[s.profile_id] || null,
  }))

  // Progress counts per student
  const { data: progress } = await supabase
    .from('student_progress')
    .select('student_id, status')

  const progressMap = {}
  for (const p of progress || []) {
    if (!progressMap[p.student_id]) progressMap[p.student_id] = { completed: 0, total: 0 }
    progressMap[p.student_id].total++
    if (p.status === 'completed') progressMap[p.student_id].completed++
  }

  // Session minutes — graceful fallback if table not yet created
  let sessionMinutes = {}
  try {
    const { data: sessions } = await supabase
      .from('student_session_minutes')
      .select('*')
    for (const row of sessions || []) sessionMinutes[row.student_id] = row
  } catch (_) {}

  return (
    <StudentsPage
      students={studentsWithProfile}
      progressMap={progressMap}
      sessionMinutes={sessionMinutes}
    />
  )
}