// src/app/api/profiles/switch/route.js

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

  // Verify this student belongs to the logged-in user
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('profile_id', user.id)
    .single()

  if (fetchError || !student) {
    return Response.json({ error: 'Profile not found or does not belong to you' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ active_student_id: studentId })
    .eq('id', user.id)

  if (updateError) {
    console.error('[profiles/switch] update error:', updateError)
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}