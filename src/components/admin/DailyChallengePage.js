// src/components/admin/DailyChallengePage.js
'use client'

import { useState, useEffect } from 'react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF', electric:'#C8F135',
  gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
}

const CLASS_LEVELS = ['JSS1','JSS2','JSS3','SS1','SS2','SS3']
const BATCH_SIZE   = 10

export default function DailyChallengePage({ questions: initial = [], topics: topicsMap = {} }) {
  const [questions,   setQuestions]   = useState(initial)
  const [filter,      setFilter]      = useState('all')

  // Bulk generate state
  const [bClass,   setBClass]   = useState('SS1')
  const [bTopic,   setBTopic]   = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [topicList, setTopicList] = useState(topicsMap[bClass] || [])
  const [generating,  setGenerating]  = useState(false)
  const [progress,    setProgress]    = useState({ done: 0, total: 0, status: '' })
  const [bError,      setBError]      = useState('')

  // Manual add state
  const [showManual, setShowManual] = useState(false)
  const [manual, setManual] = useState({
    class_level: 'SS1', topic: '', question_text: '',
    correct_answer: '', hint_1: '', hint_2: '', hint_3: '',
    worked_solution: '', difficulty: 'medium',
  })
  const [saving, setSaving] = useState(false)
  const [mError, setMError] = useState('')

  const effectiveTopic = bTopic === '__custom__' ? customTopic : bTopic

  // Update topic list when class changes
  useEffect(() => {
    setTopicList(topicsMap[bClass] || [])
    setBTopic('')
  }, [bClass])

  // ── Bulk generate 10 questions ────────────────────────────────────────────
  async function bulkGenerate() {
    if (!effectiveTopic.trim()) { setBError('Choose or type a topic first'); return }
    setBError('')
    setGenerating(true)
    setProgress({ done: 0, total: BATCH_SIZE, status: 'Starting…' })

    const newQs = []
    for (let i = 0; i < BATCH_SIZE; i++) {
      setProgress({ done: i, total: BATCH_SIZE, status: `Generating question ${i+1} of ${BATCH_SIZE}…` })
      try {
        // Generate
        const genRes = await fetch('/api/admin/daily-challenge/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_level: bClass, topic: effectiveTopic.trim() }),
        })
        const genData = await genRes.json()
        if (!genRes.ok) throw new Error(genData.error)

        // Save immediately
        const saveRes = await fetch('/api/admin/daily-challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            class_level:     bClass,
            topic:           effectiveTopic.trim(),
            question_text:   genData.question_text,
            correct_answer:  genData.correct_answer,
            hint_1:          genData.hint_1,
            hint_2:          genData.hint_2 || '',
            hint_3:          genData.hint_3 || '',
            worked_solution: genData.worked_solution,
            difficulty:      genData.difficulty || 'medium',
          }),
        })
        const saveData = await saveRes.json()
        if (!saveRes.ok) throw new Error(saveData.error)
        newQs.push(saveData.question)
        setProgress({ done: i+1, total: BATCH_SIZE, status: `Saved ${i+1} of ${BATCH_SIZE}` })
      } catch (err) {
        setProgress(p => ({ ...p, status: `Q${i+1} failed: ${err.message} — continuing…` }))
      }
      // Small delay to avoid rate limits
      if (i < BATCH_SIZE - 1) await new Promise(r => setTimeout(r, 800))
    }

    setQuestions(p => [...newQs, ...p])
    setProgress({ done: newQs.length, total: BATCH_SIZE, status: `✓ Done — ${newQs.length} questions saved` })
    setGenerating(false)
  }

  // ── Manual save ──────────────────────────────────────────────────────────
  async function saveManual() {
    if (!manual.question_text || !manual.correct_answer || !manual.hint_1 || !manual.worked_solution) {
      setMError('Fill all required fields'); return
    }
    setSaving(true); setMError('')
    try {
      const res = await fetch('/api/admin/daily-challenge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manual),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestions(p => [data.question, ...p])
      setShowManual(false)
      setManual(m => ({ ...m, question_text:'', correct_answer:'', hint_1:'', hint_2:'', hint_3:'', worked_solution:'' }))
    } catch (err) { setMError(err.message) }
    setSaving(false)
  }

  async function deleteQ(id) {
    if (!confirm('Delete?')) return
    await fetch(`/api/admin/daily-challenge?id=${id}`, { method: 'DELETE' })
    setQuestions(p => p.filter(q => q.id !== id))
  }

  const filtered = filter === 'all' ? questions : questions.filter(q => q.class_level === filter)

  return (
    <div style={{ padding:28, maxWidth:960, fontFamily:'Nunito,sans-serif' }}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dc-f{width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid ${A.border};background:${A.surface};color:${A.chalk};font-family:Nunito,sans-serif;font-size:13px;outline:none;box-sizing:border-box}
        .dc-f:focus{border-color:${A.accentHi}}
        textarea.dc-f{min-height:80px;resize:vertical}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, margin:0, marginBottom:4 }}>⚡ Daily Challenge Bank</h1>
        <p style={{ fontSize:13, color:A.dim, margin:0 }}>{questions.length} questions total · one shown per class per day, auto-cycled by topic coverage</p>
      </div>

      {/* ── BULK GENERATE PANEL ── */}
      <div style={{ background:A.card, border:`1.5px solid ${A.borderHi}`, borderRadius:16, padding:22, marginBottom:24 }}>
        <div style={{ fontSize:15, fontWeight:900, color:A.chalk, marginBottom:4 }}>✨ Bulk Generate — 10 Questions per Topic</div>
        <div style={{ fontSize:12, color:A.dim, marginBottom:18 }}>Choose a class and topic. Claude will generate 10 real-world challenge questions and save them automatically.</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Class Level</label>
            <select value={bClass} onChange={e => setBClass(e.target.value)} className="dc-f">
              {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Topic</label>
            {topicList.length > 0 ? (
              <select value={bTopic} onChange={e => setBTopic(e.target.value)} className="dc-f">
                <option value="">— Select topic —</option>
                {topicList.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__custom__">+ Type custom topic…</option>
              </select>
            ) : (
              <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
                placeholder="e.g. Compound Interest, Quadratic Equations, Ratio…"
                className="dc-f" />
            )}
          </div>
        </div>

        {bTopic === '__custom__' && (
          <div style={{ marginBottom:12 }}>
            <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
              placeholder="Type topic name…" className="dc-f" />
          </div>
        )}

        {/* Progress bar */}
        {(generating || progress.status) && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              {generating && <span style={{ fontSize:14, animation:'spin 0.8s linear infinite', display:'inline-block' }}>↻</span>}
              <span style={{ fontSize:12, fontWeight:700, color: progress.status.startsWith('✓') ? A.electric : A.gold }}>
                {progress.status}
              </span>
            </div>
            {progress.total > 0 && (
              <div style={{ height:6, background:'rgba(165,155,255,0.1)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(progress.done/progress.total)*100}%`, background: progress.done===progress.total ? A.electric : A.accent, borderRadius:3, transition:'width 0.3s' }} />
              </div>
            )}
          </div>
        )}

        {bError && <div style={{ fontSize:12, color:A.coral, fontWeight:700, marginBottom:10 }}>{bError}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={bulkGenerate} disabled={generating || !effectiveTopic.trim()}
            style={{ padding:'11px 24px', borderRadius:10, border:'none', background: effectiveTopic.trim() && !generating ? A.electric : 'rgba(200,241,53,0.15)', color: effectiveTopic.trim() && !generating ? '#0C0820' : 'rgba(200,241,53,0.35)', fontSize:13, fontWeight:900, cursor: effectiveTopic.trim() && !generating ? 'pointer' : 'not-allowed', fontFamily:'Nunito,sans-serif' }}>
            {generating ? `Generating… (${progress.done}/${progress.total})` : `⚡ Generate ${BATCH_SIZE} Questions`}
          </button>
          <button onClick={() => { setShowManual(true); setMError('') }}
            style={{ padding:'11px 18px', borderRadius:10, border:`1.5px solid ${A.border}`, background:'transparent', color:A.dim, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
            + Add Manually
          </button>
        </div>
      </div>

      {/* ── MANUAL ADD FORM ── */}
      {showManual && (
        <div style={{ background:A.card, border:`1.5px solid ${A.borderHi}`, borderRadius:14, padding:20, marginBottom:20, animation:'slideUp 0.3s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:900, color:A.chalk }}>Add Question Manually</div>
            <button onClick={() => setShowManual(false)} style={{ background:'none', border:'none', cursor:'pointer', color:A.dim, fontSize:18 }}>✕</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Class *</label>
              <select value={manual.class_level} onChange={e => setManual(m => ({...m, class_level:e.target.value}))} className="dc-f">
                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Topic *</label>
              <input value={manual.topic} onChange={e => setManual(m => ({...m, topic:e.target.value}))} placeholder="e.g. Simple Interest" className="dc-f" />
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Question *</label>
            <textarea value={manual.question_text} onChange={e => setManual(m => ({...m, question_text:e.target.value}))} placeholder="Full question with real-world context…" className="dc-f" />
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Correct Answer *</label>
            <input value={manual.correct_answer} onChange={e => setManual(m => ({...m, correct_answer:e.target.value}))} placeholder="e.g. ₦24000 or 15" className="dc-f" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
            {[1,2,3].map(n => (
              <div key={n}>
                <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Hint {n}{n===1?' *':''}</label>
                <input value={manual[`hint_${n}`]} onChange={e => setManual(m => ({...m, [`hint_${n}`]:e.target.value}))} placeholder={n===1?'First nudge…':n===2?'More specific…':'Almost there…'} className="dc-f" />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:10, fontWeight:800, color:A.dim, textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:4 }}>Worked Solution * <span style={{ color:A.dim2, fontSize:9 }}>(\\n between steps)</span></label>
            <textarea value={manual.worked_solution} onChange={e => setManual(m => ({...m, worked_solution:e.target.value}))} placeholder={'Step 1\\nStep 2\\nAnswer: 15'} className="dc-f" style={{ minHeight:90 }} />
          </div>
          {mError && <div style={{ fontSize:12, color:A.coral, fontWeight:700, marginBottom:10 }}>{mError}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setShowManual(false)} style={{ flex:1, padding:'10px', borderRadius:8, border:`1.5px solid ${A.border}`, background:'transparent', color:A.dim, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>Cancel</button>
            <button onClick={saveManual} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:A.electric, color:'#0C0820', fontSize:13, fontWeight:900, cursor:'pointer', fontFamily:'Nunito,sans-serif', opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : 'Save Question'}
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER + LIST ── */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {['all', ...CLASS_LEVELS].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${filter===f ? A.accentHi : A.border}`, background: filter===f ? 'rgba(124,58,237,0.18)' : 'transparent', color: filter===f ? A.accentHi : A.dim, fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
            {f === 'all' ? `All (${questions.length})` : `${f} (${questions.filter(q=>q.class_level===f).length})`}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 24px', background:A.card, border:`1.5px solid ${A.border}`, borderRadius:14, color:A.dim, fontSize:14, fontWeight:700 }}>
            No questions yet for this filter. Use Bulk Generate above to add 10 at once.
          </div>
        )}
        {filtered.map(q => (
          <div key={q.id} style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:5 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:A.accentHi, background:'rgba(124,58,237,0.15)', borderRadius:20, padding:'2px 9px' }}>{q.class_level}</span>
                  <span style={{ fontSize:10, fontWeight:800, color: q.difficulty==='hard' ? A.coral : A.gold, background: q.difficulty==='hard' ? 'rgba(255,107,107,0.1)' : 'rgba(255,201,51,0.1)', borderRadius:20, padding:'2px 9px' }}>{q.difficulty}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:A.teal }}>{q.topic}</span>
                  {q.date_assigned && <span style={{ fontSize:10, fontWeight:700, color: q.date_assigned === new Date().toISOString().slice(0,10) ? A.electric : A.dim }}>📅 {q.date_assigned}</span>}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:A.chalk, lineHeight:1.5, marginBottom:3 }}>{q.question_text}</div>
                <div style={{ fontSize:11, color:A.dim }}>Answer: <strong style={{ color:A.electric }}>{q.correct_answer}</strong></div>
              </div>
              <button onClick={() => deleteQ(q.id)} style={{ background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontSize:11, color:A.coral, fontFamily:'Nunito,sans-serif', fontWeight:800, flexShrink:0 }}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}