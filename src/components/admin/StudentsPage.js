'use client'

import { useState } from 'react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
}

const CLASS_ORDER = ['JSS1','JSS2','JSS3','SS1','SS2','SS3']

export default function StudentsPage({ students, progressMap }) {
  const [search,    setSearch]    = useState('')
  const [classFilter, setClass]   = useState('all')
  const [sortBy,    setSortBy]    = useState('xp')
  const [expanded,  setExpanded]  = useState(null)

  const filtered = students
    .filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !q || s.display_name?.toLowerCase().includes(q) || s.school?.toLowerCase().includes(q) || s.profile?.email?.toLowerCase().includes(q)
      const matchClass = classFilter === 'all' || s.class_level === classFilter
      return matchSearch && matchClass
    })
    .sort((a, b) => {
      if (sortBy === 'xp')    return (b.xp||0) - (a.xp||0)
      if (sortBy === 'name')  return (a.display_name||'').localeCompare(b.display_name||'')
      if (sortBy === 'recent') return new Date(b.created_at||0) - new Date(a.created_at||0)
      return 0
    })

  // Stats
  const total  = students.length
  const byClass = {}
  for (const s of students) {
    byClass[s.class_level] = (byClass[s.class_level] || 0) + 1
  }
  const activeToday = students.filter(s => {
    if (!s.last_active) return false
    return new Date(s.last_active).toDateString() === new Date().toDateString()
  }).length

  const inputStyle = {
    background: A.card, border: `1px solid ${A.border}`, borderRadius: 8,
    padding: '8px 12px', color: A.chalk, fontSize: 12, fontFamily: 'Nunito, sans-serif',
    outline: 'none',
  }

  return (
    <div style={{ padding: '28px', maxWidth: 1000, fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 24, color: A.chalk, marginBottom: 6 }}>
          👥 Students
        </h1>
        <p style={{ color: A.dim, fontSize: 13, marginBottom: 16 }}>Manage and monitor all registered students.</p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Total Students', value: total,       color: A.accentHi },
            { label: 'Active Today',   value: activeToday, color: A.electric },
            ...CLASS_ORDER.filter(c => byClass[c]).map(c => ({ label: c, value: byClass[c], color: A.teal })),
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Fredoka',sans-serif" }}>{value}</div>
              <div style={{ fontSize: 9, color: A.dim2, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search name, school, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, minWidth: 200 }}
          />
          <select value={classFilter} onChange={e => setClass(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="all">All classes</option>
            {CLASS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="xp">Sort: XP</option>
            <option value="name">Sort: Name</option>
            <option value="recent">Sort: Newest</option>
          </select>
          <span style={{ fontSize: 11, color: A.dim, marginLeft: 4 }}>{filtered.length} students</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', gap: 0, padding: '10px 18px', borderBottom: `1px solid ${A.border}` }}>
          {['Student', 'Class', 'School', 'XP', 'Progress', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 9, fontWeight: 800, color: A.dim2, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: A.dim }}>No students found.</div>
        )}

        {filtered.map((s, i) => {
          const prog     = progressMap[s.id] || { completed: 0, total: 0 }
          const pct      = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
          const isOpen   = expanded === s.id

          return (
            <div key={s.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${A.border}` : 'none' }}>
              <div
                onClick={() => setExpanded(isOpen ? null : s.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
                  gap: 0, padding: '13px 18px', cursor: 'pointer',
                  background: isOpen ? A.cardHi : 'transparent',
                  transition: 'background 0.12s',
                }}>

                {/* Name + email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: `${A.accent}22`, border: `1.5px solid ${A.accent}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: A.accentHi,
                  }}>{s.display_name?.[0]?.toUpperCase() || '?'}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: A.chalk }}>{s.display_name || '—'}</div>
                    <div style={{ fontSize: 10, color: A.dim2 }}>{s.profile?.email || ''}</div>
                  </div>
                </div>

                {/* Class */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: A.teal,
                    background: 'rgba(0,212,200,0.1)', border: '1px solid rgba(0,212,200,0.25)',
                    borderRadius: 20, padding: '2px 8px',
                  }}>{s.class_level || '—'}</span>
                </div>

                {/* School */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: A.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.school || <span style={{ color: A.dim2 }}>—</span>}
                  </span>
                </div>

                {/* XP */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: A.gold }}>{s.xp || 0}</div>
                    <div style={{ fontSize: 9, color: A.dim2 }}>{s.monthly_xp || 0} this month</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: A.electric, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 10, color: A.dim2, flexShrink: 0 }}>{pct}%</span>
                </div>

                {/* Expand */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, color: A.dim, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>
              </div>

              {/* Expanded detail row */}
              {isOpen && (
                <div style={{ padding: '12px 18px 16px 72px', background: A.card, borderTop: `1px solid ${A.border}` }}>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Total XP',      value: s.xp || 0 },
                      { label: 'Monthly XP',    value: s.monthly_xp || 0 },
                      { label: 'Streak',        value: `${s.streak_days || 0} days` },
                      { label: 'Lessons Done',  value: prog.completed },
                      { label: 'Total Lessons', value: prog.total },
                      { label: 'Last Active',   value: s.last_active ? new Date(s.last_active).toLocaleDateString('en-GB') : 'Never' },
                      { label: 'Joined',        value: s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: A.chalk }}>{value}</div>
                        <div style={{ fontSize: 9, color: A.dim2, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
