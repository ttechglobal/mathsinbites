'use client'

// ─────────────────────────────────────────────────────────────────────────────
// 120 Seconds of Fame — Blitz Challenge
// Answer as many questions as you can in 120 seconds (2 minutes).
// Score = number of correct answers. Beat your personal best.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'

const BLITZ_SECONDS = 120   // 2 minutes

function MathText({ text }) {
  if (!text) return null
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
  return (
    <span>
      {parts.map((p, i) =>
        p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super' }}>{p.v}</sup>
        : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub' }}>{p.v}</sub>
        : <span key={i}>{p.v}</span>
      )}
    </span>
  )
}

export default function ChallengePage() {
  const router   = useRouter()
  const supabase = createClient()
  const { M, mode } = useMode()

  const accent   = M.accentColor || '#7C3AED'
  const bodyColor= M.textSecondary || '#888'
  const isBlaze  = mode === 'blaze'
  const isNova   = mode === 'nova'
  const isRoots  = mode === 'roots'

  // ── State ──────────────────────────────────────────────────────────────────
  const [student,   setStudent]   = useState(null)
  const [questions, setQuestions] = useState([])   // large pool, shuffled
  const [phase,     setPhase]     = useState('loading') // loading | ready | active | done | error
  const [error,     setError]     = useState(null)

  // Blitz state
  const [timeLeft,  setTimeLeft]  = useState(BLITZ_SECONDS)
  const [qIdx,      setQIdx]      = useState(0)
  const [correct,   setCorrect]   = useState(0)
  const [total,     setTotal]     = useState(0)
  const [chosen,    setChosen]    = useState(null)   // selected option id
  const [revealed,  setRevealed]  = useState(false)  // show answer briefly
  const [blitzBest,    setBlitzBest]    = useState(0)
  const [board,        setBoard]        = useState([])
  const [boardScope,   setBoardScope]   = useState('class')


  const timerRef   = useRef(null)
  const revealRef  = useRef(null)

  // ── Load student ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadStudent() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('active_student_id').eq('id', user.id).single()
        const sid = profile?.active_student_id
        if (!sid) { const { data: s } = await supabase.from('students').select('*').eq('profile_id', user.id).limit(1).single(); if (s) setStudent(s); return }
        const { data: s } = await supabase.from('students').select('*').eq('id', sid).single()
        if (s) {
          setStudent(s)
          const isFM = s.active_subject === 'further_maths'
          setBlitzBest(isFM ? (s.fm_blitz_best || 0) : (s.blitz_best || 0))
        }
      } catch (e) { console.error('[blitz] load student:', e.message) }
    }
    loadStudent()
  }, [])

  // ── Load question pool ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!student) return
    async function loadQuestions() {
      try {
        // Get all completed subtopics for this student
        const { data: progress } = await supabase
          .from('student_progress').select('subtopic_id')
          .eq('student_id', student.id).eq('status', 'completed')

        const isFM = student?.active_subject === 'further_maths'
        const { data: subjectLessons } = await supabase
          .from('lessons').select('id').eq('subject', isFM ? 'further_maths' : 'maths')

        let query = supabase.from('questions').select('*, options:question_options(*)')
        if (subjectLessons?.length) {
          if (progress?.length) {
            const { data: pLessons } = await supabase
              .from('lessons').select('id')
              .in('subtopic_id', progress.map(p => p.subtopic_id))
              .eq('subject', isFM ? 'further_maths' : 'maths')
            query = query.in('lesson_id', (pLessons?.length ? pLessons : subjectLessons).map(l => l.id))
          } else {
            query = query.in('lesson_id', subjectLessons.map(l => l.id))
          }
        }
        const { data: raw } = await query.limit(200)

        if (!raw?.length) { setError('No questions yet — complete some lessons first!'); setPhase('error'); return }

        // Shuffle a large pool — we'll cycle through them
        const pool = [...raw].sort(() => Math.random() - 0.5).map(q => ({
          ...q, options: [...(q.options || [])].sort(() => Math.random() - 0.5),
        }))
        setQuestions(pool)
        setPhase('ready')
        // Load monthly leaderboard immediately when questions are ready
        loadBoard('class', student)

      } catch (e) { setError('Failed to load questions.'); setPhase('error') }
    }
    loadQuestions()
  }, [student])

  // ── Lazy-load: also trigger load as soon as component mounts ────────────────
  // This way questions are ready by the time the user presses Start
  useEffect(() => {
    // If student loaded quickly, the above effect already fired.
    // If not, this fires on mount and retries when student arrives — no extra work needed.
    // The key insight: we set phase='ready' only after both student and questions are loaded.
  }, [])

  // ── Board loader ─────────────────────────────────────────────────────────────
  function loadBoard(scope, stu, freshScore = null) {
    const thisMonth = new Date().toISOString().slice(0, 7)
    const isFMb  = stu?.active_subject === 'further_maths'
    const mthCol = isFMb ? 'fm_blitz_monthly_best' : 'blitz_monthly_best'
    const mthKey = isFMb ? 'fm_blitz_month'        : 'blitz_month'
    let q = supabase.from('students')
      .select(`id, display_name, class_level, school, ${mthCol}, ${mthKey}`)
      .gt(mthCol, 0)
      .order(mthCol, { ascending: false })
      .limit(20)
    if (scope === 'class' && stu?.class_level)
      q = q.eq('class_level', stu.class_level)
    else if (scope === 'school' && stu?.school)
      q = q.ilike('school', `%${stu.school.split(' ')[0]}%`)
    q.then(({ data }) => {
      if (!data) return
      const rows      = data.filter(r => r[mthKey] === thisMonth)
      const normed    = rows.map(r => ({ ...r, blitz_monthly_best: r[mthCol] || 0 }))
      const alreadyIn = normed.some(r => r.id === stu?.id)
      const stuKey    = isFMb ? stu?.fm_blitz_month : stu?.blitz_month
      const stuBest   = isFMb ? (stu?.fm_blitz_monthly_best || 0) : (stu?.blitz_monthly_best || 0)
      const myBest    = freshScore ?? (stuKey === thisMonth ? stuBest : 0)
      let final = normed
      if (!alreadyIn && myBest > 0) {
        final = [...normed, { id: stu.id, display_name: stu.display_name, blitz_monthly_best: myBest, class_level: stu.class_level, school: stu.school }]
          .sort((a, b) => (b.blitz_monthly_best || 0) - (a.blitz_monthly_best || 0))
      }
      setBoard(final)
    })
  }

  // ── Timer ──────────────────────────────────────────────────────────────────
  // Use refs for values captured inside setInterval callbacks
  // (closures in setInterval are stale — refs always have the latest value)
  const correctRef = useRef(0)
  const studentRef = useRef(null)
  useEffect(() => { correctRef.current = correct }, [correct])
  useEffect(() => { studentRef.current = student }, [student])

  // Restart timer with latest correct ref
  function startBlitzReal() {
    correctRef.current = 0
    setTimeLeft(BLITZ_SECONDS)
    setQIdx(0); setCorrect(0); setTotal(0)
    setChosen(null); setRevealed(false)
    setPhase('active')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setPhase('done')
          const fc  = correctRef.current
          const stu = studentRef.current   // always fresh — no stale closure
          if (!stu) return 0
          const sid    = stu.id
          if (!sid) return 0

          const isFM2  = stu.active_subject === 'further_maths'
          const bestCol = isFM2 ? 'fm_blitz_best'         : 'blitz_best'
          const mthCol  = isFM2 ? 'fm_blitz_monthly_best' : 'blitz_monthly_best'
          const mthKey  = isFM2 ? 'fm_blitz_month'        : 'blitz_month'
          const curBest = isFM2 ? (stu.fm_blitz_best || 0)         : (stu.blitz_best || 0)
          const curMth  = isFM2 ? (stu.fm_blitz_monthly_best || 0) : (stu.blitz_monthly_best || 0)
          const curKey  = isFM2 ? stu.fm_blitz_month               : stu.blitz_month

          const thisMonth = new Date().toISOString().slice(0, 7)
          if (fc > curBest) {
            supabase.from('students')
              .update({ [bestCol]: fc })
              .eq('id', sid)
              .then(({ error }) => { if (!error) setBlitzBest(fc) })
          }
          const prevMonthly = curKey === thisMonth ? curMth : 0
          if (fc > prevMonthly) {
            supabase.from('students')
              .update({ [mthCol]: fc, [mthKey]: thisMonth })
              .eq('id', sid)
          }
          setTimeout(() => loadBoard(boardScope || 'class', stu, fc), 1500)

          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => { clearInterval(timerRef.current); clearTimeout(revealRef.current) }, [])

  // ── Answer ─────────────────────────────────────────────────────────────────
  function handleAnswer(optionId) {
    if (revealed || phase !== 'active') return
    const q = questions[qIdx % questions.length]
    const isCorrect = q.options.find(o => o.id === optionId)?.is_correct
    setChosen(optionId)
    setRevealed(true)
    setTotal(t => t + 1)
    if (isCorrect) { setCorrect(c => { correctRef.current = c + 1; return c + 1 }) }
    // Brief flash (600ms) then next question
    revealRef.current = setTimeout(() => {
      setChosen(null); setRevealed(false)
      setQIdx(i => i + 1)
    }, 600)
  }

  // ── Current question ───────────────────────────────────────────────────────
  const q = questions.length > 0 ? questions[qIdx % questions.length] : null
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const pct  = Math.round((timeLeft / BLITZ_SECONDS) * 100)
  const isNewBest = phase === 'done' && correct > blitzBest

  // Timer colour — green → amber → red
  const timerColor = timeLeft > 60 ? M.correctColor : timeLeft > 30 ? '#FFC933' : '#FF4444'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pop     { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes flash   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: M.lessonBg, fontFamily: 'Nunito, sans-serif' }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', flexShrink: 0, borderBottom: `1px solid ${accent}18`, background: M.hudBg }}>
          <button onClick={() => { clearInterval(timerRef.current); router.back() }}
            style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: M.lessonCard, border: M.lessonBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: M.textSecondary }}>
            ←
          </button>
          {phase === 'active' && (
            <>
              {/* Progress bar */}
              <div style={{ flex: 1, height: 6, background: M.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: timerColor, borderRadius: 99, transition: 'width 1s linear' }} />
              </div>
              {/* Timer */}
              <div style={{ fontSize: 20, fontWeight: 900, color: timerColor, fontFamily: 'Nunito, sans-serif', minWidth: 52, textAlign: 'right', animation: timeLeft <= 10 ? 'flash 0.5s ease-in-out infinite' : 'none' }}>
                {mins}:{secs}
              </div>
            </>
          )}
          {phase !== 'active' && (
            <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 900, color: accent }}>⚡ 120 Seconds of Fame</div>
          )}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 18px 60px' }}>

            {/* LOADING */}
            {(phase === 'loading') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 12 }}>
                <div style={{ fontSize: 36, animation: 'float 1.5s ease-in-out infinite' }}>⚡</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: bodyColor }}>Loading your question bank…</div>
              </div>
            )}

            {/* ERROR */}
            {phase === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 52 }}>📭</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: M.textPrimary }}>{error}</div>
                <button onClick={() => router.back()} style={{ ...M.primaryBtn, padding: '14px 32px' }}>← Go Back</button>
              </div>
            )}

            {/* READY — full leaderboard + start */}
            {phase === 'ready' && (
              <div style={{ animation: 'slideUp 0.4s ease' }}>

                {/* ── Header ── */}
                <div style={{ textAlign: 'center', paddingTop: 8, marginBottom: 22 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>⚡ 120 Seconds of Fame</div>
                  <div style={{ fontSize: 13, color: bodyColor, fontWeight: 600 }}>
                    How many can you answer in 2 minutes?
                  </div>
                </div>

                {/* ── Personal best + Start ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: isNova ? 'rgba(255,255,255,0.07)' : `${accent}08`, border: `1.5px solid ${accent}28`, borderRadius: isBlaze ? 12 : 18, marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>Your best ever</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
                      {blitzBest > 0 ? `${blitzBest} correct` : '—'}
                    </div>
                  </div>
                  <button onClick={startBlitzReal}
                    style={{ ...M.primaryBtn, fontSize: 17, padding: '14px 28px', borderRadius: isBlaze ? 10 : 20, boxShadow: `0 6px 22px ${accent}55`, flexShrink: 0 }}>
                    {isBlaze ? '⚡ GO!' : isRoots ? '🇳🇬 Go!' : 'Go →'}
                  </button>
                </div>

                {/* ── Monthly leaderboard ── */}
                <div>
                  {/* Title + scope switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: M.textPrimary, fontFamily: 'Nunito, sans-serif' }}>🏅 This Month&apos;s Best</div>
                      <div style={{ fontSize: 9, color: bodyColor, fontWeight: 600, fontFamily: 'Nunito, sans-serif', marginTop: 1 }}>
                        Resets {new Date(new Date().getFullYear(), new Date().getMonth()+1, 1).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 2, gap: 2 }}>
                      {[['class', student?.class_level || 'Class'], ['school','School'], ['overall','All']].map(([scope, label]) => (
                        <button key={scope} onClick={() => { setBoardScope(scope); loadBoard(scope, student) }}
                          style={{ fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', background: boardScope === scope ? (isBlaze ? '#0d0d0d' : accent) : 'transparent', color: boardScope === scope ? '#fff' : bodyColor, transition: 'all 0.15s' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Board rows */}
                  {board.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: bodyColor, fontFamily: 'Nunito, sans-serif' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>No scores yet this month</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Be the first — tap Go!</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {board.map((entry, i) => {
                        const isMe = entry.id === student?.id
                        const medals = ['🥇','🥈','🥉']
                        return (
                          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: isMe ? `${accent}14` : isNova ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: isMe ? `1.5px solid ${accent}45` : `1px solid ${isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, fontFamily: 'Nunito, sans-serif' }}>
                            <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                              {i < 3 ? <span style={{ fontSize: 18 }}>{medals[i]}</span> : <span style={{ fontSize: 11, fontWeight: 700, color: bodyColor }}>#{i+1}</span>}
                            </div>
                            <div style={{ flex: 1, fontSize: 13, fontWeight: isMe ? 900 : 700, color: isMe ? (isNova ? '#F8F7FF' : M.textPrimary) : bodyColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isMe ? `${entry.display_name} (you)` : entry.display_name}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: isMe ? accent : (i < 3 ? M.textPrimary : bodyColor), flexShrink: 0 }}>
                              {entry.blitz_monthly_best}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTIVE — Question */}
            {phase === 'active' && q && (
              <div style={{ animation: 'slideUp 0.2s ease' }}>

                {/* Score row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '0 2px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: bodyColor }}>Q{total + 1}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: M.correctColor }}>✓ {correct} correct</div>
                </div>

                {/* Question */}
                <div style={{ background: isNova ? 'rgba(255,255,255,0.06)' : M.cardBg, border: M.cardBorder, borderRadius: isBlaze ? 12 : 20, padding: '22px 20px', marginBottom: 16, boxShadow: M.cardShadow }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: M.textPrimary, lineHeight: 1.5, fontFamily: 'Nunito, sans-serif' }}>
                    <MathText text={q.question_text} />
                  </div>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map(opt => {
                    const isChosen  = chosen === opt.id
                    const isCorrect = opt.is_correct
                    let bg = M.cardBg, border = M.cardBorder, color = M.textPrimary
                    if (revealed) {
                      if (isCorrect)       { bg = `${M.correctColor}18`; border = `2px solid ${M.correctColor}`; color = M.correctColor }
                      else if (isChosen)   { bg = 'rgba(255,77,77,0.1)'; border = '2px solid #ff4d4d'; color = '#ff4d4d' }
                    } else if (isChosen) {
                      bg = `${accent}14`; border = `2px solid ${accent}`
                    }
                    return (
                      <button key={opt.id} onClick={() => handleAnswer(opt.id)}
                        style={{ width: '100%', padding: '14px 18px', textAlign: 'left', cursor: revealed ? 'default' : 'pointer', background: bg, border, borderRadius: isBlaze ? 10 : 16, fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700, color, transition: 'all 0.15s', boxShadow: M.cardShadow }}>
                        <MathText text={opt.option_text} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* DONE — Results */}
            {phase === 'done' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 20, animation: 'slideUp 0.4s ease' }}>

                <div style={{ fontSize: 56, marginBottom: 8, animation: 'pop 0.5s ease' }}>
                  {correct === 0 ? '💪' : correct < 5 ? '🌟' : correct < 10 ? '⭐' : '🏆'}
                </div>

                <div style={{ fontSize: 26, fontWeight: 900, color: M.textPrimary, marginBottom: 4 }}>
                  {isNewBest ? '🎉 New Best!' : correct === 0 ? 'Keep Going!' : 'Time\'s Up!'}
                </div>

                {/* Big score */}
                <div style={{ background: isBlaze ? '#FFD700' : `${accent}12`, border: isBlaze ? '2.5px solid #0d0d0d' : `2px solid ${accent}30`, borderRadius: isBlaze ? 14 : 24, padding: '24px 48px', marginBottom: 20, boxShadow: isBlaze ? '4px 4px 0 #0d0d0d' : `0 6px 24px ${accent}22` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isBlaze ? '#555' : bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>Correct Answers</div>
                  <div style={{ fontSize: 64, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, lineHeight: 1, fontFamily: 'Nunito, sans-serif', letterSpacing: -2 }}>{correct}</div>
                  <div style={{ fontSize: 13, color: isBlaze ? '#444' : bodyColor, marginTop: 4 }}>out of {total} attempted</div>
                </div>

                {/* Personal best badge */}
                <div style={{ fontSize: 13, color: bodyColor, marginBottom: 20, textAlign: 'center' }}>
                  {isNewBest
                    ? <span style={{ color: M.correctColor, fontWeight: 800, fontSize: 14 }}>🏆 New personal best — {correct} correct!</span>
                    : blitzBest > 0
                      ? <span>Personal best: <strong style={{ color: accent }}>{blitzBest} correct</strong></span>
                      : 'Complete more lessons for more questions!'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
                  <button onClick={startBlitzReal} style={{ ...M.primaryBtn, fontSize: 16, padding: '16px' }}>
                    {isBlaze ? '⚡ GO AGAIN' : correct < (blitzBest || correct + 1) ? `🔄 Beat your best (${blitzBest})` : '🔄 Play Again'}
                  </button>
                  <button onClick={() => router.back()}
                    style={{ padding: '14px', background: 'transparent', border: `1.5px solid ${accent}30`, borderRadius: isBlaze ? 10 : 16, fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700, color: bodyColor, cursor: 'pointer' }}>
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}