import { createClient } from '@/lib/supabase/server'

async function isAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin'
}

// GET — fetch questions for a topic
export async function GET(request) {
  const supabase = await createClient()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const topicId = new URL(request.url).searchParams.get('topicId')
  if (!topicId) return Response.json({ error: 'topicId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('practice_questions')
    .select('*, options:practice_question_options(*)')
    .eq('topic_id', topicId)
    .order('difficulty')
    .order('created_at')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ questions: data || [] })
}

// PATCH — toggle active
export async function PATCH(request) {
  const supabase = await createClient()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { questionId, is_active } = await request.json()
  const { error } = await supabase
    .from('practice_questions')
    .update({ is_active })
    .eq('id', questionId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

// DELETE — remove question
export async function DELETE(request) {
  const supabase = await createClient()
  if (!await isAdmin(supabase)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { questionId } = await request.json()
  const { error } = await supabase
    .from('practice_questions')
    .delete()
    .eq('id', questionId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
