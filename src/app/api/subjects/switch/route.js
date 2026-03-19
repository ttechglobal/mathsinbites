import { createClient } from '@/lib/supabase/server'

const VALID_SUBJECTS = ['maths', 'further_maths']

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { studentId, subject } = body
  if (!studentId)                     return Response.json({ error: 'studentId required' }, { status: 400 })
  if (!VALID_SUBJECTS.includes(subject)) return Response.json({ error: 'Invalid subject' }, { status: 400 })

  // Verify student belongs to this user
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('id, subjects')
    .eq('id', studentId)
    .eq('profile_id', user.id)
    .single()

  if (fetchError || !student) {
    return Response.json({ error: 'Student not found' }, { status: 404 })
  }

  // Verify student is enrolled in the target subject
  const enrolled = student.subjects || ['maths']
  if (!enrolled.includes(subject)) {
    return Response.json({ error: 'Student is not enrolled in this subject' }, { status: 403 })
  }

  const { error: updateError } = await supabase
    .from('students')
    .update({ active_subject: subject })
    .eq('id', studentId)

  if (updateError) {
    console.error('[subjects/switch] update error:', updateError.message)
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ ok: true, active_subject: subject })
}