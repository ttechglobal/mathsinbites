'use client'

// src/components/admin/LessonEditor.js
// Split-panel lesson editor: left = slide editor, right = phone preview
// Features: edit text inline, AI rewrite with suggestion, regenerate SVG,
//           regenerate entire slide, add slide, delete slide, reorder slides

import { useState, useCallback } from 'react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.3)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
  green: '#22c55e',
}

const TYPE_LABELS = {
  concept: 'Concept', definition: 'Definition', worked_example: 'Worked Example',
  you_try: 'You Try', summary: 'Summary', introduction: 'Introduction', rule: 'Rule',
}
const TYPE_COLOR = {
  concept: '#9F67FF', definition: A.teal, worked_example: A.gold,
  you_try: A.electric, summary: '#A599FF', introduction: '#67E8F9', rule: A.coral,
}

function Badge({ type }) {
  const col = TYPE_COLOR[type] || A.dim
  return <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:0.8, padding:'2px 8px', borderRadius:20, background:`${col}18`, color:col, border:`1px solid ${col}28` }}>{TYPE_LABELS[type] || type}</span>
}

// ── Phone Preview ─────────────────────────────────────────────────────────────
function PhonePreview({ slide }) {
  if (!slide) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:A.dim2, fontSize:13, fontWeight:700, textAlign:'center', padding:24 }}>
      <div><div style={{ fontSize:32, marginBottom:12 }}>👈</div>Select a slide to preview</div>
    </div>
  )

  return (
    <div style={{ flex:1, padding:'16px 14px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14, fontFamily:'Nunito, sans-serif' }}>
      {/* Type badge */}
      <Badge type={slide.type} />

      {/* Title */}
      <div style={{ fontSize:16, fontWeight:900, color:A.chalk, lineHeight:1.3 }}>{slide.title}</div>

      {/* SVG illustration */}
      {slide.svg_code && (
        <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${A.border}`, background:'#fff' }}
          dangerouslySetInnerHTML={{ __html: slide.svg_code }} />
      )}

      {/* Explanation */}
      {slide.explanation && (
        <div style={{ fontSize:13, color:A.dim, lineHeight:1.75, fontWeight:600 }}>{slide.explanation}</div>
      )}

      {/* Formula */}
      {slide.formula && (
        <div style={{ background:`${A.accent}14`, border:`1.5px solid ${A.accent}30`, borderRadius:10, padding:'12px 14px', fontSize:15, fontWeight:900, color:A.chalk, textAlign:'center', letterSpacing:0.5 }}>{slide.formula}</div>
      )}

      {/* Steps (worked example) */}
      {slide.steps && (() => {
        try {
          const parsed = typeof slide.steps === 'string' ? JSON.parse(slide.steps) : slide.steps
          const steps = Array.isArray(parsed) ? parsed : parsed?._steps || []
          return steps.map((s, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${A.border}` }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:`${A.accent}20`, border:`1px solid ${A.accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:A.accentHi, fontWeight:900, flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:12, color:A.dim, lineHeight:1.6, fontWeight:600 }}>{s.label && <strong style={{ color:A.chalk }}>{s.label}: </strong>}{s.text}</div>
            </div>
          ))
        } catch { return null }
      })()}

      {/* Hint */}
      {slide.hint && (
        <div style={{ background:'rgba(255,201,51,0.08)', border:'1px solid rgba(255,201,51,0.2)', borderRadius:10, padding:'10px 12px', fontSize:12, color:A.gold, fontWeight:700 }}>
          💡 {slide.hint}
        </div>
      )}
    </div>
  )
}

// ── Slide Editor Panel ────────────────────────────────────────────────────────
function SlideEditor({ slide, idx, total, onUpdate, onDelete, onMove, onRegenerate, onRegenerateSvg, subtopicTitle }) {
  const [editing,       setEditing]       = useState(null) // field name being edited
  const [aiSuggestion,  setAiSuggestion]  = useState('')
  const [aiLoading,     setAiLoading]     = useState(false)
  const [svgLoading,    setSvgLoading]    = useState(false)
  const [msg,           setMsg]           = useState('')

  async function aiRewrite(field) {
    if (!aiSuggestion.trim()) return
    setAiLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/lesson-editor/ai-rewrite', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          field, currentValue: slide[field], suggestion: aiSuggestion,
          context: `Slide type: ${slide.type}. Subtopic: ${subtopicTitle}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(slide.id, { [field]: data.result })
      setAiSuggestion('')
      setEditing(null)
      setMsg('✓ Updated')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) { setMsg('✗ ' + e.message) }
    setAiLoading(false)
  }

  async function regenSvg() {
    setSvgLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/lesson-editor/regen-svg', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ slideId: slide.id, title: slide.title, explanation: slide.explanation, type: slide.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(slide.id, { svg_code: data.svg_code })
      setMsg('✓ SVG updated')
      setTimeout(() => setMsg(''), 2500)
    } catch (e) { setMsg('✗ ' + e.message) }
    setSvgLoading(false)
  }

  function EditableField({ field, label, multiline = false, mono = false }) {
    const isOpen = editing === field
    const val    = slide[field] || ''
    return (
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <label style={{ fontSize:9, fontWeight:800, color:A.dim2, textTransform:'uppercase', letterSpacing:1 }}>{label}</label>
          <button onClick={() => setEditing(isOpen ? null : field)}
            style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:10, color:A.dim, fontFamily:'Nunito,sans-serif' }}>
            {isOpen ? 'Done' : 'Edit'}
          </button>
        </div>
        {isOpen ? (
          <div>
            {multiline
              ? <textarea value={val} onChange={e => onUpdate(slide.id, { [field]: e.target.value })}
                  style={{ width:'100%', minHeight:80, padding:'8px 10px', borderRadius:8, border:`1.5px solid ${A.borderHi}`, background:A.cardHi, color:A.chalk, fontSize:12, fontFamily: mono ? 'monospace' : 'Nunito,sans-serif', resize:'vertical', outline:'none', boxSizing:'border-box' }} />
              : <input value={val} onChange={e => onUpdate(slide.id, { [field]: e.target.value })}
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1.5px solid ${A.borderHi}`, background:A.cardHi, color:A.chalk, fontSize:12, fontFamily:'Nunito,sans-serif', outline:'none', boxSizing:'border-box' }} />
            }
            {/* AI rewrite */}
            <div style={{ marginTop:8, display:'flex', gap:6 }}>
              <input value={aiSuggestion} onChange={e => setAiSuggestion(e.target.value)}
                placeholder={`AI suggestion, e.g. "make simpler" or "use football example"`}
                style={{ flex:1, padding:'6px 10px', borderRadius:7, border:`1px solid ${A.border}`, background:A.surface, color:A.chalk, fontSize:11, fontFamily:'Nunito,sans-serif', outline:'none' }} />
              <button onClick={() => aiRewrite(field)} disabled={!aiSuggestion.trim() || aiLoading}
                style={{ padding:'6px 12px', borderRadius:7, border:'none', background: aiSuggestion.trim() ? A.accent : 'rgba(124,58,237,0.2)', color: aiSuggestion.trim() ? '#fff' : A.dim, fontSize:11, fontWeight:800, cursor: aiSuggestion.trim() ? 'pointer' : 'not-allowed', fontFamily:'Nunito,sans-serif', whiteSpace:'nowrap' }}>
                {aiLoading ? '…' : '✨ AI'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:12, color: val ? A.dim : A.dim2, lineHeight:1.6, padding:'6px 8px', background:A.card, borderRadius:8, border:`1px solid ${A.border}`, fontFamily: mono ? 'monospace' : 'inherit', whiteSpace: mono ? 'pre-wrap' : 'normal', wordBreak:'break-word', minHeight:32 }}>
            {val || <em style={{ opacity:0.4 }}>Empty</em>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background:A.surface, border:`1.5px solid ${A.border}`, borderRadius:14, overflow:'hidden', marginBottom:10 }}>
      {/* Slide header */}
      <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${A.border}`, background:A.card }}>
        <div style={{ fontSize:11, fontWeight:800, color:A.dim2, minWidth:20 }}>#{idx+1}</div>
        <Badge type={slide.type} />
        <div style={{ flex:1, fontSize:13, fontWeight:800, color:A.chalk, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{slide.title}</div>
        {msg && <span style={{ fontSize:10, fontWeight:800, color: msg.startsWith('✓') ? A.green : A.coral }}>{msg}</span>}
        {/* Controls */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={() => onMove(idx, -1)} disabled={idx === 0} title="Move up"
            style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:6, width:26, height:26, cursor: idx===0?'default':'pointer', color:A.dim, opacity:idx===0?.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>↑</button>
          <button onClick={() => onMove(idx, 1)} disabled={idx === total-1} title="Move down"
            style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:6, width:26, height:26, cursor: idx===total-1?'default':'pointer', color:A.dim, opacity:idx===total-1?.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>↓</button>
          <button onClick={() => onRegenerate(slide.id)} title="Regenerate entire slide"
            style={{ background:'rgba(124,58,237,0.12)', border:`1px solid ${A.border}`, borderRadius:6, padding:'0 8px', height:26, cursor:'pointer', color:A.accentHi, fontSize:10, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>⚡ Regen</button>
          <button onClick={() => onDelete(slide.id)} title="Delete slide"
            style={{ background:'rgba(255,107,107,0.08)', border:`1px solid rgba(255,107,107,0.2)`, borderRadius:6, width:26, height:26, cursor:'pointer', color:A.coral, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>×</button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding:'14px' }}>
        <EditableField field="title" label="Title" />
        <EditableField field="explanation" label="Explanation" multiline />
        {slide.formula !== undefined && <EditableField field="formula" label="Formula" />}
        {slide.hint    !== undefined && <EditableField field="hint" label="Hint" multiline />}

        {/* SVG section */}
        {(slide.svg_code || slide.type === 'concept' || slide.type === 'rule') && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <label style={{ fontSize:9, fontWeight:800, color:A.dim2, textTransform:'uppercase', letterSpacing:1 }}>SVG Illustration</label>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={regenSvg} disabled={svgLoading}
                  style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:10, color:A.teal, fontFamily:'Nunito,sans-serif' }}>
                  {svgLoading ? '…' : '🖼 Regenerate SVG'}
                </button>
                <button onClick={() => setEditing(editing === 'svg_code' ? null : 'svg_code')}
                  style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:10, color:A.dim, fontFamily:'Nunito,sans-serif' }}>
                  {editing === 'svg_code' ? 'Done' : 'Edit SVG'}
                </button>
              </div>
            </div>
            {editing === 'svg_code'
              ? <textarea value={slide.svg_code || ''} onChange={e => onUpdate(slide.id, { svg_code: e.target.value })}
                  style={{ width:'100%', minHeight:120, padding:'8px 10px', borderRadius:8, border:`1.5px solid ${A.borderHi}`, background:A.cardHi, color:A.chalk, fontSize:11, fontFamily:'monospace', resize:'vertical', outline:'none', boxSizing:'border-box' }} />
              : slide.svg_code
                ? <div style={{ background:'#fff', borderRadius:8, overflow:'hidden', border:`1px solid ${A.border}`, maxHeight:140, display:'flex', alignItems:'center', justifyContent:'center' }}
                    dangerouslySetInnerHTML={{ __html: slide.svg_code }} />
                : <div style={{ fontSize:11, color:A.dim2, padding:'8px', fontStyle:'italic' }}>No SVG — click "Regenerate SVG" to generate one</div>
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LessonEditor({ subtopic, lesson: initialLesson, onClose }) {
  const [lesson,        setLesson]        = useState(initialLesson)
  const [slides,        setSlides]        = useState(initialLesson?.slides?.sort((a,b)=>a.order_index-b.order_index) || [])
  const [selectedSlide, setSelectedSlide] = useState(slides[0] || null)
  const [saving,        setSaving]        = useState(false)
  const [saveMsg,       setSaveMsg]       = useState('')
  const [regenFull,     setRegenFull]     = useState(false)
  const [aiPrompt,      setAiPrompt]      = useState('')

  // ── Update a slide field locally ─────────────────────────────────────────
  const updateSlide = useCallback((slideId, updates) => {
    setSlides(ss => ss.map(s => s.id === slideId ? { ...s, ...updates } : s))
    setSelectedSlide(sel => sel?.id === slideId ? { ...sel, ...updates } : sel)
  }, [])

  // ── Delete slide ─────────────────────────────────────────────────────────
  function deleteSlide(slideId) {
    if (!confirm('Delete this slide?')) return
    setSlides(ss => {
      const next = ss.filter(s => s.id !== slideId)
      if (selectedSlide?.id === slideId) setSelectedSlide(next[0] || null)
      return next
    })
  }

  // ── Reorder ──────────────────────────────────────────────────────────────
  function moveSlide(idx, dir) {
    setSlides(ss => {
      const next = [...ss]
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= next.length) return ss
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next.map((s, i) => ({ ...s, order_index: i }))
    })
  }

  // ── Save all changes ──────────────────────────────────────────────────────
  async function saveAll() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/admin/lesson-editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, slides }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaveMsg('✓ All changes saved')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setSaveMsg('✗ ' + e.message)
    }
    setSaving(false)
  }

  // ── Regenerate a single slide ─────────────────────────────────────────────
  async function regenSlide(slideId) {
    const slide = slides.find(s => s.id === slideId)
    if (!slide || !confirm(`Regenerate the "${slide.title}" slide? AI will rewrite it.`)) return
    try {
      const res = await fetch('/api/admin/lesson-editor/regen-slide', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ slideId, subtopicId: subtopic.id, slideType: slide.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateSlide(slideId, data.slide)
    } catch (e) { alert('Error: ' + e.message) }
  }

  // ── Regenerate entire lesson ──────────────────────────────────────────────
  async function regenFully() {
    if (!confirm('Regenerate the entire lesson? This will replace all slides and questions.')) return
    setRegenFull(true)
    try {
      const body = { subtopicId: subtopic.id }
      if (aiPrompt.trim()) body.suggestion = aiPrompt.trim()
      const res = await fetch('/api/generate/lesson', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaveMsg('✓ Lesson regenerated — refresh to see new content')
      setAiPrompt('')
    } catch (e) { setSaveMsg('✗ ' + e.message) }
    setRegenFull(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:A.bg, fontFamily:'Nunito, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ flexShrink:0, padding:'0 20px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${A.border}`, background:A.surface }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${A.border}`, borderRadius:8, padding:'5px 12px', cursor:'pointer', color:A.dim, fontSize:12, fontFamily:'Nunito,sans-serif' }}>← Back</button>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:A.chalk, maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{subtopic.title}</div>
            <div style={{ fontSize:10, color:A.dim2, fontWeight:700 }}>{slides.length} slides</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {saveMsg && <span style={{ fontSize:11, fontWeight:800, color: saveMsg.startsWith('✓') ? A.green : A.coral }}>{saveMsg}</span>}
          {/* AI regen entire lesson */}
          <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
            placeholder='AI hint: "make it simpler" or "use farming context"'
            style={{ width:240, padding:'6px 10px', borderRadius:8, border:`1px solid ${A.border}`, background:A.card, color:A.chalk, fontSize:11, fontFamily:'Nunito,sans-serif', outline:'none' }} />
          <button onClick={regenFully} disabled={regenFull}
            style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${A.accent}`, background:'rgba(124,58,237,0.15)', color:A.accentHi, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', opacity:regenFull?.6:1 }}>
            {regenFull ? '↻ Regenerating…' : '⚡ Regen Lesson'}
          </button>
          <button onClick={saveAll} disabled={saving}
            style={{ padding:'6px 18px', borderRadius:8, border:'none', background:A.electric, color:A.bg, fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'Nunito,sans-serif', opacity:saving?.7:1 }}>
            {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      {/* ── Split panel ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* LEFT: slide list + editors */}
        <div style={{ width:'55%', overflowY:'auto', padding:'16px', borderRight:`1px solid ${A.border}` }}>
          {slides.map((slide, idx) => (
            <div key={slide.id} onClick={() => setSelectedSlide(slide)} style={{ cursor:'pointer' }}>
              <SlideEditor
                slide={slide} idx={idx} total={slides.length}
                onUpdate={updateSlide} onDelete={deleteSlide}
                onMove={moveSlide} onRegenerate={regenSlide}
                subtopicTitle={subtopic.title}
              />
            </div>
          ))}

          {/* Add slide */}
          <button onClick={() => {
            const newSlide = { id: `new-${Date.now()}`, type:'concept', title:'New slide', explanation:'', svg_code:'', order_index: slides.length }
            setSlides(ss => [...ss, newSlide])
            setSelectedSlide(newSlide)
          }}
            style={{ width:'100%', padding:'12px', borderRadius:12, border:`2px dashed ${A.border}`, background:'none', cursor:'pointer', color:A.dim, fontSize:13, fontWeight:800, fontFamily:'Nunito,sans-serif', marginTop:4 }}>
            + Add slide
          </button>
        </div>

        {/* RIGHT: phone preview */}
        <div style={{ width:'45%', display:'flex', flexDirection:'column', background:A.bg }}>
          {/* Preview label */}
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${A.border}`, fontSize:10, fontWeight:800, color:A.dim2, textTransform:'uppercase', letterSpacing:1 }}>
            📱 Preview — {selectedSlide ? selectedSlide.title : 'Select a slide'}
          </div>
          {/* Phone frame */}
          <div style={{ flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 20px', overflowY:'auto' }}>
            <div style={{ width:280, minHeight:560, background:'#1a1730', borderRadius:32, border:'6px solid rgba(165,155,255,0.15)', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
              {/* Mock phone notch */}
              <div style={{ height:28, background:'#0F0C24', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:60, height:6, borderRadius:3, background:'rgba(165,155,255,0.2)' }} />
              </div>
              <PhonePreview slide={selectedSlide} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}