import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopicPage from '@/components/learn/TopicPage'

export default async function TopicRoute({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Topic + subtopics
  const { data: topic } = await supabase
    .from('topics')
    .select('*, subtopics(*)')
    .eq('id', id)
    .single()

  if (!topic) redirect('/learn')

  const subtopics = (topic.subtopics || []).sort((a, b) => a.order_index - b.order_index)

  // Student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  // Progress for these subtopics
  const subtopicIds = subtopics.map(s => s.id)
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', student?.id)
    .in('subtopic_id', subtopicIds.length > 0 ? subtopicIds : ['none'])

  return (
    <TopicPage
      topic={topic}
      subtopics={subtopics}
      progress={progress || []}
    />
  )
}