'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'

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
// Same lineType logic as LessonPlayer and PracticePage

function lineType(line) {
  const t = line.trim()
  if (!t) return 'empty'
  if (/^(Answer|Solution)\s*:/i.test(t)) return 'answer'
  const isWordStart = /^[A-Z][a-z]/.test(t)
  const hasWords    = (t.match(/[a-z]{2,}/g) || []).length >= 2
  const hasEquals   = t.includes('=')
  const startsDigit = /^\d/.test(t)
  const isFraction  = /^\d+\/\d+/.test(t)
  const hasOperator = /[+\-×÷*/^]/.test(t) && !isWordStart
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
      <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 8, opacity: 0.65 }}>
        Working
      </div>
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

// ─── Timer component ──────────────────────────────────────────────────────────
function TimerBar({ seconds, total, accent, M }) {
  const pct = Math.max(0, (seconds / total) * 100)
  const color = pct > 50 ? accent : pct > 25 ? '#FFC933' : '#EF4444'
  return (
    <div style={{ height: 6, background: `${color}25`, borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s linear, background 0.3s ease' }} />
    </div>
  )
}

// ─── Challenge question component ────────────────────────────────────────────
const QUESTION_TIME = 60  // seconds per question

function ChallengeQuestion({ question, questionNumber, total, accent, M, mode, onNext }) {
  const [picked,    setPicked]    = useState(null)
  const [showExp,   setShowExp]   = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(QUESTION_TIME)
  const [timedOut,  setTimedOut]  = useState(false)
  const timerRef = useRef(null)

  const isBlaze    = mode === 'blaze'
  const opts       = question.options || []
  const answered   = picked !== null || timedOut
  const isCorrect  = !timedOut && opts[picked]?.is_correct
  const correctOpt = opts.find(o => o.is_correct)
  const hasExp     = !!(question.explanation?.trim())

  // Start countdown when question mounts
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setTimedOut(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function handlePick(i) {
    if (answered) return
    clearInterval(timerRef.current)
    setPicked(i)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.28s ease' }}>

      {/* Timer + question counter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: timeLeft <= 8 ? '#EF4444' : M.textSecondary, fontFamily: 'Nunito, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
            ⏱ {timeLeft}s
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
            ⚡ {questionNumber} / {total}
          </div>
        </div>
        <TimerBar seconds={timeLeft} total={QUESTION_TIME} accent={accent} M={M} />
      </div>

      {/* Question text */}
      <div style={{ background: M.lessonCard, border: M.lessonBorder, borderRadius: M.cardRadius, padding: '18px', boxShadow: M.cardShadow }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: M.textPrimary, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>
          <MathText text={question.question_text || question.title || ''} />
        </div>
      </div>

      {/* Timed-out message (before options colour up) */}
      {timedOut && !picked && (
        <div style={{ background: `${M.wrongColor}10`, border: `1.5px solid ${M.wrongColor}30`, borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: M.wrongColor, fontFamily: 'Nunito, sans-serif', animation: 'slideUp 0.2s ease' }}>
          ⏰ Time's up!
        </div>
      )}

      {/* Options — 2-column */}
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
            <button
              key={i}
              onClick={() => handlePick(i)}
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

      {/* Feedback panel */}
      {answered && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${isCorrect ? M.correctColor : M.wrongColor}40`, background: isCorrect ? `${M.correctColor}08` : `${M.wrongColor}06`, animation: 'slideUp 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isCorrect ? `${M.correctColor}14` : `${M.wrongColor}12` }}>
            <span style={{ fontSize: 22 }}>{isCorrect ? '🎉' : timedOut ? '⏰' : '💡'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'Nunito, sans-serif', color: isCorrect ? M.correctColor : M.wrongColor }}>
                {isCorrect ? 'Correct! 🌟' : timedOut && !picked ? "Time's up!" : 'Not quite!'}
              </div>
              {!isCorrect && correctOpt && (
                <div style={{ fontSize: 12, color: M.correctColor, fontFamily: 'Nunito, sans-serif', marginTop: 3, fontWeight: 700 }}>
                  ✅ Answer: <MathText text={correctOpt.option_text} />
                </div>
              )}
            </div>
            {hasExp && (
              <button
                onClick={() => setShowExp(v => !v)}
                style={{ background: showExp ? accent : 'transparent', border: `1.5px solid ${accent}`, borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Nunito, sans-serif', color: showExp ? '#fff' : accent, flexShrink: 0, transition: 'all 0.15s' }}>
                {showExp ? 'Hide ▲' : 'Why? 💡'}
              </button>
            )}
          </div>

          {/* Board-style working */}
          {showExp && hasExp && (
            <div style={{ padding: '4px 16px 14px' }}>
              <BoardExplanation text={question.explanation} accent={accent} M={M} />
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button
          onClick={() => onNext(isCorrect)}
          style={{ ...M.primaryBtn, width: '100%', fontSize: 16, padding: '15px', animation: 'slideUp 0.2s ease' }}>
          {questionNumber >= total ? 'See Results ✓' : 'Next →'}
        </button>
      )}
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ChallengeResults({ correct, total, xpEarned, onRetry, onBack, accent, M, mode }) {
  const isBlaze = mode === 'blaze'
  const perfect = correct === total
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 24, animation: 'slideUp 0.35s ease', textAlign: 'center' }}>

      <div style={{ animation: 'float 2s ease-in-out infinite', fontSize: 52 }}>
        {perfect ? '🏆' : correct >= Math.ceil(total * 0.6) ? '⭐' : '💪'}
      </div>

      <div>
        <div style={{ fontFamily: M.headingFont, fontSize: 26, fontWeight: 900, color: M.textPrimary, marginBottom: 6 }}>
          {perfect ? 'Perfect! 🏆' : correct >= Math.ceil(total * 0.6) ? 'Well done! ⭐' : 'Keep practising! 💪'}
        </div>
        <div style={{ fontSize: 15, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>
          You got <strong style={{ color: accent }}>{correct}</strong> out of <strong>{total}</strong> correct
        </div>
      </div>

      {/* XP earned */}
      <div style={{ background: isBlaze ? '#FFD700' : `${accent}12`, border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`, borderRadius: isBlaze ? 12 : 20, padding: '20px 48px', boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 4px 20px ${accent}20` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: isBlaze ? '#0d0d0d' : M.textSecondary, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>XP Earned</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#FFC933', fontFamily: M.headingFont, lineHeight: 1, letterSpacing: -1 }}>
          +{xpEarned}<span style={{ fontSize: 22, marginLeft: 6 }}>✨</span>
        </div>
        <div style={{ fontSize: 11, color: isBlaze ? 'rgba(0,0,0,0.5)' : M.textSecondary, fontFamily: 'Nunito, sans-serif', marginTop: 4 }}>
          {correct} of {total} correct · {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 300 }}>
        <div style={{ height: 10, background: `${accent}20`, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: perfect ? M.correctColor : accent, borderRadius: 99, transition: 'width 0.9s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        {onRetry && (
          <button onClick={onRetry} style={{ ...M.primaryBtn, fontSize: 15, padding: '15px' }}>
            {isBlaze ? '⚡ Try Again' : '🔄 Try Again'}
          </button>
        )}
        <button onClick={onBack} style={{ ...M.ghostBtn, fontSize: 14 }}>
          ← Back to Learn
        </button>
      </div>
    </div>
  )
}

// ─── Intro / countdown screen ─────────────────────────────────────────────────
function ChallengeIntro({ onStart, onBack, accent, M, mode }) {
  const isBlaze = mode === 'blaze'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: 24, textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
      <div style={{ animation: 'float 2.5s ease-in-out infinite', fontSize: 56 }}>⚡</div>
      <div>
        <div style={{ fontFamily: M.headingFont, fontSize: 28, fontWeight: 900, color: M.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>
          🏆 Daily Challenge
        </div>
        <div style={{ fontSize: 14, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.7, maxWidth: 280 }}>
          {isBlaze ? '5 QUESTIONS. 60 SECONDS EACH. NO EXCUSES.' : '5 questions · 60 seconds each · Board-style working shown after each answer'}
        </div>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { icon: '⚡', label: '5 questions', color: accent },
          { icon: '⏱', label: '60s per Q',   color: '#FFC933' },
          { icon: '🏆', label: '+50 XP max',  color: M.correctColor },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 12px', textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color, fontFamily: 'Nunito, sans-serif', lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        <button onClick={onStart} style={{ ...M.primaryBtn, fontSize: 16, padding: '16px', width: '100%' }}>
          {isBlaze ? '⚡ ACCEPT CHALLENGE' : 'Start Challenge →'}
        </button>
        <button onClick={onBack} style={{ ...M.ghostBtn, fontSize: 14 }}>← Back</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHALLENGE PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ChallengePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()
  const { M, mode }  = useMode()

  const challengeMode = searchParams.get('mode') || 'daily'  // 'daily' | 'topic'

  const accent    = M.accentColor
  const isBlaze   = mode === 'blaze'
  const isNova    = mode === 'nova'
  const bodyColor = isNova ? 'rgba(200,195,255,0.78)' : M.textSecondary

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState('loading')  // 'loading' | 'locked' | 'active' | 'done'
  const [questions,    setQuestions]    = useState([])
  const [error,        setError]        = useState(null)
  const [currentIdx,   setCurrentIdx]   = useState(0)
  const [results,      setResults]      = useState([])
  const [student,      setStudent]      = useState(null)

  // ── Load active student via profiles.active_student_id ──────────────────
  useEffect(() => {
    async function loadStudent() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        // Get active_student_id from profile first
        const { data: profile } = await supabase.from('profiles').select('active_student_id').eq('id', user.id).single()
        const studentId = profile?.active_student_id
        if (!studentId) {
          // fallback: first student for this profile
          const { data: first } = await supabase.from('students').select('*').eq('profile_id', user.id).limit(1).single()
          if (first) setStudent(first)
          return
        }
        const { data: s } = await supabase.from('students').select('*').eq('id', studentId).single()
        if (s) setStudent(s)
      } catch (e) { console.error('[challenge] load student:', e.message) }
    }
    loadStudent()
  }, [])

  // ── Load questions + check daily trial count ──────────────────────────────
  // - Questions only from subtopics the student has completed (falls back to all)
  useEffect(() => {
    if (!student) return
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Not logged in.'); setPhase('locked'); return }

        // Load questions from completed subtopics
        let lessonIds = []
        const { data: progress } = await supabase
          .from('student_progress')
          .select('subtopic_id')
          .eq('student_id', student.id)
          .eq('status', 'completed')

        if (progress?.length) {
          const { data: lessons } = await supabase
            .from('lessons').select('id').in('subtopic_id', progress.map(p => p.subtopic_id))
          lessonIds = (lessons || []).map(l => l.id)
        }

        let query = supabase
          .from('questions').select('*, options:question_options(*)').limit(80)
        if (lessonIds.length > 0) query = query.in('lesson_id', lessonIds)

        const { data: raw } = await query
        if (!raw?.length) {
          setError('No questions available yet. Complete some lessons first!')
          setPhase('locked')
          return
        }

        const shuffled = [...raw]
          .sort(() => Math.random() - 0.5).slice(0, 5)
          .map(q => ({ ...q, options: [...(q.options || [])].sort(() => Math.random() - 0.5) }))

        setQuestions(shuffled)
        setPhase('active')   // skip intro — jump straight in
      } catch (e) {
        setError('Failed to load challenge. Please try again.')
        console.error('[challenge]', e)
        setPhase('locked')
      }
    }
    load()
  }, [student])

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleNext(wasCorrect) {
    const newResults = [...results, { correct: wasCorrect }]
    setResults(newResults)
    if (currentIdx + 1 >= questions.length) {
      const correctCount = newResults.filter(r => r.correct).length
      const xpEarned = correctCount === questions.length ? 50 : Math.max(5, Math.round((correctCount / questions.length) * 50))
      awardXP(xpEarned)
        setPhase('done')
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  async function awardXP(amount) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: s } = await supabase.from('students').select('xp, monthly_xp').eq('profile_id', user.id).single()
      await supabase.from('students').update({ xp: (s?.xp || 0) + amount, monthly_xp: (s?.monthly_xp || 0) + amount }).eq('profile_id', user.id)
    } catch (e) { console.error('[challenge] XP:', e.message) }
  }

  function handleRetry() {
    const reshuffled = [...questions]
      .sort(() => Math.random() - 0.5)
      .map(q => ({ ...q, options: [...(q.options || [])].sort(() => Math.random() - 0.5) }))
    setQuestions(reshuffled)
    setResults([])
    setCurrentIdx(0)
    setPhase('active')
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const correct   = results.filter(r => r.correct).length
  const xpEarned  = correct === questions.length ? 50 : Math.max(5, Math.round((correct / Math.max(questions.length, 1)) * 50))
  const currentQ  = questions[currentIdx]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', flexShrink: 0, borderBottom: `1px solid ${accent}18`, background: M.hudBg }}>
        <button onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: M.lessonCard, border: M.lessonBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: M.textSecondary, flexShrink: 0 }}>
          ←
        </button>
        {phase === 'active' && (
          <div style={{ flex: 1, height: 6, background: M.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((currentIdx / questions.length) * 100)}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${accent},${M.accent2 || accent})`, transition: 'width 0.4s ease' }} />
          </div>
        )}
        <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: accent, flexShrink: 0 }}>
          {phase === 'active' ? `⚡ Q${currentIdx + 1}/${questions.length}` : '🏆 Challenge'}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 18px 40px' }}>

          {/* Loading */}
          {phase === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12, color: bodyColor }}>
              <div style={{ fontSize: 32, animation: 'float 1.5s ease-in-out infinite' }}>⚡</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Preparing your challenge…</div>
            </div>
          )}

          {/* Locked — only for errors (no questions found etc.) */}
          {phase === 'locked' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 20, textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
              <div style={{ fontSize: 52 }}>📭</div>
              <div>
                <div style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 900, color: M.textPrimary, marginBottom: 8 }}>
                  Something went wrong
                </div>
                <div style={{ fontSize: 14, color: bodyColor, fontFamily: 'Nunito, sans-serif', lineHeight: 1.7, maxWidth: 280 }}>
                  {error || 'No questions available yet. Complete some lessons first!'}
                </div>
              </div>
              <button onClick={() => router.back()} style={{ ...M.primaryBtn, fontSize: 15, padding: '14px 32px' }}>
                ← Go Back
              </button>
            </div>
          )}

          {/* Active question */}
          {phase === 'active' && currentQ && (
            <ChallengeQuestion
              key={currentQ.id}
              question={currentQ}
              questionNumber={currentIdx + 1}
              total={questions.length}
              accent={accent}
              M={M}
              mode={mode}
              onNext={handleNext}
            />
          )}

          {/* Results */}
          {phase === 'done' && (
            <ChallengeResults
              correct={correct}
              total={questions.length}
              xpEarned={xpEarned}
              onRetry={handleRetry}
              onBack={() => router.back()}
              accent={accent}
              M={M}
              mode={mode}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float   { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  )
}