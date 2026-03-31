// src/app/api/guest/first-lesson/route.js
// Returns first available subtopic for a given class + subject
// Works even when levels table is empty

import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const classLevel = searchParams.get('class') || ''
  const subject    = searchParams.get('subject') || 'maths'

  const supabase   = await createClient()
  const isFM       = subject === 'further_maths'
  const levelCode  = isFM ? `FM_${classLevel}` : classLevel

  let firstSubtopicId = null

  // ── Strategy 1: levels table (when curriculum is uploaded) ────────────────
  const nameForms = [...new Set([levelCode, classLevel, classLevel.replace(/([A-Z]+)(\d)/, '$1 $2')])]
  for (const code of nameForms) {
    const { data: lvl } = await supabase
      .from('levels').select('id').eq('code', code).maybeSingle()
    if (!lvl) {
      const { data: lvl2 } = await supabase
        .from('levels').select('id').eq('name', code).maybeSingle()
      if (!lvl2) continue
      firstSubtopicId = await getFirstFromLevel(supabase, lvl2.id, isFM)
    } else {
      firstSubtopicId = await getFirstFromLevel(supabase, lvl.id, isFM)
    }
    if (firstSubtopicId) break
  }

  // ── Strategy 2: filter by class_level column on lessons ──────────────────
  // (populated after the ALTER TABLE migration is run)
  if (!firstSubtopicId) {
    const classVariants = [...new Set([classLevel, classLevel.replace(/([A-Z]+)(\d)/, '$1 $2')])]
    for (const variant of classVariants) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('subtopic_id, subject, class_level')
        .eq('class_level', variant)
        .limit(50)
      if (lessons?.length) {
        // Sort to get consistent ordering, prefer subject match
        const match = lessons.find(l => isFM ? l.subject === 'further_maths' : l.subject !== 'further_maths')
        if (match) { firstSubtopicId = match.subtopic_id; break }
        firstSubtopicId = lessons[0].subtopic_id
        break
      }
    }
  }

  // ── Strategy 3: walk ALL subtopics in curriculum order, filter by subject ─
  // This is the current fallback — but now we add class-level awareness
  // by checking subtopic → topic title against known class topic patterns
  if (!firstSubtopicId) {
    // Fetch all subtopics with their full topic chain for sorting
    const { data: allSubs } = await supabase
      .from('subtopics')
      .select('id, order_index, topic:topics(id, title, order_index, unit:units(order_index, term:terms(order_index)))')
      .order('order_index')

    if (allSubs?.length) {
      // Sort by curriculum path
      const sorted = [...allSubs].sort((a, b) => {
        const ta = a.topic?.unit?.term?.order_index ?? 0, tb = b.topic?.unit?.term?.order_index ?? 0
        if (ta !== tb) return ta - tb
        const ua = a.topic?.unit?.order_index ?? 0, ub = b.topic?.unit?.order_index ?? 0
        if (ua !== ub) return ua - ub
        const pa = a.topic?.order_index ?? 0, pb = b.topic?.order_index ?? 0
        if (pa !== pb) return pa - pb
        return (a.order_index ?? 0) - (b.order_index ?? 0)
      })

      const subIds = sorted.map(s => s.id)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('subtopic_id, subject, class_level')
        .in('subtopic_id', subIds)

      if (lessons?.length) {
        const lessonMap = new Map(lessons.map(l => [l.subtopic_id, l]))

        // Try to find a lesson matching class AND subject
        for (const sub of sorted) {
          const lesson = lessonMap.get(sub.id)
          if (!lesson) continue
          // Check class_level match if column exists
          if (lesson.class_level && lesson.class_level !== classLevel &&
              lesson.class_level !== classLevel.replace(/([A-Z]+)(\d)/, '$1 $2')) continue
          const subjectMatch = isFM ? lesson.subject === 'further_maths' : lesson.subject !== 'further_maths'
          if (subjectMatch) { firstSubtopicId = sub.id; break }
        }

        // Fall back to subject match only (ignore class if nothing found)
        if (!firstSubtopicId) {
          for (const sub of sorted) {
            const lesson = lessonMap.get(sub.id)
            if (!lesson) continue
            const subjectMatch = isFM ? lesson.subject === 'further_maths' : lesson.subject !== 'further_maths'
            if (subjectMatch) { firstSubtopicId = sub.id; break }
          }
        }

        // Absolute last resort: any lesson
        if (!firstSubtopicId) {
          for (const sub of sorted) {
            if (lessonMap.has(sub.id)) { firstSubtopicId = sub.id; break }
          }
        }
      }
    }
  }

  if (!firstSubtopicId) {
    return Response.json({ error: 'No lessons found for this class yet. Try JSS3 or SS1!' }, { status: 404 })
  }

  return Response.json({ subtopicId: firstSubtopicId })
}

async function getFirstFromLevel(supabase, levelId, isFM) {
  const { data: terms } = await supabase.from('terms').select('id').eq('level_id', levelId)
  if (!terms?.length) return null
  const { data: units } = await supabase.from('units').select('id, order_index').in('term_id', terms.map(t => t.id)).order('order_index')
  if (!units?.length) return null
  const { data: topics } = await supabase.from('topics').select('id, order_index').in('unit_id', units.map(u => u.id)).order('order_index')
  if (!topics?.length) return null
  const { data: subs } = await supabase.from('subtopics').select('id, order_index').in('topic_id', topics.map(t => t.id)).order('order_index')
  if (!subs?.length) return null
  const { data: lessons } = await supabase.from('lessons').select('subtopic_id, subject').in('subtopic_id', subs.map(s => s.id))
  if (!lessons?.length) return null
  const lessonSet = new Map(lessons.map(l => [l.subtopic_id, l]))
  for (const sub of subs) {
    const lesson = lessonSet.get(sub.id)
    if (!lesson) continue
    const match = isFM ? lesson.subject === 'further_maths' : lesson.subject !== 'further_maths'
    if (match) return sub.id
  }
  return subs.find(s => lessonSet.has(s.id))?.id || null
}