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

export default function PastQuestionsAdmin() {
  const [questions, setQuestions]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterExam, setFilterExam]     = useState('')
  const [filterYear, setFilterYear]     = useState('')
  const [years, setYears]               = useState([])
  const [deleting, setDeleting]         = useState(false)
  const [toast, setToast]               = useState(null)

  async function load() {
    setLoading(true)
    let q = supabase.from('past_questions').select('*').order('year', { ascending: false }).order('question_number')
    if (filterExam) q = q.eq('exam_body', filterExam)
    if (filterYear) q = q.eq('year', parseInt(filterYear))
    const { data, error } = await q
    if (error) { showToast('Error loading: ' + error.message, 'error'); setLoading(false); return }
    setQuestions(data || [])
    // Extract distinct years
    const { data: yd } = await supabase.from('past_questions').select('year').order('year', { ascending: false })
    const uniq = [...new Set((yd || []).map(r => r.year))]
    setYears(uniq)
    setLoading(false)
  }

  useEffect(() => { load() }, [filterExam, filterYear])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function deleteYear() {
    if (!filterExam || !filterYear) { showToast('Select exam body and year to delete', 'error'); return }
    if (!confirm(`Delete ALL ${filterExam} ${filterYear} questions? This cannot be undone.`)) return
    setDeleting(true)
    const { error } = await supabase.from('past_questions')
      .delete().eq('exam_body', filterExam).eq('year', parseInt(filterYear))
    setDeleting(false)
    if (error) { showToast('Delete failed: ' + error.message, 'error'); return }
    showToast(`Deleted all ${filterExam} ${filterYear} questions`)
    load()
  }

  const grouped = {}
  for (const q of questions) {
    const key = `${q.exam_body} ${q.year}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(q)
  }

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.chalk, fontFamily: "'Nunito', sans-serif", padding: '32px 24px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 12, background: toast.type === 'error' ? '#7f1d1d' : '#14532d', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: A.dim, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 4 }}>Admin</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: A.chalk, margin: 0, fontFamily: "'Fredoka', sans-serif" }}>Past Questions</h1>
        </div>
        <Link href="/admin/past-questions/upload" style={{ textDecoration: 'none' }}>
          <button style={{ padding: '12px 22px', background: A.accent, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            + Upload Questions
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Exam Body</div>
          <select value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ padding: '10px 14px', background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 10, color: A.chalk, fontSize: 14, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
            <option value="">All</option>
            <option value="WAEC">WAEC</option>
            <option value="BECE">BECE</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Year</div>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: '10px 14px', background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 10, color: A.chalk, fontSize: 14, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {filterExam && filterYear && (
          <button onClick={deleteYear} disabled={deleting} style={{ padding: '10px 18px', background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 10, color: '#EF4444', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginTop: 20 }}>
            {deleting ? 'Deleting…' : `Delete ${filterExam} ${filterYear}`}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total questions', value: questions.length, color: A.electric },
          { label: 'MCQ', value: questions.filter(q => q.question_type === 'mcq').length, color: A.teal },
          { label: 'Theory', value: questions.filter(q => q.question_type === 'theory').length, color: A.gold },
          { label: 'Years', value: [...new Set(questions.map(q => q.year))].length, color: A.accentHi },
        ].map(s => (
          <div key={s.label} style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "'Fredoka', sans-serif", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: A.dim, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: A.dim, fontSize: 14 }}>Loading…</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: A.dim }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: A.chalk, marginBottom: 6 }}>No past questions yet</div>
          <div style={{ fontSize: 13 }}>Upload your first batch using the button above.</div>
        </div>
      ) : (
        <div style={{ background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${A.border}`, background: A.surface }}>
                  {['#', 'Exam', 'Year', 'Topic', 'Type', 'Question preview'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: A.dim, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id} style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '11px 16px', color: A.dim, fontWeight: 700 }}>{q.question_number}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 900, background: q.exam_body === 'WAEC' ? 'rgba(200,241,53,0.12)' : 'rgba(0,212,200,0.12)', color: q.exam_body === 'WAEC' ? A.electric : A.teal }}>{q.exam_body}</span>
                    </td>
                    <td style={{ padding: '11px 16px', color: A.chalk, fontWeight: 700 }}>{q.year}</td>
                    <td style={{ padding: '11px 16px', color: A.accentHi, fontSize: 12, fontWeight: 700, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.topic_slug}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 900, background: q.question_type === 'mcq' ? 'rgba(124,58,237,0.2)' : 'rgba(255,107,107,0.15)', color: q.question_type === 'mcq' ? A.accentHi : A.coral }}>{q.question_type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '11px 16px', color: A.dim, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question_text}</td>
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