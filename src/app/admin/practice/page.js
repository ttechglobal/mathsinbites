import { createClient } from '@/lib/supabase/server'
import PracticePage from '@/components/admin/PracticePage'

export default async function AdminPractice() {
  const supabase = await createClient()

  const { data: levels } = await supabase
    .from('levels')
    .select(`*, terms(*, units(*, topics(*, subtopics(*))))`)
    .order('name')

  const { data: counts } = await supabase
    .from('practice_questions')
    .select('topic_id, difficulty, exam_tag')

  const topicCounts = {}
  for (const row of counts || []) {
    if (!topicCounts[row.topic_id]) topicCounts[row.topic_id] = { total: 0, easy: 0, medium: 0, hard: 0, exam: 0 }
    topicCounts[row.topic_id].total++
    if (row.difficulty) topicCounts[row.topic_id][row.difficulty] = (topicCounts[row.topic_id][row.difficulty] || 0) + 1
    if (row.exam_tag)   topicCounts[row.topic_id].exam++
  }

  return <PracticePage levels={levels || []} topicCounts={topicCounts} />
}