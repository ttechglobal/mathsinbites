// src/app/guest/lesson/[subtopicId]/page.js
// Guest lesson player — no auth, localStorage progress

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GuestLessonPlayer from '@/components/guest/GuestLessonPlayer'

export default async function GuestLessonPage({ params }) {
  const { subtopicId } = await params
  const supabase = await createClient()

  // Load subtopic + lesson — no auth required (public read)
  const { data: subtopic } = await supabase
    .from('subtopics')
    .select('*, topic:topics(*, subtopics(id, order_index, title))')
    .eq('id', subtopicId)
    .single()

  if (!subtopic) redirect('/guest')

  // Determine next subtopic in same topic
  const siblings = (subtopic.topic?.subtopics || []).sort((a, b) => a.order_index - b.order_index)
  const myIdx = siblings.findIndex(s => s.id === subtopicId)
  const nextSubtopicId = myIdx >= 0 && myIdx + 1 < siblings.length ? siblings[myIdx + 1].id : null

  // Load lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('subtopic_id', subtopicId)
    .maybeSingle()

  let slides = []
  let questions = []

  if (lesson) {
    const { data: slidesData } = await supabase
      .from('slides').select('*').eq('lesson_id', lesson.id).order('order_index')
    const { data: questionsData } = await supabase
      .from('questions').select('*, options:question_options(*)').eq('lesson_id', lesson.id).order('order_index')

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

  const lessonData = lesson ? { ...lesson, slides, questions } : null

  return (
    <GuestLessonPlayer
      lesson={lessonData}
      subtopic={subtopic}
      nextSubtopicId={nextSubtopicId}
    />
  )
}