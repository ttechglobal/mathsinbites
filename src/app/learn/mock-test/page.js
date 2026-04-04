'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'

const supabase = createClient()

// ── Math renderer (sup/sub, fractions via /) ─────────────────────────────────
function parseMath(text) {
  const parts = []; let i = 0, buf = ''
  while (i < text.length) {
    const ch = text[i]
    if ((ch === '^' || ch === '_') && i + 1 < text.length) {
      if (buf) { parts.push({ t: 'text', v: buf }); buf = '' }
      const type = ch === '^' ? 'sup' : 'sub'; i++
      if (text[i] === '{') {
        const end = text.indexOf('}', i)
        parts.push({ t: type, v: end === -1 ? text.slice(i+1) : text.slice(i+1, end) })
        i = end === -1 ? text.length : end + 1
      } else {
        let val = ''
        while (i < text.length && /[a-zA-Z0-9.]/.test(text[i])) { val += text[i]; i++ }
        if (val) parts.push({ t: type, v: val }); else buf += ch
      }
    } else { buf += ch; i++ }
  }
  if (buf) parts.push({ t: 'text', v: buf })
  return parts
}
function MathText({ text, size = 16 }) {
  if (!text) return null
  return (
    <span style={{ fontSize: size }}>
      {parseMath(String(text)).map((p, i) =>
        p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super', lineHeight: 0, fontWeight: 800 }}>{p.v}</sup>
        : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{p.v}</sub>
        : <span key={i}>{p.v}</span>
      )}
    </span>
  )
}

// ── Circular timer ────────────────────────────────────────────────────────────
function Timer({ remaining, total, accent }) {
  const pct   = (remaining / total) * 100
  const color = pct > 33 ? accent : pct > 15 ? '#F59E0B' : '#EF4444'
  const mins  = Math.floor(remaining / 60)
  const secs  = remaining % 60
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 44, height: 44, position: 'relative' }}>
        <svg viewBox="0 0 44 44" style={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r="18" fill="none" stroke={color + '25'} strokeWidth="3.5" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${(pct / 100 * 113.1).toFixed(1)} 113.1`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color, fontFamily: 'Nunito, sans-serif' }}>
          {mins}:{secs.toString().padStart(2,'0')}
        </div>
      </div>
    </div>
  )
}

// ── Step-by-step solution (Lesson Player style) ───────────────────────────────
function SolutionSteps({ steps, finalAnswer, accent }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= steps.length) return
    const t = setTimeout(() => setShown(n => n + 1), 360)
    return () => clearTimeout(t)
  }, [shown, steps.length])

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.4, fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>Solution</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.slice(0, shown).map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'stepIn 0.3s ease both' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0, marginTop: 4 }}>{i + 1}</div>
            <div style={{ flex: 1, background: '#FEFDE8', border: '1px solid #F0EAC0', borderRadius: 12, padding: '11px 15px', lineHeight: 1.7, fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: '#2D2D2D' }}>
              <MathText text={step} size={15} />
            </div>
          </div>
        ))}
      </div>
      {shown >= steps.length && finalAnswer && (
        <div style={{ marginTop: 14, padding: '13px 18px', background: `${accent}12`, border: `2px solid ${accent}35`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, animation: 'stepIn 0.4s ease both' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Answer</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: accent, fontFamily: "'Courier New', monospace" }}>
            <MathText text={finalAnswer} size={20} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, body, confirmLabel, confirmColor = '#EF4444', onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', fontFamily: 'Sora, sans-serif', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#555', fontFamily: 'Nunito, sans-serif', lineHeight: 1.6, marginBottom: 22 }}>{body}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: 'transparent', color: '#555', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: confirmColor, color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question card (shared by test and review) ─────────────────────────────────
function QuestionCard({ q, qIdx, total, answers, onPick, reviewMode, accent, M }) {
  const picked   = answers[q.id]
  const isRight  = (opt) => opt === q.correct_answer
  const isWrong  = (opt) => reviewMode && picked === opt && opt !== q.correct_answer

  const steps = Array.isArray(q.solution_steps) ? q.solution_steps : (q.solution_steps ? [q.solution_steps] : [])

  return (
    <div style={{ background: M.lessonCard || '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: M.cardShadow || '0 4px 24px rgba(0,0,0,0.08)', border: M.lessonBorder || '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }}>
      {/* Meta strip */}
      <div style={{ padding: '10px 18px', background: `${accent}09`, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: accent }}>Q{q.question_number || qIdx + 1}</span>
        <span style={{ fontSize: 10, color: '#aaa' }}>·</span>
        <span style={{ fontSize: 10, fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>{q.question_type}</span>
        {q.exam_body && <><span style={{ fontSize: 10, color: '#aaa' }}>·</span><span style={{ fontSize: 10, fontWeight: 800, color: '#888' }}>{q.exam_body} {q.year}</span></>}
        {q.marks && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#aaa', fontWeight: 700 }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
        {reviewMode && picked && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: picked === q.correct_answer ? '#22c55e' : '#EF4444' }}>
            {picked === q.correct_answer ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
      </div>

      <div style={{ padding: '20px 20px 24px' }}>
        {/* Diagram */}
        {q.diagram_svg && <div dangerouslySetInnerHTML={{ __html: q.diagram_svg }} style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden', background: '#f8f8f8' }} />}
        {q.diagram_description && !q.diagram_svg && (
          <div style={{ padding: '10px 14px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 10, marginBottom: 14, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
            <strong style={{ color: accent }}>Diagram: </strong>{q.diagram_description}
          </div>
        )}

        {/* Question text — big */}
        <div style={{ fontSize: 17, fontWeight: 700, color: M.textPrimary || '#1a1a1a', lineHeight: 1.75, marginBottom: 20, fontFamily: 'Nunito, sans-serif' }}>
          <MathText text={q.question_text} size={17} />
        </div>

        {/* MCQ options */}
        {q.question_type === 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(q.options || []).map((opt, i) => {
              let bg = 'transparent', border = 'rgba(0,0,0,0.1)', color = M.textPrimary || '#1a1a1a'
              if (reviewMode) {
                if (isRight(opt))  { bg = 'rgba(34,197,94,0.1)';  border = '#22c55e'; color = '#15803d' }
                if (isWrong(opt))  { bg = 'rgba(239,68,68,0.08)'; border = '#EF4444'; color = '#dc2626' }
              } else if (picked === opt) {
                bg = `${accent}12`; border = accent; color = accent
              }
              return (
                <button key={i} onClick={() => !reviewMode && onPick && onPick(q.id, opt)}
                  disabled={reviewMode || !!picked}
                  style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${border}`, background: bg, cursor: (reviewMode || picked) ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${border}18`, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: border, flexShrink: 0 }}>
                    {reviewMode ? (isRight(opt) ? '✓' : isWrong(opt) ? '✗' : String.fromCharCode(65+i)) : String.fromCharCode(65+i)}
                  </div>
                  <MathText text={opt} size={15} />
                </button>
              )
            })}
          </div>
        )}

        {/* Theory placeholder */}
        {q.question_type === 'theory' && !reviewMode && (
          <div style={{ marginTop: 12, padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: 14, color: '#888', lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Nunito, sans-serif' }}>
            Theory question — write your working on paper. Solution shown after you submit.
          </div>
        )}

        {/* Review: show solution */}
        {reviewMode && steps.length > 0 && (
          <SolutionSteps steps={steps} finalAnswer={q.final_answer} accent={accent} />
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function MockTestPage() {
  const { M }       = useMode()
  const router      = useRouter()
  const searchParams = useSearchParams()
  const accent      = M.accentColor

  // mode: 'year' = Past Questions CBT by year | 'random' = Mock Exam 50 random
  const initialMode = searchParams.get('mode') || 'year'

  const [mode,      setMode]      = useState(initialMode) // 'year' | 'random'
  const [phase,     setPhase]     = useState('setup')     // setup | test | result | review
  const [examBody,  setExamBody]  = useState('WAEC')
  const [year,      setYear]      = useState('')
  const [years,     setYears]     = useState([])
  const [questions, setQuestions] = useState([])
  const [answers,   setAnswers]   = useState({})
  const [qIdx,      setQIdx]      = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [showNav,   setShowNav]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [result,    setResult]    = useState(null)
  const timerRef = useRef(null)

  // Load available years for year-based mode
  useEffect(() => {
    if (mode !== 'year') return
    supabase.from('past_questions').select('year, exam_body')
      .eq('exam_body', examBody).order('year', { ascending: false })
      .then(({ data }) => {
        const uniq = [...new Set((data || []).map(r => r.year))]
        setYears(uniq)
        if (uniq.length > 0) setYear(String(uniq[0]))
      })
  }, [examBody, mode])

  async function startTest() {
    setLoading(true)
    let data = []

    if (mode === 'year') {
      // Load all questions for this exam + year
      const res = await supabase.from('past_questions').select('*')
        .eq('exam_body', examBody).eq('year', parseInt(year))
        .order('question_number')
      data = res.data || []
    } else {
      // Random 50 from entire past_questions bank
      const res = await supabase.from('past_questions').select('*')
        .eq('question_type', 'mcq')   // mock exam = MCQ only for scoring
        .limit(500)
      const all = (res.data || []).sort(() => Math.random() - 0.5)
      data = all.slice(0, 50)
    }

    setLoading(false)
    if (!data.length) return

    setQuestions(data)
    setAnswers({})
    setQIdx(0)
    const dur = mode === 'random' ? 60 * 60 : (examBody === 'BECE' ? 120 * 60 : 150 * 60)
    setRemaining(dur)
    setTotalTime(dur)
    setPhase('test')
  }

  // Timer
  useEffect(() => {
    if (phase !== 'test') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(timerRef.current); doSubmit(true); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  function doSubmit(timedOut = false) {
    clearInterval(timerRef.current)
    let correct = 0
    const breakdown = {}
    for (const q of questions) {
      if (q.question_type !== 'mcq') continue
      const picked = answers[q.id]
      if (picked === q.correct_answer) { correct++ }
      else {
        const key = q.topic_slug || 'Other'
        breakdown[key] = (breakdown[key] || 0) + 1
      }
    }
    const mcqTotal = questions.filter(q => q.question_type === 'mcq').length
    const pct = mcqTotal > 0 ? Math.round(correct / mcqTotal * 100) : 0
    setResult({ correct, total: mcqTotal, pct, breakdown, timedOut })
    setPhase('result')

    // Save result (fire and forget)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('mock_test_results').insert({
        user_id: user.id, exam_body: examBody,
        year: mode === 'year' ? parseInt(year) : null,
        score: correct, total: mcqTotal, percentage: pct,
        topic_breakdown: breakdown,
        mode,
      }).catch(() => {})
    })
  }

  const answeredCount  = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  // ── SETUP SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={() => router.back()} style={{ marginBottom: 20, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(0,0,0,0.05)', borderRadius: 14, padding: 4 }}>
          {[{v:'year',l:'📋 Past Questions'},{v:'random',l:'🏆 Mock Exam'}].map(m => (
            <button key={m.v} onClick={() => setMode(m.v)}
              style={{ flex: 1, padding: '11px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'Nunito, sans-serif', background: mode === m.v ? '#fff' : 'transparent', color: mode === m.v ? accent : M.textSecondary, boxShadow: mode === m.v ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {m.l}
            </button>
          ))}
        </div>

        <div style={{ background: M.lessonCard || '#fff', borderRadius: 20, padding: '24px', boxShadow: M.cardShadow || '0 4px 24px rgba(0,0,0,0.08)', border: M.lessonBorder }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{mode === 'year' ? '📋' : '🏆'}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: M.textPrimary, fontFamily: 'Sora, sans-serif', marginBottom: 4 }}>
              {mode === 'year' ? 'Past Questions' : 'Mock Exam'}
            </div>
            <div style={{ fontSize: 12, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.6 }}>
              {mode === 'year'
                ? 'Solve a full year of past questions in CBT format with a timer'
                : '50 randomly selected questions from all available past questions · 60 minutes'}
            </div>
          </div>

          {mode === 'year' && (
            <>
              {/* Exam body */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Exam Body</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['WAEC','JAMB','NECO','BECE','GCE'].map(e => (
                    <button key={e} onClick={() => { setExamBody(e); setYear('') }}
                      style={{ flex: 1, padding: '11px 6px', borderRadius: 12, border: `2px solid ${examBody === e ? accent : 'rgba(0,0,0,0.1)'}`, background: examBody === e ? `${accent}10` : 'transparent', color: examBody === e ? accent : M.textSecondary, fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Year</div>
                <select value={year} onChange={e => setYear(e.target.value)}
                  style={{ width: '100%', padding: '13px 16px', background: 'rgba(0,0,0,0.03)', border: `1.5px solid ${accent}25`, borderRadius: 12, fontSize: 15, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', outline: 'none', fontWeight: 700 }}>
                  <option value="">— Select year —</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div style={{ padding: '12px 14px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 12, fontSize: 12, color: M.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
                <strong style={{ color: accent }}>{examBody}:</strong> {examBody === 'BECE' ? '120' : '150'} minutes · All questions for the selected year
              </div>
            </>
          )}

          {mode === 'random' && (
            <div style={{ padding: '14px 16px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 12, fontSize: 13, color: M.textSecondary, lineHeight: 1.7, marginBottom: 20, fontFamily: 'Nunito, sans-serif' }}>
              🎲 <strong style={{ color: M.textPrimary }}>Every mock is different.</strong> Questions are randomly pulled from the entire past questions bank. The pool grows as more years are uploaded.
            </div>
          )}

          <button onClick={startTest} disabled={loading || (mode === 'year' && !year)}
            style={{ width: '100%', padding: '16px', background: (loading || (mode === 'year' && !year)) ? '#ccc' : `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 16, cursor: (loading || (mode === 'year' && !year)) ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: loading ? 'none' : `0 6px 22px ${accent}45` }}>
            {loading ? 'Loading questions…' : mode === 'year' ? `Start ${examBody} ${year} CBT` : 'Start Mock Exam'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'result' && result) return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Score hero */}
      <div style={{ background: `linear-gradient(160deg,${accent},${accent}CC)`, padding: '40px 24px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        {result.timedOut && <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>⏰ Time ran out</div>}
        <div style={{ fontSize: 58, fontWeight: 900, color: '#fff', fontFamily: 'Sora, sans-serif', lineHeight: 1, marginBottom: 6 }}>{result.pct}%</div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{result.correct} / {result.total} correct</div>
        {mode === 'year' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{examBody} {year}</div>}
        {mode === 'random' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>Mock Exam · Random 50</div>}
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Correct / Wrong chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: '14px', background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.25)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e', fontFamily: 'Sora, sans-serif' }}>{result.correct}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Correct</div>
          </div>
          <div style={{ flex: 1, padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#EF4444', fontFamily: 'Sora, sans-serif' }}>{result.total - result.correct}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>Wrong</div>
          </div>
        </div>

        {/* Weak areas */}
        {Object.keys(result.breakdown).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Weak Areas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(result.breakdown).sort((a,b) => b[1]-a[1]).slice(0,5).map(([slug, count]) => (
                <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: M.lessonCard || '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: M.textPrimary }}>{slug.replace(/-/g, ' ')}</div>
                  <div style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 99, fontSize: 11, fontWeight: 900, color: '#EF4444' }}>{count} wrong</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { setQIdx(0); setPhase('review') }}
            style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 16, color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 22px ${accent}45` }}>
            Review Answers & Solutions →
          </button>
          <button onClick={() => setPhase('setup')}
            style={{ width: '100%', padding: '15px', background: 'transparent', border: `1.5px solid ${accent}30`, borderRadius: 16, color: accent, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            Try Another {mode === 'year' ? 'Year' : 'Mock'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── REVIEW SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'review') {
    const q = questions[qIdx]
    if (!q) return null
    return (
      <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

        {/* Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${M.progressTrack || 'rgba(0,0,0,0.07)'}`, background: M.hudBg || M.lessonBg, flexShrink: 0 }}>
          <button onClick={() => setPhase('result')} style={{ width: 34, height: 34, borderRadius: '50%', background: M.lessonCard || '#fff', border: '1.5px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: 15, color: M.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>Review</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: M.textPrimary }}>Question {qIdx + 1} of {questions.length}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: M.textSecondary }}>{result?.correct}/{result?.total}</div>
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: M.progressTrack || 'rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${((qIdx + 1) / questions.length) * 100}%`, background: accent, transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px max(80px,calc(60px + env(safe-area-inset-bottom)))', maxWidth: 560, margin: '0 auto', width: '100%' }}>
          <QuestionCard q={q} qIdx={qIdx} total={questions.length} answers={answers} reviewMode accent={accent} M={M} />
          <div style={{ display: 'flex', gap: 10 }}>
            {qIdx > 0 && (
              <button onClick={() => setQIdx(i => i - 1)} style={{ flex: '0 0 52px', padding: '14px', background: 'transparent', border: `1.5px solid ${M.progressTrack || 'rgba(0,0,0,0.1)'}`, borderRadius: 14, cursor: 'pointer', fontSize: 18, color: M.textSecondary }}>←</button>
            )}
            {qIdx < questions.length - 1 ? (
              <button onClick={() => setQIdx(i => i + 1)} style={{ flex: 1, padding: '14px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 16px ${accent}40` }}>
                Next →
              </button>
            ) : (
              <button onClick={() => setPhase('result')} style={{ flex: 1, padding: '14px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                Back to Results
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── TEST SCREEN ────────────────────────────────────────────────────────────
  if (phase !== 'test' || !questions.length) return null
  const q = questions[qIdx]

  return (
    <div style={{ minHeight: '100dvh', background: M.lessonBg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes stepIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Submit confirm modal */}
      {showModal && (
        <Modal
          title="Submit Test?"
          body={`You have answered ${answeredCount} of ${questions.length} questions. ${unansweredCount > 0 ? `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} left unanswered.` : 'All questions answered!'} Are you sure you want to submit?`}
          confirmLabel="Yes, Submit"
          confirmColor={accent}
          onConfirm={() => { setShowModal(false); doSubmit() }}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Question nav overlay */}
      {showNav && (
        <div onClick={() => setShowNav(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: M.lessonBg, borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 520, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' }}>
              {answeredCount}/{questions.length} answered
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: M.textSecondary }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#22c55e' }} /> Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: M.textSecondary }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(0,0,0,0.1)' }} /> Not answered
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
              {questions.map((qq, i) => {
                const ans = !!answers[qq.id]
                const cur = i === qIdx
                return (
                  <button key={qq.id} onClick={() => { setQIdx(i); setShowNav(false) }}
                    style={{ aspectRatio: '1', borderRadius: 10, border: `2px solid ${cur ? accent : ans ? '#22c55e' : 'rgba(0,0,0,0.12)'}`, background: cur ? accent : ans ? '#22c55e14' : 'transparent', color: cur ? '#fff' : ans ? '#22c55e' : M.textSecondary, fontWeight: 900, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${M.progressTrack || 'rgba(0,0,0,0.07)'}`, background: M.hudBg || M.lessonBg, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent }}>
            {mode === 'year' ? `${examBody} ${year}` : 'Mock Exam'} · Q{qIdx+1}/{questions.length}
          </div>
          <div style={{ fontSize: 11, color: M.textSecondary, fontWeight: 600 }}>
            {answeredCount} answered · {unansweredCount} left
          </div>
        </div>
        <Timer remaining={remaining} total={totalTime} accent={accent} />
        <button onClick={() => setShowNav(n => !n)}
          style={{ padding: '8px 13px', background: `${accent}14`, border: `1px solid ${accent}25`, borderRadius: 10, color: accent, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
          Questions
        </button>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '8px 13px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#EF4444', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
          Submit
        </button>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: M.progressTrack || 'rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${((qIdx+1)/questions.length)*100}%`, background: accent, transition: 'width 0.3s ease' }} />
      </div>

      {/* Question */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px max(80px,calc(60px + env(safe-area-inset-bottom)))', maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <QuestionCard
          q={q} qIdx={qIdx} total={questions.length}
          answers={answers}
          onPick={(id, opt) => setAnswers(a => ({ ...a, [id]: opt }))}
          reviewMode={false}
          accent={accent} M={M}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          {qIdx > 0 && (
            <button onClick={() => setQIdx(i => i - 1)} style={{ flex: '0 0 52px', padding: '14px', background: 'transparent', border: `1.5px solid ${M.progressTrack || 'rgba(0,0,0,0.1)'}`, borderRadius: 14, cursor: 'pointer', fontSize: 18, color: M.textSecondary }}>←</button>
          )}
          <button onClick={() => qIdx < questions.length - 1 ? setQIdx(i => i + 1) : setShowModal(true)}
            style={{ flex: 1, padding: '14px', background: `linear-gradient(135deg,${accent},${accent}CC)`, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 16px ${accent}40` }}>
            {qIdx < questions.length - 1 ? 'Next →' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  )
}