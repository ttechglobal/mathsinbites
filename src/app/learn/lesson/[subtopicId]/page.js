import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonPlayer from '@/components/learn/LessonPlayer'

export default async function LessonPage({ params }) {
  const { subtopicId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Subtopic + topic + all sibling subtopics (to find next)
  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('*, topic:topics(*, subtopics(id, order_index, title))')
    .eq('id', subtopicId)
    .single()

  if (!subtopic) redirect('/learn')

  // Determine next subtopic in this topic
  const siblings = (subtopic.topic?.subtopics || []).sort((a, b) => a.order_index - b.order_index)
  const myIdx = siblings.findIndex(s => s.id === subtopicId)
  const nextSubtopicId = myIdx >= 0 && myIdx + 1 < siblings.length ? siblings[myIdx + 1].id : null

  // Lesson
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

  // ── Load the ACTIVE student — mirrors learn/page.js logic ──────────────────
  // A user can have multiple student profiles (family plan).
  // Always use the active_student_id from profiles, not just the first match.
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_student_id')
    .eq('id', user.id)
    .single()

  const { data: allStudents } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: true })

  const activeId = profile?.active_student_id || allStudents?.[0]?.id
  const student  = allStudents?.find(s => s.id === activeId) || allStudents?.[0] || null

  const lessonData = lesson ? { ...lesson, slides, questions } : null

  return (
    <LessonPlayer
      lesson={lessonData}
      subtopic={subtopic}
      topic={subtopic?.topic}
      student={student}
      nextSubtopicId={nextSubtopicId}
      userId={user.id}
    />
  )
}