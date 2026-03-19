import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { studentId } = body
  if (!studentId) return Response.json({ error: 'studentId required' }, { status: 400 })

  // Verify student belongs to this user and is SS level
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('id, class_level, subjects')
    .eq('id', studentId)
    .eq('profile_id', user.id)
    .single()

  if (fetchError || !student) {
    return Response.json({ error: 'Student not found' }, { status: 404 })
  }

  // Further Maths only available for SS1, SS2, SS3
  const SS_LEVELS = ['SS1', 'SS2', 'SS3']
  if (!SS_LEVELS.includes(student.class_level)) {
    return Response.json({ error: 'Further Maths is only available for SS1–SS3 students' }, { status: 403 })
  }

  // Already enrolled — idempotent, just return ok
  const currentSubjects = student.subjects || ['maths']
  if (currentSubjects.includes('further_maths')) {
    return Response.json({ ok: true, alreadyEnrolled: true })
  }

  const { error: updateError } = await supabase
    .from('students')
    .update({
      subjects:       [...currentSubjects, 'further_maths'],
      active_subject: 'further_maths',
    })
    .eq('id', studentId)

  if (updateError) {
    console.error('[subjects/enroll] update error:', updateError.message)
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}