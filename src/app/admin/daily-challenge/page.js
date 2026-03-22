// src/app/admin/daily-challenge/page.js
import { createClient } from '@/lib/supabase/server'
import DailyChallengePage from '@/components/admin/DailyChallengePage'

export default async function Page() {
  const supabase = await createClient()

  // Load existing questions
  const { data: questions } = await supabase
    .from('daily_challenge_questions')
    .select('*')
    .order('created_at', { ascending: false })

  // Load topics from DB grouped by class level
  // topics → units → terms → levels gives us class_level context
  // Since levels table may be empty, also try getting topics directly
  const topicsMap = {}

  // Try via levels chain first
  const { data: levels } = await supabase
    .from('levels')
    .select('code, name, terms(units(topics(title)))')

  if (levels?.length) {
    for (const level of levels) {
      const code = level.code || level.name
      const classKey = code.replace('FM_', '').replace(/\s/g, '')
      const topics = (level.terms || [])
        .flatMap(t => t.units || [])
        .flatMap(u => u.topics || [])
        .map(t => t.title)
        .filter(Boolean)
      if (topics.length && classKey) {
        topicsMap[classKey] = [...new Set([...(topicsMap[classKey] || []), ...topics])]
      }
    }
  }

  // Also pull from topics table directly (covers when levels is empty)
  const { data: allTopics } = await supabase
    .from('topics')
    .select('title')
    .order('title')

  // Add as 'General' if we have topics but no level mapping
  const allTopicTitles = [...new Set((allTopics || []).map(t => t.title).filter(Boolean))]

  // If topicsMap is empty, put all topics under each class level as fallback
  if (Object.keys(topicsMap).length === 0 && allTopicTitles.length) {
    for (const cl of ['JSS1','JSS2','JSS3','SS1','SS2','SS3']) {
      topicsMap[cl] = allTopicTitles
    }
  }

  return <DailyChallengePage questions={questions || []} topics={topicsMap} />
}