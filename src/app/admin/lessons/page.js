import { createClient } from '@/lib/supabase/server'
import LessonsHub from '@/components/admin/LessonsHub'

export default async function AdminLessons() {
  const supabase = await createClient()

  // Fetch curriculum with published status
  const { data: levels } = await supabase
    .from('levels')
    .select(`*, terms(*, units(*, topics(*, subtopics(id, title, order_index, is_published, generated_at))))`)
    .order('name')

  // Fetch all lessons with their slides + questions separately
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`*, slides(id, order_index, type, title, explanation, formula, hint, svg_code, steps),
             questions(id, order_index, question_text, difficulty, explanation,
               options:question_options(id, option_text, is_correct))`)

  // Map lessons by subtopic_id for quick lookup
  const lessonMap = {}
  for (const lesson of lessons || []) {
    lessonMap[lesson.subtopic_id] = lesson
  }

  // Attach lessons to subtopics
  const levelsWithLessons = (levels || []).map(level => ({
    ...level,
    terms: (level.terms || []).map(term => ({
      ...term,
      units: (term.units || []).map(unit => ({
        ...unit,
        topics: (unit.topics || []).map(topic => ({
          ...topic,
          subtopics: (topic.subtopics || []).map(sub => ({
            ...sub,
            lesson: lessonMap[sub.id] || null,
          })),
        })),
      })),
    })),
  }))

  // Stats
  const { count: lessonCount }   = await supabase.from('lessons').select('*', { count:'exact', head:true })
  const { count: slideCount }    = await supabase.from('slides').select('*', { count:'exact', head:true })
  const { count: questionCount } = await supabase.from('questions').select('*', { count:'exact', head:true })

  return (
    <LessonsHub
      levels={levelsWithLessons}
      stats={{ lessons: lessonCount || 0, slides: slideCount || 0, questions: questionCount || 0 }}
    />
  )
}
