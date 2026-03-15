import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PracticeMode from '@/components/learn/PracticeMode'

export default async function PracticePage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params  = await searchParams
  const topicId = params?.topicId || null

  const { data: student } = await supabase
    .from('students').select('*').eq('profile_id', user.id).single()

  // Fetch ALL questions for student's class level — used for both mixed and topic mode
  // The setup screen filters by topic_id client-side
  let questions  = []
  let topicTitle = 'Practice'

  if (topicId) {
    const { data: topic } = await supabase
      .from('topics').select('title').eq('id', topicId).single()
    topicTitle = topic?.title || 'Practice'

    const { data } = await supabase
      .from('practice_questions')
      .select('*, options:practice_question_options(*)')
      .eq('topic_id', topicId)
      .eq('is_active', true)
    questions = data || []
  } else if (student?.class_level) {
    // Mixed — fetch ALL questions for this class level
    const { data } = await supabase
      .from('practice_questions')
      .select('*, options:practice_question_options(*)')
      .eq('class_level', student.class_level)
      .eq('is_active', true)
    questions = data || []
    topicTitle = 'Mixed Practice'
  }

  const questionTopicIds = [...new Set(questions.map(q => q.topic_id))]

  // Always fetch ALL topics for the student's level so the topic picker is populated
  // even when no practice questions exist yet for some topics
  let levels = []
  if (student?.class_level) {
    const { data } = await supabase
      .from('levels')
      .select('*, terms(*, units(*, topics(id, title)))')
      .eq('code', student.class_level)
    levels = data || []
  }

  return (
    <PracticeMode
      questions={questions}
      topicTitle={topicTitle}
      topicId={topicId}
      student={student}
      levels={levels}
      questionTopicIds={questionTopicIds}
    />
  )
}