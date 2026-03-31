// ═══════════════════════════════════════════════════════════════════════════
// src/app/api/admin/lesson-editor/save/route.js
// Saves edited slides back to DB
// ═══════════════════════════════════════════════════════════════════════════
// FILE 1: save/route.js

import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()
  const { lessonId, slides } = await request.json()
  if (!lessonId || !slides) return Response.json({ error: 'Missing fields' }, { status: 400 })

  for (const slide of slides) {
    if (slide.id?.startsWith('new-')) {
      // New slide — insert
      const { error } = await supabase.from('slides').insert({
        lesson_id:   lessonId,
        order_index: slide.order_index,
        type:        slide.type        || 'concept',
        title:       slide.title       || '',
        explanation: slide.explanation || '',
        formula:     slide.formula     || null,
        hint:        slide.hint        || null,
        svg_code:    slide.svg_code    || null,
        has_illustration: !!(slide.svg_code),
      })
      if (error) console.error('[editor/save] insert error:', error.message)
    } else {
      // Existing slide — update
      const { error } = await supabase.from('slides').update({
        order_index: slide.order_index,
        type:        slide.type,
        title:       slide.title       || '',
        explanation: slide.explanation || '',
        formula:     slide.formula     || null,
        hint:        slide.hint        || null,
        svg_code:    slide.svg_code    || null,
        has_illustration: !!(slide.svg_code),
      }).eq('id', slide.id)
      if (error) console.error('[editor/save] update error:', error.message)
    }
  }

  return Response.json({ ok: true })
}