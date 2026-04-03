'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const A = {
  bg: '#09071A', surface: '#12102A', card: '#181535', cardHi: '#1E1A40',
  border: 'rgba(165,155,255,0.1)', borderHi: 'rgba(165,155,255,0.26)',
  chalk: '#F0EDFF', dim: 'rgba(220,215,255,0.5)', dim2: 'rgba(220,215,255,0.28)',
  accent: '#7C3AED', accentHi: '#9F67FF',
  electric: '#C8F135', gold: '#FFC933', coral: '#FF6B6B', teal: '#00D4C8',
}

const REQUIRED_FIELDS = ['question_number', 'question_type', 'topic_slug', 'question_text', 'solution_steps', 'final_answer']

export default function UploadPastQuestions() {
  const [examBody, setExamBody]     = useState('WAEC')
  const [year, setYear]             = useState(new Date().getFullYear())
  const [raw, setRaw]               = useState('')
  const [rows, setRows]             = useState([])
  const [parseError, setParseError] = useState('')
  const [slugs, setSlugs]           = useState([])
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)

  useEffect(() => {
    supabase.from('topics').select('id, title, slug').order('title').then(({ data }) => {
      setSlugs((data || []).map(t => t.slug || t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')))
    })
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function parse() {
    setParseError('')
    setRows([])
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      setParseError('Invalid JSON: ' + e.message)
      return
    }
    if (!Array.isArray(parsed)) {
      setParseError('Expected a JSON array at the top level.')
      return
    }
    // Validate + annotate each row
    const annotated = parsed.map((q, i) => {
      const missing = REQUIRED_FIELDS.filter(f => q[f] === undefined || q[f] === null || q[f] === '')
      const slugOk  = slugs.length === 0 || slugs.includes(q.topic_slug)
      return {
        ...q,
        _index: i,
        _missing: missing,
        _slugOk: slugOk,
        _hasError: missing.length > 0 || !slugOk,
        exam_body: examBody,
        year: parseInt(year),
        subject: q.subject || 'Mathematics',
      }
    })
    setRows(annotated)
  }

  function deleteRow(index) {
    setRows(prev => prev.filter(r => r._index !== index))
  }

  function updateSlug(index, newSlug) {
    setRows(prev => prev.map(r => {
      if (r._index !== index) return r
      const slugOk = slugs.length === 0 || slugs.includes(newSlug)
      return { ...r, topic_slug: newSlug, _slugOk: slugOk, _hasError: r._missing.length > 0 || !slugOk }
    }))
  }

  async function saveAll() {
    const invalid = rows.filter(r => r._hasError)
    if (invalid.length > 0) {
      showToast(`Fix ${invalid.length} error(s) before saving`, 'error')
      return
    }
    setSaving(true)
    const toInsert = rows.map(({ _index, _missing, _slugOk, _hasError, ...q }) => ({
      exam_body: q.exam_body,
      year: q.year,
      subject: q.subject,
      question_number: q.question_number,
      question_type: q.question_type,
      topic_slug: q.topic_slug,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      solution_steps: Array.isArray(q.solution_steps) ? q.solution_steps : [q.solution_steps],
      final_answer: q.final_answer || '',
      diagram_description: q.diagram_description || null,
      diagram_svg: q.diagram_svg || null,
      marks: q.marks || null,
    }))
    const { error } = await supabase.from('past_questions').insert(toInsert)
    setSaving(false)
    if (error) { showToast('Save failed: ' + error.message, 'error'); return }
    showToast(`Saved ${toInsert.length} questions successfully!`)
    setRaw('')
    setRows([])
  }

  const errorCount = rows.filter(r => r._hasError).length

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.chalk, fontFamily: "'Nunito', sans-serif", padding: '32px 24px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 12, background: toast.type === 'error' ? '#7f1d1d' : '#14532d', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
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

      {/* Step 1: Exam meta */}
      <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Step 1 — Exam details</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: A.dim, marginBottom: 6 }}>Exam Body</div>
            <select value={examBody} onChange={e => setExamBody(e.target.value)} style={{ padding: '10px 14px', background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 10, color: A.chalk, fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>
              <option value="WAEC">WAEC</option>
              <option value="BECE">BECE</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: A.dim, marginBottom: 6 }}>Year</div>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} min="1990" max="2030" style={{ padding: '10px 14px', background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 10, color: A.chalk, fontSize: 14, fontFamily: 'Nunito, sans-serif', width: 100 }} />
          </div>
        </div>
      </div>

      {/* Step 2: Paste JSON */}
      <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Step 2 — Paste Claude JSON</div>
        <div style={{ fontSize: 12, color: A.dim, marginBottom: 12, lineHeight: 1.6 }}>
          Paste the JSON array returned by Claude. Each object must have: <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>question_number, question_type, topic_slug, question_text, solution_steps, final_answer</code>. For MCQ also include <code style={{ background: A.surface, borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>options, correct_answer</code>.
        </div>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder={'[\n  {\n    "question_number": 1,\n    "question_type": "mcq",\n    "topic_slug": "linear-equations",\n    "question_text": "Solve 2x + 3 = 7",\n    "options": ["x=1","x=2","x=3","x=4"],\n    "correct_answer": "x=2",\n    "solution_steps": ["Subtract 3 from both sides: 2x = 4","Divide by 2: x = 2"],\n    "final_answer": "x = 2"\n  }\n]'}
          style={{ width: '100%', height: 220, padding: '14px', background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 12, color: A.chalk, fontSize: 13, fontFamily: "'Fira Code', 'Courier New', monospace", resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
        />
        {parseError && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#FCA5A5', fontSize: 13, fontWeight: 700 }}>
            {parseError}
          </div>
        )}
        <button onClick={parse} disabled={!raw.trim()} style={{ marginTop: 14, padding: '12px 28px', background: A.accent, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 14, cursor: raw.trim() ? 'pointer' : 'not-allowed', opacity: raw.trim() ? 1 : 0.5, fontFamily: 'Nunito, sans-serif' }}>
          Parse & Review
        </button>
      </div>

      {/* Step 3: Review table */}
      {rows.length > 0 && (
        <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: A.dim, textTransform: 'uppercase', letterSpacing: 1 }}>Step 3 — Review</div>
              <div style={{ fontSize: 14, color: A.chalk, fontWeight: 700, marginTop: 4 }}>
                {rows.length} question{rows.length !== 1 ? 's' : ''} parsed
                {errorCount > 0 && <span style={{ color: A.coral, marginLeft: 8 }}>· {errorCount} error{errorCount !== 1 ? 's' : ''} need fixing</span>}
              </div>
            </div>
            <button
              onClick={saveAll}
              disabled={saving || errorCount > 0}
              style={{ padding: '12px 28px', background: errorCount > 0 ? 'rgba(124,58,237,0.3)' : A.accent, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 14, cursor: (saving || errorCount > 0) ? 'not-allowed' : 'pointer', opacity: errorCount > 0 ? 0.5 : 1, fontFamily: 'Nunito, sans-serif' }}
            >
              {saving ? 'Saving…' : `Save ${rows.length} questions to database`}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${A.border}`, background: A.surface }}>
                  {['#', 'Type', 'Topic Slug', 'Question preview', 'Answer', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row._index} style={{ borderBottom: `1px solid ${A.border}`, background: row._hasError ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: A.dim, fontWeight: 700, whiteSpace: 'nowrap' }}>{row.question_number}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 900, background: row.question_type === 'mcq' ? 'rgba(124,58,237,0.2)' : 'rgba(255,107,107,0.15)', color: row.question_type === 'mcq' ? A.accentHi : A.coral }}>
                        {(row.question_type || '?').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {slugs.length > 0 ? (
                        <select
                          value={row.topic_slug || ''}
                          onChange={e => updateSlug(row._index, e.target.value)}
                          style={{ padding: '6px 10px', background: row._slugOk ? A.surface : 'rgba(239,68,68,0.2)', border: `1.5px solid ${row._slugOk ? A.border : 'rgba(239,68,68,0.6)'}`, borderRadius: 8, color: row._slugOk ? A.chalk : '#FCA5A5', fontSize: 12, fontFamily: 'Nunito, sans-serif', maxWidth: 200 }}
                        >
                          <option value="">— select slug —</option>
                          {slugs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: row._slugOk ? A.accentHi : A.coral, fontWeight: 700, fontSize: 12 }}>{row.topic_slug || '—'}</span>
                      )}
                      {!row._slugOk && <div style={{ fontSize: 10, color: A.coral, marginTop: 2 }}>Unrecognised slug</div>}
                    </td>
                    <td style={{ padding: '10px 14px', color: A.chalk, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.question_text || <span style={{ color: A.coral }}>MISSING</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: A.electric, fontSize: 12, fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.correct_answer || row.final_answer || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => deleteRow(row._index)} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#FCA5A5', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}