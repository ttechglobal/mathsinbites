import { createClient } from '@/lib/supabase/server'
import StudentsPage from '@/components/admin/StudentsPage'

export default async function AdminStudents() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('students')
    .select('*, profile:profiles(email, role)')
    .order('xp', { ascending: false })

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

  return <StudentsPage students={students || []} progressMap={progressMap} />
}
