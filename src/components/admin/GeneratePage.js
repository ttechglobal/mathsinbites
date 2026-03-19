'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
}

const STATUS_CFG = {
  done:       { color:'#C8F135', bg:'rgba(200,241,53,0.1)',  border:'rgba(200,241,53,0.25)',  label:'Regenerate', icon:'✓' },
  generating: { color:'#FFC933', bg:'rgba(255,201,51,0.1)',  border:'rgba(255,201,51,0.25)',  label:'Generating…', icon:'↻' },
  error:      { color:'#FF6B6B', bg:'rgba(255,107,107,0.1)', border:'rgba(255,107,107,0.25)', label:'Retry', icon:'!' },
  pending:    { color:A.accentHi, bg:'rgba(124,58,237,0.1)', border:'rgba(124,58,237,0.28)', label:'Generate', icon:'⚡' },
}

export default function GeneratePage({ levels }) {
  const [expandedLevels, setExpandedLevels] = useState({})
  const [expandedUnits,  setExpandedUnits]  = useState({})
  const [expandedTopics, setExpandedTopics] = useState({})
  const [generating,     setGenerating]     = useState({})
  const [generated,      setGenerated]      = useState({})
  const [errors,         setErrors]         = useState({})
  const [subject,        setSubject]        = useState('maths')  // 'maths' | 'further_maths'

  const toggle = (setter, id) => setter(p => ({ ...p, [id]: !p[id] }))

  async function generateLesson(subtopicId) {
    setGenerating(p => ({ ...p, [subtopicId]: true }))
    setErrors(p => ({ ...p, [subtopicId]: null }))
    try {
      const res  = await fetch('/api/generate/lesson', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId, subject }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenerated(p => ({ ...p, [subtopicId]: true }))
    } catch (err) {
      setErrors(p => ({ ...p, [subtopicId]: err.message }))
    } finally {
      setGenerating(p => ({ ...p, [subtopicId]: false }))
    }
  }

  async function generateAllInTopic(subtopics) {
    for (const sub of subtopics) {
      if (!sub.is_published && !generated[sub.id]) {
        await generateLesson(sub.id)
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  function getStatus(sub) {
    if (generating[sub.id])                      return 'generating'
    if (generated[sub.id] || sub.is_published)   return 'done'
    if (errors[sub.id])                          return 'error'
    return 'pending'
  }

  return (
    <>
      <style>{`
        .gen-toggle { background:none; border:none; cursor:pointer; width:100%; text-align:left; transition:background 0.12s; }
        .gen-toggle:hover { background:rgba(165,155,255,0.045); }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display:inline-block; }
      `}</style>

      <div style={{ padding:'28px', maxWidth:900, fontFamily:'Nunito,sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, lineHeight:1, marginBottom:6 }}>
            ⚡ Generate Lessons
          </h1>
          <p style={{ fontSize:13, color:A.dim, fontWeight:700, maxWidth:560 }}>
            Use AI to generate bite-sized lessons for each subtopic. Generate individually or use &ldquo;Generate All&rdquo; to batch a whole topic.
          </p>
        </div>

        {/* Subject toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['maths','Mathematics'],['further_maths','Further Maths']].map(([val, label]) => (
            <button key={val} onClick={() => setSubject(val)} style={{
              padding:'8px 18px', borderRadius:10, cursor:'pointer',
              border: subject===val ? `1.5px solid ${A.accentHi}` : `1.5px solid ${A.border}`,
              background: subject===val ? 'rgba(124,58,237,0.18)' : 'transparent',
              color: subject===val ? A.accentHi : A.dim,
              fontSize:12, fontWeight:800, fontFamily:'Nunito,sans-serif',
              transition:'all 0.15s',
            }}>{label}</button>
          ))}
          {subject === 'further_maths' && (
            <span style={{ fontSize:11, fontWeight:700, color:A.dim2, alignSelf:'center', marginLeft:4 }}>
              Lessons will be generated with FM step-by-step format
            </span>
          )}
        </div>

        {levels.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 24px', background:A.card, border:`1.5px solid ${A.border}`, borderRadius:20 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
            <div style={{ fontSize:16, fontWeight:900, color:A.chalk, marginBottom:8 }}>No curriculum uploaded yet</div>
            <div style={{ fontSize:13, color:A.dim, fontWeight:700, marginBottom:20 }}>Upload a curriculum first, then come back here to generate lessons.</div>
            <a href="/admin/curriculum" style={{
              display:'inline-flex', alignItems:'center', gap:7,
              background:A.electric, color:'#0C0820', borderRadius:10, padding:'10px 22px',
              fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:600,
              textDecoration:'none',
            }}>📚 Go to Curriculum →</a>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {levels.map(level => {
              const allSubs = (level.units||[]).flatMap(u=>(u.topics||[]).flatMap(t=>t.subtopics||[]))
              const doneCount = allSubs.filter(s => s.is_published || generated[s.id]).length
              const pct = allSubs.length > 0 ? Math.round((doneCount/allSubs.length)*100) : 0

              return (
                <div key={level.id} style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:16, overflow:'hidden' }}>

                  {/* Level header */}
                  <button className="gen-toggle" style={{ borderRadius:expandedLevels[level.id] ? '16px 16px 0 0' : 16 }}
                    onClick={() => toggle(setExpandedLevels, level.id)}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px' }}>
                      <span style={{ fontSize:14, color:A.dim2, flexShrink:0, transition:'transform 0.2s', transform:expandedLevels[level.id]?'rotate(90deg)':'none' }}>▶</span>
                      <span style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:18, color:A.chalk, flex:1 }}>{level.name}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:A.dim2, flexShrink:0 }}>{doneCount}/{allSubs.length} lessons</span>
                      {/* Progress bar */}
                      <div style={{ width:80, height:6, background:'rgba(165,155,255,0.1)', borderRadius:3, overflow:'hidden', flexShrink:0 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background: pct===100 ? A.electric : A.accent, borderRadius:3, transition:'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:900, color: pct===100 ? A.electric : A.dim2, minWidth:30, textAlign:'right' }}>{pct}%</span>
                    </div>
                  </button>

                  {/* Units */}
                  {expandedLevels[level.id] && (
                    <div style={{ borderTop:`1px solid ${A.border}` }}>
                      {(level.units||[]).map((unit, uIdx) => (
                        <div key={unit.id} style={{ borderBottom: uIdx < (level.units||[]).length-1 ? `1px solid ${A.border}` : 'none' }}>

                          {/* Unit header */}
                          <button className="gen-toggle"
                            onClick={() => toggle(setExpandedUnits, unit.id)}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 20px 12px 32px' }}>
                              <span style={{ fontSize:12, color:A.dim2, flexShrink:0 }}>{expandedUnits[unit.id] ? '▾' : '▸'}</span>
                              <span style={{ fontSize:13, fontWeight:900, color:A.chalk, flex:1 }}>{unit.title}</span>
                              <span style={{ fontSize:10, fontWeight:700, color:A.dim2 }}>
                                {(unit.topics||[]).length} topics · {(unit.topics||[]).reduce((a,t)=>a+(t.subtopics?.length||0),0)} subtopics
                              </span>
                            </div>
                          </button>

                          {/* Topics */}
                          {expandedUnits[unit.id] && (
                            <div style={{ padding:'4px 16px 12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                              {(unit.topics||[]).map(topic => {
                                const topicSubs = topic.subtopics || []
                                const topicDone = topicSubs.filter(s => s.is_published || generated[s.id]).length

                                return (
                                  <div key={topic.id} style={{ background:A.surface, border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>

                                    {/* Topic header */}
                                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom: expandedTopics[topic.id] ? `1px solid ${A.border}` : 'none' }}>
                                      <button style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:7, flex:1, textAlign:'left' }}
                                        onClick={() => toggle(setExpandedTopics, topic.id)}>
                                        <span style={{ fontSize:11, color:A.dim2 }}>{expandedTopics[topic.id] ? '▾' : '▸'}</span>
                                        <span style={{ fontSize:12.5, fontWeight:900, color:A.chalk }}>{topic.title}</span>
                                        <span style={{ fontSize:10, fontWeight:700, color:A.dim2, marginLeft:4 }}>({topicSubs.length})</span>
                                      </button>
                                      {/* Topic progress pip */}
                                      <span style={{ fontSize:10, fontWeight:800, color: topicDone===topicSubs.length && topicSubs.length>0 ? A.electric : A.dim2 }}>
                                        {topicDone}/{topicSubs.length}
                                      </span>
                                      {/* Generate All */}
                                      <button onClick={() => generateAllInTopic(topicSubs)} style={{
                                        display:'flex', alignItems:'center', gap:5,
                                        padding:'5px 12px', borderRadius:8,
                                        background:'rgba(200,241,53,0.08)', border:'1.5px solid rgba(200,241,53,0.22)',
                                        color:A.electric, fontSize:11, fontWeight:800,
                                        cursor:'pointer', transition:'all 0.15s', fontFamily:'Nunito,sans-serif',
                                        flexShrink:0,
                                      }}
                                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,241,53,0.16)';e.currentTarget.style.borderColor='rgba(200,241,53,0.45)'}}
                                        onMouseLeave={e=>{e.currentTarget.style.background='rgba(200,241,53,0.08)';e.currentTarget.style.borderColor='rgba(200,241,53,0.22)'}}
                                      >
                                        <Zap size={11} /> Generate All
                                      </button>
                                    </div>

                                    {/* Subtopics */}
                                    {expandedTopics[topic.id] && (
                                      <div>
                                        {topicSubs.sort((a,b)=>a.order_index-b.order_index).map((sub, sIdx) => {
                                          const status = getStatus(sub)
                                          const cfg    = STATUS_CFG[status]

                                          return (
                                            <div key={sub.id} style={{
                                              display:'flex', alignItems:'center', gap:12,
                                              padding:'10px 14px',
                                              borderBottom: sIdx < topicSubs.length-1 ? `1px solid ${A.border}` : 'none',
                                              transition:'background 0.1s',
                                            }}
                                              onMouseEnter={e=>e.currentTarget.style.background='rgba(165,155,255,0.04)'}
                                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                            >
                                              {/* Status icon */}
                                              <div style={{ flexShrink:0, width:18, textAlign:'center' }}>
                                                {status === 'generating' && <span className="spin" style={{ fontSize:13, color:A.gold }}>↻</span>}
                                                {status === 'done'       && <CheckCircle  size={14} color={A.electric} />}
                                                {status === 'error'      && <AlertCircle  size={14} color={A.coral}    />}
                                                {status === 'pending'    && <Clock        size={14} color={A.dim2}     />}
                                              </div>

                                              {/* Title + meta */}
                                              <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontSize:12, fontWeight:800, color: status==='done' ? A.chalk : A.dim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                  {sub.title}
                                                </div>
                                                {errors[sub.id] && (
                                                  <div style={{ fontSize:10, color:A.coral, fontWeight:700, marginTop:2 }}>{errors[sub.id]}</div>
                                                )}
                                                {sub.generated_at && (
                                                  <div style={{ fontSize:10, color:A.dim2, fontWeight:700, marginTop:2 }}>
                                                    Generated {new Date(sub.generated_at).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Action button */}
                                              <button
                                                onClick={() => generateLesson(sub.id)}
                                                disabled={status === 'generating'}
                                                style={{
                                                  display:'flex', alignItems:'center', gap:5,
                                                  padding:'5px 12px', borderRadius:8,
                                                  background:cfg.bg, border:`1.5px solid ${cfg.border}`,
                                                  color:cfg.color, fontSize:11, fontWeight:800,
                                                  cursor: status==='generating' ? 'not-allowed' : 'pointer',
                                                  flexShrink:0, transition:'all 0.15s',
                                                  fontFamily:'Nunito,sans-serif',
                                                  opacity: status==='generating' ? 0.7 : 1,
                                                }}
                                                onMouseEnter={e=>{ if(status!=='generating') e.currentTarget.style.opacity='.8' }}
                                                onMouseLeave={e=>{ e.currentTarget.style.opacity='1' }}
                                              >
                                                <Zap size={10} /> {cfg.label}
                                              </button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}