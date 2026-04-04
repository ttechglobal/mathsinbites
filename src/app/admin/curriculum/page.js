'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535', cardHi:'#1E1A40',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', cyan:'#67E8F9',
}

const CLASS_LEVELS = [
  { code:'JSS1', name:'JSS 1', category:'junior' },
  { code:'JSS2', name:'JSS 2', category:'junior' },
  { code:'JSS3', name:'JSS 3', category:'junior' },
  { code:'SS1',  name:'SS 1',  category:'senior' },
  { code:'SS2',  name:'SS 2',  category:'senior' },
  { code:'SS3',  name:'SS 3',  category:'senior' },
]

const EXAM_TYPES = [
  { code:'WAEC', name:'WAEC',  color:'#22c55e' },
  { code:'JAMB', name:'JAMB',  color:'#3b82f6' },
  { code:'NECO', name:'NECO',  color:'#f59e0b' },
  { code:'BECE', name:'BECE',  color:'#a855f7' },
  { code:'GCE',  name:'GCE',   color:'#ec4899' },
]

const TERM_NAMES = { 1:'First Term', 2:'Second Term', 3:'Third Term' }

function toSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const SCHOOL_EXAMPLE = `[
  {
    "term": 1,
    "term_name": "First Term",
    "topics": [
      {
        "title": "Number and Numeration",
        "subtopics": [
          { "title": "Whole Numbers", "objectives": ["Read and write whole numbers"] },
          { "title": "Fractions" }
        ]
      }
    ]
  },
  {
    "term": 2,
    "term_name": "Second Term",
    "topics": [
      {
        "title": "Geometry",
        "subtopics": [
          { "title": "Angles and lines" }
        ]
      }
    ]
  },
  {
    "term": 3,
    "term_name": "Third Term",
    "topics": [
      {
        "title": "Statistics",
        "subtopics": [
          { "title": "Mean, median and mode" }
        ]
      }
    ]
  }
]`

const EXAM_EXAMPLE = `[
  {
    "title": "Algebra",
    "subtopics": [
      { "title": "Linear equations", "objectives": ["Solve linear equations"] },
      { "title": "Quadratic equations" }
    ]
  },
  {
    "title": "Statistics",
    "subtopics": [
      { "title": "Mean, median and mode" }
    ]
  }
]`

export default function CurriculumPage() {
  const [curriculumMode,  setCurriculumMode]  = useState('class')
  const [selectedLevel,   setSelectedLevel]   = useState('')
  const [selectedSubject, setSelectedSubject] = useState('maths')
  const [selectedExam,    setSelectedExam]    = useState('WAEC')
  const [jsonInput,       setJsonInput]       = useState('')
  const [parsed,          setParsed]          = useState(null)
  const [parseError,      setParseError]      = useState('')
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [saveError,       setSaveError]       = useState('')
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [expandedTerms,   setExpandedTerms]   = useState({})
  const [expandedTopics,  setExpandedTopics]  = useState({})

  const isSS   = ['SS1','SS2','SS3'].includes(selectedLevel)
  const isExam = curriculumMode === 'exam'
  const isClass= curriculumMode === 'class'

  const effectiveCode = isExam
    ? `EXAM_${selectedExam}_${selectedSubject === 'further_maths' ? 'Further_Mathematics' : 'Mathematics'}`
    : (selectedSubject === 'further_maths' && isSS ? `FM_${selectedLevel}` : selectedLevel)

  const effectiveName = isExam
    ? `${selectedExam} ${selectedSubject === 'further_maths' ? 'Further Mathematics' : 'Mathematics'}`
    : (selectedSubject === 'further_maths' && isSS
        ? `Further Maths ${selectedLevel}`
        : CLASS_LEVELS.find(l => l.code === selectedLevel)?.name || selectedLevel)

  const effectiveCategory = isExam ? 'exam'
    : (CLASS_LEVELS.find(l => l.code === selectedLevel)?.category || 'senior')

  const canSave = isExam ? !!selectedExam : !!selectedLevel

  function parseJSON() {
    setParseError(''); setParsed(null)
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('JSON must be an array at the top level')
      if (isClass) {
        if (data[0]?.term === undefined)
          throw new Error('School curriculum must have a "term" field (1, 2 or 3) on each item. See the example.')
        for (const t of data) {
          if (!t.term) throw new Error('Each term entry must have a "term" number')
          if (!Array.isArray(t.topics)) throw new Error(`Term ${t.term} must have a "topics" array`)
          if (t.topics[0] && !t.topics[0].title) throw new Error(`Topics in term ${t.term} must have a "title"`)
          if (t.topics[0] && !Array.isArray(t.topics[0].subtopics)) throw new Error(`Topics in term ${t.term} must have a "subtopics" array`)
        }
      } else {
        if (data[0]?.term !== undefined)
          throw new Error('Exam curriculum should be a flat list of topics with no "term" field. See the example.')
        if (!data[0]?.title) throw new Error('Each topic must have a "title" field')
        if (!Array.isArray(data[0]?.subtopics)) throw new Error('Each topic must have a "subtopics" array')
      }
      setParsed(data)
    } catch (err) {
      setParseError('Invalid JSON: ' + err.message)
    }
  }

  async function saveCurriculum() {
    if (!canSave) return
    if (!parsed)  return
    setShowConfirm(false)
    setSaveError('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/curriculum', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          effectiveCode,
          effectiveName,
          effectiveCategory,
          selectedSubject,
          isClass,
          parsed,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`)
      setSaved(true)
      setParsed(null)
      setJsonInput('')
      setTimeout(() => setSaved(false), 5000)
    } catch (err) {
      setSaveError(err.message || 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const totalTerms     = isClass ? (parsed?.length || 0) : 0
  const totalTopics    = isClass
    ? (parsed?.reduce((a, t) => a + (t.topics?.length || 0), 0) || 0)
    : (parsed?.length || 0)
  const totalSubtopics = isClass
    ? (parsed?.reduce((a, t) => a + (t.topics || []).reduce((b, tp) => b + (tp.subtopics?.length || 0), 0), 0) || 0)
    : (parsed?.reduce((a, t) => a + (t.subtopics?.length || 0), 0) || 0)

  return (
    <>
      <style>{`
        .cur-input { width:100%; background:rgba(165,155,255,0.06); border:1.5px solid rgba(165,155,255,0.14); border-radius:12px; padding:12px 16px; font-size:13px; font-weight:700; color:#F0EDFF; outline:none; resize:vertical; box-sizing:border-box; font-family:'Courier New',monospace; transition:border-color 0.2s; }
        .cur-input:focus { border-color:rgba(200,241,53,0.45); }
        .cur-input::placeholder { color:rgba(165,155,255,0.28); }
        .lvl-btn { padding:8px 6px; border-radius:10px; border:1.5px solid rgba(165,155,255,0.14); background:rgba(165,155,255,0.05); font-family:'Nunito',sans-serif; font-size:11.5px; font-weight:800; color:rgba(220,215,255,0.55); cursor:pointer; transition:all 0.15s; text-align:center; }
        .lvl-btn:hover { border-color:rgba(200,241,53,0.35); color:#F0EDFF; }
        .lvl-btn.sel { background:rgba(200,241,53,0.12); border-color:rgba(200,241,53,0.5); color:#C8F135; }
        .mode-tab { flex:1; padding:10px; border-radius:10px; border:1.5px solid transparent; font-family:'Nunito',sans-serif; font-size:13px; font-weight:800; cursor:pointer; transition:all 0.15s; text-align:center; background:transparent; color:rgba(220,215,255,0.5); }
        .mode-tab.active { background:rgba(200,241,53,0.1); border-color:rgba(200,241,53,0.4); color:#C8F135; }
        .mode-tab:hover:not(.active) { color:#F0EDFF; background:rgba(165,155,255,0.06); }
        .exam-btn { padding:9px 8px; border-radius:10px; border:1.5px solid rgba(165,155,255,0.14); background:rgba(165,155,255,0.05); font-family:'Nunito',sans-serif; font-size:12px; font-weight:900; color:rgba(220,215,255,0.55); cursor:pointer; transition:all 0.15s; text-align:center; }
        .exam-btn.sel { background:rgba(124,58,237,0.18); border-color:rgba(124,58,237,0.5); color:#9F67FF; }
        .cur-btn-ghost { padding:9px 18px; border-radius:10px; border:1.5px solid rgba(165,155,255,0.18); background:rgba(165,155,255,0.06); font-family:'Nunito',sans-serif; font-size:12px; font-weight:800; color:rgba(220,215,255,0.65); cursor:pointer; transition:all 0.15s; }
        .cur-btn-ghost:hover { border-color:rgba(200,241,53,0.4); color:#C8F135; }
        .cur-btn-ghost:disabled { opacity:0.4; cursor:not-allowed; }
        .cur-btn-primary { width:100%; padding:13px; border-radius:12px; border:none; background:#C8F135; color:#0C0820; font-family:'Fredoka',sans-serif; font-size:16px; font-weight:600; cursor:pointer; transition:all 0.18s; box-shadow:0 4px 20px rgba(200,241,53,0.25); }
        .cur-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(200,241,53,0.4); }
        .cur-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        .tree-toggle { background:none; border:none; cursor:pointer; width:100%; text-align:left; transition:background 0.12s; }
        .tree-toggle:hover { background:rgba(165,155,255,0.05); }
      `}</style>

      <div style={{ padding:'28px', maxWidth:820, fontFamily:'Nunito,sans-serif' }}>

        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, lineHeight:1, marginBottom:6 }}>📚 Curriculum Upload</h1>
          <p style={{ fontSize:13, color:A.dim, fontWeight:700 }}>School curricula are organised by term. Exam curricula are flat — no terms.</p>
        </div>

        {saved && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(200,241,53,0.08)', border:'1.5px solid rgba(200,241,53,0.3)', borderRadius:14, padding:'14px 18px', marginBottom:20 }}>
            <CheckCircle size={18} color={A.electric} />
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:A.electric }}>Curriculum saved successfully!</div>
              <div style={{ fontSize:11, color:A.dim, marginTop:2 }}>Topics are now available for lesson generation and past question matching.</div>
            </div>
          </div>
        )}

        {saveError && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.3)', borderRadius:14, padding:'14px 18px', marginBottom:20 }}>
            <AlertCircle size={18} color={A.coral} style={{ flexShrink:0, marginTop:1 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:A.coral }}>Save failed</div>
              <div style={{ fontSize:12, color:A.dim, marginTop:4, fontFamily:'Courier New, monospace', lineHeight:1.5 }}>{saveError}</div>
              <div style={{ fontSize:11, color:A.dim, marginTop:6, lineHeight:1.5 }}>
                Common causes: expired session (refresh the page), Supabase RLS policy blocking inserts, or network error.
              </div>
              <button onClick={() => setSaveError('')} style={{ marginTop:10, padding:'5px 14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:A.coral, fontWeight:800, fontSize:11, cursor:'pointer', fontFamily:'Nunito, sans-serif' }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* STEP 1 — Mode */}
        <div style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 1</div>
          <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:12 }}>Curriculum Type</div>
          <div style={{ display:'flex', gap:8, background:'rgba(165,155,255,0.05)', borderRadius:12, padding:4 }}>
            <button className={`mode-tab${isClass?' active':''}`} onClick={() => { setCurriculumMode('class'); setParsed(null); setParseError('') }}>
              🏫 School (JSS 1 – SS 3)
            </button>
            <button className={`mode-tab${isExam?' active':''}`} onClick={() => { setCurriculumMode('exam'); setParsed(null); setParseError('') }}>
              📋 Exam (WAEC, JAMB…)
            </button>
          </div>
          <div style={{ marginTop:12, padding:'10px 14px', background: isClass?'rgba(0,212,200,0.06)':'rgba(124,58,237,0.06)', border:`1px solid ${isClass?'rgba(0,212,200,0.2)':'rgba(124,58,237,0.2)'}`, borderRadius:10 }}>
            {isClass ? (
              <div style={{ fontSize:12, color:'#00D4C8', fontWeight:700, lineHeight:1.6 }}>
                📅 <strong>Term structure required.</strong> JSON must include First Term, Second Term, and Third Term. Topics sit under their term. Students see term banners on the Learn page.
              </div>
            ) : (
              <div style={{ fontSize:12, color:'#9F67FF', fontWeight:700, lineHeight:1.6 }}>
                📋 <strong>No terms.</strong> Exam curricula are flat — all topics in one list. No First Term / Second Term / Third Term divisions. This matches how external exams work.
              </div>
            )}
          </div>
        </div>

        {/* STEP 2 — Level / Exam */}
        <div style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 2</div>
          <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:14 }}>{isClass ? 'Select Class Level' : 'Select Exam Type'}</div>

          {isClass ? (
            <>
              {[
                { g:'Junior Secondary', codes: CLASS_LEVELS.filter(l => l.category==='junior') },
                { g:'Senior Secondary', codes: CLASS_LEVELS.filter(l => l.category==='senior') },
              ].map(grp => (
                <div key={grp.g} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:9, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>{grp.g}</div>
                  <div style={{ display:'grid', gridTemplateColumns:`repeat(${grp.codes.length},1fr)`, gap:6 }}>
                    {grp.codes.map(l => (
                      <button key={l.code} className={`lvl-btn${selectedLevel===l.code?' sel':''}`} onClick={() => setSelectedLevel(l.code)}>{l.code}</button>
                    ))}
                  </div>
                </div>
              ))}
              {isSS && (
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${A.border}` }}>
                  <div style={{ fontSize:9, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:8 }}>Subject</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[{id:'maths',label:'Mathematics'},{id:'further_maths',label:'Further Maths'}].map(s => (
                      <button key={s.id} className={`lvl-btn${selectedSubject===s.id?' sel':''}`} onClick={() => setSelectedSubject(s.id)}>{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {selectedLevel && (
                <div style={{ marginTop:12, padding:'9px 13px', background:'rgba(0,212,200,0.06)', border:'1px solid rgba(0,212,200,0.2)', borderRadius:9 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#00D4C8' }}>
                    Uploading <code style={{ fontFamily:'Courier New', color:A.electric }}>{effectiveName}</code> — must include all 3 terms
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                {EXAM_TYPES.map(e => (
                  <button key={e.code} className={`exam-btn${selectedExam===e.code?' sel':''}`} onClick={() => setSelectedExam(e.code)}>{e.name}</button>
                ))}
              </div>
              <div style={{ paddingTop:14, borderTop:`1px solid ${A.border}` }}>
                <div style={{ fontSize:9, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:8 }}>Subject</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[{id:'maths',label:'Mathematics'},{id:'further_maths',label:'Further Maths'}].map(s => (
                    <button key={s.id} className={`lvl-btn${selectedSubject===s.id?' sel':''}`} onClick={() => setSelectedSubject(s.id)}>{s.label}</button>
                  ))}
                </div>
              </div>
              {selectedExam && (
                <div style={{ marginTop:12, padding:'9px 13px', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:9 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#9F67FF' }}>
                    Saving as <code style={{ fontFamily:'Courier New', color:A.electric }}>{effectiveCode}</code> — flat topic list, no terms
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* STEP 3 — JSON */}
        <div style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 3</div>
          <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:4 }}>Paste Curriculum JSON</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, marginBottom:12, background: isClass?'rgba(0,212,200,0.08)':'rgba(124,58,237,0.08)', border: isClass?'1px solid rgba(0,212,200,0.2)':'1px solid rgba(124,58,237,0.2)' }}>
            <span style={{ fontSize:11, fontWeight:900, color: isClass?'#00D4C8':'#9F67FF' }}>
              {isClass ? '📅 Format: [ { "term": 1, "term_name": "First Term", "topics": [ ... ] } ]' : '📋 Format: [ { "title": "Topic", "subtopics": [ ... ] } ]'}
            </span>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Example format</div>
            <div style={{ background:A.surface, borderRadius:10, padding:'12px 14px', fontSize:11, fontFamily:'Courier New,monospace', color:A.dim, lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:180, overflowY:'auto' }}>
              {isClass ? SCHOOL_EXAMPLE : EXAM_EXAMPLE}
            </div>
          </div>

          <textarea className="cur-input" rows={14} value={jsonInput} onChange={e => setJsonInput(e.target.value)}
            placeholder={isClass
              ? `[\n  {\n    "term": 1,\n    "term_name": "First Term",\n    "topics": [\n      { "title": "Topic", "subtopics": [{ "title": "Subtopic" }] }\n    ]\n  }\n]`
              : `[\n  { "title": "Topic", "subtopics": [{ "title": "Subtopic" }] }\n]`}
          />

          {parseError && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginTop:10, padding:'10px 14px', background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10 }}>
              <AlertCircle size={15} color={A.coral} style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, fontWeight:700, color:A.coral, lineHeight:1.5 }}>{parseError}</span>
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button className="cur-btn-ghost" onClick={() => { setJsonInput(''); setParsed(null); setParseError('') }} disabled={!jsonInput}>Clear</button>
            <button className="cur-btn-ghost" onClick={parseJSON} disabled={!jsonInput.trim()}>Preview →</button>
          </div>
        </div>

        {/* STEP 4 — Preview */}
        {parsed && (
          <div style={{ background:A.card, border:`1.5px solid ${A.borderHi}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 4</div>
            <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:16 }}>Preview & Save</div>

            <div style={{ display:'grid', gridTemplateColumns: isClass?'1fr 1fr 1fr':'1fr 1fr', gap:8, marginBottom:18 }}>
              {[
                ...(isClass ? [{ label:'Terms', v:totalTerms, color:'#00D4C8' }] : []),
                { label:'Topics',    v:totalTopics,    color:A.electric },
                { label:'Subtopics', v:totalSubtopics, color:A.gold },
              ].map(s => (
                <div key={s.label} style={{ background:A.surface, borderRadius:12, padding:'14px', textAlign:'center', border:`1px solid ${A.border}` }}>
                  <div style={{ fontSize:28, fontWeight:900, color:s.color, fontFamily:'Fredoka,sans-serif', lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:10, fontWeight:800, color:A.dim2, textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(200,241,53,0.06)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:10 }}>
              <span style={{ fontSize:12, fontWeight:800, color:A.electric }}>
                Saving as: <code style={{ fontFamily:'Courier New' }}>{effectiveName}</code>
                <span style={{ color:A.dim }}> ({effectiveCode})</span>
                {isClass && <span style={{ color:A.dim }}> · with term structure</span>}
                {isExam  && <span style={{ color:A.dim }}> · flat — no terms</span>}
              </span>
            </div>

            {/* Tree */}
            <div style={{ background:A.surface, borderRadius:12, overflow:'hidden', border:`1px solid ${A.border}`, maxHeight:420, overflowY:'auto', marginBottom:18 }}>
              {isClass ? (
                parsed.map((termData, ti) => (
                  <div key={ti}>
                    <button className="tree-toggle" onClick={() => setExpandedTerms(p => ({...p, [ti]:!p[ti]}))}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', borderBottom:`1px solid ${A.border}`, background:'rgba(0,212,200,0.04)' }}>
                        {expandedTerms[ti] ? <ChevronDown size={13} color="#00D4C8"/> : <ChevronRight size={13} color={A.dim}/>}
                        <span style={{ fontSize:13, fontWeight:900, color:'#00D4C8' }}>
                          Term {termData.term}: {termData.term_name || TERM_NAMES[termData.term] || `Term ${termData.term}`}
                        </span>
                        <span style={{ fontSize:10, color:A.dim, marginLeft:'auto' }}>{termData.topics?.length || 0} topics</span>
                      </div>
                    </button>
                    {expandedTerms[ti] && (termData.topics || []).map((topic, tpi) => (
                      <div key={tpi}>
                        <button className="tree-toggle" onClick={() => setExpandedTopics(p => ({...p, [`${ti}-${tpi}`]:!p[`${ti}-${tpi}`]}))}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px 9px 32px', borderBottom:`1px solid ${A.border}` }}>
                            {expandedTopics[`${ti}-${tpi}`] ? <ChevronDown size={12} color={A.electric}/> : <ChevronRight size={12} color={A.dim}/>}
                            <span style={{ fontSize:12, fontWeight:800, color:A.chalk, flex:1, textAlign:'left' }}>{topic.title}</span>
                            <span style={{ fontSize:10, color:A.dim }}>{topic.subtopics?.length || 0} subtopics</span>
                          </div>
                        </button>
                        {expandedTopics[`${ti}-${tpi}`] && (topic.subtopics || []).map((sub, si) => (
                          <div key={si} style={{ padding:'6px 14px 6px 52px', fontSize:11, color:A.dim, fontWeight:600, borderBottom:`1px solid rgba(165,155,255,0.04)` }}>
                            · {sub.title || sub}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                parsed.map((topic, ti) => (
                  <div key={ti}>
                    <button className="tree-toggle" onClick={() => setExpandedTopics(p => ({...p, [ti]:!p[ti]}))}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', borderBottom:`1px solid ${A.border}` }}>
                        {expandedTopics[ti] ? <ChevronDown size={13} color={A.electric}/> : <ChevronRight size={13} color={A.dim}/>}
                        <span style={{ fontSize:13, fontWeight:800, color:A.chalk, flex:1, textAlign:'left' }}>{topic.title}</span>
                        <span style={{ fontSize:10, color:A.dim }}>{topic.subtopics?.length || 0} subtopics</span>
                      </div>
                    </button>
                    {expandedTopics[ti] && (topic.subtopics || []).map((sub, si) => (
                      <div key={si} style={{ padding:'7px 14px 7px 38px', fontSize:11, color:A.dim, fontWeight:600, borderBottom:`1px solid rgba(165,155,255,0.04)` }}>
                        · {sub.title || sub}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {!showConfirm ? (
              <button className="cur-btn-primary" onClick={() => setShowConfirm(true)} disabled={!canSave}>💾 Save Curriculum</button>
            ) : (
              <div style={{ background:'rgba(200,241,53,0.06)', border:'1.5px solid rgba(200,241,53,0.25)', borderRadius:14, padding:'18px' }}>
                <p style={{ fontSize:13, fontWeight:800, color:A.chalk, marginBottom:14 }}>
                  ⚠️ This will save <strong style={{color:A.electric}}>{totalTopics} topics</strong>
                  {isClass && <span> across <strong style={{color:A.electric}}>{totalTerms} terms</strong></span>}
                  {' '}under <strong style={{color:A.electric}}>{effectiveName}</strong>. Topics already saved will be added again — clear the level first if re-uploading.
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="cur-btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
                  <button className="cur-btn-primary" style={{ flex:1 }} onClick={saveCurriculum} disabled={saving}>
                    {saving ? '⏳ Saving…' : '✓ Confirm & Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}