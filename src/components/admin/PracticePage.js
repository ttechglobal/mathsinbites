'use client'

import { useState } from 'react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
  easy:'#C8F135', medium:'#FFC933', hard:'#FF6B6B', exam:'#00D4C8',
}

const COUNT_OPTIONS = [10, 20, 40, 60]

function pill(text, color) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 20,
      background: color + '18', color, border: `1px solid ${color}30`,
    }}>{text}</span>
  )
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ topicId, topicTitle, onClose }) {
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [deleting, setDeleting]   = useState({})

  useState(() => {
    fetch(`/api/admin/practice-questions?topicId=${topicId}`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions || []); setLoading(false) })
      .catch(() => setLoading(false))
  })

  async function toggleActive(qId, current) {
    await fetch('/api/admin/practice-questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: qId, is_active: !current }),
    })
    setQuestions(qs => qs.map(q => q.id === qId ? { ...q, is_active: !current } : q))
  }

  async function deleteQuestion(qId) {
    setDeleting(d => ({ ...d, [qId]: true }))
    await fetch('/api/admin/practice-questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: qId }),
    })
    setQuestions(qs => qs.filter(q => q.id !== qId))
    setDeleting(d => ({ ...d, [qId]: false }))
  }

  const filtered = (questions || []).filter(q => filter === 'all' || q.difficulty === filter || (filter === 'exam' && q.exam_tag))

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:780, background:A.surface, borderRadius:16, border:`1px solid ${A.borderHi}`, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:`1px solid ${A.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:12, color:A.dim, marginBottom:4 }}>Reviewing questions for</div>
            <div style={{ fontSize:17, fontWeight:700, color:A.chalk }}>{topicTitle}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:8, padding:'6px 14px', color:A.dim, cursor:'pointer', fontSize:13 }}>Close</button>
        </div>

        {/* Filter tabs */}
        <div style={{ padding:'12px 24px', borderBottom:`1px solid ${A.border}`, display:'flex', gap:8 }}>
          {['all','easy','medium','hard','exam'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? (f==='all' ? A.accent : f==='easy' ? A.easy : f==='medium' ? A.gold : f==='hard' ? A.coral : A.teal) + '22' : 'none',
              border: `1px solid ${filter === f ? (f==='all' ? A.accent : f==='easy' ? A.easy : f==='medium' ? A.gold : f==='hard' ? A.coral : A.teal) : A.border}`,
              borderRadius:20, padding:'4px 12px', cursor:'pointer',
              color: filter === f ? A.chalk : A.dim, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8,
            }}>{f} {f !== 'all' && questions ? `(${questions.filter(q => f==='exam' ? q.exam_tag : q.difficulty===f).length})` : ''}</button>
          ))}
          <span style={{ marginLeft:'auto', fontSize:11, color:A.dim, alignSelf:'center' }}>
            {questions?.length || 0} total questions
          </span>
        </div>

        {/* Question list */}
        <div style={{ maxHeight:560, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:12 }}>
          {loading && <div style={{ color:A.dim, textAlign:'center', padding:40 }}>Loading questions…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ color:A.dim, textAlign:'center', padding:40 }}>No questions in this filter.</div>
          )}
          {filtered.map((q, i) => (
            <div key={q.id} style={{
              background: A.card, border:`1px solid ${q.is_active ? A.border : A.coral + '40'}`,
              borderRadius:10, padding:'14px 16px', opacity: q.is_active ? 1 : 0.55,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:11, color:A.dim2, flexShrink:0, marginTop:2 }}>#{i+1}</span>
                <div style={{ flex:1, fontSize:13, color:A.chalk, lineHeight:1.6 }}>{q.question_text}</div>
              </div>

              {/* Options */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                {(q.options || []).map((opt, j) => (
                  <div key={j} style={{
                    fontSize:12, padding:'6px 10px', borderRadius:7, lineHeight:1.4,
                    background: opt.is_correct ? A.electric + '15' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${opt.is_correct ? A.electric + '40' : A.border}`,
                    color: opt.is_correct ? A.electric : A.dim,
                  }}>
                    {opt.is_correct && '✓ '}{opt.option_text}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div style={{ fontSize:11, color:A.dim, background:'rgba(255,255,255,0.03)', borderRadius:7, padding:'8px 10px', marginBottom:10, lineHeight:1.6 }}>
                  📖 {q.explanation}
                </div>
              )}

              {/* Meta + actions */}
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {pill(q.difficulty, q.difficulty==='easy' ? A.easy : q.difficulty==='medium' ? A.gold : A.coral)}
                {q.exam_tag && pill(`${q.exam_tag}${q.exam_year && q.exam_year !== 'style' ? ' '+q.exam_year : ' style'}`, A.teal)}
                {!q.is_active && pill('Hidden', A.coral)}

                <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                  <button onClick={() => toggleActive(q.id, q.is_active)} style={{
                    background:'none', border:`1px solid ${A.border}`, borderRadius:6, padding:'3px 10px',
                    color: q.is_active ? A.coral : A.electric, cursor:'pointer', fontSize:11, fontWeight:700,
                  }}>{q.is_active ? 'Hide' : 'Show'}</button>
                  <button onClick={() => deleteQuestion(q.id)} disabled={deleting[q.id]} style={{
                    background: A.coral + '18', border:`1px solid ${A.coral}40`, borderRadius:6,
                    padding:'3px 10px', color:A.coral, cursor:'pointer', fontSize:11, fontWeight:700,
                    opacity: deleting[q.id] ? 0.5 : 1,
                  }}>{deleting[q.id] ? '…' : 'Delete'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PracticePage({ levels, topicCounts }) {
  const [expandedLevels, setExpandedLevels] = useState({})
  const [expandedTerms,  setExpandedTerms]  = useState({})
  const [expandedUnits,  setExpandedUnits]  = useState({})
  const [generating,     setGenerating]     = useState({})
  const [genResults,     setGenResults]     = useState({})
  const [errors,         setErrors]         = useState({})
  const [counts,         setCounts]         = useState(topicCounts || {})
  const [reviewTopic,    setReviewTopic]    = useState(null) // { id, title }

  // Per-topic settings
  const [topicCount,     setTopicCount]     = useState({})   // topicId → number
  const [topicSubtopic,  setTopicSubtopic]  = useState({})   // topicId → subtopicId|''
  const [topicExam,      setTopicExam]      = useState({})   // topicId → bool

  const toggle = (setter, id) => setter(p => ({ ...p, [id]: !p[id] }))

  async function generate(topic, subtopics) {
    const topicId    = topic.id
    const count      = topicCount[topicId] || 20
    const subtopicId = topicSubtopic[topicId] || null
    const includeExam = topicExam[topicId] !== false // default true

    setGenerating(p => ({ ...p, [topicId]: true }))
    setErrors(p => ({ ...p, [topicId]: null }))
    setGenResults(p => ({ ...p, [topicId]: null }))

    try {
      const res = await fetch('/api/generate/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, subtopicId: subtopicId || undefined, count, includeExam }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.detail)
      setGenResults(p => ({ ...p, [topicId]: data }))
      // Update local count
      setCounts(c => ({ ...c, [topicId]: { ...(c[topicId]||{}), total: ((c[topicId]?.total)||0) + data.saved } }))
    } catch(err) {
      setErrors(p => ({ ...p, [topicId]: err.message }))
    } finally {
      setGenerating(p => ({ ...p, [topicId]: false }))
    }
  }

  const totalQ   = Object.values(counts).reduce((s, c) => s + (c.total||0), 0)
  const examQ    = Object.values(counts).reduce((s, c) => s + (c.exam||0), 0)

  return (
    <>
      <style>{`
        .pq-toggle { background:none; border:none; cursor:pointer; width:100%; text-align:left; transition:background 0.12s; border-radius:8px; }
        .pq-toggle:hover { background:rgba(165,155,255,0.04); }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display:inline-block; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(165,155,255,0.15); border-radius:2px; }
      `}</style>

      <div style={{ padding:'28px', maxWidth:960, fontFamily:'Nunito,sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, marginBottom:6 }}>
            ✏️ Practice Questions
          </h1>
          <p style={{ color:A.dim, fontSize:13 }}>
            Generate and review practice questions per topic. Includes real BECE / WAEC / NECO / JAMB past questions.
          </p>
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            {[
              { label:'Total Questions', value: totalQ, color: A.accentHi },
              { label:'Exam-Tagged',     value: examQ,  color: A.teal },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:10, padding:'10px 18px' }}>
                <div style={{ fontSize:20, fontWeight:800, color, fontFamily:"'Fredoka',sans-serif" }}>{value}</div>
                <div style={{ fontSize:10, color:A.dim2, textTransform:'uppercase', letterSpacing:0.8 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum tree */}
        {levels.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:A.dim }}>No curriculum yet. Upload curriculum first.</div>
        )}

        {levels.map(level => (
          <div key={level.id} style={{ marginBottom:12, background:A.surface, border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>

            {/* Level header */}
            <button className="pq-toggle" onClick={() => toggle(setExpandedLevels, level.id)}
              style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color: expandedLevels[level.id] ? A.accentHi : A.dim, fontSize:12, transition:'transform 0.2s',
                display:'inline-block', transform: expandedLevels[level.id] ? 'rotate(90deg)' : 'none' }}>▶</span>
              <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, fontWeight:600, color:A.chalk }}>{level.name}</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:A.dim }}>
                {(level.terms || []).reduce((s,t) => s + (t.units||[]).reduce((ss,u) => ss + (u.topics||[]).length, 0), 0)} topics
              </span>
            </button>

            {expandedLevels[level.id] && (level.terms || []).map(term => (
              <div key={term.id} style={{ marginLeft:0 }}>
                {/* Term header */}
                <button className="pq-toggle" onClick={() => toggle(setExpandedTerms, term.id)}
                  style={{ padding:'10px 18px 10px 36px', display:'flex', alignItems:'center', gap:8, borderTop:`1px solid ${A.border}` }}>
                  <span style={{ color: expandedTerms[term.id] ? A.accentHi : A.dim, fontSize:11,
                    display:'inline-block', transform: expandedTerms[term.id] ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}>▶</span>
                  <span style={{ fontSize:13, fontWeight:700, color:A.dim }}>{term.name}</span>
                </button>

                {expandedTerms[term.id] && (term.units || []).map(unit => (
                  <div key={unit.id}>
                    {/* Unit header */}
                    <button className="pq-toggle" onClick={() => toggle(setExpandedUnits, unit.id)}
                      style={{ padding:'8px 18px 8px 54px', display:'flex', alignItems:'center', gap:8, borderTop:`1px solid ${A.border}` }}>
                      <span style={{ color: expandedUnits[unit.id] ? A.accentHi : A.dim, fontSize:10,
                        display:'inline-block', transform: expandedUnits[unit.id] ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}>▶</span>
                      <span style={{ fontSize:12, color:A.dim2 }}>📂 {unit.title}</span>
                    </button>

                    {expandedUnits[unit.id] && (unit.topics || []).map(topic => {
                      const tc      = counts[topic.id] || {}
                      const isGen   = generating[topic.id]
                      const result  = genResults[topic.id]
                      const err     = errors[topic.id]
                      const selCount = topicCount[topic.id] || 20

                      return (
                        <div key={topic.id} style={{
                          marginLeft:0, borderTop:`1px solid ${A.border}`,
                          padding:'14px 18px 14px 72px',
                          background: result ? 'rgba(200,241,53,0.03)' : 'transparent',
                        }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                            <div style={{ flex:1 }}>
                              {/* Topic title + counts */}
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                <span style={{ fontSize:13, fontWeight:700, color:A.chalk }}>{topic.title}</span>
                                {tc.total > 0 && (
                                  <span style={{ fontSize:10, color:A.dim2 }}>
                                    {tc.total}q
                                    {tc.easy ? ` · ${tc.easy}E` : ''}
                                    {tc.medium ? ` · ${tc.medium}M` : ''}
                                    {tc.hard ? ` · ${tc.hard}H` : ''}
                                    {tc.exam ? ` · ${tc.exam} exam` : ''}
                                  </span>
                                )}
                                {tc.total > 0 && (
                                  <button onClick={() => setReviewTopic({ id: topic.id, title: topic.title })} style={{
                                    background: A.teal + '15', border:`1px solid ${A.teal}40`,
                                    borderRadius:20, padding:'2px 10px', color:A.teal, cursor:'pointer', fontSize:10, fontWeight:800,
                                  }}>Review</button>
                                )}
                              </div>

                              {/* Controls row */}
                              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                {/* Count selector */}
                                <div style={{ display:'flex', gap:4 }}>
                                  {COUNT_OPTIONS.map(n => (
                                    <button key={n} onClick={() => setTopicCount(p => ({ ...p, [topic.id]: n }))} style={{
                                      background: selCount === n ? A.accent + '30' : 'none',
                                      border: `1px solid ${selCount === n ? A.accent : A.border}`,
                                      borderRadius:6, padding:'3px 9px', color: selCount === n ? A.accentHi : A.dim,
                                      cursor:'pointer', fontSize:11, fontWeight:700,
                                    }}>{n}</button>
                                  ))}
                                </div>

                                {/* Subtopic selector */}
                                {(topic.subtopics || []).length > 0 && (
                                  <select
                                    value={topicSubtopic[topic.id] || ''}
                                    onChange={e => setTopicSubtopic(p => ({ ...p, [topic.id]: e.target.value }))}
                                    style={{
                                      background:A.card, border:`1px solid ${A.border}`, borderRadius:6,
                                      color:A.dim, fontSize:11, padding:'3px 8px', cursor:'pointer',
                                    }}>
                                    <option value=''>All subtopics</option>
                                    {(topic.subtopics || []).map(s => (
                                      <option key={s.id} value={s.id}>{s.title}</option>
                                    ))}
                                  </select>
                                )}

                                {/* Include exam toggle */}
                                <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
                                  <input type="checkbox"
                                    checked={topicExam[topic.id] !== false}
                                    onChange={e => setTopicExam(p => ({ ...p, [topic.id]: e.target.checked }))}
                                    style={{ accentColor: A.teal }}
                                  />
                                  <span style={{ fontSize:11, color:A.teal }}>Include exam Qs</span>
                                </label>
                              </div>

                              {/* Result / error */}
                              {result && (
                                <div style={{ marginTop:8, fontSize:11, color:A.electric }}>
                                  ✓ Saved {result.saved} questions ({result.customCount} custom{result.examCount > 0 ? ` + ${result.examCount} exam` : ''})
                                </div>
                              )}
                              {err && (
                                <div style={{ marginTop:8, fontSize:11, color:A.coral }}>✗ {err}</div>
                              )}
                            </div>

                            {/* Generate button */}
                            <button onClick={() => generate(topic, topic.subtopics || [])} disabled={isGen} style={{
                              flexShrink:0,
                              background: isGen ? 'none' : `linear-gradient(135deg,${A.accent},#5B21B6)`,
                              border: `1px solid ${isGen ? A.border : A.accent}`,
                              borderRadius:8, padding:'8px 16px',
                              color: isGen ? A.dim : '#fff', cursor: isGen ? 'default' : 'pointer',
                              fontSize:12, fontWeight:800, display:'flex', alignItems:'center', gap:6,
                              opacity: isGen ? 0.7 : 1,
                            }}>
                              {isGen
                                ? <><span className="spin">↻</span> Generating…</>
                                : tc.total > 0 ? '+ Add More' : '⚡ Generate'
                              }
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Review modal */}
      {reviewTopic && (
        <ReviewModal
          topicId={reviewTopic.id}
          topicTitle={reviewTopic.title}
          onClose={() => setReviewTopic(null)}
        />
      )}
    </>
  )
}
