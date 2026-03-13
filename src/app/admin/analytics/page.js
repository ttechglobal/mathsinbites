import { createClient } from '@/lib/supabase/server'
import AnalyticsPage from '@/components/admin/AnalyticsPage'

export default async function AdminAnalytics() {
  const supabase = await createClient()

  // XP leaderboard (top 20 all-time)
  const { data: topStudents } = await supabase
    .from('students')
    .select('id, display_name, class_level, school, xp, monthly_xp, streak_days, created_at')
    .order('xp', { ascending: false })
    .limit(20)

  // Monthly leaderboard
  const { data: monthlyTop } = await supabase
    .from('students')
    .select('id, display_name, class_level, monthly_xp')
    .order('monthly_xp', { ascending: false })
    .limit(10)

  // Progress stats
  const { data: progressRows } = await supabase
    .from('student_progress')
    .select('status, created_at')

  const completed = (progressRows || []).filter(p => p.status === 'completed').length
  const inProgress = (progressRows || []).filter(p => p.status === 'in_progress').length

  // Generation logs (recent activity)
  const { data: genLogs } = await supabase
    .from('generation_logs')
    .select('*, subtopic:subtopics(title)')
    .order('created_at', { ascending: false })
    .limit(20)

  // Counts
  const { count: studentCount }  = await supabase.from('students').select('*', { count: 'exact', head: true })
  const { count: lessonCount }   = await supabase.from('lessons').select('*', { count: 'exact', head: true })
  const { count: practiceCount } = await supabase.from('practice_questions').select('*', { count: 'exact', head: true })

  return (
    <AnalyticsPage
      topStudents={topStudents || []}
      monthlyTop={monthlyTop || []}
      genLogs={genLogs || []}
      stats={{
        students: studentCount || 0,
        lessons: lessonCount || 0,
        practiceQuestions: practiceCount || 0,
        completedLessons: completed,
        inProgress,
      }}
    />
  )
}
