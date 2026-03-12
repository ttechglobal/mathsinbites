import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonPlayer from '@/components/learn/LessonPlayer'

export default async function LessonPage({ params }) {
  const { subtopicId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Subtopic + topic
  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('*, topic:topics(*)')
    .eq('id', subtopicId)
    .single()

  if (!subtopic) redirect('/learn')

  // Lesson row
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('subtopic_id', subtopicId)
    .single()

  let slides = []
  let questions = []

  if (lesson) {
    const { data: slidesData } = await supabase
      .from('slides')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('order_index', { ascending: true })

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*, options:question_options(*)')
      .eq('lesson_id', lesson.id)
      .order('order_index', { ascending: true })

    // Parse steps JSON string back to array if stored as text
    slides = (slidesData || []).map(s => ({
      ...s,
      steps: s.steps
        ? (typeof s.steps === 'string'
            ? (() => { try { return JSON.parse(s.steps) } catch { return null } })()
            : s.steps)
        : null,
    }))

    questions = questionsData || []
  }

  // Student
  const { data: student } = await supabase
    .from('students')
    .select('*, profile:profiles!students_profile_id_fkey(*)')
    .eq('profile_id', user.id)
    .single()

  const lessonData = lesson ? { ...lesson, slides, questions } : null

  return (
    <LessonPlayer
      lesson={lessonData}
      subtopic={subtopic}
      topic={subtopic?.topic}
      student={student}
    />
  )
}