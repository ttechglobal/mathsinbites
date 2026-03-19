'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'

// Module-level client — avoids recreating on every render (prevents fast-refresh loops)
const supabase = createClient()

// ─── Math renderer ────────────────────────────────────────────────────────────
function parseMath(text) {
  const parts = []; let i = 0, buf = ''
  while (i < text.length) {
    const ch = text[i]
    if ((ch === '^' || ch === '_') && i + 1 < text.length) {
      if (buf) { parts.push({ t: 'text', v: buf }); buf = '' }
      const type = ch === '^' ? 'sup' : 'sub'; i++
      if (text[i] === '{') {
        const end = text.indexOf('}', i)
        parts.push({ t: type, v: end === -1 ? text.slice(i + 1) : text.slice(i + 1, end) })
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
function MathText({ text, style }) {
  if (!text) return null
  return (
    <span style={style}>
      {parseMath(String(text)).map((p, i) =>
        p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super', lineHeight: 0 }}>{p.v}</sup>
        : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{p.v}</sub>
        : <span key={i}>{p.v}</span>
      )}
    </span>
  )
}

// ─── Board-style explanation renderer ────────────────────────────────────────
// ANSWER  → "Answer:" or "Solution:" → 20px accent bold Courier
// EXPLAIN → capital + 2+ words + no = → 13px italic muted Nunito
// MATH    → everything else → 18px bold Courier

function lineType(line) {
  const t = line.trim()
  if (!t) return 'empty'
  if (/^(Answer|Solution)\s*:/i.test(t)) return 'answer'
  const isWordStart = /^[A-Z][a-z]/.test(t)
  const hasWords    = (t.match(/[a-z]{2,}/g) || []).length >= 2
  const hasEquals   = t.includes('=')
  const startsDigit = /^\d/.test(t)
  const isFraction  = /^\d+\/\d+/.test(t)
  const hasOperator = /[+\-\u00d7\u00f7*/^]/.test(t) && !isWordStart
  if (isWordStart && hasWords && !hasEquals && !startsDigit && !isFraction && !hasOperator) return 'explanation'
  return 'math'
}
function BoardExplanation({ text, accent, M }) {
  if (!text?.trim()) return null
  const ac    = accent || '#4F46E5'
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return null
  return (
    <div style={{ background: M.mathBg || '#F8F9FF', borderRadius: 14, padding: '16px 18px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 8, opacity: 0.65 }}>Working</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {lines.map((line, i) => {
          const type = lineType(line)
          if (type === 'answer') return (
            <div key={i} style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 20, fontWeight: 900, color: ac, lineHeight: 2.2, letterSpacing: 0.3, marginTop: 6 }}>
              <MathText text={line} />
            </div>
          )
          if (type === 'explanation') return (
            <div key={i} style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 600, fontStyle: 'italic', color: M.textSecondary, lineHeight: 1.6, marginTop: 3, marginBottom: 1, paddingLeft: 2 }}>
              {line}
            </div>
          )
          return (
            <div key={i} style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 18, fontWeight: 700, color: M.textPrimary, lineHeight: 2.0, letterSpacing: 0.2 }}>
              <MathText text={line} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Timer bar ────────────────────────────────────────────────────────────────
const TIMED_SECONDS = 60
function TimerBar({ seconds, total, accent }) {
  const pct   = Math.max(0, (seconds / total) * 100)
  const color = pct > 50 ? accent : pct > 25 ? '#FFC933' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: `${color}25`, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s linear, background 0.3s ease' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'Nunito, sans-serif', minWidth: 28, textAlign: 'right' }}>{seconds}s</div>
    </div>
  )
}

// ─── Question card ────────────────────────────────────────────────────────────
function QuestionCard({ question, accent, M, onAnswered, timed }) {
  const [picked,   setPicked]   = useState(null)
  const [showExp,  setShowExp]  = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS)
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef(null)

  const opts       = question.options || []
  const answered   = picked !== null || timedOut
  const isCorrect  = !timedOut && opts[picked]?.is_correct
  const correctOpt = opts.find(o => o.is_correct)
  const hasExp     = !!(question.explanation?.trim())

  useEffect(() => {
    if (!timed) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setTimedOut(true); onAnswered?.(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timed])

  function handlePick(i) {
    if (answered) return
    if (timed) clearInterval(timerRef.current)
    setPicked(i)
    onAnswered?.(opts[i]?.is_correct === true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideUp 0.3s ease' }}>
      {timed && !answered && <TimerBar seconds={timeLeft} total={TIMED_SECONDS} accent={accent} />}
      {timed && timedOut && !picked && (
        <div style={{ background: `${M.wrongColor}10`, border: `1.5px solid ${M.wrongColor}30`, borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 700, color: M.wrongColor, fontFamily: 'Nunito, sans-serif' }}>
          Time&apos;s up!
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>{question.difficulty || 'question'}</div>

      <div style={{ background: M.lessonCard, border: M.lessonBorder, borderRadius: M.cardRadius, padding: '18px', boxShadow: M.cardShadow }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: M.textPrimary, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>
          <MathText text={question.question_text || question.title || ''} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {opts.map((opt, i) => {
          const letters  = ['A', 'B', 'C', 'D']
          const isChosen = answered && picked === i
          const isRight  = opt.is_correct
          let border = `2px solid ${accent}25`, bg = M.lessonCard, color = M.textPrimary
          if (answered) {
            if (isRight)       { border = `2px solid ${M.correctColor}`; bg = `${M.correctColor}15`; color = M.correctColor }
            else if (isChosen) { border = `2px solid ${M.wrongColor}`;   bg = `${M.wrongColor}12`;   color = M.wrongColor   }
            else               { border = `2px solid ${accent}10`;       color = M.textSecondary }
          }
          return (
            <button key={i} onClick={() => handlePick(i)}
              style={{ background: bg, border, borderRadius: 14, padding: '14px 10px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, color, cursor: answered ? 'default' : 'pointer', textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: 70 }}
              onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = `${accent}25`; e.currentTarget.style.transform = '' } }}
            >
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: answered && isRight ? M.correctColor : answered && isChosen ? M.wrongColor : `${accent}22`, color: answered && (isRight || isChosen) ? '#fff' : accent, fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {answered && isRight ? '✓' : answered && isChosen && !isRight ? '✗' : letters[i]}
              </span>
              <MathText text={opt.option_text || opt.text || ''} style={{ fontSize: 13, lineHeight: 1.35 }} />
            </button>
          )
        })}
      </div>

      {answered && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${isCorrect ? M.correctColor : M.wrongColor}40`, background: isCorrect ? `${M.correctColor}08` : `${M.wrongColor}06`, animation: 'slideUp 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isCorrect ? `${M.correctColor}14` : `${M.wrongColor}12` }}>
            <span style={{ fontSize: 22 }}>{isCorrect ? '🎉' : '💡'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'Nunito, sans-serif', color: isCorrect ? M.correctColor : M.wrongColor }}>
                {isCorrect ? 'Correct! Great work! 🌟' : timedOut && !picked ? "Time's up!" : 'Not quite!'}
              </div>
              {!isCorrect && correctOpt && (
                <div style={{ fontSize: 12, color: M.correctColor, fontFamily: 'Nunito, sans-serif', marginTop: 3, fontWeight: 700 }}>
                  Answer: <MathText text={correctOpt.option_text} />
                </div>
              )}
            </div>
            {hasExp && (
              <button onClick={() => setShowExp(v => !v)}
                style={{ background: showExp ? accent : 'transparent', border: `1.5px solid ${accent}`, borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Nunito, sans-serif', color: showExp ? '#fff' : accent, flexShrink: 0, transition: 'all 0.15s' }}>
                {showExp ? 'Hide' : 'Why? 💡'}
              </button>
            )}
          </div>
          {showExp && hasExp && (
            <div style={{ padding: '4px 16px 14px' }}>
              <BoardExplanation text={question.explanation} accent={accent} M={M} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ResultsScreen({ correct, total, title, onRetry, onNewTopic, accent, M, mode }) {
  const isBlaze = mode === 'blaze'
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
  const xpEarned = correct   // 1 XP per correct answer
  const grade   = pct === 100 ? 'Perfect! 🏆' : pct >= 80 ? 'Great work! 🌟' : pct >= 60 ? 'Good effort! 👍' : pct >= 40 ? 'Keep practising! 💪' : 'Review the topic! 📖'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 24, animation: 'slideUp 0.35s ease', textAlign: 'center' }}>
      <div style={{ fontSize: 52 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '💪'}</div>
      <div>
        <div style={{ fontFamily: M.headingFont, fontSize: 26, fontWeight: 900, color: M.textPrimary, marginBottom: 6 }}>{grade}</div>
        <div style={{ fontSize: 15, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>
          {title && <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{title}</span>}
          You got <strong style={{ color: accent }}>{correct}</strong> of <strong>{total}</strong> correct
        </div>
      </div>
      <div style={{ background: isBlaze ? '#FFD700' : `${accent}12`, border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`, borderRadius: isBlaze ? 12 : 20, padding: '20px 48px', boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 4px 20px ${accent}20` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: isBlaze ? '#0d0d0d' : M.textSecondary, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>Score</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: M.headingFont, lineHeight: 1 }}>{pct}%</div>
      </div>
      <div style={{ width: '100%', maxWidth: 300 }}>
        <div style={{ height: 10, background: `${accent}20`, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? M.correctColor : accent, borderRadius: 99, transition: 'width 0.9s ease' }} />
        </div>
      </div>

      {/* XP earned */}
      {xpEarned > 0 && (
        <div style={{ background: `${accent}12`, border: `1.5px solid ${accent}30`, borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif' }}>
          +{xpEarned} XP earned ⚡
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        <button onClick={onRetry}    style={{ ...M.primaryBtn, fontSize: 15, padding: '15px' }}>🔄 Practice Again</button>
        <button onClick={onNewTopic} style={{ ...M.ghostBtn,   fontSize: 14 }}>← Choose a Different Topic</button>
      </div>
    </div>
  )
}

// ─── Config sheet (bottom overlay) ───────────────────────────────────────────
// Slides up from bottom when a topic or Mixed is tapped.
// Pick count + timed toggle → Start.
function ConfigSheet({ title, icon, onStart, onClose, accent, M, mode }) {
  const isBlaze   = mode === 'blaze'
  const bodyColor = M.textSecondary
  const [count, setCount] = useState(10)
  const [timed, setTimed] = useState(false)
  const COUNTS = [5, 10, 15, 20]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520, zIndex: 50, background: M.lessonCard || '#fff', borderRadius: isBlaze ? '12px 12px 0 0' : '24px 24px 0 0', padding: '0 20px 40px', boxShadow: '0 -10px 60px rgba(0,0,0,0.18)', border: isBlaze ? '2px solid #0d0d0d' : 'none', animation: 'sheetUp 0.28s cubic-bezier(0.34,1.1,0.64,1)', fontFamily: 'Nunito, sans-serif' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 6 }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, background: `${accent}30` }} />
        </div>

        {/* Topic name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingTop: 4 }}>
          {icon && <div style={{ fontSize: 26 }}>{icon}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2 }}>{title}</div>
            <div style={{ fontSize: 11, color: bodyColor, fontWeight: 500, marginTop: 2 }}>Choose your session settings</div>
          </div>
        </div>

        {/* Count picker */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Number of questions</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COUNTS.map(n => {
              const active = count === n
              return (
                <button key={n} onClick={() => setCount(n)}
                  style={{ flex: 1, padding: '12px 4px', borderRadius: isBlaze ? 8 : 14, cursor: 'pointer', border: active ? (isBlaze ? '2.5px solid #0d0d0d' : `2px solid ${accent}`) : `1.5px solid ${isBlaze ? '#ddd' : `${accent}25`}`, background: active ? (isBlaze ? '#FFD700' : accent) : M.lessonBg || '#fff', fontFamily: 'Nunito, sans-serif', fontSize: 17, fontWeight: 900, color: active ? (isBlaze ? '#0d0d0d' : '#fff') : M.textPrimary, boxShadow: active && !isBlaze ? `0 3px 12px ${accent}30` : isBlaze && active ? '3px 3px 0 #0d0d0d' : 'none', transition: 'all 0.15s' }}>
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Timed toggle */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Timed mode</div>
          <button onClick={() => setTimed(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: isBlaze ? 10 : 16, cursor: 'pointer', border: timed ? (isBlaze ? '2.5px solid #0d0d0d' : `2px solid ${accent}`) : `1.5px solid ${isBlaze ? '#ddd' : `${accent}25`}`, background: timed ? (isBlaze ? '#FFF9D6' : `${accent}0D`) : M.lessonBg || '#fff', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ width: 44, height: 24, borderRadius: 99, background: timed ? accent : `${accent}28`, flexShrink: 0, position: 'relative', transition: 'background 0.2s', boxShadow: timed ? `0 2px 8px ${accent}50` : 'none' }}>
              <div style={{ position: 'absolute', top: 3, left: timed ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: timed ? (isBlaze ? '#0d0d0d' : accent) : M.textPrimary, marginBottom: 1 }}>
                {timed ? '⏱ Timed — 60s per question' : 'No timer'}
              </div>
              <div style={{ fontSize: 10, color: bodyColor, fontWeight: 500 }}>
                {timed ? 'Auto-advances when time runs out' : 'Answer at your own pace'}
              </div>
            </div>
          </button>
        </div>

        {/* Start */}
        <button onClick={() => onStart({ count, timed })}
          style={{ ...M.primaryBtn, width: '100%', fontSize: 16, padding: '15px' }}>
          Start · {count} question{count !== 1 ? 's' : ''}{timed ? ' · Timed ⏱' : ''} →
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PRACTICE PAGE
// ─────────────────────────────────────────────────────────────────────────────
// Phase flow:
//   'topics'  ← topic list + Mixed card (entry point)
//   'active'  ← question loop
//   'done'    ← results
//
// Config sheet overlays the 'topics' phase — selecting a topic/Mixed
// opens the sheet, picking count + timed closes it and starts 'active'.
//
// Back button behaviour (app-like):
//   active  → back to topics (via state — no router.back())
//   done    → back to topics (retry reopens sheet for same topic)
//   topics  → router.back() to wherever came from
//
// If ?topicId= param is present, auto-opens that topic's config sheet on load.

export default function PracticePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { M, mode }  = useMode()

  const preTopicId = searchParams.get('topicId') || null
  const accent     = M.accentColor

  const bodyColor  = M.textSecondary
  const isBlaze    = mode === 'blaze'
  const isNova     = mode === 'nova'

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,         setPhase]        = useState('topics')  // 'topics' | 'active' | 'done'
  const [allTopics,     setAllTopics]    = useState([])
  const [questions,     setQuestions]    = useState([])
  const [loading,       setLoading]      = useState(true)
  const [starting,      setStarting]     = useState(false)
  const [error,         setError]        = useState(null)
  const [currentIdx,    setCurrentIdx]   = useState(0)
  const [answers,       setAnswers]      = useState([])
  const [timed,         setTimed]        = useState(false)
  const [sessionTitle,  setSessionTitle] = useState('')
  const [lastConfig,    setLastConfig]   = useState(null)
  const [sheet,         setSheet]        = useState(null)  // null | {topicId, title, icon}
  const [student,       setStudent]      = useState(null)
  const [activeSubject, setActiveSubject]= useState('maths')

  // Load active student + subject on mount
  useEffect(() => {
    async function loadStudent() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('active_student_id').eq('id', user.id).single()
        const sid = profile?.active_student_id
        if (!sid) return
        const { data: s } = await supabase.from('students').select('id, active_subject, class_level').eq('id', sid).single()
        if (s) { setStudent(s); setActiveSubject(s.active_subject || 'maths') }
      } catch (e) { console.error('[practice] load student:', e.message) }
    }
    loadStudent()
  }, [])

  // Auto-open sheet when arriving with ?topicId=
  useEffect(() => {
    if (preTopicId && allTopics.length > 0) {
      const topic = allTopics.find(t => t.id === preTopicId)
      if (topic) setSheet({ topicId: preTopicId, title: topic.title, icon: '📚' })
    }
  }, [preTopicId, allTopics])

  // ── Load topics with question counts ──────────────────────────────────────
  useEffect(() => {
    async function loadTopics() {
      try {
        if (!student?.class_level) { setLoading(false); return }

        const isFM      = activeSubject === 'further_maths'
        const classCode = student.class_level
        const className = classCode.replace(/([A-Z]+)(\d)/, '$1 $2')

        // Step 1: Find the level row to get the right topic IDs
        // For FM: level code is 'FM_SS1'. For Maths: 'SS1'.
        const levelCode = isFM ? `FM_${classCode}` : classCode
        const { data: levelRow } = await supabase
          .from('levels').select('id').eq('code', levelCode).maybeSingle()

        // Step 2: Get topic IDs that belong to this level
        let levelTopicIds = []
        if (levelRow) {
          const { data: terms } = await supabase.from('terms').select('id').eq('level_id', levelRow.id)
          const termIds = (terms || []).map(t => t.id)
          if (termIds.length) {
            const { data: units } = await supabase.from('units').select('id').in('term_id', termIds)
            const unitIds = (units || []).map(u => u.id)
            if (unitIds.length) {
              const { data: topics } = await supabase.from('topics').select('id').in('unit_id', unitIds)
              levelTopicIds = (topics || []).map(t => t.id)
            }
          }
        }

        // Step 3: If we have level topic IDs, use them to find practice questions
        // Otherwise fall back to class_level text match (handles missing level row)
        let pqs = []
        if (levelTopicIds.length) {
          // Most reliable: filter by topic_id — directly links to the right level
          const { data, error } = await supabase
            .from('practice_questions')
            .select('id, topic_id')
            .in('topic_id', levelTopicIds)
            .eq('is_active', true)
          if (error) console.error('[practice] topic filter failed:', error.message)
          pqs = data || []
        } else {
          // Fallback: match by class_level text (try both code and name forms)
          const { data, error } = await supabase
            .from('practice_questions')
            .select('id, topic_id')
            .in('class_level', [classCode, className, `FM_${classCode}`, `Further Maths ${classCode}`])
            .eq('is_active', true)
          if (error) console.error('[practice] class_level filter failed:', error.message)
          pqs = data || []
        }

        // Step 4: Count questions per topic and fetch titles
        const topicQCount = {}
        pqs.forEach(q => {
          if (q.topic_id) topicQCount[q.topic_id] = (topicQCount[q.topic_id] || 0) + 1
        })
        const topicIds = Object.keys(topicQCount)
        if (!topicIds.length) { setAllTopics([]); setLoading(false); return }

        const { data: topicsData } = await supabase
          .from('topics').select('id, title').in('id', topicIds)

        const enriched = (topicsData || [])
          .map(t => ({ id: t.id, title: t.title, questionCount: topicQCount[t.id] || 0 }))
          .sort((a, b) => a.title.localeCompare(b.title))

        setAllTopics(enriched)
      } catch (e) {
        console.error('[practice] load topics:', e)
      }
      setLoading(false)
    }
    loadTopics()
  }, [activeSubject, student?.class_level])

  // ── Start session ─────────────────────────────────────────────────────────
  async function handleSheetStart({ count, timed: isTimed }) {
    setSheet(null)
    setStarting(true)
    setError(null)
    try {
      let q = []
      const isMixed = !sheet?.topicId

      if (!isMixed) {
        // topic_id is the most reliable filter — it directly links to the right level/subject
        const { data: raw } = await supabase
          .from('practice_questions')
          .select('*, options:practice_question_options(*)')
          .eq('topic_id', sheet.topicId)
          .eq('is_active', true)
        q = (raw || []).map(pq => ({
          ...pq,
          options: (pq.options || []).map(o => ({ option_text: o.option_text, is_correct: o.is_correct })),
        }))
        setSessionTitle(sheet.title)
      } else {
        // Mixed — get all topics for this level, then fetch questions by topic_id
        const isFMMix   = activeSubject === 'further_maths'
        const levelCode = isFMMix ? `FM_${student?.class_level}` : student?.class_level
        const { data: mixLvl } = await supabase.from('levels').select('id').eq('code', levelCode).maybeSingle()
        if (mixLvl) {
          const { data: mTerms } = await supabase.from('terms').select('id').eq('level_id', mixLvl.id)
          const mTermIds = (mTerms || []).map(t => t.id)
          if (mTermIds.length) {
            const { data: mUnits } = await supabase.from('units').select('id').in('term_id', mTermIds)
            const mUnitIds = (mUnits || []).map(u => u.id)
            if (mUnitIds.length) {
              const { data: mTopics } = await supabase.from('topics').select('id').in('unit_id', mUnitIds)
              const mTopicIds = (mTopics || []).map(t => t.id)
              if (mTopicIds.length) {
                const { data: raw } = await supabase
                  .from('practice_questions')
                  .select('*, options:practice_question_options(*)')
                  .in('topic_id', mTopicIds)
                  .eq('is_active', true)
                  .limit(200)
                q = (raw || []).map(pq => ({
                  ...pq,
                  options: (pq.options || []).map(o => ({ option_text: o.option_text, is_correct: o.is_correct })),
                }))
              }
            }
          }
        }
        setSessionTitle(activeSubject === 'further_maths' ? 'Mixed Further Maths' : 'Mixed Practice')
      }

      if (!q.length) {
        setError(isMixed ? 'No questions found. Generate some lessons first!' : 'No questions found for this topic yet.')
        setStarting(false)
        return
      }

      const final = [...q]
        .sort(() => Math.random() - 0.5).slice(0, count)
        .map(q => ({ ...q, options: [...(q.options || [])].sort(() => Math.random() - 0.5) }))

      setQuestions(final)
      setAnswers([])
      setCurrentIdx(0)
      setTimed(isTimed)
      setLastConfig({ topicId: sheet?.topicId || null, title: sheet?.title || 'Mixed Practice', count, timed: isTimed })
      setPhase('active')
    } catch (e) {
      setError('Failed to load questions. Please try again.')
      console.error('[practice] start:', e)
    }
    setStarting(false)
  }

  function handleAnswered(wasCorrect) {
    setAnswers(prev => [...prev, wasCorrect])
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setPhase('done')
      // Award XP: 1 per correct answer — save after session completes
      const correctCount = answers.filter(Boolean).length + (answers.length === currentIdx ? 0 : 0)
      // Re-count after this answer is registered (answers state may be one behind)
      // Use a slight delay to let state settle
      setTimeout(async () => {
        try {
          const finalCorrect = answers.filter(Boolean).length
          if (finalCorrect === 0) return
          // Atomic increment — avoids read-then-write race condition and RLS issues
          if (activeSubject === 'further_maths') {
            // FM XP — direct update (RPC is for Maths only)
            const { data: { user } } = await supabase.auth.getUser()
            if (user && student?.id) {
              const { data: f } = await supabase.from('students').select('fm_xp, fm_monthly_xp').eq('id', student.id).single()
              const { error } = await supabase.from('students').update({
                fm_xp:         (f?.fm_xp         || 0) + finalCorrect,
                fm_monthly_xp: (f?.fm_monthly_xp || 0) + finalCorrect,
              }).eq('id', student.id)
              if (error) console.error('[practice] FM XP save:', error.message)
            }
          } else {
            const { error } = await supabase.rpc('increment_xp', { amount: finalCorrect })
            if (error) console.error('[practice] XP save:', error.message)
          }
        } catch (e) { console.error('[practice] XP save:', e.message) }
      }, 100)
    }
    else setCurrentIdx(i => i + 1)
  }

  // Retry: reopen config sheet for same topic — no router navigation
  function handleRetry() {
    setPhase('topics')
    if (lastConfig) {
      setSheet({ topicId: lastConfig.topicId, title: lastConfig.title, icon: lastConfig.topicId ? '📚' : '🎲' })
    }
  }

  // Back button — app-like: goes one phase back, not router.back()
  function handleBack() {
    if (phase === 'active')  { setSheet(null); setPhase('topics') }
    else if (phase === 'done') { setPhase('topics') }
    else                     { router.back() }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentQ    = questions[currentIdx]
  const answered    = answers.length > currentIdx
  const correct     = answers.filter(Boolean).length
  const progressPct = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', flexShrink: 0, borderBottom: `1px solid ${accent}18`, background: M.hudBg }}>
        <button onClick={handleBack}
          style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: M.lessonCard, border: M.lessonBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: M.textSecondary, flexShrink: 0 }}>
          ✕
        </button>
        {phase === 'active' && (
          <>
            <div style={{ flex: 1, height: 6, background: M.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${accent},${M.accent2 || accent})`, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ background: M.lessonCard, border: M.lessonBorder, borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 800, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>
              {currentIdx + 1} / {questions.length}
            </div>
          </>
        )}
        {phase !== 'active' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif' }}>
              {phase === 'done' ? '✏️ Results' : '✏️ Practice'}
            </span>
            {activeSubject === 'further_maths' && (
              <span style={{ fontSize: 10, fontWeight: 900, color: accent, background: `${accent}14`, border: `1.5px solid ${accent}30`, borderRadius: 20, padding: '2px 9px', fontFamily: 'Nunito, sans-serif', letterSpacing: 0.4 }}>Further Maths</span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 18px 40px' }}>

          {/* Loading */}
          {(loading || starting) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12, color: bodyColor }}>
              <div style={{ fontSize: 32, animation: 'float 1.5s ease-in-out infinite' }}>{loading ? '✏️' : '⚡'}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{loading ? 'Loading topics…' : 'Building your session…'}</div>
            </div>
          )}

          {/* Error */}
          {!loading && !starting && error && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: M.textPrimary, marginBottom: 16 }}>{error}</div>
              <button onClick={() => setError(null)} style={{ ...M.ghostBtn }}>← Back</button>
            </div>
          )}

          {/* ── TOPICS SCREEN ── */}
          {!loading && !starting && !error && phase === 'topics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideUp 0.3s ease' }}>

              {/* Mixed Practice card */}
              <button
                onClick={() => setSheet({ topicId: null, title: 'Mixed Practice', icon: '🎲' })}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', width: '100%', borderRadius: isBlaze ? 10 : 18, background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.12)' : `linear-gradient(135deg,${accent}18,${M.accent2 || accent}0A)`, border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}35`, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 4px 18px ${accent}18`, fontFamily: 'Nunito, sans-serif' }}>
                <div style={{ width: 48, height: 48, borderRadius: isBlaze ? 10 : '50%', flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.1)' : `${accent}22`, border: isBlaze ? '2px solid rgba(0,0,0,0.12)' : `2px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎲</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, marginBottom: 2 }}>
                    {isBlaze ? 'MIXED DRILL' : 'Mixed Practice'}
                  </div>
                  <div style={{ fontSize: 11, color: isBlaze ? '#555' : bodyColor, fontWeight: 500 }}>Questions shuffled from all topics</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', background: isBlaze ? '#0d0d0d' : accent, borderRadius: isBlaze ? 6 : 20, padding: '6px 13px', fontFamily: 'Nunito, sans-serif' }}>GO →</div>
              </button>

              <div style={{ fontSize: 10, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginTop: 4 }}>By Topic</div>

              {allTopics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: bodyColor, fontFamily: 'Nunito, sans-serif' }}>
                  <BicPencil pose="think" size={90} style={{ display: 'inline-block', marginBottom: 14 }} />
                  <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, marginBottom: 6, fontFamily: M.headingFont }}>Practice questions coming soon!</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: bodyColor, lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>
                    {activeSubject === 'further_maths'
                      ? 'Further Maths practice questions will appear here once generated.'
                      : 'Practice questions for your class will appear here. Check back soon!'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allTopics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => setSheet({ topicId: topic.id, title: topic.title, icon: '📚' })}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: M.lessonCard, border: M.lessonBorder, borderRadius: isBlaze ? 8 : 14, boxShadow: M.cardShadow, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Nunito, sans-serif', transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `${accent}08` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = '' }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: isBlaze ? 8 : '50%', flexShrink: 0, background: `${accent}15`, border: `1.5px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✏️</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary, marginBottom: 2 }}>{topic.title}</div>
                        <div style={{ fontSize: 10, color: bodyColor, fontWeight: 500 }}>{topic.questionCount} question{topic.questionCount !== 1 ? 's' : ''}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: accent, background: `${accent}12`, borderRadius: 20, padding: '3px 10px' }}>Practice</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVE — question ── */}
          {!loading && !starting && !error && phase === 'active' && currentQ && (
            <>
              {sessionTitle && (
                <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 16, opacity: 0.8 }}>
                  {sessionTitle}
                </div>
              )}
              <QuestionCard
                key={currentQ.id}
                question={currentQ}
                accent={accent}
                M={M}
                onAnswered={handleAnswered}
                timed={timed}
              />
              {answered && (
                <div style={{ marginTop: 16, animation: 'slideUp 0.2s ease' }}>
                  <button onClick={handleNext} style={{ ...M.primaryBtn, width: '100%', fontSize: 16, padding: '15px' }}>
                    {currentIdx + 1 >= questions.length ? 'See Results ✓' : 'Next Question →'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── DONE — results ── */}
          {!loading && !starting && !error && phase === 'done' && (
            <ResultsScreen
              correct={correct}
              total={questions.length}
              title={sessionTitle}
              onRetry={handleRetry}
              onNewTopic={() => { setPhase('topics'); setError(null) }}
              accent={accent}
              M={M}
              mode={mode}
            />
          )}
        </div>
      </div>

      {/* Config sheet */}
      {sheet && (
        <ConfigSheet
          title={sheet.title}
          icon={sheet.icon}
          onStart={handleSheetStart}
          onClose={() => setSheet(null)}
          accent={accent}
          M={M}
          mode={mode}
        />
      )}

      <style>{`
        @keyframes slideUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sheetUp  { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }
        @keyframes float    { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  )
}