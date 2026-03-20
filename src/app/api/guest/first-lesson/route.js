// src/app/api/guest/first-lesson/route.js
// Server-side route — uses service role, bypasses RLS
// Returns the first available subtopic ID for a given class + subject

import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const classLevel = searchParams.get('class') || ''
  const subject    = searchParams.get('subject') || 'maths'

  const supabase = await createClient()
  const isFM     = subject === 'further_maths'

  // Try levels table first (populated when admin uploads curriculum)
  const levelCode  = isFM ? `FM_${classLevel}` : classLevel
  const nameForms  = [...new Set([levelCode, classLevel, classLevel.replace(/([A-Z]+)(\d)/, '$1 $2')])]

  let firstSubtopicId = null

  for (const code of nameForms) {
    const { data: lvl } = await supabase
      .from('levels').select('id').or(`code.eq.${code},name.eq.${code}`).maybeSingle()

    if (lvl) {
      firstSubtopicId = await getFirstSubtopicForLevel(supabase, lvl.id)
      if (firstSubtopicId) break
    }
  }

  // Fallback: any lesson matching subject preference
  if (!firstSubtopicId) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('subtopic_id, subject')
      .limit(50)

    if (lessons?.length) {
      const match = lessons.find(l =>
        isFM ? l.subject === 'further_maths' : l.subject !== 'further_maths'
      ) || lessons[0]
      firstSubtopicId = match?.subtopic_id || null
    }
  }

  if (!firstSubtopicId) {
    return Response.json({ error: 'No lessons found' }, { status: 404 })
  }

  return Response.json({ subtopicId: firstSubtopicId })
}

async function getFirstSubtopicForLevel(supabase, levelId) {
  const { data: terms } = await supabase.from('terms').select('id').eq('level_id', levelId)
  if (!terms?.length) return null
  const { data: units } = await supabase.from('units').select('id, order_index').in('term_id', terms.map(t => t.id)).order('order_index')
  if (!units?.length) return null
  const { data: topics } = await supabase.from('topics').select('id, order_index').in('unit_id', units.map(u => u.id)).order('order_index')
  if (!topics?.length) return null
  const { data: subs } = await supabase.from('subtopics').select('id, order_index').in('topic_id', topics.map(t => t.id)).order('order_index')
  if (!subs?.length) return null
  const { data: lessons } = await supabase.from('lessons').select('subtopic_id').in('subtopic_id', subs.map(s => s.id)).limit(10)
  if (!lessons?.length) return null
  const lessonSet = new Set(lessons.map(l => l.subtopic_id))
  return subs.find(s => lessonSet.has(s.id))?.id || null
}