import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChallengeMode from '@/components/learn/ChallengeMode'

export default async function ChallengePage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const topicId    = params?.topicId || null
  const isDaily    = params?.mode === 'daily'

  const { data: student } = await supabase
    .from('students').select('*').eq('profile_id', user.id).single()

  const { data: levels } = await supabase
    .from('levels')
    .select('*, terms(*, units(*, topics(id, title)))')
    .order('name')

  let questions = []
  let topicTitle = 'Challenge'

  if (topicId) {
    const { data: topic } = await supabase
      .from('topics').select('title').eq('id', topicId).single()
    topicTitle = topic?.title || 'Challenge'

    const { data } = await supabase
      .from('practice_questions')
      .select('*, options:practice_question_options(*)')
      .eq('topic_id', topicId)
      .eq('is_active', true)
    questions = (data || []).sort(() => Math.random() - 0.5)
  } else if (student?.class_level) {
    // Daily / mixed challenge — pick from student's level
    const { data } = await supabase
      .from('practice_questions')
      .select('*, options:practice_question_options(*)')
      .eq('class_level', student.class_level)
      .eq('is_active', true)
      .limit(100)
    // Shuffle and take 5 for daily, 10 for mixed
    const shuffled = (data || []).sort(() => Math.random() - 0.5)
    questions = isDaily ? shuffled.slice(0, 5) : shuffled.slice(0, 10)
    topicTitle = isDaily ? 'Daily Challenge' : 'Mixed Challenge'
  }

  // Check if daily already done today
  let dailyDone = false
  if (isDaily && student?.id) {
    const today = new Date().toISOString().split('T')[0]
    const { data: dc } = await supabase
      .from('daily_challenges')
      .select('id, completed')
      .eq('student_id', student.id)
      .eq('challenge_date', today)
      .single()
    dailyDone = dc?.completed === true
  }

  return (
    <ChallengeMode
      questions={questions}
      topicTitle={topicTitle}
      topicId={topicId}
      student={student}
      levels={levels || []}
      isDaily={isDaily}
      dailyDone={dailyDone}
    />
  )
}
