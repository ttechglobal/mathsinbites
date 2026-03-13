'use client'

import { useState } from 'react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
}

const STATUS_COLOR = { open: A.coral, resolved: A.electric, dismissed: A.dim }

export default function FlagsPage({ flags: initialFlags }) {
  const [flags,  setFlags]  = useState(initialFlags)
  const [filter, setFilter] = useState('open')
  const [busy,   setBusy]   = useState({})

  const filtered = flags.filter(f => filter === 'all' || f.status === filter)

  async function updateStatus(flagId, status) {
    setBusy(b => ({ ...b, [flagId]: true }))
    await fetch('/api/admin/flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagId, status }),
    })
    setFlags(fs => fs.map(f => f.id === flagId ? { ...f, status } : f))
    setBusy(b => ({ ...b, [flagId]: false }))
  }

  const openCount = flags.filter(f => f.status === 'open').length

  return (
    <div style={{ padding: '28px', maxWidth: 860, fontFamily: 'Nunito, sans-serif' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 24, color: A.chalk, marginBottom: 6 }}>
          🚩 Flagged Questions
        </h1>
        <p style={{ color: A.dim, fontSize: 13, marginBottom: 16 }}>
          Questions reported by students as incorrect or unclear.
        </p>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['open', 'resolved', 'dismissed', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter === s ? (s === 'open' ? A.coral : s === 'resolved' ? A.electric : A.accent) + '22' : 'none',
              border: `1px solid ${filter === s ? (s === 'open' ? A.coral : s === 'resolved' ? A.electric : A.accent) : A.border}`,
              borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
              color: filter === s ? A.chalk : A.dim, fontSize: 11, fontWeight: 800,
              textTransform: 'capitalize',
            }}>
              {s} {s === 'open' ? `(${openCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Flags list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: A.dim }}>
            {filter === 'open' ? '🎉 No open flags — all clear!' : 'No flags in this category.'}
          </div>
        )}

        {filtered.map(flag => (
          <div key={flag.id} style={{
            background: A.card, border: `1px solid ${flag.status === 'open' ? A.coral + '30' : A.border}`,
            borderRadius: 12, padding: '16px',
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8,
                padding: '2px 8px', borderRadius: 20, flexShrink: 0, marginTop: 2,
                background: STATUS_COLOR[flag.status] + '18',
                border: `1px solid ${STATUS_COLOR[flag.status]}30`,
                color: STATUS_COLOR[flag.status],
              }}>{flag.status}</span>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: A.chalk, lineHeight: 1.5 }}>
                {flag.question?.question_text || 'Question deleted'}
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              {flag.question?.lesson?.subtopic?.title && (
                <span style={{ fontSize: 10, color: A.dim2 }}>📖 {flag.question.lesson.subtopic.title}</span>
              )}
              {flag.student?.display_name && (
                <span style={{ fontSize: 10, color: A.dim2 }}>👤 {flag.student.display_name} · {flag.student.class_level}</span>
              )}
              {flag.reason && (
                <span style={{ fontSize: 10, color: A.gold }}>💬 "{flag.reason}"</span>
              )}
              <span style={{ fontSize: 10, color: A.dim2 }}>
                {flag.created_at ? new Date(flag.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>

            {/* Actions */}
            {flag.status === 'open' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => updateStatus(flag.id, 'resolved')} disabled={busy[flag.id]} style={{
                  background: A.electric + '18', border: `1px solid ${A.electric}40`, borderRadius: 7,
                  padding: '5px 12px', color: A.electric, cursor: 'pointer', fontSize: 11, fontWeight: 800,
                  opacity: busy[flag.id] ? 0.5 : 1,
                }}>✓ Mark Resolved</button>
                <button onClick={() => updateStatus(flag.id, 'dismissed')} disabled={busy[flag.id]} style={{
                  background: 'none', border: `1px solid ${A.border}`, borderRadius: 7,
                  padding: '5px 12px', color: A.dim, cursor: 'pointer', fontSize: 11, fontWeight: 800,
                  opacity: busy[flag.id] ? 0.5 : 1,
                }}>Dismiss</button>
              </div>
            )}
            {flag.status !== 'open' && (
              <button onClick={() => updateStatus(flag.id, 'open')} style={{
                background: 'none', border: `1px solid ${A.border}`, borderRadius: 7,
                padding: '4px 10px', color: A.dim, cursor: 'pointer', fontSize: 10, fontWeight: 700,
              }}>↩ Reopen</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
