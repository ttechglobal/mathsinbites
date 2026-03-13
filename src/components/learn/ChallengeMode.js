'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import { createClient } from '@/lib/supabase/client'

const DIFF_COLOR = { easy: '#C8F135', medium: '#FFC933', hard: '#FF6B6B' }
const TIMER_SECS = 30

function getMascotMsg(streak, timeLeft, wrongCount, mode) {
  if (streak >= 5) return { pose:'celebrate', msg: mode==='blaze'?`⚡ ${streak} IN A ROW! UNSTOPPABLE!`:mode==='roots'?`🇳🇬 ${streak} correct! You too much!`:`🔥 ${streak} in a row — on fire!` }
  if (streak >= 3) return { pose:'celebrate', msg: mode==='roots'?`Oya! ${streak} correct, you dey try!`:`${streak} correct — great momentum! 🎯` }
  if (wrongCount >= 3) return { pose:'think', msg: mode==='roots'?`E dey hard, but you fit do am! 💪`:`Tough session — keep pushing! 💪` }
  if (timeLeft <= 7 && timeLeft > 0) return { pose:'think', msg: mode==='blaze'?`HURRY!! RUNNING OUT OF TIME!`:`⏰ Hurry — ${timeLeft}s left!` }
  return { pose:'idle', msg: mode==='blaze'?`ANSWER FAST! CLOCK IS TICKING!`:mode==='roots'?`Think am well, then answer! 🇳🇬`:`Think it through — ${TIMER_SECS}s per question! ⏱` }
}

export default function ChallengeMode({ questions, topicTitle, topicId, student, isDaily, dailyDone }) {
  const router   = useRouter()
  const { M, mode } = useMode()
  const supabase = createClient()

  const [qIdx,         setQIdx]         = useState(0)
  const [phase,        setPhase]        = useState('question')
  const [streak,       setStreak]       = useState(0)
  const [wrongCount,   setWrongCount]   = useState(0)
  const [results,      setResults]      = useState([])
  const [xpEarned,     setXpEarned]     = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(TIMER_SECS)
  const [selectedOpt,  setSelectedOpt]  = useState(null)
  const [dailyAwarded, setDailyAwarded] = useState(false)
  const timerRef = useRef(null)

  const currentQ   = questions[qIdx]
  const accent     = M.accentColor
  const card       = { background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, boxShadow:M.cardShadow }
  const mascot     = getMascotMsg(streak, timeLeft, wrongCount, mode)
  const letters    = ['A','B','C','D']

  // Per-question countdown timer
  useEffect(() => {
    if (phase !== 'question') return
    setTimeLeft(TIMER_SECS)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setStreak(0)
          setWrongCount(w => w + 1)
          setResults(r => [...r, false])
          setPhase('wrong')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [qIdx, phase])

  // Award daily bonus once when session ends
  useEffect(() => {
    if (phase !== 'done' || dailyAwarded || !isDaily || !student?.id) return
    setDailyAwarded(true)
    const allCorrect = results.length === questions.length && results.every(Boolean)
    const bonus = allCorrect ? 50 : 0
    const today = new Date().toISOString().split('T')[0]
    supabase.from('daily_challenges').upsert({
      student_id:     student.id,
      challenge_date: today,
      question_ids:   questions.map(q => q.id),
      score:          results.filter(Boolean).length,
      xp_awarded:     xpEarned + bonus,
      completed:      true,
    }, { onConflict: 'student_id,challenge_date' })
    if (bonus > 0) {
      supabase.from('students').update({
        xp:        (student.xp||0) + bonus,
        monthly_xp:(student.monthly_xp||0) + bonus,
      }).eq('id', student.id)
    }
  }, [phase])

  async function handleAnswer(opt) {
    if (phase !== 'question') return
    clearInterval(timerRef.current)
    setSelectedOpt(opt)
    const correct = opt.is_correct
    const newResults = [...results, correct]
    setResults(newResults)

    if (correct) {
      const newStreak = streak + 1
      setStreak(newStreak)
      const xp = 3 + (newStreak % 5 === 0 ? 15 : 0)
      setXpEarned(p => p + xp)
      setPhase('correct')
      if (student?.id && currentQ?.id) {
        supabase.from('practice_attempts').insert({ student_id:student.id, question_id:currentQ.id, is_correct:true })
        supabase.from('students').update({ xp:(student.xp||0)+xp, monthly_xp:(student.monthly_xp||0)+xp }).eq('id', student.id)
      }
      setTimeout(() => {
        setPhase('question')
        setSelectedOpt(null)
        if (qIdx + 1 < questions.length) setQIdx(i => i + 1)
        else setPhase('done')
      }, 1200)
    } else {
      setStreak(0)
      setWrongCount(w => w + 1)
      setPhase('wrong')
      if (student?.id && currentQ?.id) {
        supabase.from('practice_attempts').insert({ student_id:student.id, question_id:currentQ.id, is_correct:false })
      }
    }
  }

  function nextQuestion() {
    setPhase('question')
    setSelectedOpt(null)
    if (qIdx + 1 < questions.length) setQIdx(i => i + 1)
    else setPhase('done')
  }

  function resetSession() {
    setQIdx(0); setPhase('question'); setStreak(0); setWrongCount(0)
    setResults([]); setXpEarned(0); setSelectedOpt(null); setTimeLeft(TIMER_SECS)
  }

  // ── Already done today ──────────────────────────────────────────────────────
  if (dailyDone) {
    return (
      <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ animation:'float 2s ease-in-out infinite', marginBottom:16 }}><BicPencil pose="celebrate" size={100} /></div>
        <div style={{ fontFamily:M.headingFont, fontSize:22, fontWeight:900, color:M.textPrimary, textAlign:'center', marginBottom:8 }}>🏆 Already done today!</div>
        <div style={{ fontSize:13, color:M.textSecondary, textAlign:'center', maxWidth:300, lineHeight:1.7, fontFamily:'Nunito,sans-serif', marginBottom:24 }}>
          {mode==='roots' ? `You don do today's challenge! Come back tomorrow for another one. 🇳🇬` : `You've already completed today's daily challenge. Come back tomorrow for a fresh set!`}
        </div>
        <button onClick={() => router.push('/learn')} style={{ ...M.primaryBtn }}>Back to Map</button>
        <button onClick={() => router.push('/learn/practice')} style={{ ...M.ghostBtn, marginTop:10 }}>Practice instead →</button>
      </div>
    )
  }

  // ── No questions ────────────────────────────────────────────────────────────
  if (!currentQ && phase !== 'done') {
    return (
      <div style={{ minHeight:'100vh', background:M.lessonBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:M.font }}>
        <BicPencil pose="think" size={90} />
        <div style={{ fontFamily:M.headingFont, fontSize:18, fontWeight:900, color:M.textPrimary, margin:'16px 0 8px', textAlign:'center' }}>No questions yet!</div>
        <div style={{ fontSize:13, color:M.textSecondary, textAlign:'center', maxWidth:300, lineHeight:1.6, fontFamily:'Nunito,sans-serif', marginBottom:20 }}>
          {mode==='roots'
            ? `Challenge questions haven't been generated for this topic yet. Try a different one! 🇳🇬`
            : `Challenge questions for this topic haven't been generated yet. Try mixed challenge or a different topic.`}
        </div>
        <button onClick={() => router.push('/learn/challenge')} style={{ ...M.primaryBtn }}>Mixed Challenge →</button>
        <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn, marginTop:10 }}>Back to Map</button>
      </div>
    )
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const correct   = results.filter(Boolean).length
    const finalAcc  = Math.round((correct / Math.max(results.length, 1)) * 100)
    const allCorrect = correct === questions.length && questions.length > 0
    const dailyBonus = (isDaily && allCorrect) ? 50 : 0
    return (
      <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ animation:'float 2s ease-in-out infinite', marginBottom:16 }}><BicPencil pose={finalAcc>=70?'celebrate':'think'} size={100} /></div>
        <div style={{ fontFamily:M.headingFont, fontSize:22, fontWeight:900, color:M.textPrimary, textAlign:'center', marginBottom:8 }}>
          {finalAcc===100?'🏆 Perfect!':finalAcc>=80?'🎉 Excellent!':finalAcc>=60?'✅ Good effort!':'💪 Keep going!'}
        </div>
        {isDaily && allCorrect && (
          <div style={{ background:'rgba(255,201,51,0.12)', border:'1px solid rgba(255,201,51,0.35)', borderRadius:12, padding:'10px 20px', marginBottom:14, textAlign:'center' }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#FFC933', fontFamily:'Nunito,sans-serif' }}>🏆 Daily Bonus: +50 XP!</div>
          </div>
        )}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          {[
            { label:'Correct',  value:`${correct}/${results.length}`, color:M.correctColor },
            { label:'Accuracy', value:`${finalAcc}%`,                 color:finalAcc>=70?M.correctColor:'#FFC933' },
            { label:'XP',       value:`+${xpEarned+dailyBonus}`,      color:'#FFC933' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, textAlign:'center', padding:'12px 14px', minWidth:80 }}>
              <div style={{ fontSize:18, fontWeight:900, color, fontFamily:M.headingFont }}>{value}</div>
              <div style={{ fontSize:10, color:M.textSecondary, fontFamily:'Nunito,sans-serif' }}>{label}</div>
            </div>
          ))}
        </div>
        {finalAcc < 60 && (
          <div style={{ ...card, padding:'12px 16px', marginBottom:16, maxWidth:320, textAlign:'center' }}>
            <div style={{ fontSize:12, color:M.textSecondary, lineHeight:1.7, fontFamily:'Nunito,sans-serif' }}>
              {mode==='roots' ? `No worry! Practice first, then come back and beat this challenge! 💪` : `Build your foundation in Practice Mode first, then come back and crush this! 📚`}
            </div>
            <button onClick={() => router.push(topicId?`/learn/practice?topicId=${topicId}`:'/learn/practice')} style={{ ...M.ghostBtn, marginTop:10, width:'100%' }}>
              Try Practice Mode →
            </button>
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300 }}>
          {!isDaily && <button onClick={resetSession} style={{ ...M.primaryBtn }}>{mode==='blaze'?'⚡ GO AGAIN!':'Try Again →'}</button>}
          <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn }}>Back to Map</button>
        </div>
      </div>
    )
  }

  // ── Question screen ─────────────────────────────────────────────────────────
  const timerPct   = (timeLeft / TIMER_SECS) * 100
  const timerColor = timeLeft > 15 ? '#C8F135' : timeLeft > 7 ? '#FFC933' : '#FF6B6B'

  return (
    <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column' }}>
      {phase==='correct' && <div style={{ position:'fixed', inset:0, background:`${M.correctColor}10`, zIndex:10, pointerEvents:'none', animation:'pulse 0.3s ease' }} />}
      {phase==='wrong'   && <div style={{ position:'fixed', inset:0, background:`${M.wrongColor}08`,   zIndex:10, pointerEvents:'none', animation:'pulse 0.3s ease' }} />}

      {/* Timer bar */}
      <div style={{ height:6, background:M.progressTrack, flexShrink:0 }}>
        <div style={{ width:`${phase==='question'?timerPct:phase==='correct'?100:0}%`, height:'100%', background:timerColor, transition:'width 1s linear, background 0.3s' }} />
      </div>

      {/* Top bar */}
      <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${accent}18`, background:M.hudBg }}>
        <button onClick={() => router.back()} style={{ width:32, height:32, borderRadius:'50%', background:M.lessonCard, border:M.lessonBorder, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:M.textSecondary, fontSize:14 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ fontSize:12, fontWeight:800, color:M.textPrimary, fontFamily:M.headingFont }}>{topicTitle}</div>
            <span style={{ fontSize:9, fontWeight:900, color:'#FF6B6B', background:'rgba(255,107,107,0.15)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:20, padding:'1px 7px', textTransform:'uppercase', letterSpacing:0.8 }}>
              {isDaily?'🏆 Daily':'⚡ Challenge'}
            </span>
          </div>
          <div style={{ fontSize:10, color:M.textSecondary }}>{qIdx+1} / {questions.length}</div>
        </div>
        {/* Countdown */}
        <div style={{ background:timeLeft<=7?'rgba(255,107,107,0.12)':M.lessonCard, border:`1px solid ${timerColor}40`, borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10 }}>⏱</span>
          <span style={{ fontSize:13, fontWeight:900, color:timerColor, fontFamily:'Nunito,sans-serif', minWidth:20, textAlign:'center' }}>{phase==='question'?timeLeft:'—'}</span>
        </div>
        {/* Streak */}
        <div style={{ background:streak>=3?accent:M.lessonCard, border:M.lessonBorder, borderRadius:20, padding:'3px 10px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10 }}>🔥</span>
          <span style={{ fontSize:11, fontWeight:900, color:streak>=3?M.textOnAccent:M.textSecondary, fontFamily:'Nunito,sans-serif' }}>×{streak}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'14px 16px', gap:10, maxWidth:560, margin:'0 auto', width:'100%' }}>

        {/* Tags */}
        <div style={{ display:'flex', gap:6 }}>
          {currentQ.difficulty && (
            <span style={{ fontSize:9, fontWeight:900, color:DIFF_COLOR[currentQ.difficulty]||accent, background:(DIFF_COLOR[currentQ.difficulty]||accent)+'18', border:`1px solid ${(DIFF_COLOR[currentQ.difficulty]||accent)}30`, borderRadius:20, padding:'2px 9px', letterSpacing:1, textTransform:'uppercase' }}>
              {currentQ.difficulty}
            </span>
          )}
          {currentQ.exam_tag && (
            <span style={{ fontSize:9, fontWeight:900, color:'#00D4C8', background:'#00D4C818', border:'1px solid #00D4C830', borderRadius:20, padding:'2px 9px', letterSpacing:1, textTransform:'uppercase' }}>
              {currentQ.exam_tag}{currentQ.exam_year&&currentQ.exam_year!=='style'?` ${currentQ.exam_year}`:''}
            </span>
          )}
        </div>

        {/* Question — NO hint in challenge */}
        <div style={{ ...card, padding:'16px' }}>
          <div style={{ fontSize:15, fontWeight:800, color:M.textPrimary, lineHeight:1.6, fontFamily:'Nunito,sans-serif' }}>
            {currentQ.question_text}
          </div>
        </div>

        {/* Mascot */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
          <BicPencil pose={mascot.pose} size={52} style={{ flexShrink:0 }} />
          <div style={{
            flex:1, padding:'9px 13px',
            background: phase==='correct'?`${M.correctColor}12`:phase==='wrong'?`${M.wrongColor}10`:`${accent}0A`,
            border:`1.5px solid ${phase==='correct'?M.correctColor:phase==='wrong'?M.wrongColor:accent+'25'}`,
            borderRadius:'14px 14px 14px 4px',
            fontSize:12, fontFamily:'Nunito,sans-serif', fontWeight:600, lineHeight:1.6,
            color: phase==='correct'?M.correctColor:phase==='wrong'?M.wrongColor:M.textSecondary,
          }}>
            {phase==='correct' && (mode==='roots'?'Correct! 🙌':mode==='blaze'?'⚡ CORRECT!':'Correct! 🎉')}
            {phase==='wrong' && timeLeft===0 && '⏰ Time\'s up!'}
            {phase==='wrong' && timeLeft>0 && mascot.msg}
            {phase==='question' && mascot.msg}
          </div>
        </div>

        {/* Wrong: show explanation + correct answer */}
        {phase==='wrong' && (
          <div style={{ ...card, padding:'12px 14px', background:`${M.wrongColor}06`, borderColor:`${M.wrongColor}25` }}>
            <div style={{ fontSize:10, fontWeight:800, color:M.wrongColor, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>
              {timeLeft===0 ? '⏰ Time up — correct answer' : 'Wrong — here\'s why'}
            </div>
            {currentQ.explanation && (
              <div style={{ fontSize:12, color:M.textSecondary, lineHeight:1.7, fontFamily:'Nunito,sans-serif', marginBottom:6 }}>{currentQ.explanation}</div>
            )}
            <div style={{ fontSize:11, color:M.correctColor, fontWeight:700, fontFamily:'Nunito,sans-serif' }}>
              ✓ {(currentQ.options||[]).find(o=>o.is_correct)?.option_text}
            </div>
          </div>
        )}

        {/* Options */}
        {phase!=='correct' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {(currentQ.options||[]).map((opt, i) => {
              const isSelected  = selectedOpt?.option_text === opt.option_text
              const showCorrect = phase==='wrong' && opt.is_correct
              const showWrong   = phase==='wrong' && isSelected && !opt.is_correct
              return (
                <button key={i} onClick={() => handleAnswer(opt)} disabled={phase!=='question'}
                  style={{
                    background: showCorrect?`${M.correctColor}18`:showWrong?`${M.wrongColor}18`:M.lessonCard,
                    border:`2px solid ${showCorrect?M.correctColor:showWrong?M.wrongColor:`${accent}22`}`,
                    borderRadius:M.cardRadius, padding:'12px 10px',
                    cursor:phase==='question'?'pointer':'default',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    fontFamily:'Nunito,sans-serif', transition:'all 0.15s', minHeight:70,
                  }}
                  onMouseEnter={e=>{ if(phase!=='question') return; e.currentTarget.style.borderColor=accent; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${accent}22`; e.currentTarget.style.transform='' }}
                >
                  <span style={{ width:22, height:22, borderRadius:'50%', background:`${accent}20`, color:accent, fontSize:10, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{letters[i]}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:M.textPrimary, lineHeight:1.3, textAlign:'center' }}>{opt.option_text}</span>
                </button>
              )
            })}
          </div>
        )}

        {phase==='wrong' && (
          <button onClick={nextQuestion} style={{ ...M.primaryBtn }}>
            {qIdx+1<questions.length?'Next Question →':'See Results →'}
          </button>
        )}
      </div>
    </div>
  )
}
