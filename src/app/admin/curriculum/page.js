'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
const TERM_NAMES = { 1:'First Term', 2:'Second Term', 3:'Third Term' }

export default function CurriculumPage() {
  const supabase = createClient()
  const [selectedLevel,   setSelectedLevel]   = useState('')
  const [selectedSubject, setSelectedSubject] = useState('maths')
  const [jsonInput,       setJsonInput]       = useState('')
  const [parsed,          setParsed]          = useState(null)
  const [parseError,      setParseError]      = useState('')
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [expandedTerms,   setExpandedTerms]   = useState({})
  const [expandedUnits,   setExpandedUnits]   = useState({})
  const [expandedTopics,  setExpandedTopics]  = useState({})

  const isSS = ['SS1','SS2','SS3'].includes(selectedLevel)
  // FM levels use FM_ prefix to avoid clashing with Maths levels in DB
  const effectiveCode = selectedSubject === 'further_maths' && isSS
    ? `FM_${selectedLevel}` : selectedLevel
  const effectiveName = selectedSubject === 'further_maths' && isSS
    ? `Further Maths ${selectedLevel}` : CLASS_LEVELS.find(l=>l.code===selectedLevel)?.name || selectedLevel

  const exampleJSON = JSON.stringify([{ term:1, term_name:"First Term", units:[{ unit:"Number and Numeration", topics:[{ title:"Whole Numbers", subtopics:[{ title:"Reading and writing whole numbers", objectives:["Read whole numbers up to 1,000,000"] }] }] }] }], null, 2)

  function parseJSON() {
    setParseError(''); setParsed(null)
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) throw new Error('JSON must be an array of terms')
      if (!data[0]?.term) throw new Error('Each item must have a "term" number (1, 2, or 3)')
      setParsed(data)
    } catch (err) { setParseError('Invalid JSON: ' + err.message) }
  }

  async function saveCurriculum() {
    if (!selectedLevel) return alert('Please select a class level')
    if (!parsed) return alert('Please parse the JSON first')
    setShowConfirm(false)
    setSaving(true)
    try {
      const levelData = CLASS_LEVELS.find(l => l.code === selectedLevel)
      const { data: level, error: levelError } = await supabase
        .from('levels').upsert({
          name:     effectiveName,
          code:     effectiveCode,
          category: levelData?.category || 'senior',
          subject:  selectedSubject,
        }, { onConflict:'code' })
        .select().single()
      if (levelError) throw levelError
      for (const termData of parsed) {
        const { data: term, error: termError } = await supabase.from('terms')
          .upsert({ level_id:level.id, name:termData.term_name||TERM_NAMES[termData.term], term_number:termData.term, order_index:termData.term-1 }, { onConflict:'level_id,term_number' })
          .select().single()
        if (termError) throw termError
        for (let uIdx=0; uIdx<termData.units.length; uIdx++) {
          const unit = termData.units[uIdx]
          const { data: unitRow, error: unitError } = await supabase.from('units')
            .insert({ level_id:level.id, term_id:term.id, title:unit.unit, order_index:uIdx }).select().single()
          if (unitError) throw unitError
          for (let tIdx=0; tIdx<unit.topics.length; tIdx++) {
            const topic = unit.topics[tIdx]
            const { data: topicRow, error: topicError } = await supabase.from('topics')
              .insert({ unit_id:unitRow.id, title:topic.title, order_index:tIdx }).select().single()
            if (topicError) throw topicError
            for (let sIdx=0; sIdx<topic.subtopics.length; sIdx++) {
              const subtopic = topic.subtopics[sIdx]
              const { error: subError } = await supabase.from('subtopics')
                .insert({ topic_id:topicRow.id, title:subtopic.title, learning_objectives:subtopic.objectives||[], order_index:sIdx })
              if (subError) throw subError
            }
          }
        }
      }
      setSaved(true); setParsed(null); setJsonInput('')
      setTimeout(()=>setSaved(false), 4000)
    } catch (err) { alert('Error saving curriculum: ' + err.message) }
    finally { setSaving(false) }
  }

  const totalTerms     = parsed?.length || 0
  const totalUnits     = parsed?.reduce((a,t)=>a+(t.units?.length||0),0) || 0
  const totalTopics    = parsed?.reduce((a,t)=>a+(t.units||[]).reduce((b,u)=>b+(u.topics?.length||0),0),0) || 0
  const totalSubtopics = parsed?.reduce((a,t)=>a+(t.units||[]).reduce((b,u)=>b+(u.topics||[]).reduce((c,tp)=>c+(tp.subtopics?.length||0),0),0),0) || 0

  const inputCls = `
    width:100%; background:rgba(165,155,255,0.06); border:1.5px solid rgba(165,155,255,0.14);
    border-radius:12px; padding:12px 16px; font-family:'Nunito',sans-serif;
    font-size:13px; font-weight:700; color:#F0EDFF; outline:none; resize:none;
    font-family:monospace; box-sizing:border-box;
  `

  return (
    <>
      <style>{`
        .cur-input {
          width:100%; background:rgba(165,155,255,0.06);
          border:1.5px solid rgba(165,155,255,0.14); border-radius:12px;
          padding:12px 16px; font-size:13px; font-weight:700;
          color:#F0EDFF; outline:none; resize:none; box-sizing:border-box;
          font-family:'Courier New',monospace; transition:border-color 0.2s;
        }
        .cur-input:focus { border-color:rgba(200,241,53,0.45); }
        .cur-input::placeholder { color:rgba(165,155,255,0.3); }
        .lvl-btn {
          padding:8px 6px; border-radius:10px;
          border:1.5px solid rgba(165,155,255,0.14);
          background:rgba(165,155,255,0.05);
          font-family:'Nunito',sans-serif; font-size:11.5px; font-weight:800;
          color:rgba(220,215,255,0.55); cursor:pointer; transition:all 0.15s; text-align:center;
        }
        .lvl-btn:hover { border-color:rgba(200,241,53,0.35); color:#F0EDFF; }
        .lvl-btn.sel { background:rgba(200,241,53,0.12); border-color:rgba(200,241,53,0.5); color:#C8F135; }
        .cur-btn-ghost {
          padding:9px 18px; border-radius:10px;
          border:1.5px solid rgba(165,155,255,0.18); background:rgba(165,155,255,0.06);
          font-family:'Nunito',sans-serif; font-size:12px; font-weight:800;
          color:rgba(220,215,255,0.65); cursor:pointer; transition:all 0.15s;
        }
        .cur-btn-ghost:hover { border-color:rgba(200,241,53,0.4); color:#C8F135; }
        .cur-btn-ghost:disabled { opacity:0.4; cursor:not-allowed; }
        .cur-btn-primary {
          width:100%; padding:13px; border-radius:12px; border:none;
          background:#C8F135; color:#0C0820;
          font-family:'Fredoka',sans-serif; font-size:16px; font-weight:600;
          cursor:pointer; transition:all 0.18s;
          box-shadow:0 4px 20px rgba(200,241,53,0.25);
        }
        .cur-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(200,241,53,0.4); }
        .cur-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        .tree-toggle { background:none; border:none; cursor:pointer; width:100%; text-align:left; transition:background 0.12s; }
        .tree-toggle:hover { background:rgba(165,155,255,0.05); }
      `}</style>

      <div style={{ padding:'28px', maxWidth:860, fontFamily:'Nunito,sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:24, color:A.chalk, lineHeight:1, marginBottom:6 }}>
            📚 Curriculum Upload
          </h1>
          <p style={{ fontSize:13, color:A.dim, fontWeight:700 }}>
            Paste your AI-generated JSON curriculum. Organised by Term → Unit → Topic → Subtopic.
          </p>
        </div>

        {/* Success */}
        {saved && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(200,241,53,0.08)', border:'1.5px solid rgba(200,241,53,0.3)', borderRadius:14, padding:'14px 18px', marginBottom:20 }}>
            <CheckCircle size={18} color={A.electric} />
            <span style={{ fontSize:13, fontWeight:800, color:A.electric }}>Curriculum saved successfully!</span>
          </div>
        )}

        {/* Step 1 — Level */}
        <div style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 1</div>
          <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:4 }}>Select Class Level</div>
          <p style={{ fontSize:12, color:A.dim, fontWeight:700, marginBottom:16 }}>Which class is this curriculum for?</p>

          {[{g:'Junior Secondary',codes:CLASS_LEVELS.filter(l=>l.category==='junior')},{g:'Senior Secondary',codes:CLASS_LEVELS.filter(l=>l.category==='senior')}].map(grp=>(
            <div key={grp.g} style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>{grp.g}</div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${grp.codes.length},1fr)`, gap:6 }}>
                {grp.codes.map(l => (
                  <button key={l.code} className={`lvl-btn${selectedLevel===l.code?' sel':''}`} onClick={()=>setSelectedLevel(l.code)}>
                    {l.code}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Subject selector — only for SS levels */}
          {isSS && (
            <div style={{ marginTop:18, paddingTop:16, borderTop:`1px solid ${A.border}` }}>
              <div style={{ fontSize:9, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>Subject</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['maths','Mathematics'],['further_maths','Further Mathematics']].map(([val,label]) => (
                  <button key={val}
                    onClick={() => setSelectedSubject(val)}
                    style={{
                      padding:'10px 14px', borderRadius:10, cursor:'pointer', textAlign:'left',
                      border: selectedSubject===val ? '1.5px solid rgba(200,241,53,0.5)' : `1.5px solid ${A.border}`,
                      background: selectedSubject===val ? 'rgba(200,241,53,0.10)' : 'rgba(165,155,255,0.04)',
                      fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:800,
                      color: selectedSubject===val ? A.electric : A.dim,
                      transition:'all 0.15s',
                    }}>
                    {label}
                    {selectedSubject===val && <span style={{ marginLeft:6, fontSize:10 }}>✓</span>}
                  </button>
                ))}
              </div>
              {selectedSubject === 'further_maths' && (
                <div style={{ marginTop:10, fontSize:11, fontWeight:700, color:A.gold, background:'rgba(255,201,51,0.06)', border:'1px solid rgba(255,201,51,0.2)', borderRadius:8, padding:'8px 12px' }}>
                  ⚠ Further Maths lessons will use step-by-step FM format. Will be saved as code: {effectiveCode}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2 — Paste JSON */}
        <div style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 2</div>
          <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:4 }}>Paste Curriculum JSON</div>
          <p style={{ fontSize:12, color:A.dim, fontWeight:700, marginBottom:16 }}>Must include all 3 terms. Structure: Term → Units → Topics → Subtopics.</p>

          <details style={{ marginBottom:14 }}>
            <summary style={{ fontSize:12, fontWeight:800, color:A.electric, cursor:'pointer' }}>View expected JSON format ▾</summary>
            <pre style={{ background:A.bg, border:`1px solid ${A.border}`, borderRadius:10, padding:'14px', fontSize:11, color:A.dim, overflowX:'auto', marginTop:10 }}>{exampleJSON}</pre>
          </details>

          <textarea className="cur-input" rows={13} placeholder="Paste your curriculum JSON here…"
            value={jsonInput} onChange={e=>{setJsonInput(e.target.value);setParsed(null)}} />

          {parseError && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, fontSize:12, fontWeight:700, color:A.coral }}>
              <AlertCircle size={14} /> {parseError}
            </div>
          )}

          <div style={{ marginTop:12 }}>
            <button className="cur-btn-ghost" disabled={!jsonInput.trim()} onClick={parseJSON}>
              Parse &amp; Preview →
            </button>
          </div>
        </div>

        {/* Step 3 — Preview */}
        {parsed && (
          <div style={{ background:A.card, border:`1.5px solid ${A.border}`, borderRadius:18, padding:'22px 24px', marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:3 }}>Step 3</div>
            <div style={{ fontWeight:900, fontSize:15, color:A.chalk, marginBottom:4 }}>Preview &amp; Confirm</div>
            <p style={{ fontSize:12, color:A.dim, fontWeight:700, marginBottom:16 }}>
              Class: <span style={{ color:A.electric, fontWeight:900 }}>{effectiveName||'Not selected'}</span>
              {' · '}
              Subject: <span style={{ color:A.gold, fontWeight:900 }}>
                {selectedSubject === 'further_maths' ? 'Further Mathematics' : 'Mathematics'}
              </span>
            </p>

            {/* Counts */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
              {[
                { label:'Terms',     value:totalTerms,     color:'#67E8F9' },
                { label:'Units',     value:totalUnits,     color:A.gold    },
                { label:'Topics',    value:totalTopics,    color:A.electric},
                { label:'Subtopics', value:totalSubtopics, color:A.accent  },
              ].map(s => (
                <div key={s.label} style={{ background:A.bg, border:`1px solid ${A.border}`, borderRadius:12, padding:'14px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:28, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:A.dim2, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tree */}
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:380, overflowY:'auto', paddingRight:4 }}>
              {parsed.map((termData, tIdx) => (
                <div key={tIdx} style={{ background:A.bg, border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>
                  <button className="tree-toggle" style={{ borderRadius:12 }}
                    onClick={()=>setExpandedTerms({...expandedTerms,[tIdx]:!expandedTerms[tIdx]})}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px' }}>
                      {expandedTerms[tIdx] ? <ChevronDown size={14} color={A.cyan}/> : <ChevronRight size={14} color={A.cyan}/>}
                      <span style={{ fontSize:13, fontWeight:900, color:A.cyan }}>{termData.term_name||TERM_NAMES[termData.term]}</span>
                      <span style={{ marginLeft:'auto', fontSize:11, color:A.dim2, fontWeight:700 }}>{termData.units?.length||0} units</span>
                    </div>
                  </button>
                  {expandedTerms[tIdx] && (
                    <div style={{ padding:'0 14px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                      {(termData.units||[]).map((unit,uIdx) => (
                        <div key={uIdx} style={{ background:A.surface, border:`1px solid ${A.border}`, borderRadius:10, overflow:'hidden' }}>
                          <button className="tree-toggle"
                            onClick={()=>setExpandedUnits({...expandedUnits,[`${tIdx}-${uIdx}`]:!expandedUnits[`${tIdx}-${uIdx}`]})}>
                            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 12px' }}>
                              {expandedUnits[`${tIdx}-${uIdx}`] ? <ChevronDown size={12} color={A.dim}/> : <ChevronRight size={12} color={A.dim}/>}
                              <span style={{ fontSize:12, fontWeight:800, color:A.chalk, flex:1, textAlign:'left' }}>{unit.unit}</span>
                              <span style={{ fontSize:10, color:A.dim2, fontWeight:700 }}>{unit.topics?.length||0} topics</span>
                            </div>
                          </button>
                          {expandedUnits[`${tIdx}-${uIdx}`] && (
                            <div style={{ padding:'0 12px 10px', display:'flex', flexDirection:'column', gap:4 }}>
                              {(unit.topics||[]).map((topic,topIdx) => (
                                <div key={topIdx} style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:8, overflow:'hidden' }}>
                                  <button className="tree-toggle"
                                    onClick={()=>setExpandedTopics({...expandedTopics,[`${tIdx}-${uIdx}-${topIdx}`]:!expandedTopics[`${tIdx}-${uIdx}-${topIdx}`]})}>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px' }}>
                                      {expandedTopics[`${tIdx}-${uIdx}-${topIdx}`] ? <ChevronDown size={11} color={A.dim2}/> : <ChevronRight size={11} color={A.dim2}/>}
                                      <span style={{ fontSize:11.5, fontWeight:800, color:A.chalk, flex:1, textAlign:'left' }}>{topic.title}</span>
                                      <span style={{ fontSize:10, color:A.dim2, fontWeight:700 }}>{topic.subtopics?.length||0}</span>
                                    </div>
                                  </button>
                                  {expandedTopics[`${tIdx}-${uIdx}-${topIdx}`] && (
                                    <div style={{ padding:'0 10px 8px', display:'flex', flexDirection:'column', gap:3 }}>
                                      {(topic.subtopics||[]).map((sub,sIdx) => (
                                        <div key={sIdx} style={{ background:A.bg, border:`1px solid ${A.border}`, borderRadius:7, padding:'8px 10px' }}>
                                          <div style={{ fontSize:11, fontWeight:800, color:A.dim }}>{sub.title}</div>
                                          {sub.objectives?.length>0 && (
                                            <ul style={{ marginTop:4, paddingLeft:12, display:'flex', flexDirection:'column', gap:2 }}>
                                              {sub.objectives.map((obj,oIdx) => (
                                                <li key={oIdx} style={{ fontSize:10.5, color:A.dim2, fontWeight:700, listStyle:'none', display:'flex', gap:5 }}>
                                                  <span style={{ color:A.electric, flexShrink:0 }}>•</span>{obj}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop:20 }}>
              <button className="cur-btn-primary" disabled={saving||!selectedLevel} onClick={() => setShowConfirm(true)}>
                {saving ? 'Saving to database…' : `Save ${effectiveName} Curriculum →`}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation modal */}
        {showConfirm && (
          <>
            <div onClick={() => setShowConfirm(false)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50 }} />
            <div style={{
              position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              zIndex:51, background:A.card, border:`1.5px solid ${A.borderHi}`,
              borderRadius:20, padding:'28px 28px 24px', width:'min(480px,90vw)',
              fontFamily:'Nunito,sans-serif',
            }}>
              <div style={{ fontSize:22, marginBottom:12 }}>⚠️</div>
              <div style={{ fontSize:16, fontWeight:900, color:A.chalk, marginBottom:8 }}>Confirm Upload</div>
              <div style={{ fontSize:13, fontWeight:700, color:A.dim, lineHeight:1.7, marginBottom:20 }}>
                You are about to upload a curriculum as:<br/>
                <span style={{ color:A.electric, fontWeight:900 }}>{effectiveName}</span>
                {' — '}
                <span style={{ color:A.gold, fontWeight:900 }}>
                  {selectedSubject === 'further_maths' ? 'Further Mathematics' : 'Mathematics'}
                </span><br/>
                <span style={{ fontSize:11, color:A.dim2 }}>DB code: {effectiveCode} · {totalSubtopics} subtopics</span><br/><br/>
                This cannot be undone. Existing data for this level+subject will be updated.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowConfirm(false)}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:`1.5px solid ${A.border}`, background:'transparent', color:A.dim, fontFamily:'Nunito,sans-serif', fontSize:13, fontWeight:800, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={saveCurriculum}
                  style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background:A.electric, color:'#0C0820', fontFamily:"'Fredoka',sans-serif", fontSize:15, fontWeight:600, cursor:'pointer' }}>
                  Yes, Save Curriculum
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!selectedLevel && !parsed && (
          <div style={{ textAlign:'center', padding:'48px 24px' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>📚</div>
            <div style={{ fontSize:15, fontWeight:900, color:A.chalk, marginBottom:6 }}>Select a class level to begin</div>
            <div style={{ fontSize:13, color:A.dim, fontWeight:700 }}>Curriculum will be organised into First, Second and Third Term automatically</div>
          </div>
        )}
      </div>
    </>
  )
}