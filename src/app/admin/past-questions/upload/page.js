'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Module-level client (keeps auth session across renders) ──────────────────
const supabase = createClient()

const A = {
  bg: '#09071A', surface: '#12102A', card: '#181535', cardHi: '#1E1A40',
  border: 'rgba(165,155,255,0.1)', borderHi: 'rgba(165,155,255,0.26)',
  chalk: '#F0EDFF', dim: 'rgba(220,215,255,0.5)', dim2: 'rgba(220,215,255,0.28)',
  accent: '#7C3AED', accentHi: '#9F67FF',
  electric: '#C8F135', gold: '#FFC933', coral: '#FF6B6B', teal: '#00D4C8', green: '#22c55e',
}

const EXAM_BODIES = ['WAEC', 'JAMB', 'NECO', 'BECE', 'GCE']

// Required fields — topic is NOT required; it comes from JSON as-is
const REQUIRED_FIELDS = ['question_number', 'question_type', 'question_text', 'solution_steps', 'final_answer']

// ── Slug helper ───────────────────────────────────────────────────────────────
function toSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Extract topic name from a question row ────────────────────────────────────
// Accepts: topic_slug, topic, topic_title, category — whichever is present
function extractTopic(q) {
  return (q.topic_slug || q.topic || q.topic_title || q.category || '').trim()
}

export default function UploadPastQuestions() {
  const [examBody,   setExamBody]   = useState('WAEC')
  const [year,       setYear]       = useState(new Date().getFullYear())
  const [raw,        setRaw]        = useState('')
  const [rows,       setRows]       = useState([])
  const [parseError, setParseError] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saveLog,    setSaveLog]    = useState([])   // per-topic result log
  const [toast,      setToast]      = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  // ── Parse JSON ────────────────────────────────────────────────────────────
  // Read topic directly from JSON — no matching, no transformation
  function parse() {
    setParseError('')
    setRows([])
    setSaveLog([])
    let parsed
    try { parsed = JSON.parse(raw) }
    catch (e) { setParseError('Invalid JSON: ' + e.message); return }
    if (!Array.isArray(parsed)) { setParseError('Expected a JSON array at the top level.'); return }

    const annotated = parsed.map((q, i) => {
      const missing     = REQUIRED_FIELDS.filter(f => !q[f] && q[f] !== 0)
      const topicRaw    = extractTopic(q)  // exactly what came in the JSON
      return {
        ...q,
        _index:     i,
        _missing:   missing,
        _hasError:  missing.length > 0,
        _topicRaw:  topicRaw,              // stored for display
        topic_slug: toSlug(topicRaw),      // slug stored in DB (kebab-case of the raw name)
        _topicDisplay: topicRaw || '(no topic)',
        exam_body:  examBody,
        year:       parseInt(year),
        subject:    q.subject || 'Mathematics',
      }
    })
    setRows(annotated)
  }

  function deleteRow(index) {
    setRows(prev => prev.filter(r => r._index !== index))
  }

  function updateTopicRaw(index, newTopic) {
    setRows(prev => prev.map(r => {
      if (r._index !== index) return r
      return { ...r, _topicRaw: newTopic, topic_slug: toSlug(newTopic), _topicDisplay: newTopic || '(no topic)' }
    }))
  }

  // ── Save — one topic at a time, merge into existing ───────────────────────
  //
  // Flow per unique topic in the batch:
  //   1. Check past_questions table for existing questions with this topic_slug
  //      → just insert — past_questions stores topic_slug as plain text, no FK
  //   That's it. No topic deduplication needed at the past_questions level.
  //   The topic_slug is just a text label. Same label = same bucket when queried.
  //
  async function saveAll() {
    const invalid = rows.filter(r => r._hasError)
    if (invalid.length > 0) {
      showToast(`Fix ${invalid.length} error(s) before saving (missing required fields).`, 'error')
      return
    }

    setSaving(true)
    setSaveLog([])

    // Group by topic for the log
    const byTopic = {}
    for (const row of rows) {
      const key = row.topic_slug || '__no_topic__'
      if (!byTopic[key]) byTopic[key] = { topicDisplay: row._topicRaw || 'No topic', rows: [] }
      byTopic[key].rows.push(row)
    }

    // Build insert array — store topic_slug exactly as derived from JSON
    const toInsert = rows.map(({ _index, _missing, _hasError, _topicRaw, _topicDisplay, _originalSlug, _slugOk, _matchedTitle, _matchConf, ...q }) => ({
      exam_body:           q.exam_body,
      year:                q.year,
      subject:             q.subject,
      question_number:     q.question_number,
      question_type:       q.question_type,
      topic_slug:          q.topic_slug,         // stored as-is (slug of what came in JSON)
      question_text:       q.question_text,
      options:             q.options || null,
      correct_answer:      q.correct_answer || null,
      solution_steps:      Array.isArray(q.solution_steps) ? q.solution_steps : [q.solution_steps],
      final_answer:        q.final_answer || '',
      diagram_description: q.diagram_description || null,
      diagram_svg:         q.diagram_svg || null,
      marks:               q.marks || null,
    }))

    const res = await fetch('/api/admin/past-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: toInsert }),
    })
    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      const msg = result?.error || `HTTP ${res.status}`
      showToast('Save failed: ' + msg, 'error')
      setSaveLog([{ topic: 'Error', count: 0, status: 'error', msg }])
      return
    }

    // Build result log grouped by topic
    const log = Object.entries(byTopic).map(([slug, group]) => ({
      topic: group.topicDisplay,
      count: group.rows.length,
      status: 'saved',
    }))
    setSaveLog(log)
    showToast(`✓ Saved ${toInsert.length} questions across ${log.length} topic(s)!`)
    setRaw('')
    setRows([])
  }

  const errorCount    = rows.filter(r => r._hasError).length
  const topicCount    = new Set(rows.map(r => r.topic_slug)).size

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.chalk, fontFamily: "'Nunito', sans-serif", padding: '32px 24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '13px 22px', borderRadius: 12,
          background: toast.type === 'error' ? '#7f1d1d' : '#14532d',
          color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 380 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link href="/admin/past-questions" style={{ color: A.dim, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>← Back</Link>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: A.dim, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 2 }}>Admin</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: A.chalk, margin: 0, fontFamily: "'Fredoka', sans-serif" }}>Upload Past Questions</h1>
        </div>
      </div>

      {/* How it works notice */}
      <div style={{ background: 'rgba(0,212,200,0.07)', border: '1.5px solid rgba(0,212,200,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: A.teal, marginBottom: 4 }}>How topic assignment works</div>
        <div style={{ fontSize: 12, color: A.dim, lineHeight: 1.7 }}>
          Topics are read <strong style={{ color: A.chalk }}>directly from your JSON</strong> — whatever comes in is stored exactly as-is.
          If the JSON says <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px' }}>Indices and Logarithms</code>, it is stored as <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px' }}>Indices and Logarithms</code>.
          When you upload a second batch with the same topic name, the questions merge into the same bucket automatically — no duplicates.
        </div>
      </div>

      {/* STEP 1 — Exam details */}
      <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: A.dim2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Step 1 — Exam details</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: A.dim, marginBottom: 8 }}>Exam Body</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {EXAM_BODIES.map(e => (
                <button key={e} onClick={() => setExamBody(e)}
                  style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${examBody===e ? A.accent : A.border}`, background: examBody===e ? `${A.accent}22` : 'transparent', color: examBody===e ? A.accentHi : A.dim, fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: A.dim, marginBottom: 8 }}>Year</div>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} min="1990" max="2030"
              style={{ padding: '9px 14px', background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 10, color: A.chalk, fontSize: 14, fontFamily: 'Nunito, sans-serif', width: 110, outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* STEP 2 — Paste JSON */}
      <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: A.dim2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Step 2 — Paste JSON</div>

        <div style={{ fontSize: 12, color: A.dim, marginBottom: 6, lineHeight: 1.7 }}>
          Required: <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>question_number, question_type, question_text, solution_steps, final_answer</code><br />
          For MCQ add: <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>options, correct_answer</code><br />
          Topic: use any of <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>topic_slug</code> <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>topic</code> <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>topic_title</code> <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>category</code> — stored exactly as given
        </div>

        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder={`[\n  {\n    "question_number": 1,\n    "question_type": "mcq",\n    "topic_slug": "Indices and Logarithms",\n    "question_text": "Simplify 2^3 × 2^4",\n    "options": ["2^6","2^7","2^12","2^1"],\n    "correct_answer": "2^7",\n    "solution_steps": ["Add exponents: 3+4=7","Answer: 2^7"],\n    "final_answer": "2^7"\n  }\n]`}
          style={{ width: '100%', height: 240, padding: '14px', background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 12, color: A.chalk, fontSize: 13, fontFamily: "'Fira Code', 'Courier New', monospace", resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, outline: 'none' }}
        />

        {parseError && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#FCA5A5', fontSize: 13, fontWeight: 700 }}>
            ⚠ {parseError}
          </div>
        )}

        <button onClick={parse} disabled={!raw.trim()}
          style={{ marginTop: 14, padding: '12px 28px', background: A.accent, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 14, cursor: raw.trim() ? 'pointer' : 'not-allowed', opacity: raw.trim() ? 1 : 0.5, fontFamily: 'Nunito, sans-serif' }}>
          Parse & Preview →
        </button>
      </div>

      {/* STEP 3 — Review */}
      {rows.length > 0 && (
        <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: A.dim2, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Step 3 — Review & Save</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: A.chalk }}>{rows.length} questions</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: A.teal }}>{topicCount} topic{topicCount !== 1 ? 's' : ''}</span>
                {errorCount > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: A.coral }}>✕ {errorCount} missing required fields</span>
                )}
              </div>
            </div>
            <button onClick={saveAll} disabled={saving || errorCount > 0}
              style={{ padding: '11px 26px', background: errorCount > 0 ? 'rgba(124,58,237,0.25)' : A.electric, border: 'none', borderRadius: 11, color: errorCount > 0 ? A.dim : '#0C0820', fontWeight: 900, fontSize: 14, cursor: (saving || errorCount > 0) ? 'not-allowed' : 'pointer', opacity: errorCount > 0 ? 0.55 : 1, fontFamily: 'Nunito, sans-serif' }}>
              {saving ? 'Saving…' : errorCount > 0 ? `Fix ${errorCount} error(s) first` : `Save ${rows.length} questions`}
            </button>
          </div>

          {/* Topic grouping preview */}
          <div style={{ marginBottom: 16, padding: '12px 16px', background: A.surface, borderRadius: 12, border: `1px solid ${A.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: A.dim2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Topics in this batch</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[...new Set(rows.map(r => r._topicRaw || '(no topic)'))].map(topic => {
                const count = rows.filter(r => (r._topicRaw || '(no topic)') === topic).length
                return (
                  <div key={topic} style={{ padding: '5px 12px', background: 'rgba(0,212,200,0.1)', border: '1px solid rgba(0,212,200,0.25)', borderRadius: 99, fontSize: 12, fontWeight: 700, color: A.teal }}>
                    {topic} <span style={{ opacity: 0.7 }}>({count})</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${A.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: A.surface }}>
                  {['#', 'Type', 'Topic (from JSON)', 'Question preview', 'Answer', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap', borderBottom: `1px solid ${A.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, tableIdx) => (
                  <tr key={row._index} style={{ borderBottom: `1px solid ${A.border}`, background: row._hasError ? 'rgba(239,68,68,0.05)' : tableIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>

                    <td style={{ padding: '10px 14px', color: A.dim, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {row.question_number}
                    </td>

                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 900, background: row.question_type === 'mcq' ? 'rgba(124,58,237,0.2)' : 'rgba(255,107,107,0.15)', color: row.question_type === 'mcq' ? A.accentHi : A.coral }}>
                        {(row.question_type || '?').toUpperCase()}
                      </span>
                    </td>

                    {/* Topic — editable, shows exactly what came from JSON */}
                    <td style={{ padding: '10px 14px', minWidth: 220 }}>
                      <input
                        value={row._topicRaw || ''}
                        onChange={e => updateTopicRaw(row._index, e.target.value)}
                        placeholder="(no topic)"
                        style={{ padding: '6px 10px', background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 8, color: A.chalk, fontSize: 12, fontFamily: 'Nunito, sans-serif', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ fontSize: 10, color: A.dim2, marginTop: 3, fontFamily: 'Courier New, monospace' }}>
                        slug: {row.topic_slug || '—'}
                      </div>
                      {row._hasError && row._missing.length > 0 && (
                        <div style={{ fontSize: 10, color: A.coral, marginTop: 2 }}>
                          Missing: {row._missing.join(', ')}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px', color: A.chalk, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.question_text
                        ? row.question_text.slice(0, 90) + (row.question_text.length > 90 ? '…' : '')
                        : <span style={{ color: A.coral, fontWeight: 700 }}>MISSING</span>}
                    </td>

                    <td style={{ padding: '10px 14px', color: A.electric, fontSize: 12, fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.correct_answer || row.final_answer || '—'}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => deleteRow(row._index)}
                        style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, color: '#FCA5A5', fontWeight: 800, fontSize: 11, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom save */}
          {rows.length > 8 && (
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={saveAll} disabled={saving || errorCount > 0}
                style={{ padding: '11px 26px', background: errorCount > 0 ? 'rgba(124,58,237,0.25)' : A.electric, border: 'none', borderRadius: 11, color: errorCount > 0 ? A.dim : '#0C0820', fontWeight: 900, fontSize: 14, cursor: (saving || errorCount > 0) ? 'not-allowed' : 'pointer', opacity: errorCount > 0 ? 0.55 : 1, fontFamily: 'Nunito, sans-serif' }}>
                {saving ? 'Saving…' : `Save ${rows.length} questions`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save result log */}
      {saveLog.length > 0 && (
        <div style={{ background: A.card, border: '1.5px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: '22px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: A.green, marginBottom: 14 }}>✓ Upload complete</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {saveLog.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: A.surface, borderRadius: 10, border: `1px solid ${entry.status === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.15)'}` }}>
                <span style={{ fontSize: 14 }}>{entry.status === 'error' ? '✕' : '✓'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: A.chalk }}>{entry.topic}</div>
                  {entry.msg && <div style={{ fontSize: 11, color: A.coral, marginTop: 2 }}>{entry.msg}</div>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: entry.status === 'error' ? A.coral : A.green }}>
                  {entry.count} question{entry.count !== 1 ? 's' : ''} saved
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: A.dim, lineHeight: 1.6 }}>
            Questions with the same topic name are now grouped together. Upload another batch anytime — same topic = same bucket.
          </div>
        </div>
      )}
    </div>
  )
}