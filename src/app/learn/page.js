import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LearnDashboard from '@/components/learn/LearnDashboard'

export default async function LearnPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get student — explicitly use profile_id foreign key
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*, profiles!students_profile_id_fkey(*)')
    .eq('profile_id', user.id)
    .single()

  if (studentError) {
    console.error('Student fetch error:', studentError)
  }

  if (!student) {
    redirect('/auth/login')
  }

  console.log('Student:', student?.display_name, '| Class:', student?.class_level)

  // Get level matching student's class
  const { data: level, error: levelError } = await supabase
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

  if (levelError) {
    console.error('Level fetch error:', levelError)
  }

  console.log('Level:', level?.name, '| Terms:', level?.terms?.length ?? 'none')

  // Get student progress
  const { data: progress, error: progressError } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', student.id)

  if (progressError) {
    console.error('Progress fetch error:', progressError)
  }

  return (
    <LearnDashboard
      student={student}
      level={level || null}
      progress={progress || []}
    />
  )
}