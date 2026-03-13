import { createClient } from '@/lib/supabase/server'

async function isAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin'
}

export async function PATCH(request) {
  const supabase = await createClient()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { flagId, status } = await request.json()
  const { error } = await supabase.from('flagged_questions').update({ status }).eq('id', flagId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
