import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type        = searchParams.get('type') || 'class'
  const class_level = searchParams.get('class_level')
  const school      = searchParams.get('school')

  // Build query — server-side client runs with user auth cookie
  // If RLS is blocking this, you need to add a SELECT policy on students table:
  //   CREATE POLICY "students can view all students" ON students FOR SELECT USING (true);
  let query = supabase
    .from('students')
    .select('id, display_name, class_level, school, xp, monthly_xp')
    .order('monthly_xp', { ascending: false })
    .limit(50)

  if (type === 'class' && class_level) {
    query = query.eq('class_level', class_level)
  } else if (type === 'school' && school) {
    query = query.eq('school', school)
  }
  // type === 'overall' — no additional filter

  const { data, error } = await query

  if (error) {
    console.error('[leaderboard] query error:', error.message, error.code)
    return Response.json({ error: error.message }, { status: 500 })
  }

  console.log(`[leaderboard] type=${type} returned ${data?.length ?? 0} rows`)
  return Response.json(data || [])
}