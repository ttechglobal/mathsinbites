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

  // Fallback: find subtopics in curriculum order that have lessons
  if (!firstSubtopicId) {
    // Walk curriculum in order: terms → units → topics → subtopics
    // Filter by subject on the lesson itself
    const { data: allSubtopics } = await supabase
      .from('subtopics')
      .select('id, order_index, topic:topics(order_index, unit:units(order_index, term:terms(order_index)))')
      .order('order_index')

    if (allSubtopics?.length) {
      // Sort by full curriculum path: term → unit → topic → subtopic
      const sorted = [...allSubtopics].sort((a, b) => {
        const ta = a.topic?.unit?.term?.order_index ?? 0
        const tb = b.topic?.unit?.term?.order_index ?? 0
        if (ta !== tb) return ta - tb
        const ua = a.topic?.unit?.order_index ?? 0
        const ub = b.topic?.unit?.order_index ?? 0
        if (ua !== ub) return ua - ub
        const pa = a.topic?.order_index ?? 0
        const pb = b.topic?.order_index ?? 0
        if (pa !== pb) return pa - pb
        return (a.order_index ?? 0) - (b.order_index ?? 0)
      })

      const subIds = sorted.map(s => s.id)

      // Find which ones have lessons with the right subject
      const { data: lessons } = await supabase
        .from('lessons')
        .select('subtopic_id, subject')
        .in('subtopic_id', subIds)

      if (lessons?.length) {
        const lessonMap = new Map(lessons.map(l => [l.subtopic_id, l]))
        // Walk in curriculum order, find first lesson matching subject
        for (const sub of sorted) {
          const lesson = lessonMap.get(sub.id)
          if (!lesson) continue
          const isMatch = isFM
            ? lesson.subject === 'further_maths'
            : lesson.subject !== 'further_maths'
          if (isMatch) { firstSubtopicId = sub.id; break }
        }
        // If no subject match, take first available
        if (!firstSubtopicId) {
          for (const sub of sorted) {
            if (lessonMap.has(sub.id)) { firstSubtopicId = sub.id; break }
          }
        }
      }
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