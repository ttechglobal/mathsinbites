import { createClient } from '@/lib/supabase/server'

// ── Auth guard ───────────────────────────────────────────────────────────────
async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? user : null
}

// ── POST /api/admin/past-questions — bulk insert past questions ──────────────
export async function POST(request) {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { questions } = body
  if (!Array.isArray(questions) || questions.length === 0)
    return Response.json({ error: 'questions must be a non-empty array' }, { status: 400 })

  const { data, error } = await supabase
    .from('past_questions')
    .insert(questions)
    .select('id')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ inserted: data?.length ?? questions.length })
}

// ── GET /api/admin/past-questions — list all past questions (paginated) ───────
export async function GET(request) {
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const url    = new URL(request.url)
  const page   = parseInt(url.searchParams.get('page') || '1')
  const limit  = parseInt(url.searchParams.get('limit') || '50')
  const from   = (page - 1) * limit
  const exam   = url.searchParams.get('exam')

  let query = supabase.from('past_questions')
    .select('id, exam_body, year, subject, question_number, question_type, topic_slug, question_text, correct_answer, final_answer, marks', { count: 'exact' })
    .order('exam_body').order('year', { ascending: false }).order('question_number')
    .range(from, from + limit - 1)

  if (exam) query = query.eq('exam_body', exam)

  const { data, error, count } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ questions: data || [], total: count ?? 0 })
}