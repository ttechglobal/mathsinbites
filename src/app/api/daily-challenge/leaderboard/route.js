// src/app/api/daily-challenge/leaderboard/route.js

import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('questionId')
  const today = new Date().toISOString().slice(0, 10)

  if (!questionId) return Response.json({ solvers: [] })

  // Get attempts, then fetch student names separately to avoid FK join issues
  const { data: attempts } = await supabase
    .from('daily_challenge_attempts')
    .select('student_id, attempted_at')
    .eq('question_id', questionId)
    .eq('challenge_date', today)
    .eq('solved', true)
    .order('attempted_at', { ascending: true })
    .limit(20)

  if (!attempts?.length) return Response.json({ solvers: [], date: today })

  // Fetch student names in one query
  const studentIds = attempts.map(a => a.student_id)
  const { data: students } = await supabase
    .from('students')
    .select('id, display_name, class_level, school')
    .in('id', studentIds)

  const studentMap = Object.fromEntries((students || []).map(s => [s.id, s]))

  const solvers = attempts.map((a, i) => {
    const stu = studentMap[a.student_id] || {}
    return {
      rank:         i + 1,
      display_name: stu.display_name || 'Student',
      class_level:  stu.class_level  || '',
      school:       stu.school       || '',
      student_id:   a.student_id,
      solved_at:    a.attempted_at,
    }
  })

  return Response.json({ solvers, date: today })
}