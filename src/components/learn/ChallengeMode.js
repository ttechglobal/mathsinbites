'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import { createClient } from '@/lib/supabase/client'
import ExitConfirmModal from './ExitConfirmModal'

const DIFF_COLOR = { easy: '#C8F135', medium: '#FFC933', hard: '#FF6B6B' }
const TIMER_SECS = 60   // 60 seconds per question

function parseSteps(text) {
  if (!text) return []
  const byNewline = text.split(/\n+/).map(s => s.trim()).filter(Boolean)
  if (byNewline.length > 1) return byNewline
  const numbered = text.split(/(?=(?:Step\s+)?\d+[\.\):\-]\s)/i).map(s => s.trim()).filter(Boolean)
  if (numbered.length > 1) return numbered
  const bySentence = text.split(/(?<=[.!?])\s+(?=[A-Z∴∵])/).map(s => s.trim()).filter(Boolean)
  return bySentence.length > 1 ? bySentence : [text]
}

function StepExplanation({ text, M }) {
  const steps = parseSteps(text)
  const accent = M.accentColor
  if (steps.length === 1) {
    return (
      <div style={{ background:'#FEFDE8', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, color:'#333', lineHeight:1.8, fontFamily:'Nunito,sans-serif' }}>
        {text}
      </div>
    )
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display:'flex', flexDirection:'row', alignItems:'flex-start', gap:10 }}>
          <div style={{ width:28, height:28, minWidth:28, minHeight:28, flexShrink:0, borderRadius:'50%', background:accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', marginTop:6 }}>{i+1}</div>
          <div style={{ flex:1, minWidth:0, background:'#FEFDE8', border:'1px solid #F0EAC0', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, color:'#2D2D2D', lineHeight:1.8, fontFamily:'Nunito,sans-serif', wordWrap:'break-word', overflowWrap:'break-word', whiteSpace:'normal' }}>{step.trim()}</div>
        </div>
      ))}
    </div>
  )
}

export default function ChallengeMode({ questions, topicTitle, topicId, student, isDaily, dailyDone, userId }) {
  const router   = useRouter()
  const { M, mode } = useMode()
  const supabase = createClient()

  // answers: array of { correct, timeTaken } — only recorded when user submits
  const [qIdx,         setQIdx]         = useState(0)
  const [phase,        setPhase]        = useState('question')
  const [streak,       setStreak]       = useState(0)
  const [results,      setResults]      = useState([])
  const [xpEarned,     setXpEarned]     = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(TIMER_SECS)
  const [selectedOpt,  setSelectedOpt]  = useState(null)
  const [answerMap,    setAnswerMap]    = useState({})
  const [showExitModal, setShowExitModal] = useState(false)
  const [dailyAwarded, setDailyAwarded] = useState(false)
  const [reviewIdx,    setReviewIdx]    = useState(0)
  const [showWhy,      setShowWhy]      = useState({})
  const timerRef  = useRef(null)
  const startRef  = useRef(Date.now())

  const currentQ = questions[qIdx]
  const accent   = M.accentColor
  const card     = { background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, boxShadow:M.cardShadow }
  const letters  = ['A','B','C','D']

  // Per-question countdown timer
  useEffect(() => {
    if (phase !== 'question') return
    setTimeLeft(TIMER_SECS)
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          // Time up — record as wrong, auto-advance
          const timeTaken = TIMER_SECS
          setResults(r => [...r, { correct: false, timeTaken, questionId: questions[qIdx]?.id }])
          setStreak(0)
          if (student?.id && questions[qIdx]?.id) {
            supabase.from('practice_attempts').insert({ student_id:student.id, question_id:questions[qIdx].id, is_correct:false })
          }
          setSelectedOpt(null)
          setPhase('question')
          if (qIdx + 1 < questions.length) setQIdx(i => i + 1)
          else setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [qIdx, phase])

  // Award daily bonus once when done
  useEffect(() => {
    if (phase !== 'done' || dailyAwarded || !isDaily || !student?.id) return
    setDailyAwarded(true)
    const correct   = results.filter(r => r.correct).length
    const allCorrect = correct === questions.length && questions.length > 0
    const bonus      = allCorrect ? 50 : 0
    const today      = new Date().toISOString().split('T')[0]
    supabase.from('daily_challenges').upsert({
      student_id:     student.id,
      challenge_date: today,
      question_ids:   questions.map(q => q.id),
      score:          correct,
      xp_awarded:     xpEarned + bonus,
      completed:      true,
    }, { onConflict: 'student_id,challenge_date' })
    if (bonus > 0 && userId) {
      supabase.rpc('add_xp', { amount: bonus })
    }
  }, [phase])

  function handleSelect(opt) {
    if (phase !== 'question') return
    // Just highlight — don't reveal answer yet
    setSelectedOpt(opt)
    setPhase('selected')
  }

  async function handleSubmit() {
    if (!selectedOpt) return
    clearInterval(timerRef.current)
    const timeTaken = TIMER_SECS - timeLeft
    const correct   = selectedOpt.is_correct
    const newResults = [...results, { correct, timeTaken, questionId: currentQ?.id }]
    setResults(newResults)
    setAnswerMap(m => ({ ...m, [qIdx]: selectedOpt }))  // save for back nav

    if (correct) setStreak(s => s + 1)
    else setStreak(0)

    const xp = correct ? 3 : 0
    if (xp > 0) {
      setXpEarned(p => p + xp)
      if (userId) {
        supabase.rpc('add_xp', { amount: xp })
      }
    }

    if (student?.id && currentQ?.id) {
      supabase.from('practice_attempts').insert({ student_id:student.id, question_id:currentQ.id, is_correct:correct })
    }

    setSelectedOpt(null)
    setPhase('question')
    if (qIdx + 1 < questions.length) setQIdx(i => i + 1)
    else setPhase('done')
  }

  function resetSession() {
    setQIdx(0); setPhase('question'); setStreak(0)
    setResults([]); setXpEarned(0); setSelectedOpt(null)
    setAnswerMap({}); setTimeLeft(TIMER_SECS); setReviewIdx(0); setShowWhy({})
  }

  // ── Already done today ──────────────────────────────────────────────────────
  if (dailyDone) {
    return (
      <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ animation:'float 2s ease-in-out infinite', marginBottom:16 }}><BicPencil pose="celebrate" size={100} /></div>
        <div style={{ fontFamily:M.headingFont, fontSize:22, fontWeight:900, color:M.textPrimary, textAlign:'center', marginBottom:8 }}>🏆 Already done today!</div>
        <div style={{ fontSize:13, color:M.textSecondary, textAlign:'center', maxWidth:300, lineHeight:1.7, fontFamily:'Nunito,sans-serif', marginBottom:24 }}>
          {mode==='roots' ? `You don do today's challenge! Come back tomorrow. 🇳🇬` : `You've completed today's daily challenge. Come back tomorrow for a fresh set!`}
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
          {mode==='roots' ? `Challenge questions haven't been generated yet. 🇳🇬` : `Challenge questions haven't been generated yet. Ask your teacher to add some.`}
        </div>
        <button onClick={() => router.push('/learn/practice')} style={{ ...M.primaryBtn }}>Go to Practice →</button>
        <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn, marginTop:10 }}>Back to Map</button>
      </div>
    )
  }

  // ── Done / Review screen ────────────────────────────────────────────────────
  if (phase === 'done') {
    const correct    = results.filter(r => r.correct).length
    const finalAcc   = Math.round((correct / Math.max(results.length, 1)) * 100)
    const allCorrect = correct === questions.length && questions.length > 0
    const dailyBonus = (isDaily && allCorrect) ? 50 : 0
    const avgTime    = results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / results.length)
      : 0
    const reviewQ    = questions[reviewIdx]
    const reviewR    = results[reviewIdx]

    return (
      <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${accent}18`, background:M.hudBg, flexShrink:0 }}>
          <button onClick={() => router.push('/learn')} style={{ width:32, height:32, borderRadius:'50%', background:M.lessonCard, border:M.lessonBorder, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:M.textSecondary, fontSize:14 }}>←</button>
          <div style={{ flex:1, fontSize:13, fontWeight:800, color:M.textPrimary, fontFamily:M.headingFont }}>
            {isDaily ? '🏆 Daily Challenge' : '⚡ Challenge'} · Results
          </div>
          <div style={{ fontSize:13, fontWeight:900, color:finalAcc>=70?M.correctColor:'#FFC933' }}>{finalAcc}%</div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px', maxWidth:560, margin:'0 auto', width:'100%' }}>

          {/* Mascot + summary */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:16 }}>
            <BicPencil pose={finalAcc>=70?'celebrate':'think'} size={74} style={{ flexShrink:0, animation:'float 2s ease-in-out infinite' }} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:M.headingFont, fontSize:18, fontWeight:900, color:M.textPrimary, marginBottom:4 }}>
                {finalAcc===100?'🏆 Perfect!':finalAcc>=80?'🎉 Excellent!':finalAcc>=60?'✅ Good effort!':'💪 Keep going!'}
              </div>
              <div style={{ fontSize:12, color:M.textSecondary, fontFamily:'Nunito,sans-serif', lineHeight:1.6 }}>
                {mode==='roots'
                  ? `${correct} out of ${questions.length} — ${finalAcc>=70?'you sabi! 🇳🇬':'no worry, try again! 💪'}`
                  : `${correct} out of ${questions.length} — ${finalAcc>=70?'solid performance!':'keep practising!'}`}
              </div>
            </div>
          </div>

          {/* Daily bonus */}
          {isDaily && allCorrect && (
            <div style={{ background:'rgba(255,201,51,0.12)', border:'1px solid rgba(255,201,51,0.35)', borderRadius:12, padding:'10px 14px', marginBottom:12, textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#FFC933', fontFamily:'Nunito,sans-serif' }}>🏆 Daily Bonus: +50 XP!</div>
            </div>
          )}

          {/* Stats row — includes speed */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[
              { label:'Score',    value:`${correct}/${results.length}`,  color:finalAcc>=70?M.correctColor:'#FFC933' },
              { label:'Accuracy', value:`${finalAcc}%`,                  color:finalAcc>=70?M.correctColor:'#FFC933' },
              { label:'XP',       value:`+${xpEarned+dailyBonus}`,       color:'#FFC933' },
              { label:'Avg Speed', value:`${avgTime}s`,                  color:avgTime<=20?M.correctColor:avgTime<=40?'#FFC933':'#FF6B6B' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex:1, background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, textAlign:'center', padding:'10px 4px' }}>
                <div style={{ fontSize:16, fontWeight:900, color, fontFamily:M.headingFont }}>{value}</div>
                <div style={{ fontSize:9, color:M.textSecondary, fontFamily:'Nunito,sans-serif' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Per-question speed breakdown */}
          <div style={{ background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:800, color:M.textSecondary, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, fontFamily:'Nunito,sans-serif' }}>Your Speed per Question</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {results.map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:r.correct?M.correctColor+'20':'#FF6B6B20', border:`1px solid ${r.correct?M.correctColor:'#FF6B6B'}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:10 }}>{r.correct?'✓':'✗'}</span>
                  </div>
                  <div style={{ fontSize:11, color:M.textSecondary, fontFamily:'Nunito,sans-serif', flex:1 }}>Q{i+1}</div>
                  {/* Speed bar */}
                  <div style={{ flex:2, height:6, background:M.progressTrack, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${Math.min((r.timeTaken/TIMER_SECS)*100, 100)}%`, height:'100%', background: r.timeTaken<=20?M.correctColor:r.timeTaken<=40?'#FFC933':'#FF6B6B', transition:'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize:11, fontWeight:800, color:r.timeTaken<=20?M.correctColor:r.timeTaken<=40?'#FFC933':'#FF6B6B', fontFamily:'Nunito,sans-serif', minWidth:28, textAlign:'right' }}>{r.timeTaken}s</div>
                </div>
              ))}
            </div>
          </div>

          {/* Question review — dot nav + expandable */}
          <div style={{ fontSize:10, fontWeight:800, color:M.textSecondary, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10, fontFamily:'Nunito,sans-serif' }}>
            Question Review
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => { setReviewIdx(i); setShowWhy({}) }} style={{ width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer', background:i===reviewIdx?accent:results[i]?.correct?M.correctColor+'30':'#FF6B6B30', outline:i===reviewIdx?`2px solid ${accent}`:'none', outlineOffset:2, fontSize:10, fontWeight:900, color:i===reviewIdx?'#fff':results[i]?.correct?M.correctColor:'#FF6B6B', transition:'all 0.15s' }}>{i+1}</button>
            ))}
          </div>

          {reviewQ && (
            <div style={{ background:M.lessonCard, border:`1.5px solid ${results[reviewIdx]?.correct?M.correctColor+'35':'#FF6B6B35'}`, borderRadius:M.cardRadius, overflow:'visible', marginBottom:16 }}>
              <div style={{ padding:'8px 14px', background:results[reviewIdx]?.correct?M.correctColor+'12':'#FF6B6B12', display:'flex', alignItems:'center', gap:8, borderRadius:`${M.cardRadius}px ${M.cardRadius}px 0 0` }}>
                <span style={{ fontSize:16 }}>{results[reviewIdx]?.correct?'✅':'❌'}</span>
                <span style={{ fontSize:11, fontWeight:800, color:results[reviewIdx]?.correct?M.correctColor:'#FF6B6B', fontFamily:'Nunito,sans-serif' }}>{results[reviewIdx]?.correct?'Correct!':'Incorrect'}</span>
                <span style={{ marginLeft:'auto', fontSize:11, fontWeight:800, color:results[reviewIdx]?.timeTaken<=20?M.correctColor:results[reviewIdx]?.timeTaken<=40?'#FFC933':'#FF6B6B', fontFamily:'Nunito,sans-serif' }}>⏱ {results[reviewIdx]?.timeTaken}s</span>
              </div>
              <div style={{ padding:'12px 14px', borderBottom:`1px solid ${accent}15` }}>
                <div style={{ fontSize:14, fontWeight:700, color:M.textPrimary, lineHeight:1.6, fontFamily:'Nunito,sans-serif' }}>{reviewQ.question_text}</div>
              </div>
              <div style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {(reviewQ.options||[]).map((opt, j) => (
                  <div key={j} style={{ padding:'8px 10px', borderRadius:8, fontSize:12, lineHeight:1.4, background:opt.is_correct?M.correctColor+'14':'rgba(0,0,0,0.02)', border:`1px solid ${opt.is_correct?M.correctColor+'40':accent+'15'}`, color:opt.is_correct?M.correctColor:M.textSecondary, fontFamily:'Nunito,sans-serif', fontWeight:opt.is_correct?800:500, overflowWrap:'break-word' }}>
                    {opt.is_correct && <span style={{ marginRight:4 }}>✓</span>}{opt.option_text}
                  </div>
                ))}
              </div>
              {reviewQ.explanation && (
                <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${accent}12` }}>
                  {!showWhy[reviewIdx] ? (
                    <button onClick={() => setShowWhy(w => ({ ...w, [reviewIdx]:true }))} style={{ marginTop:10, background:'none', border:`1px dashed ${results[reviewIdx]?.correct?M.correctColor+'60':accent+'50'}`, borderRadius:8, padding:'7px 14px', width:'100%', textAlign:'left', color:results[reviewIdx]?.correct?M.correctColor:accent, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Nunito,sans-serif' }}>
                      💡 {results[reviewIdx]?.correct ? 'Why is this correct?' : 'Show solution'}
                    </button>
                  ) : (
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:accent, marginBottom:8, textTransform:'uppercase', letterSpacing:0.8, fontFamily:'Nunito,sans-serif' }}>Solution — step by step</div>
                      <StepExplanation text={reviewQ.explanation} M={M} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prev / Next */}
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <button onClick={() => { setReviewIdx(i => Math.max(0,i-1)); setShowWhy({}) }} disabled={reviewIdx===0} style={{ flex:1, ...M.ghostBtn, opacity:reviewIdx===0?0.3:1 }}>← Prev</button>
            <button onClick={() => { setReviewIdx(i => Math.min(questions.length-1,i+1)); setShowWhy({}) }} disabled={reviewIdx===questions.length-1} style={{ flex:1, ...M.ghostBtn, opacity:reviewIdx===questions.length-1?0.3:1 }}>Next →</button>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, paddingBottom:24 }}>
            {!isDaily && <button onClick={resetSession} style={{ ...M.primaryBtn }}>{mode==='blaze'?'⚡ GO AGAIN!':'Try Again →'}</button>}
            {finalAcc < 60 && (
              <button onClick={() => router.push(topicId?`/learn/practice?topicId=${topicId}`:'/learn/practice')} style={{ ...M.ghostBtn }}>
                Practice this topic first →
              </button>
            )}
            <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn }}>Back to Map</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Question screen ─────────────────────────────────────────────────────────
  const timerPct   = (timeLeft / TIMER_SECS) * 100
  const timerColor = timeLeft > 30 ? '#C8F135' : timeLeft > 15 ? '#FFC933' : '#FF6B6B'

  return (
    <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column' }}>
      <ExitConfirmModal
        open={showExitModal}
        onStay={() => setShowExitModal(false)}
        onExit={() => { setShowExitModal(false); router.push('/learn') }}
        M={M}
        mode={mode}
      />
      {/* Timer bar */}
      <div style={{ height:6, background:M.progressTrack, flexShrink:0 }}>
        <div style={{ width:`${phase==='question'||phase==='selected'?timerPct:0}%`, height:'100%', background:timerColor, transition:'width 1s linear, background 0.3s' }} />
      </div>

      {/* Top bar */}
      <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${accent}18`, background:M.hudBg }}>
        <button onClick={() => setShowExitModal(true)} style={{ width:32, height:32, borderRadius:'50%', background:M.lessonCard, border:M.lessonBorder, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:M.textSecondary, fontSize:14 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ fontSize:12, fontWeight:800, color:M.textPrimary, fontFamily:M.headingFont }}>{topicTitle}</div>
            <span style={{ fontSize:9, fontWeight:900, color:'#FF6B6B', background:'rgba(255,107,107,0.15)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:20, padding:'1px 7px', textTransform:'uppercase', letterSpacing:0.8 }}>
              {isDaily?'🏆 Daily':'⚡ Challenge'}
            </span>
          </div>
          <div style={{ fontSize:10, color:M.textSecondary }}>{qIdx+1} / {questions.length}</div>
        </div>
        {/* Countdown display */}
        <div style={{ background:timeLeft<=15?'rgba(255,107,107,0.12)':M.lessonCard, border:`1px solid ${timerColor}40`, borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10 }}>⏱</span>
          <span style={{ fontSize:13, fontWeight:900, color:timerColor, fontFamily:'Nunito,sans-serif', minWidth:24, textAlign:'center' }}>{phase==='question'||phase==='selected'?timeLeft:'—'}</span>
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
          {currentQ.difficulty && <span style={{ fontSize:9, fontWeight:900, color:DIFF_COLOR[currentQ.difficulty]||accent, background:(DIFF_COLOR[currentQ.difficulty]||accent)+'18', border:`1px solid ${(DIFF_COLOR[currentQ.difficulty]||accent)}30`, borderRadius:20, padding:'2px 9px', letterSpacing:1, textTransform:'uppercase' }}>{currentQ.difficulty}</span>}
          {currentQ.exam_tag && <span style={{ fontSize:9, fontWeight:900, color:'#00D4C8', background:'#00D4C818', border:'1px solid #00D4C830', borderRadius:20, padding:'2px 9px', letterSpacing:1, textTransform:'uppercase' }}>{currentQ.exam_tag}</span>}
        </div>

        {/* Question — NO hint */}
        <div style={{ ...card, padding:'16px' }}>
          <div style={{ fontSize:15, fontWeight:800, color:M.textPrimary, lineHeight:1.6, fontFamily:'Nunito,sans-serif' }}>{currentQ.question_text}</div>
        </div>

        {/* Mascot prompt */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
          <BicPencil pose={phase==='selected'?'happy':'idle'} size={48} style={{ flexShrink:0 }} />
          <div style={{ flex:1, padding:'8px 12px', background:`${accent}0A`, border:`1.5px solid ${accent}25`, borderRadius:'12px 12px 12px 4px', fontSize:12, fontFamily:'Nunito,sans-serif', fontWeight:600, lineHeight:1.6, color:M.textSecondary }}>
            {phase==='selected'
              ? `✓ Selected — tap Submit to confirm`
              : mode==='blaze' ? `ANSWER FAST! ${timeLeft}s LEFT!`
              : mode==='roots' ? `Think am well, then answer! 🇳🇬`
              : `Choose your answer — ${timeLeft}s remaining`}
          </div>
        </div>

        {/* Answer options — select & submit flow */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {(currentQ.options||[]).map((opt, i) => {
            const isSelected = selectedOpt?.option_text === opt.option_text
            return (
              <button key={i} onClick={() => { setSelectedOpt(opt); setPhase('selected') }}
                style={{ background:isSelected?`${accent}18`:M.lessonCard, border:`2px solid ${isSelected?accent:accent+'22'}`, borderRadius:M.cardRadius, padding:'12px 10px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, fontFamily:'Nunito,sans-serif', transition:'all 0.15s', minHeight:70, transform:isSelected?'translateY(-2px)':'none', boxShadow:isSelected?`0 4px 12px ${accent}25`:'none' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=accent; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=isSelected?accent:`${accent}22`; if(!isSelected) e.currentTarget.style.transform='' }}
              >
                <span style={{ width:22, height:22, borderRadius:'50%', background:isSelected?accent:`${accent}20`, color:isSelected?'#fff':accent, fontSize:10, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>{letters[i]}</span>
                <span style={{ fontSize:12, fontWeight:700, color:M.textPrimary, lineHeight:1.3, textAlign:'center' }}>{opt.option_text}</span>
              </button>
            )
          })}
        </div>

        {/* Submit + Back row */}
        <div style={{ display:'flex', gap:10 }}>
          {/* Back button — only shown when not on first question */}
          {qIdx > 0 && (
            <button
              onClick={() => {
                clearInterval(timerRef.current)
                if (selectedOpt) setAnswerMap(m => ({ ...m, [qIdx]: selectedOpt }))
                const prevIdx = qIdx - 1
                const prevOpt = answerMap[prevIdx] || null
                setQIdx(prevIdx)
                setSelectedOpt(prevOpt)
                setPhase(prevOpt ? 'selected' : 'question')
              }}
              style={{ ...M.ghostBtn, flex:'0 0 auto', fontSize:14, padding:'14px 18px' }}>
              ← Back
            </button>
          )}

          {/* Submit — only when option selected */}
          {phase === 'selected' && (
            <button onClick={handleSubmit} style={{ ...M.primaryBtn, flex:1, fontSize:15 }}>
              {qIdx+1 < questions.length
                ? (mode==='blaze' ? '⚡ SUBMIT & NEXT' : 'Submit →')
                : (mode==='blaze' ? '⚡ SEE RESULTS' : 'Submit & See Results →')}
            </button>
          )}
        </div>

        {phase === 'question' && (
          <div style={{ fontSize:11, color:M.textSecondary, textAlign:'center', fontFamily:'Nunito,sans-serif', opacity:0.6 }}>
            Tap an answer to select it
          </div>
        )}
      </div>
    </div>
  )
}