// src/app/learn/challenge/page.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import { createClient } from '@/lib/supabase/client'

const supabaseClient = createClient()

export default function DailyChallengePage() {
  const router   = useRouter()
  const { M, mode } = useMode()

  const accent   = M.accentColor || '#7C3AED'
  const bodyColor = M.textSecondary || '#888'
  const isBlaze  = mode === 'blaze'
  const isNova   = mode === 'nova'

  const [question,    setQuestion]    = useState(null)
  const [attempt,     setAttempt]     = useState(null)
  const [solversCount,setSolversCount]= useState(0)
  const [loading,     setLoading]     = useState(true)
  const [phase, setPhase] = useState('question') // question | correct | revealed | no_question
  const [answer,      setAnswer]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [wrongShake,  setWrongShake]  = useState(false)
  const [hintsShown,  setHintsShown]  = useState(0)
  const [solvers,     setSolvers]     = useState([])
  const [studentId,   setStudentId]   = useState(null)
  const inputRef = useRef(null)

  // ── Load today's question ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const res = await fetch('/api/daily-challenge')
      const data = await res.json()

      if (!data.question) { setPhase('no_question'); setLoading(false); return }

      setQuestion(data.question)
      setAttempt(data.attempt)
      setSolversCount(data.solversCount || 0)

      // Get student id for leaderboard highlighting
      const { data: profile } = await supabaseClient
        .from('profiles').select('active_student_id').eq('id', user.id).single()
      setStudentId(profile?.active_student_id)

      if (data.attempt?.solved) {
        setPhase('correct')
        loadLeaderboard(data.question.id)
      } else if (data.attempt?.revealed_answer) {
        setPhase('revealed')
      }

      setLoading(false)
    }
    load()
  }, [])

  async function loadLeaderboard(qId) {
    const res = await fetch(`/api/daily-challenge/leaderboard?questionId=${qId}`)
    const data = await res.json()
    setSolvers(data.solvers || [])
  }

  // ── Submit answer ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!answer.trim() || submitting || !question) return
    setSubmitting(true)

    const res = await fetch('/api/daily-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', answer: answer.trim(), questionId: question.id }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (data.correct) {
      setQuestion(q => ({ ...q, worked_solution: data.worked_solution, correct_answer: data.correct_answer }))
      setPhase('correct')
      loadLeaderboard(question.id)
    } else {
      setWrongShake(true)
      setTimeout(() => setWrongShake(false), 600)
    }
  }

  // ── Reveal answer ──────────────────────────────────────────────────────────
  async function handleReveal() {
    if (!question) return
    const res = await fetch('/api/daily-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal', questionId: question.id }),
    })
    const data = await res.json()
    setQuestion(q => ({ ...q, correct_answer: data.correct_answer, worked_solution: data.worked_solution }))
    setPhase('revealed')
  }

  const hints = question ? [question.hint_1, question.hint_2, question.hint_3].filter(Boolean) : []

  if (loading) return (
    <div style={{ minHeight: '100vh', background: M.mapBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 36, animation: 'spin 1s linear infinite' }}>⚡</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: M.mapBg, fontFamily: 'Nunito, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <style>{`
          @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
          @keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
          @keyframes pop{0%{transform:scale(0.85)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
          @keyframes pulse{0%,100%{box-shadow:0 0 0 0 ${accent}40}50%{box-shadow:0 0 0 8px ${accent}00}}
          .hint-btn:hover{opacity:1!important}
        `}</style>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, background: M.hudBg, flexShrink: 0 }}>
          <button onClick={() => router.push('/learn?tab=learn')}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${isNova ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`, background: 'none', cursor: 'pointer', fontSize: 15, color: bodyColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ fontSize: 13, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont }}>⚡ Daily Challenge</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: accent, background: `${accent}14`, border: `1px solid ${accent}30`, borderRadius: 20, padding: '3px 10px' }}>+15 XP</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>

          {/* ── No question state ── */}
          {phase === 'no_question' && (
            <div style={{ textAlign: 'center', paddingTop: 60, animation: 'slideUp 0.4s ease' }}>
              <BicPencil pose="think" size={90} style={{ display: 'inline-block', marginBottom: 20 }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: M.textPrimary, marginBottom: 8 }}>No challenge today</div>
              <div style={{ fontSize: 13, color: bodyColor, lineHeight: 1.7 }}>Your teacher is preparing today's challenge.<br/>Check back soon!</div>
            </div>
          )}

          {/* ── Active question ── */}
          {(phase === 'question' || phase === 'revealed') && question && (
            <div style={{ animation: 'slideUp 0.4s ease' }}>
              {/* Date pill */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: bodyColor, background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>

              {/* Topic pill */}
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: accent, background: `${accent}12`, border: `1px solid ${accent}25`, borderRadius: 20, padding: '4px 14px' }}>{question.topic}</span>
              </div>

              {/* Question card */}
              <div style={{ background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', border: isBlaze ? '2.5px solid #0d0d0d' : `1.5px solid ${isNova ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`, borderRadius: isBlaze ? 12 : 20, padding: '20px 18px', marginBottom: 16, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>{question.difficulty === 'hard' ? '🔥 Hard' : '💪 Medium'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: M.textPrimary, lineHeight: 1.65 }}>{question.question_text}</div>
              </div>

              {/* Hints */}
              {phase === 'question' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {hints.map((hint, i) => (
                    <div key={i}>
                      {hintsShown > i ? (
                        <div style={{ background: isNova ? 'rgba(255,255,255,0.05)' : `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: bodyColor, fontWeight: 600, animation: 'slideUp 0.3s ease' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: accent, marginRight: 8 }}>HINT {i+1}</span>{hint}
                        </div>
                      ) : hintsShown === i ? (
                        <button className="hint-btn" onClick={() => setHintsShown(i + 1)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px dashed ${accent}40`, background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: accent, opacity: 0.7, fontFamily: 'Nunito, sans-serif', textAlign: 'left' }}>
                          💡 Show Hint {i + 1} {i > 0 ? '(more specific)' : ''}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer input */}
              {phase === 'question' && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>Your Answer</label>
                    <div style={{ animation: wrongShake ? 'shake 0.5s ease' : 'none' }}>
                      <input
                        ref={inputRef}
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="Type your answer here…"
                        style={{ width: '100%', padding: '14px 16px', borderRadius: isBlaze ? 10 : 14, border: wrongShake ? '2px solid #FF6B6B' : `1.5px solid ${isNova ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', color: M.textPrimary, fontSize: 16, fontWeight: 700, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
                      />
                    </div>
                    {wrongShake && <div style={{ fontSize: 11, color: '#FF6B6B', fontWeight: 700, marginTop: 5 }}>Not quite — try again or use a hint!</div>}
                  </div>

                  <button onClick={handleSubmit} disabled={!answer.trim() || submitting}
                    style={{ width: '100%', padding: '15px', borderRadius: isBlaze ? 10 : 16, border: isBlaze ? '2px solid #0d0d0d' : 'none', background: answer.trim() ? (isBlaze ? '#FFD700' : `linear-gradient(135deg,${accent},${M.accent2||accent}DD)`) : (isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), color: answer.trim() ? (isBlaze ? '#0d0d0d' : '#fff') : bodyColor, fontSize: 15, fontWeight: 900, cursor: answer.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', boxShadow: answer.trim() ? (isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 20px ${accent}40`) : 'none', transition: 'all 0.15s', marginBottom: 10 }}>
                    {submitting ? 'Checking…' : 'Submit Answer'}
                  </button>

                  {/* Show answer — subtle */}
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={handleReveal}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: bodyColor, opacity: 0.45, fontFamily: 'Nunito, sans-serif', fontWeight: 700, padding: '4px 8px' }}>
                      Show answer (you won't earn XP)
                    </button>
                  </div>
                </>
              )}

              {/* Revealed state */}
              {phase === 'revealed' && question.correct_answer && (
                <div style={{ animation: 'slideUp 0.4s ease' }}>
                  <div style={{ background: 'rgba(255,107,107,0.08)', border: '1.5px solid rgba(255,107,107,0.25)', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#FF6B6B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Correct Answer</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: M.textPrimary }}>{question.correct_answer}</div>
                  </div>
                  {question.worked_solution && <WorkedSolution solution={question.worked_solution} M={M} isNova={isNova} isBlaze={isBlaze} accent={accent} bodyColor={bodyColor} />}
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: bodyColor, fontWeight: 700 }}>Come back tomorrow for a new challenge 💪</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Correct! ── */}
          {phase === 'correct' && question && (
            <div style={{ animation: 'slideUp 0.4s ease' }}>
              {/* Confetti particles */}
              <Confetti accent={accent} />

              {/* Success banner */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ animation: 'pop 0.5s ease', display: 'inline-block', marginBottom: 12 }}>
                  <BicPencil pose="celebrate" size={90} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont, marginBottom: 4 }}>Correct! 🎉</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isBlaze ? '#FFD700' : `linear-gradient(135deg,${accent},${M.accent2||accent}DD)`, borderRadius: 20, padding: '8px 20px', boxShadow: `0 4px 16px ${accent}40` }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff' }}>+15 XP earned!</span>
                </div>
              </div>

              {/* Worked solution */}
              {question.worked_solution && <WorkedSolution solution={question.worked_solution} M={M} isNova={isNova} isBlaze={isBlaze} accent={accent} bodyColor={bodyColor} />}

              {/* Leaderboard — always show after solving */}
              <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: M.textPrimary, marginBottom: 10, fontFamily: M.headingFont }}>🏆 Today's Solvers</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {solvers.map((s, i) => {
                      const isMe = s.student_id === studentId
                      const medals = ['🥇','🥈','🥉']
                      return (
                        <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isMe ? `${accent}14` : (isNova ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), border: isMe ? `1.5px solid ${accent}40` : `1px solid ${isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 12, fontFamily: 'Nunito, sans-serif' }}>
                          <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                            {i < 3 ? <span style={{ fontSize: 16 }}>{medals[i]}</span> : <span style={{ fontSize: 11, fontWeight: 700, color: bodyColor }}>#{i+1}</span>}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: isMe ? 900 : 700, color: isMe ? M.textPrimary : bodyColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isMe ? `${s.display_name} (you)` : s.display_name}
                          </div>
                          <div style={{ fontSize: 10, color: bodyColor, flexShrink: 0 }}>{s.class_level}</div>
                        </div>
                      )
                    })}
                  </div>
                  {solvers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: bodyColor, fontSize: 13, fontWeight: 700 }}>🌟 You're the first to solve today!</div>
                  )}
                  {solversCount > solvers.length && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: bodyColor, fontWeight: 700 }}>+ {solversCount - solvers.length} more solver{solversCount - solvers.length !== 1 ? 's' : ''}</div>
                  )}
                </div>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <div style={{ fontSize: 12, color: bodyColor, fontWeight: 700 }}>New challenge tomorrow 💪</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkedSolution({ solution, M, isNova, isBlaze, accent, bodyColor }) {
  return (
    <div style={{ background: isNova ? 'rgba(255,255,255,0.05)' : `${accent}07`, border: `1.5px solid ${accent}20`, borderRadius: 14, padding: '16px' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Worked Solution</div>
      {solution.split('\n').map((line, i) => {
        const isAnswer = line.trim().startsWith('Answer:')
        const isMath   = /^[0-9\-+×÷=()₦%.,\s]+$/.test(line.trim()) && line.trim().length > 0
        return (
          <div key={i} style={{ fontSize: isAnswer ? 16 : isMath ? 15 : 12, fontWeight: isAnswer ? 900 : isMath ? 700 : 600, color: isAnswer ? accent : isMath ? M.textPrimary : bodyColor, fontStyle: isMath ? 'normal' : 'italic', marginBottom: 4, lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}>
            {line || '\u00A0'}
          </div>
        )
      })}
    </div>
  )
}

function Confetti({ accent }) {
  const colours = [accent, '#FFD700', '#FF6B6B', '#00E676', '#A78BFA']
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden', height: 300 }}>
      {Array.from({ length: 22 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 4.5 + Math.random() * 4) % 100}%`,
          top: -20,
          width: i % 3 === 0 ? 10 : 6,
          height: i % 3 === 0 ? 10 : 6,
          borderRadius: i % 2 === 0 ? '50%' : 2,
          background: colours[i % colours.length],
          animation: `confetti-fall ${1.2 + (i % 4) * 0.3}s ease ${(i % 6) * 0.1}s forwards`,
        }} />
      ))}
    </div>
  )
}