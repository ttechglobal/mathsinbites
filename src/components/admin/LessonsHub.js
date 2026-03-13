'use client'

import { useState } from 'react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
}

const DIFF_COLOR = { easy: '#C8F135', medium: '#FFC933', hard: '#FF6B6B' }
const TYPE_COLOR = {
  concept: '#9F67FF', definition: '#00D4C8', worked_example: '#FFC933',
  you_try: '#C8F135', summary: '#A599FF', introduction: '#67E8F9',
}

function Pill({ text, color }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 20,
      background: color + '18', color, border: `1px solid ${color}30`,
    }}>{text}</span>
  )
}

// ── Lesson review modal ───────────────────────────────────────────────────────
function LessonModal({ subtopic, lesson, onClose, onRegenerate }) {
  const [tab, setTab] = useState('slides')
  const [regenerating, setRegenerating] = useState(false)
  const [regenMsg, setRegenMsg] = useState('')

  const slides    = lesson?.slides    || []
  const questions = lesson?.questions || []

  const conceptSlides  = slides.filter(s => !['worked_example','you_try'].includes(s.type))
  const exampleSlides  = slides.filter(s => s.type === 'worked_example')
  const youTrySlide    = slides.find(s => s.type === 'you_try')

  async function handleRegenerate() {
    setRegenerating(true)
    setRegenMsg('')
    try {
      const res = await fetch('/api/generate/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId: subtopic.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRegenMsg('✓ Regenerated! Refresh to see new content.')
      onRegenerate(subtopic.id)
    } catch (e) {
      setRegenMsg('✗ ' + e.message)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', padding:'20px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:820, background:A.surface, borderRadius:18, border:`1px solid ${A.borderHi}`, overflow:'hidden', marginBottom:40 }}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:`1px solid ${A.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:A.dim, marginBottom:4 }}>Lesson Review</div>
            <div style={{ fontSize:18, fontWeight:800, color:A.chalk, lineHeight:1.3, marginBottom:6 }}>{subtopic.title}</div>
            {lesson?.summary && (
              <div style={{ fontSize:12, color:A.dim, lineHeight:1.6 }}>{lesson.summary}</div>
            )}
            {lesson?.hook && (
              <div style={{ marginTop:8, fontSize:11, color:A.teal, background:'rgba(0,212,200,0.08)', border:'1px solid rgba(0,212,200,0.2)', borderRadius:8, padding:'8px 12px', lineHeight:1.6 }}>
                🪝 {lesson.hook}
              </div>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0, alignItems:'flex-end' }}>
            <button onClick={onClose} style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:8, padding:'6px 14px', color:A.dim, cursor:'pointer', fontSize:12 }}>Close</button>
            <button onClick={handleRegenerate} disabled={regenerating} style={{
              background: regenerating ? 'none' : `linear-gradient(135deg,${A.accent},#5B21B6)`,
              border:`1px solid ${regenerating ? A.border : A.accent}`,
              borderRadius:8, padding:'6px 14px', color: regenerating ? A.dim : '#fff',
              cursor: regenerating ? 'default' : 'pointer', fontSize:11, fontWeight:800,
              opacity: regenerating ? 0.7 : 1,
            }}>{regenerating ? '↻ Regenerating…' : '⚡ Regenerate'}</button>
            {regenMsg && <div style={{ fontSize:10, color: regenMsg.startsWith('✓') ? A.electric : A.coral }}>{regenMsg}</div>}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ padding:'10px 24px', borderBottom:`1px solid ${A.border}`, display:'flex', gap:20 }}>
          {[
            { label:'Slides',     value: slides.length,    color: A.accentHi },
            { label:'Examples',   value: exampleSlides.length, color: A.gold },
            { label:'You Try',    value: youTrySlide ? 1 : 0, color: A.electric },
            { label:'Questions',  value: questions.length, color: A.teal },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize:16, fontWeight:900, color, fontFamily:"'Fredoka',sans-serif" }}>{value}</div>
              <div style={{ fontSize:9, color:A.dim2, textTransform:'uppercase', letterSpacing:0.8 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ padding:'10px 24px 0', display:'flex', gap:6, borderBottom:`1px solid ${A.border}` }}>
          {['slides','examples','you_try','questions'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? A.accent + '25' : 'none',
              border: tab === t ? `1px solid ${A.accent}` : `1px solid transparent`,
              borderBottom: 'none', borderRadius:'8px 8px 0 0',
              padding:'6px 14px', cursor:'pointer',
              color: tab === t ? A.chalk : A.dim, fontSize:11, fontWeight:700,
              textTransform:'capitalize',
            }}>{t.replace('_',' ')} {t === 'slides' ? `(${conceptSlides.length})` : t === 'examples' ? `(${exampleSlides.length})` : t === 'you_try' ? (youTrySlide ? '✓' : '—') : `(${questions.length})`}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:'18px 24px', maxHeight:520, overflowY:'auto' }}>

          {/* SLIDES TAB */}
          {tab === 'slides' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {conceptSlides.length === 0 && <div style={{ color:A.dim, textAlign:'center', padding:30 }}>No concept slides.</div>}
              {conceptSlides.map((slide, i) => (
                <div key={slide.id} style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:10, color:A.dim2, fontWeight:700 }}>#{slide.order_index + 1}</span>
                    <Pill text={slide.type} color={TYPE_COLOR[slide.type] || A.accentHi} />
                    <span style={{ fontSize:13, fontWeight:800, color:A.chalk, flex:1 }}>{slide.title}</span>
                  </div>

                  {slide.explanation && (
                    <div style={{ fontSize:12, color:A.dim, lineHeight:1.7, marginBottom:8 }}>{slide.explanation}</div>
                  )}

                  {slide.formula && (
                    <div style={{ fontFamily:'monospace', fontSize:13, color:A.gold, background:'rgba(255,201,51,0.08)', border:'1px solid rgba(255,201,51,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:8 }}>
                      {slide.formula}
                    </div>
                  )}

                  {slide.hint && (
                    <div style={{ fontSize:11, color:A.teal, background:'rgba(0,212,200,0.07)', borderRadius:8, padding:'6px 10px', marginBottom:8 }}>
                      💡 {slide.hint}
                    </div>
                  )}

                  {slide.svg_code && (
                    <div style={{ marginTop:8, borderRadius:8, overflow:'hidden', border:`1px solid ${A.border}`, lineHeight:0 }}
                      dangerouslySetInnerHTML={{ __html: slide.svg_code }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* EXAMPLES TAB */}
          {tab === 'examples' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {exampleSlides.length === 0 && <div style={{ color:A.dim, textAlign:'center', padding:30 }}>No worked examples.</div>}
              {exampleSlides.map((slide, i) => (
                <div key={slide.id} style={{ background:A.card, border:`1px solid ${A.gold}25`, borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ fontSize:11, fontWeight:800, color:A.gold, marginBottom:8 }}>Worked Example {i + 1}</div>
                  {slide.explanation && (
                    <div style={{ fontSize:13, color:A.chalk, background:'rgba(255,201,51,0.07)', border:'1px solid rgba(255,201,51,0.18)', borderRadius:9, padding:'10px 12px', marginBottom:10, lineHeight:1.6 }}>
                      {slide.explanation}
                    </div>
                  )}
                  {slide.steps && Array.isArray(slide.steps) && slide.steps.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {slide.steps.map((step, j) => (
                        <div key={j} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', background:A.gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#0d0d0d', flexShrink:0, marginTop:2 }}>{j+1}</div>
                          <div style={{ fontSize:12, color:A.dim, lineHeight:1.65, fontFamily:'monospace', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'5px 9px', flex:1 }}>
                            {step.text || step.content || String(step)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* YOU TRY TAB */}
          {tab === 'you_try' && (
            <div>
              {!youTrySlide
                ? <div style={{ color:A.dim, textAlign:'center', padding:30 }}>No "You Try" slide generated.</div>
                : (
                <div style={{ background:A.card, border:`1px solid ${A.electric}25`, borderRadius:12, padding:'16px' }}>
                  <div style={{ fontSize:11, fontWeight:800, color:A.electric, marginBottom:10 }}>You Try Problem</div>
                  {youTrySlide.explanation && (
                    <div style={{ fontSize:13, color:A.chalk, background:'rgba(200,241,53,0.07)', border:'1px solid rgba(200,241,53,0.18)', borderRadius:9, padding:'10px 12px', marginBottom:12, lineHeight:1.6 }}>
                      {youTrySlide.explanation}
                    </div>
                  )}
                  {youTrySlide.hint && (
                    <div style={{ fontSize:11, color:A.teal, marginBottom:10 }}>💡 Hint: {youTrySlide.hint}</div>
                  )}
                  {youTrySlide.steps && Array.isArray(youTrySlide.steps) && (
                    <div>
                      <div style={{ fontSize:10, color:A.dim2, fontWeight:800, marginBottom:8, textTransform:'uppercase', letterSpacing:0.8 }}>Solution Steps</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {youTrySlide.steps.map((step, j) => (
                          <div key={j} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                            <div style={{ width:20, height:20, borderRadius:'50%', background:A.electric, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#0d0d0d', flexShrink:0, marginTop:2 }}>{j+1}</div>
                            <div style={{ fontSize:12, color:A.dim, fontFamily:'monospace', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'5px 9px', flex:1, lineHeight:1.65 }}>
                              {step.text || step.content || String(step)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QUESTIONS TAB */}
          {tab === 'questions' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {questions.length === 0 && <div style={{ color:A.dim, textAlign:'center', padding:30 }}>No questions generated.</div>}
              {questions.map((q, i) => (
                <div key={q.id} style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:10, color:A.dim2, marginTop:2, flexShrink:0 }}>Q{i+1}</span>
                    <div style={{ flex:1, fontSize:13, color:A.chalk, fontWeight:700, lineHeight:1.6 }}>{q.question_text}</div>
                    <Pill text={q.difficulty} color={DIFF_COLOR[q.difficulty] || A.accentHi} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                    {(q.options || []).map((opt, j) => (
                      <div key={j} style={{
                        fontSize:12, padding:'7px 10px', borderRadius:8, lineHeight:1.4,
                        background: opt.is_correct ? A.electric + '14' : 'rgba(255,255,255,0.03)',
                        border:`1px solid ${opt.is_correct ? A.electric + '40' : A.border}`,
                        color: opt.is_correct ? A.electric : A.dim,
                      }}>
                        {opt.is_correct && <span style={{ marginRight:4 }}>✓</span>}{opt.option_text}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div style={{ fontSize:11, color:A.dim, background:'rgba(255,255,255,0.02)', borderRadius:7, padding:'7px 10px', lineHeight:1.65 }}>
                      📖 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LessonsHub({ levels, stats }) {
  const [expandedLevels, setExpandedLevels] = useState({})
  const [expandedTerms,  setExpandedTerms]  = useState({})
  const [expandedUnits,  setExpandedUnits]  = useState({})
  const [selected, setSelected] = useState(null) // { subtopic, lesson }
  const [regenSet, setRegenSet] = useState(new Set())

  const toggle = (setter, id) => setter(p => ({ ...p, [id]: !p[id] }))

  // Count published subtopics
  const totalPublished = levels.flatMap(l =>
    (l.terms||[]).flatMap(t => (t.units||[]).flatMap(u =>
      (u.topics||[]).flatMap(t2 => (t2.subtopics||[]).filter(s => s.is_published))
    ))
  ).length

  const totalSubtopics = levels.flatMap(l =>
    (l.terms||[]).flatMap(t => (t.units||[]).flatMap(u =>
      (u.topics||[]).flatMap(t2 => (t2.subtopics||[]))
    ))
  ).length

  return (
    <>
      <style>{`
        .lh-toggle { background:none; border:none; cursor:pointer; width:100%; text-align:left; transition:background 0.12s; border-radius:8px; }
        .lh-toggle:hover { background:rgba(165,155,255,0.04); }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(165,155,255,0.15); border-radius:2px; }
      `}</style>

      <div style={{ padding:'28px', maxWidth:960, fontFamily:'Nunito,sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, marginBottom:6 }}>
            📘 Lessons Hub
          </h1>
          <p style={{ color:A.dim, fontSize:13, marginBottom:16 }}>
            Review all generated lesson content — slides, worked examples, and quiz questions.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[
              { label:'Published',  value:`${totalPublished}/${totalSubtopics}`, color: A.electric },
              { label:'Lessons',    value: stats.lessons,   color: A.accentHi },
              { label:'Slides',     value: stats.slides,    color: A.gold },
              { label:'Questions',  value: stats.questions, color: A.teal },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:10, padding:'10px 18px' }}>
                <div style={{ fontSize:20, fontWeight:800, color, fontFamily:"'Fredoka',sans-serif" }}>{value}</div>
                <div style={{ fontSize:9, color:A.dim2, textTransform:'uppercase', letterSpacing:0.8 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum tree */}
        {levels.map(level => (
          <div key={level.id} style={{ marginBottom:12, background:A.surface, border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>

            <button className="lh-toggle" onClick={() => toggle(setExpandedLevels, level.id)}
              style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:12, color: expandedLevels[level.id] ? A.accentHi : A.dim, display:'inline-block', transform: expandedLevels[level.id] ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}>▶</span>
              <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:16, fontWeight:600, color:A.chalk }}>{level.name}</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:A.dim }}>
                {(level.terms||[]).reduce((s,t) => s + (t.units||[]).reduce((ss,u) => ss + (u.topics||[]).reduce((sss,tp) => sss + (tp.subtopics||[]).filter(sub => sub.is_published).length, 0), 0), 0)} published
              </span>
            </button>

            {expandedLevels[level.id] && (level.terms||[]).map(term => (
              <div key={term.id}>
                <button className="lh-toggle" onClick={() => toggle(setExpandedTerms, term.id)}
                  style={{ padding:'10px 18px 10px 36px', display:'flex', alignItems:'center', gap:8, borderTop:`1px solid ${A.border}` }}>
                  <span style={{ fontSize:11, color: expandedTerms[term.id] ? A.accentHi : A.dim, display:'inline-block', transform: expandedTerms[term.id] ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}>▶</span>
                  <span style={{ fontSize:13, fontWeight:700, color:A.dim }}>{term.name}</span>
                </button>

                {expandedTerms[term.id] && (term.units||[]).map(unit => (
                  <div key={unit.id}>
                    <button className="lh-toggle" onClick={() => toggle(setExpandedUnits, unit.id)}
                      style={{ padding:'8px 18px 8px 54px', display:'flex', alignItems:'center', gap:8, borderTop:`1px solid ${A.border}` }}>
                      <span style={{ fontSize:10, color: expandedUnits[unit.id] ? A.accentHi : A.dim, display:'inline-block', transform: expandedUnits[unit.id] ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}>▶</span>
                      <span style={{ fontSize:12, color:A.dim2 }}>📂 {unit.title}</span>
                    </button>

                    {expandedUnits[unit.id] && (unit.topics||[]).map(topic => (
                      <div key={topic.id} style={{ borderTop:`1px solid ${A.border}`, padding:'0' }}>

                        {/* Topic header */}
                        <div style={{ padding:'10px 18px 6px 72px', display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, fontWeight:800, color:A.chalk }}>{topic.title}</span>
                          <span style={{ fontSize:10, color:A.dim2 }}>
                            {(topic.subtopics||[]).filter(s => s.is_published).length}/{(topic.subtopics||[]).length} published
                          </span>
                        </div>

                        {/* Subtopics */}
                        {(topic.subtopics||[]).map(sub => {
                          const lesson  = sub.lesson && !Array.isArray(sub.lesson) ? sub.lesson : Array.isArray(sub.lesson) ? sub.lesson[0] : null
                          const hasLesson = !!lesson
                          const slideCount = lesson?.slides?.length || 0
                          const qCount    = lesson?.questions?.length || 0
                          const wasRegen  = regenSet.has(sub.id)

                          return (
                            <div key={sub.id} style={{
                              padding:'10px 18px 10px 88px', borderTop:`1px solid ${A.border}`,
                              display:'flex', alignItems:'center', gap:12,
                              background: wasRegen ? 'rgba(200,241,53,0.03)' : 'transparent',
                            }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                                  <span style={{ fontSize:12, fontWeight:700, color: hasLesson ? A.chalk : A.dim2 }}>{sub.title}</span>
                                  {sub.is_published
                                    ? <Pill text="Published" color={A.electric} />
                                    : <Pill text="Draft" color={A.dim} />
                                  }
                                  {wasRegen && <Pill text="Regenerated" color={A.gold} />}
                                </div>
                                {hasLesson && (
                                  <div style={{ fontSize:10, color:A.dim2, marginTop:3 }}>
                                    {slideCount} slides · {qCount} questions
                                    {lesson.created_at && ` · ${new Date(lesson.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}`}
                                  </div>
                                )}
                              </div>

                              {hasLesson ? (
                                <button onClick={() => setSelected({ subtopic: sub, lesson })} style={{
                                  background: A.teal + '15', border:`1px solid ${A.teal}40`,
                                  borderRadius:8, padding:'5px 14px', color:A.teal,
                                  cursor:'pointer', fontSize:11, fontWeight:800, flexShrink:0,
                                }}>Review →</button>
                              ) : (
                                <span style={{ fontSize:10, color:A.dim2, fontStyle:'italic', flexShrink:0 }}>Not generated</span>
                              )}
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
        ))}
      </div>

      {selected && (
        <LessonModal
          subtopic={selected.subtopic}
          lesson={selected.lesson}
          onClose={() => setSelected(null)}
          onRegenerate={(id) => {
            setRegenSet(s => new Set([...s, id]))
            setSelected(null)
          }}
        />
      )}
    </>
  )
}
