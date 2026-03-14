import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChallengeMode from '@/components/learn/ChallengeMode'

export default async function ChallengePage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params  = await searchParams
  const topicId = params?.topicId || null
  const isDaily = params?.mode === 'daily'

  const { data: student } = await supabase
    .from('students').select('*').eq('profile_id', user.id).single()
  if (!student) redirect('/auth/login')

  let questions  = []
  let topicTitle = 'Daily Challenge'

  // Find the student's most recently active topic from progress
  async function getActiveTopicIds() {
    // Get student's completed subtopics
    const { data: progress } = await supabase
      .from('student_progress')
      .select('subtopic_id, completed_at')
      .eq('student_id', student.id)
      .order('completed_at', { ascending: false })
      .limit(20)

    if (!progress?.length) return []

    // Get topic IDs from those subtopics
    const subtopicIds = progress.map(p => p.subtopic_id)
    const { data: subtopics } = await supabase
      .from('subtopics')
      .select('topic_id')
      .in('id', subtopicIds)

    return [...new Set((subtopics || []).map(s => s.topic_id))]
  }

  if (isDaily) {
    // Daily challenge: 5 questions — medium + hard only, from student's active topics
    const activeTopicIds = await getActiveTopicIds()

    if (activeTopicIds.length > 0) {
      // Try to get medium+hard from their topics first
      const { data: topicQs } = await supabase
        .from('practice_questions')
        .select('*, options:practice_question_options(*)')
        .in('topic_id', activeTopicIds)
        .in('difficulty', ['medium', 'hard'])
        .eq('is_active', true)

      if ((topicQs || []).length >= 3) {
        const shuffled = (topicQs || []).sort(() => Math.random() - 0.5)
        const medium = shuffled.filter(q => q.difficulty === 'medium').slice(0, 3)
        const hard   = shuffled.filter(q => q.difficulty === 'hard').slice(0, 2)
        questions = [...medium, ...hard].sort(() => Math.random() - 0.5)
        // Pad to 5 if needed
        if (questions.length < 5) {
          const remaining = shuffled.filter(q => !questions.find(qq => qq.id === q.id)).slice(0, 5 - questions.length)
          questions = [...questions, ...remaining]
        }
      }
    }

    // Fallback: class level medium+hard questions
    if (questions.length < 3 && student?.class_level) {
      const { data: levelQs } = await supabase
        .from('practice_questions')
        .select('*, options:practice_question_options(*)')
        .eq('class_level', student.class_level)
        .in('difficulty', ['medium', 'hard'])
        .eq('is_active', true)
        .limit(50)

      if ((levelQs || []).length > 0) {
        const shuffled = (levelQs || []).sort(() => Math.random() - 0.5)
        const medium = shuffled.filter(q => q.difficulty === 'medium').slice(0, 3)
        const hard   = shuffled.filter(q => q.difficulty === 'hard').slice(0, 2)
        questions = [...medium, ...hard].sort(() => Math.random() - 0.5)
        if (questions.length < 5) {
          questions = shuffled.slice(0, 5)
        }
      }
    }

    topicTitle = 'Daily Challenge'

  } else if (topicId) {
    // Topic challenge: medium+hard from specific topic
    const { data: topic } = await supabase.from('topics').select('title').eq('id', topicId).single()
    topicTitle = topic?.title || 'Challenge'

    const { data } = await supabase
      .from('practice_questions')
      .select('*, options:practice_question_options(*)')
      .eq('topic_id', topicId)
      .in('difficulty', ['medium', 'hard'])
      .eq('is_active', true)

    questions = (data || []).sort(() => Math.random() - 0.5)

    // Fallback to all difficulties if not enough medium/hard
    if (questions.length < 3) {
      const { data: all } = await supabase
        .from('practice_questions')
        .select('*, options:practice_question_options(*)')
        .eq('topic_id', topicId)
        .eq('is_active', true)
      questions = (all || []).sort(() => Math.random() - 0.5)
    }
  }

  // Check if daily already completed today
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
      isDaily={isDaily}
      dailyDone={dailyDone}
      userId={user.id}
    />
  )
}