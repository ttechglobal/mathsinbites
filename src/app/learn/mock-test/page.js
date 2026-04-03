'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'

const supabase = createClient()

const DURATIONS = { WAEC: 150 * 60, BECE: 120 * 60 }

function MathText({ text }) {
  if (!text) return null
  const parts = []; let i = 0, buf = ''
  while (i < text.length) {
    const ch = text[i]
    if ((ch === '^' || ch === '_') && i + 1 < text.length) {
      if (buf) { parts.push({ t: 'text', v: buf }); buf = '' }
      const type = ch === '^' ? 'sup' : 'sub'; i++
      if (text[i] === '{') { const end = text.indexOf('}', i); parts.push({ t: type, v: end === -1 ? text.slice(i+1) : text.slice(i+1, end) }); i = end === -1 ? text.length : end + 1 }
      else { let val = ''; while (i < text.length && /[a-zA-Z0-9.]/.test(text[i])) { val += text[i]; i++ }; if (val) parts.push({ t: type, v: val }); else buf += ch }
    } else { buf += ch; i++ }
  }
  if (buf) parts.push({ t: 'text', v: buf })
  return <span>{parts.map((p, i) => p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super', lineHeight: 0 }}>{p.v}</sup> : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{p.v}</sub> : <span key={i}>{p.v}</span>)}</span>
}

function Timer({ remaining, total, accent }) {
  const pct = (remaining / total) * 100
  const color = pct > 33 ? accent : pct > 15 ? '#F59E0B' : '#EF4444'
  const mins = Math.floor(remaining / 60), secs = remaining % 60
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 44, height: 44, position: 'relative' }}>
        <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r="18" fill="none" stroke={color + '25'} strokeWidth="3.5" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${(pct / 100 * 113.1).toFixed(1)} 113.1`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
          {mins}:{secs.toString().padStart(2,'0')}
        </div>
      </div>
    </div>
  )
}

export default function MockTestPage() {
  const { M }       = useMode()
  const router      = useRouter()
  const accent      = M.accentColor

  const [phase, setPhase]           = useState('setup')   // setup | test | review
  const [examBody, setExamBody]     = useState('WAEC')
  const [year, setYear]             = useState('')
  const [years, setYears]           = useState([])
  const [questions, setQuestions]   = useState([])
  const [answers, setAnswers]       = useState({})        // { qId: selectedOption }
  const [qIdx, setQIdx]             = useState(0)
  const [remaining, setRemaining]   = useState(0)
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [showNav, setShowNav]       = useState(false)
  const [result, setResult]         = useState(null)
  const timerRef = useRef(null)

  // Load available years
  useEffect(() => {
    supabase.from('past_questions').select('year, exam_body').order('year', { ascending: false }).then(({ data }) => {
      const uniq = [...new Set((data || []).filter(r => r.exam_body === examBody).map(r => r.year))]
      setYears(uniq)
      if (uniq.length > 0 && !year) setYear(String(uniq[0]))
    })
  }, [examBody])

  async function startTest() {
    if (!year) return
    setLoading(true)
    const { data } = await supabase.from('past_questions').select('*').eq('exam_body', examBody).eq('year', parseInt(year)).order('question_number')
    setLoading(false)
    if (!data || data.length === 0) return
    setQuestions(data)
    setAnswers({})
    setQIdx(0)
    const dur = DURATIONS[examBody] || 9000
    setRemaining(dur)
    setTotal(dur)
    setPhase('test')
  }

  // Countdown timer
  useEffect(() => {
    if (phase !== 'test') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(timerRef.current); submit(true); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  function pickAnswer(qId, opt) {
    setAnswers(a => ({ ...a, [qId]: opt }))
  }

  function submit(timeout = false) {
    clearInterval(timerRef.current)
    // Score
    let correct = 0
    const topicWrong = {}
    for (const q of questions) {
      if (q.question_type !== 'mcq') continue
      const picked = answers[q.id]
      if (picked === q.correct_answer) { correct++ }
      else {
        topicWrong[q.topic_slug] = (topicWrong[q.topic_slug] || 0) + 1
      }
    }
    const mcqTotal = questions.filter(q => q.question_type === 'mcq').length
    setResult({ correct, total: mcqTotal, pct: mcqTotal > 0 ? Math.round(correct / mcqTotal * 100) : 0, topicWrong, timedOut: timeout })
    setPhase('review')

    // Save to Supabase (fire and forget)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('mock_test_results').insert({
        user_id: user.id, exam_body: examBody, year: parseInt(year),
        score: correct, total: mcqTotal,
        percentage: mcqTotal > 0 ? Math.round(correct / mcqTotal * 100) : 0,
        topic_breakdown: topicWrong,
      })
    })
  }

  const q = questions[qIdx]

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8 }}>Mock Test</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont, lineHeight: 1.2 }}>Choose your exam</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Exam Body</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['WAEC','BECE'].map(e => (
                <button key={e} onClick={() => { setExamBody(e); setYear('') }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${examBody === e ? accent : 'rgba(0,0,0,0.1)'}`, background: examBody === e ? `${accent}10` : 'transparent', color: examBody === e ? accent : '#888', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Year</div>
            <select value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', padding: '12px 16px', background: '#f8f8f8', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 15, color: '#1a1a1a', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
              <option value="">— Select year —</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ padding: '12px 14px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 12, fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            <strong style={{ color: accent }}>{examBody}:</strong> {Math.floor(DURATIONS[examBody]/60)} minutes · All {examBody} questions for the selected year
          </div>

          <button onClick={startTest} disabled={!year || loading} style={{ width: '100%', padding: '16px', background: year && !loading ? `linear-gradient(135deg,${accent},${accent}CC)` : '#ccc', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 16, cursor: year && !loading ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', boxShadow: year && !loading ? `0 6px 22px ${accent}45` : 'none' }}>
            {loading ? 'Loading…' : `Start ${examBody} ${year} Mock Test`}
          </button>
        </div>

        <button onClick={() => router.back()} style={{ width: '100%', padding: '13px', background: 'transparent', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14, color: '#888', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  )

  // ── REVIEW / RESULTS SCREEN ───────────────────────────────────────────────────
  if (phase === 'review' && result) return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      {/* Score hero */}
      <div style={{ background: `linear-gradient(160deg,${accent},${accent}CC)`, padding: '36px 24px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        {result.timedOut && <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Time ran out</div>}
        <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', fontFamily: M.headingFont, lineHeight: 1, marginBottom: 4 }}>{result.pct}%</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{result.correct} / {result.total} correct</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{examBody} {year}</div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 60px' }}>

        {/* Topic breakdown */}
        {Object.keys(result.topicWrong).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Weak areas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(result.topicWrong).sort((a,b) => b[1]-a[1]).map(([slug, count]) => (
                <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{slug}</div>
                  </div>
                  <div style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 99, fontSize: 11, fontWeight: 900, color: '#EF4444' }}>{count} wrong</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solution review */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Full review</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, i) => {
              const picked   = answers[q.id]
              const correct  = q.question_type === 'mcq' ? picked === q.correct_answer : null
              const steps    = Array.isArray(q.solution_steps) ? q.solution_steps : [q.solution_steps]
              return (
                <div key={q.id} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${correct === false ? '#EF444430' : correct === true ? '#22c55e30' : 'rgba(0,0,0,0.07)'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '10px 16px', background: correct === false ? 'rgba(239,68,68,0.06)' : correct === true ? 'rgba(34,197,94,0.06)' : `${accent}06`, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#888' }}>Q{q.question_number}</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: q.question_type === 'mcq' ? accent : '#FF6B6B', background: q.question_type === 'mcq' ? `${accent}14` : 'rgba(255,107,107,0.12)', borderRadius: 99, padding: '2px 8px' }}>{q.question_type.toUpperCase()}</span>
                    {correct === true  && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: '#22c55e' }}>Correct</span>}
                    {correct === false && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: '#EF4444' }}>Wrong</span>}
                    {correct === null  && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>Theory</span>}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    {q.diagram_svg && <div dangerouslySetInnerHTML={{ __html: q.diagram_svg }} style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', background: '#f8f8f8' }} />}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.65, marginBottom: 12 }}><MathText text={q.question_text} /></div>
                    {q.question_type === 'mcq' && picked && picked !== q.correct_answer && (
                      <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, fontSize: 12, color: '#EF4444', marginBottom: 8, fontWeight: 700 }}>Your answer: <MathText text={picked} /></div>
                    )}
                    {q.correct_answer && (
                      <div style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 10, fontSize: 12, color: '#22c55e', marginBottom: 12, fontWeight: 700 }}>Correct: <MathText text={q.correct_answer} /></div>
                    )}
                    <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Solution</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {steps.map((step, si) => (
                        <div key={si} style={{ display: 'flex', gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: accent, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>{si+1}</div>
                          <div style={{ flex: 1, background: '#FEFDE8', border: '1px solid #F0EAC0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#333', lineHeight: 1.65 }}><MathText text={step} /></div>
                        </div>
                      ))}
                    </div>
                    {q.final_answer && (
                      <div style={{ marginTop: 10, padding: '10px 14px', background: `${accent}10`, borderRadius: 10, fontSize: 14, fontWeight: 900, color: accent, fontFamily: "'Courier New', monospace" }}>
                        Answer: <MathText text={q.final_answer} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button onClick={() => setPhase('setup')} style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 16, color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 22px ${accent}45` }}>
          Try Another Exam
        </button>
      </div>
    </div>
  )

  // ── TEST SCREEN ───────────────────────────────────────────────────────────────
  if (!q) return null
  const steps = Array.isArray(q.solution_steps) ? q.solution_steps : [q.solution_steps]

  return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${M.progressTrack}`, background: M.lessonBg, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif' }}>{examBody} {year} Mock Test</div>
          <div style={{ fontSize: 12, color: M.textSecondary }}>Q{qIdx+1} of {questions.length} · {answers[q.id] ? 'Answered' : 'Unanswered'}</div>
        </div>
        <Timer remaining={remaining} total={total} accent={accent} />
        <button onClick={() => setShowNav(n => !n)} style={{ padding: '8px 14px', background: `${accent}14`, border: `1px solid ${accent}25`, borderRadius: 10, color: accent, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
          {showNav ? 'Close' : 'Questions'}
        </button>
        <button onClick={() => { if (confirm('Submit test?')) submit() }} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#EF4444', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
          Submit
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: M.progressTrack, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${((qIdx+1)/questions.length)*100}%`, background: accent, transition: 'width 0.3s ease' }} />
      </div>

      {/* Question navigator overlay */}
      {showNav && (
        <div onClick={() => setShowNav(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: M.lessonBg, borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 520 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>
              Questions — {Object.keys(answers).length}/{questions.length} answered
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
              {questions.map((qq, i) => {
                const ans = !!answers[qq.id]
                const cur = i === qIdx
                return (
                  <button key={qq.id} onClick={() => { setQIdx(i); setShowNav(false) }} style={{ aspectRatio: '1', borderRadius: 10, border: `2px solid ${cur ? accent : ans ? '#22c55e' : 'rgba(0,0,0,0.12)'}`, background: cur ? accent : ans ? '#22c55e14' : 'transparent', color: cur ? '#fff' : ans ? '#22c55e' : M.textSecondary, fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                    {i+1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Question content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px max(80px,calc(60px + env(safe-area-inset-bottom)))', maxWidth: 560, margin: '0 auto', width: '100%' }}>

        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ padding: '10px 18px', background: `${accent}08`, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: accent }}>Q{q.question_number}</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>{q.question_type}</span>
            {q.marks && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#aaa', fontWeight: 700 }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
          </div>
          <div style={{ padding: '20px 20px 24px' }}>
            {q.diagram_svg && <div dangerouslySetInnerHTML={{ __html: q.diagram_svg }} style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }} />}
            {q.diagram_description && !q.diagram_svg && (
              <div style={{ padding: '10px 14px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 10, marginBottom: 14, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                <strong style={{ color: accent }}>Diagram: </strong>{q.diagram_description}
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.7, marginBottom: q.question_type === 'mcq' ? 20 : 0 }}>
              <MathText text={q.question_text} />
            </div>
            {q.question_type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(q.options || []).map((opt, i) => {
                  const sel = answers[q.id] === opt
                  return (
                    <button key={i} onClick={() => pickAnswer(q.id, opt)} style={{ padding: '13px 16px', borderRadius: 14, border: `2px solid ${sel ? accent : 'rgba(0,0,0,0.1)'}`, background: sel ? `${accent}12` : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 700, color: sel ? accent : '#1a1a1a', fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: sel ? `${accent}20` : 'rgba(0,0,0,0.05)', border: `1.5px solid ${sel ? accent : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: sel ? accent : '#888', flexShrink: 0 }}>
                        {String.fromCharCode(65+i)}
                      </div>
                      <MathText text={opt} />
                    </button>
                  )
                })}
              </div>
            )}
            {q.question_type === 'theory' && (
              <div style={{ marginTop: 12, padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: 13, color: '#888', lineHeight: 1.6, fontStyle: 'italic' }}>
                Theory question — write your working on paper. Solutions are revealed after you submit.
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: 10 }}>
          {qIdx > 0 && (
            <button onClick={() => setQIdx(i => i-1)} style={{ flex: '0 0 52px', padding: '14px', background: 'transparent', border: `1.5px solid ${M.progressTrack}`, borderRadius: 14, cursor: 'pointer', fontSize: 18, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>←</button>
          )}
          <button onClick={() => qIdx < questions.length-1 ? setQIdx(i => i+1) : (confirm('Submit test?') && submit())} style={{ flex: 1, padding: '14px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 16px ${accent}40` }}>
            {qIdx < questions.length-1 ? 'Next →' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  )
}