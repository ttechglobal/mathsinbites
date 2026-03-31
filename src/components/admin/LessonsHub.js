'use client'

// src/components/admin/LessonsHub.js
// Browse lessons by level/topic, click to open the split-panel editor

import { useState } from 'react'
import LessonEditor from './LessonEditor.js'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8', green:'#22c55e',
}

function Pill({ text, color }) {
  return <span style={{ fontSize:9, fontWeight:800, letterSpacing:0.8, textTransform:'uppercase', padding:'2px 7px', borderRadius:20, background:`${color}18`, color, border:`1px solid ${color}28` }}>{text}</span>
}

export default function LessonsHub({ levels }) {
  const [expandedLevels, setExpandedLevels] = useState({})
  const [expandedUnits,  setExpandedUnits]  = useState({})
  const [expandedTopics, setExpandedTopics] = useState({})
  const [editing, setEditing] = useState(null)  // { subtopic, lesson }
  const [search,  setSearch]  = useState('')

  const toggle = (setter, id) => setter(p => ({ ...p, [id]: !p[id] }))

  const allSubtopics = levels.flatMap(l =>
    (l.terms||[]).flatMap(t =>
      (t.units||[]).flatMap(u =>
        (u.topics||[]).flatMap(tp =>
          (tp.subtopics||[]).map(s => ({ ...s, topicTitle: tp.title, unitTitle: u.title, levelName: l.name }))
        )
      )
    )
  )

  const totalPublished = allSubtopics.filter(s => s.is_published).length

  if (editing) {
    return (
      <LessonEditor
        subtopic={editing.subtopic}
        lesson={editing.lesson}
        onClose={() => setEditing(null)}
      />
    )
  }

  return (
    <div style={{ padding:28, maxWidth:960, fontFamily:'Nunito,sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, marginBottom:4 }}>
          📘 Lesson Library
        </h1>
        <p style={{ fontSize:13, color:A.dim }}>
          {totalPublished} of {allSubtopics.length} lessons published · Click any lesson to open the editor
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom:20 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search subtopics…"
          style={{ width:320, padding:'9px 14px', borderRadius:10, border:`1.5px solid ${A.border}`, background:A.surface, color:A.chalk, fontSize:13, fontFamily:'Nunito,sans-serif', outline:'none' }}
        />
      </div>

      {/* Empty state */}
      {levels.length === 0 && (
        <div style={{ textAlign:'center', padding:'64px 24px', background:A.card, border:`1.5px solid ${A.border}`, borderRadius:20 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
          <div style={{ fontSize:16, fontWeight:900, color:A.chalk, marginBottom:8 }}>No curriculum uploaded yet</div>
          <a href="/admin/curriculum" style={{ color:A.electric, fontWeight:800, fontSize:14 }}>Upload curriculum →</a>
        </div>
      )}

      {/* Level accordion */}
      {levels.map(level => {
        const levelSubs  = (level.terms||[]).flatMap(t => (t.units||[]).flatMap(u => (u.topics||[]).flatMap(tp => tp.subtopics||[])))
        const doneCount  = levelSubs.filter(s => s.is_published).length
        const pct        = levelSubs.length > 0 ? Math.round((doneCount/levelSubs.length)*100) : 0

        return (
          <div key={level.id} style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:16, overflow:'hidden', marginBottom:10 }}>
            {/* Level header */}
            <button style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'15px 20px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
              onClick={() => toggle(setExpandedLevels, level.id)}>
              <span style={{ fontSize:13, color:A.dim2, transition:'transform 0.2s', transform:expandedLevels[level.id]?'rotate(90deg)':'none' }}>▶</span>
              <span style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:18, color:A.chalk, flex:1 }}>{level.name}</span>
              <span style={{ fontSize:11, fontWeight:800, color:A.dim2 }}>{doneCount}/{levelSubs.length}</span>
              <div style={{ width:80, height:6, background:'rgba(165,155,255,0.1)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background: pct===100 ? A.electric : A.accent, borderRadius:3, transition:'width 0.4s' }} />
              </div>
              <span style={{ fontSize:11, fontWeight:900, color: pct===100 ? A.electric : A.dim2, minWidth:30, textAlign:'right' }}>{pct}%</span>
            </button>

            {/* Terms / Units / Topics / Subtopics */}
            {expandedLevels[level.id] && (
              <div style={{ borderTop:`1px solid ${A.border}` }}>
                {(level.terms||[]).map(term => (
                  <div key={term.id}>
                    <div style={{ padding:'8px 20px 6px 36px', fontSize:10, fontWeight:900, color:A.accent, textTransform:'uppercase', letterSpacing:1.2 }}>
                      {term.name}
                    </div>
                    {(term.units||[]).map((unit, uIdx) => (
                      <div key={unit.id} style={{ borderBottom: uIdx < (term.units||[]).length-1 ? `1px solid ${A.border}` : 'none' }}>
                        {/* Unit header */}
                        <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 20px 10px 36px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                          onClick={() => toggle(setExpandedUnits, unit.id)}>
                          <span style={{ fontSize:11, color:A.dim2 }}>{expandedUnits[unit.id] ? '▾' : '▸'}</span>
                          <span style={{ fontSize:13, fontWeight:900, color:A.chalk, flex:1 }}>{unit.title}</span>
                          <span style={{ fontSize:10, color:A.dim2 }}>{(unit.topics||[]).length} topics</span>
                        </button>

                        {/* Topics */}
                        {expandedUnits[unit.id] && (
                          <div style={{ padding:'4px 16px 10px 16px' }}>
                            {(unit.topics||[]).map(topic => {
                              const subs = (topic.subtopics||[])
                              const filtered = search ? subs.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : subs
                              if (search && !filtered.length) return null
                              const topicDone = subs.filter(s => s.is_published).length

                              return (
                                <div key={topic.id} style={{ background:A.surface, border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden', marginBottom:8 }}>
                                  {/* Topic header */}
                                  <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left', borderBottom: expandedTopics[topic.id] ? `1px solid ${A.border}` : 'none' }}
                                    onClick={() => toggle(setExpandedTopics, topic.id)}>
                                    <span style={{ fontSize:11, color:A.dim2 }}>{expandedTopics[topic.id] ? '▾' : '▸'}</span>
                                    <span style={{ fontSize:13, fontWeight:900, color:A.chalk, flex:1 }}>{topic.title}</span>
                                    <span style={{ fontSize:10, fontWeight:800, color: topicDone===subs.length && subs.length>0 ? A.electric : A.dim2 }}>{topicDone}/{subs.length}</span>
                                  </button>

                                  {/* Subtopics — the clickable lesson rows */}
                                  {expandedTopics[topic.id] && (
                                    <div>
                                      {filtered.sort((a,b)=>a.order_index-b.order_index).map((sub, si) => {
                                        const hasLesson = sub.is_published
                                        return (
                                          <div key={sub.id}
                                            onClick={() => setEditing({ subtopic: sub, lesson: sub.lesson || null })}
                                            style={{
                                              display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                                              borderBottom: si < filtered.length-1 ? `1px solid ${A.border}` : 'none',
                                              cursor:'pointer', transition:'background 0.1s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background='rgba(124,58,237,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                          >
                                            {/* Status dot */}
                                            <div style={{ width:10, height:10, borderRadius:'50%', background: hasLesson ? A.green : A.border, border: hasLesson ? `2px solid ${A.green}40` : `2px solid ${A.border}`, flexShrink:0 }} />

                                            {/* Title */}
                                            <div style={{ flex:1, minWidth:0 }}>
                                              <div style={{ fontSize:13, fontWeight:800, color: hasLesson ? A.chalk : A.dim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub.title}</div>
                                              {sub.generated_at && (
                                                <div style={{ fontSize:10, color:A.dim2, marginTop:1 }}>
                                                  Generated {new Date(sub.generated_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}
                                                </div>
                                              )}
                                            </div>

                                            {/* Status pill */}
                                            {hasLesson
                                              ? <Pill text="Published" color={A.green} />
                                              : <Pill text="No lesson" color={A.dim2} />
                                            }

                                            {/* Open editor arrow */}
                                            <span style={{ fontSize:16, color: hasLesson ? A.accentHi : A.dim2, flexShrink:0 }}>›</span>
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
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}