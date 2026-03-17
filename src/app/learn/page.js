import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LearnDashboard from '@/components/learn/LearnDashboard'

export default async function LearnPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ── Load all student profiles for this account ────────────────────────────
  // One login can have multiple students (family plan / siblings).
  const { data: allStudents } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: true })

  if (!allStudents?.length) redirect('/auth/login')

  // ── Find the active student ───────────────────────────────────────────────
  // Priority: profiles.active_student_id → first student in list
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_student_id')
    .eq('id', user.id)
    .single()

  const activeStudentId = profile?.active_student_id || allStudents[0].id
  const student = allStudents.find(s => s.id === activeStudentId) || allStudents[0]

  // If active_student_id wasn't set yet, set it now
  if (!profile?.active_student_id) {
    await supabase.from('profiles').update({ active_student_id: student.id }).eq('id', user.id)
  }

  // ── Load level curriculum for this student's class ────────────────────────
  const { data: level } = await supabase
    .from('levels')
    .select(`
      *,
      terms(
        *,
        units(
          *,
          topics(
            *,
            subtopics(*)
          )
        )
      )
    `)
    .eq('code', student.class_level)
    .single()

  // ── Load student progress ─────────────────────────────────────────────────
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', student.id)

  return (
    <LearnDashboard
      student={student}
      allStudents={allStudents}
      profileId={user.id}
      level={level || null}
      progress={progress || []}
    />
  )
}