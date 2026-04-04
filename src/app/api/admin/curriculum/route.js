import { createClient } from '@/lib/supabase/server'

function toSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const TERM_NAMES = { 1: 'First Term', 2: 'Second Term', 3: 'Third Term' }

// ── POST /api/admin/curriculum ───────────────────────────────────────────────
export async function POST(request) {
  let supabase
  try {
    supabase = await createClient()
  } catch (e) {
    console.error('[curriculum] createClient failed:', e)
    return Response.json({ error: 'Server config error: ' + e.message }, { status: 500 })
  }

  // ── Auth check — graceful failure ─────────────────────────────────────────
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return Response.json({ error: 'Not authenticated. Please refresh the page and try again.' }, { status: 401 })
    }
    const { data: profile, error: profileErr } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profileErr) {
      console.error('[curriculum] profile lookup failed:', profileErr.message)
      return Response.json({ error: 'Could not verify admin role: ' + profileErr.message }, { status: 500 })
    }
    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 })
    }
  } catch (e) {
    console.error('[curriculum] auth error:', e)
    return Response.json({ error: 'Auth error: ' + e.message }, { status: 500 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body
  try { body = await request.json() }
  catch (e) { return Response.json({ error: 'Invalid JSON body: ' + e.message }, { status: 400 }) }

  const { effectiveCode, effectiveName, effectiveCategory, selectedSubject, isClass, parsed } = body

  if (!effectiveCode) return Response.json({ error: 'effectiveCode is required' }, { status: 400 })
  if (!parsed?.length) return Response.json({ error: 'parsed topics array is empty' }, { status: 400 })

  // ── Save curriculum ───────────────────────────────────────────────────────
  try {
    // 1. Upsert the level row
    // Normalise category: DB constraint only allows 'junior' | 'senior'
    // Exam curricula are treated as 'senior' for the constraint
    const safeCategory = ['junior','senior'].includes(effectiveCategory) ? effectiveCategory : 'senior'

    const { data: level, error: levelErr } = await supabase
      .from('levels')
      .upsert(
        { name: effectiveName, code: effectiveCode, category: safeCategory, subject: selectedSubject },
        { onConflict: 'code' }
      )
      .select('id, code').single()

    if (levelErr) {
      console.error('[curriculum] levels upsert:', levelErr)
      throw new Error(`Saving level failed: ${levelErr.message} (code: ${levelErr.code})`)
    }

    let topicCount = 0

    if (isClass) {
      // ── SCHOOL MODE — real term structure ─────────────────────────────────
      for (const termData of parsed) {
        const termNum  = Number(termData.term)
        const termName = termData.term_name || TERM_NAMES[termNum] || `Term ${termNum}`

        // Try upsert first; if onConflict fails, fallback to select-or-insert
        let term
        const upsertTerm = await supabase.from('terms')
          .upsert(
            { level_id: level.id, name: termName, term_number: termNum, order_index: termNum - 1 },
            { onConflict: 'level_id,term_number' }
          )
          .select('id').single()

        if (upsertTerm.error) {
          // onConflict constraint may not exist — try select-or-insert
          console.warn('[curriculum] term upsert fallback:', upsertTerm.error.message)
          const existing = await supabase.from('terms')
            .select('id').eq('level_id', level.id).eq('term_number', termNum).maybeSingle()
          if (existing.data) {
            term = existing.data
          } else {
            const ins = await supabase.from('terms')
              .insert({ level_id: level.id, name: termName, term_number: termNum, order_index: termNum - 1 })
              .select('id').single()
            if (ins.error) throw new Error(`Saving term ${termNum} failed: ${ins.error.message}`)
            term = ins.data
          }
        } else {
          term = upsertTerm.data
        }

        // One unit per term
        const unitTitle = `${termName} Topics`
        let unitRow
        const existUnit = await supabase.from('units').select('id')
          .eq('level_id', level.id).eq('term_id', term.id).eq('title', unitTitle).maybeSingle()

        if (existUnit.data) {
          unitRow = existUnit.data
        } else {
          const newUnit = await supabase.from('units')
            .insert({ level_id: level.id, term_id: term.id, title: unitTitle, order_index: 0 })
            .select('id').single()
          if (newUnit.error) throw new Error(`Saving unit for term ${termNum} failed: ${newUnit.error.message}`)
          unitRow = newUnit.data
        }

        // Insert topics + subtopics
        for (let tIdx = 0; tIdx < (termData.topics || []).length; tIdx++) {
          const topic   = termData.topics[tIdx]
          const slug    = toSlug(topic.title)

          const topicIns = await supabase.from('topics')
            .insert({ unit_id: unitRow.id, title: topic.title, order_index: tIdx, slug })
            .select('id').single()
          if (topicIns.error) {
            // slug column might not exist — retry without it
            if (topicIns.error.message.includes('slug')) {
              const retry = await supabase.from('topics')
                .insert({ unit_id: unitRow.id, title: topic.title, order_index: tIdx })
                .select('id').single()
              if (retry.error) throw new Error(`Saving topic "${topic.title}": ${retry.error.message}`)
              var topicRow = retry.data
            } else {
              throw new Error(`Saving topic "${topic.title}": ${topicIns.error.message}`)
            }
          } else {
            var topicRow = topicIns.data
          }

          for (let sIdx = 0; sIdx < (topic.subtopics || []).length; sIdx++) {
            const sub    = topic.subtopics[sIdx]
            const subIns = await supabase.from('subtopics')
              .insert({
                topic_id:            topicRow.id,
                title:               typeof sub === 'string' ? sub : sub.title,
                learning_objectives: sub.objectives || [],
                order_index:         sIdx,
              })
            if (subIns.error) throw new Error(`Saving subtopic: ${subIns.error.message}`)
          }
          topicCount++
        }
      }

    } else {
      // ── EXAM MODE — one synthetic term, flat topic list ────────────────────
      let term
      const upsertTerm = await supabase.from('terms')
        .upsert(
          { level_id: level.id, name: 'Full Syllabus', term_number: 1, order_index: 0 },
          { onConflict: 'level_id,term_number' }
        )
        .select('id').single()

      if (upsertTerm.error) {
        console.warn('[curriculum] exam term upsert fallback:', upsertTerm.error.message)
        const existing = await supabase.from('terms')
          .select('id').eq('level_id', level.id).eq('term_number', 1).maybeSingle()
        if (existing.data) {
          term = existing.data
        } else {
          const ins = await supabase.from('terms')
            .insert({ level_id: level.id, name: 'Full Syllabus', term_number: 1, order_index: 0 })
            .select('id').single()
          if (ins.error) throw new Error(`Saving exam term: ${ins.error.message}`)
          term = ins.data
        }
      } else {
        term = upsertTerm.data
      }

      let unitRow
      const existUnit = await supabase.from('units').select('id')
        .eq('level_id', level.id).eq('term_id', term.id).eq('title', 'Topics').maybeSingle()

      if (existUnit.data) {
        unitRow = existUnit.data
      } else {
        const newUnit = await supabase.from('units')
          .insert({ level_id: level.id, term_id: term.id, title: 'Topics', order_index: 0 })
          .select('id').single()
        if (newUnit.error) throw new Error(`Saving exam unit: ${newUnit.error.message}`)
        unitRow = newUnit.data
      }

      for (let tIdx = 0; tIdx < parsed.length; tIdx++) {
        const topic  = parsed[tIdx]
        const slug   = toSlug(topic.title)

        const topicIns = await supabase.from('topics')
          .insert({ unit_id: unitRow.id, title: topic.title, order_index: tIdx, slug })
          .select('id').single()

        let topicRow
        if (topicIns.error) {
          if (topicIns.error.message.includes('slug')) {
            const retry = await supabase.from('topics')
              .insert({ unit_id: unitRow.id, title: topic.title, order_index: tIdx })
              .select('id').single()
            if (retry.error) throw new Error(`Saving topic "${topic.title}": ${retry.error.message}`)
            topicRow = retry.data
          } else {
            throw new Error(`Saving topic "${topic.title}": ${topicIns.error.message}`)
          }
        } else {
          topicRow = topicIns.data
        }

        for (let sIdx = 0; sIdx < (topic.subtopics || []).length; sIdx++) {
          const sub    = topic.subtopics[sIdx]
          const subIns = await supabase.from('subtopics')
            .insert({
              topic_id:            topicRow.id,
              title:               typeof sub === 'string' ? sub : sub.title,
              learning_objectives: sub.objectives || [],
              order_index:         sIdx,
            })
          if (subIns.error) throw new Error(`Saving subtopic: ${subIns.error.message}`)
        }
        topicCount++
      }
    }

    return Response.json({ success: true, topicCount })

  } catch (err) {
    console.error('[curriculum] save error:', err)
    return Response.json(
      { error: err.message || 'Unknown server error' },
      { status: 500 }
    )
  }
}