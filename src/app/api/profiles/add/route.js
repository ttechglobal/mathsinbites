// src/app/api/profiles/add/route.js

import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { name, classLevel, school } = body
  if (!name?.trim() || !classLevel) {
    return Response.json({ error: 'Name and class are required.' }, { status: 400 })
  }

  // Step 1: Insert new student
  const { data: student, error: insertError } = await supabase
    .from('students')
    .insert({
      profile_id:   user.id,
      display_name: name.trim(),
      class_level:  classLevel,
      school:       school || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[profiles/add] insert error:', insertError)
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  // Step 2: Set as active profile
  // Note: requires migration to have been run (active_student_id column must exist)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ active_student_id: student.id })
    .eq('id', user.id)

  if (updateError) {
    console.error('[profiles/add] update error:', updateError)
    // Student was created — still return success but flag the switch issue
    return Response.json({
      ok: true,
      studentId: student.id,
      warning: `Profile created but could not set active: ${updateError.message}`,
    })
  }

  return Response.json({ ok: true, studentId: student.id })
}