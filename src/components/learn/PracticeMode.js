'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import { createClient } from '@/lib/supabase/client'

const DIFF_COLOR = { easy: '#C8F135', medium: '#FFC933', hard: '#FF6B6B' }
const COUNT_OPTIONS = [5, 10, 20, 'All']
const TIME_OPTIONS  = [
  { label: 'No timer', value: 0 },
  { label: '1 min',    value: 60 },
  { label: '3 min',    value: 180 },
  { label: '5 min',    value: 300 },
  { label: '10 min',   value: 600 },
]

// ── Parse explanation into steps ──────────────────────────────────────────────
function parseSteps(text) {
  if (!text) return []

  // 1. Explicit numbered steps: "1.", "Step 1:", "Step 1 -"
  const numbered = text.split(/(?=(?:Step\s+)?\d+[\.\):\-]\s)/i).map(s => s.trim()).filter(Boolean)
  if (numbered.length > 1) return numbered

  // 2. Newline-separated (already formatted line by line)
  const byNewline = text.split(/\n+/).map(s => s.trim()).filter(Boolean)
  if (byNewline.length > 1) return byNewline

  // 3. Maths connectors: "∴", "∵", "So,", "Then,", "Therefore,", "Hence,", "Thus,"
  const byConnector = text.split(/(?<=\.\s)(?=So\s|Then\s|Therefore\s|Hence\s|Thus\s|∴|∵)/).map(s => s.trim()).filter(Boolean)
  if (byConnector.length > 1) return byConnector

  // 4. Sentences ending with period followed by capital
  const bySentence = text.split(/(?<=[.!?])\s+(?=[A-Z"∴∵])/).map(s => s.trim()).filter(Boolean)
  if (bySentence.length > 1) return bySentence

  // 5. Single block — return as-is
  return [text]
}

// ── Step-by-step explanation component ───────────────────────────────────────
function StepExplanation({ text, M }) {
  const steps  = parseSteps(text)
  const accent = M.accentColor

  if (steps.length === 1) {
    return (
      <div style={{
        fontSize: 13,
        color: M.textSecondary,
        lineHeight: 1.9,
        fontFamily: 'Nunito, sans-serif',
        padding: '6px 0',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
      }}>
        {text}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
          {/* Number bubble — fixed size, never shrinks */}
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900,
            flexShrink: 0, marginTop: 2,
          }}>{i + 1}</div>

          {/* Step text — fills remaining width, wraps inside its box, never clips */}
          <div style={{
            flex: 1, minWidth: 0,
            background: M.mathBg || 'rgba(0,0,0,0.03)',
            borderRadius: 9,
            padding: '9px 13px',
            fontSize: 13, fontWeight: 700,
            color: M.textPrimary,
            lineHeight: 1.8,
            fontFamily: 'Nunito, sans-serif',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            boxSizing: 'border-box',
          }}>{step}</div>
        </div>
      ))}
    </div>
  )
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ allTopics, currentTopicId, allQuestions, M, mode, onStart }) {
  const router  = useRouter()
  const [count,           setCount]           = useState(10)
  const [timeSec,         setTimeSec]         = useState(0)
  const [selectedTopicIds, setSelectedTopicIds] = useState(
    currentTopicId ? new Set([currentTopicId]) : new Set(allTopics.map(t => t.id))
  )
  const accent   = M.accentColor
  const isMixed  = !currentTopicId  // came from "Mixed Practice" — show topic picker
  const isTopic  = !!currentTopicId // came from a specific topic — skip topic picker

  // Filter questions based on selected topics
  const filteredQs = isTopic
    ? allQuestions
    : allQuestions.filter(q => selectedTopicIds.has(q.topic_id))

  const max         = filteredQs.length
  const actualCount = count === 'All' ? max : Math.min(count, max)

  function toggleTopic(id) {
    setSelectedTopicIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedTopicIds.size === allTopics.length)
      setSelectedTopicIds(new Set())
    else
      setSelectedTopicIds(new Set(allTopics.map(t => t.id)))
  }

  const topicName = isTopic ? (allTopics.find(t => t.id === currentTopicId)?.title || 'Practice') : null

  return (
    <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column' }}>
      {/* Top bar */}
      <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${accent}18`, background:M.hudBg }}>
        <button onClick={() => router.back()} style={{ width:32, height:32, borderRadius:'50%', background:M.lessonCard, border:M.lessonBorder, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:M.textSecondary, fontSize:14 }}>←</button>
        <div style={{ flex:1, fontSize:14, fontWeight:800, color:M.textPrimary, fontFamily:M.headingFont }}>
          ✏️ {isTopic ? topicName : 'Mixed Practice'}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px 100px', maxWidth:520, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Mascot greeting */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
          <BicPencil pose="happy" size={68} style={{ flexShrink:0 }} />
          <div style={{ flex:1, padding:'12px 16px', background:`${accent}0A`, border:`1.5px solid ${accent}25`, borderRadius:'16px 16px 16px 4px', fontSize:13, fontFamily:'Nunito,sans-serif', fontWeight:600, lineHeight:1.6, color:M.textSecondary }}>
            {mode==='roots' ? `Ready to practise? Set your options and let's go! 🇳🇬`
              : mode==='blaze' ? `SET YOUR PARAMETERS. THEN WE GO. ⚡`
              : `Set up your session — pick how many questions and add a timer if you want one.`}
          </div>
        </div>

        {/* Topic multi-select — only for mixed mode */}
        {isMixed && (
          <div style={{ background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, padding:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:M.textSecondary, letterSpacing:0.8, textTransform:'uppercase', fontFamily:'Nunito,sans-serif' }}>
                Topics ({selectedTopicIds.size}/{allTopics.length})
              </div>
              <button onClick={toggleAll} style={{ background:'none', border:`1px solid ${accent}40`, borderRadius:20, padding:'3px 10px', color:accent, cursor:'pointer', fontSize:10, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>
                {selectedTopicIds.size === allTopics.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
              {allTopics.map(tp => {
                const isSelected = selectedTopicIds.has(tp.id)
                const qCount = tp.questionCount ?? allQuestions.filter(q => q.topic_id === tp.id).length
                const noQs = qCount === 0
                return (
                  <div key={tp.id} onClick={() => !noQs && toggleTopic(tp.id)} style={{
                    padding:'10px 12px', borderRadius:10,
                    cursor: noQs ? 'default' : 'pointer',
                    fontFamily:'Nunito,sans-serif',
                    background: isSelected ? `${accent}12` : 'transparent',
                    border:`1.5px solid ${isSelected ? accent : noQs ? accent+'10' : accent+'20'}`,
                    display:'flex', alignItems:'center', gap:10,
                    opacity: noQs ? 0.4 : 1,
                    transition:'all 0.12s',
                  }}>
                    <div style={{
                      width:18, height:18, borderRadius:5, flexShrink:0,
                      background: isSelected ? accent : 'transparent',
                      border:`2px solid ${isSelected ? accent : noQs ? accent+'30' : accent+'50'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {isSelected && <span style={{ color:'#fff', fontSize:11, fontWeight:900 }}>✓</span>}
                    </div>
                    <span style={{ flex:1, fontSize:13, fontWeight:700, color:isSelected ? M.textPrimary : M.textSecondary }}>{tp.title}</span>
                    <span style={{ fontSize:10, color: noQs ? M.textSecondary : accent, fontWeight: noQs ? 400 : 700 }}>
                      {noQs ? 'No questions yet' : `${qCount}q`}
                    </span>
                  </div>
                )
              })}
            </div>
            {filteredQs.length === 0 && (
              <div style={{ marginTop:10, fontSize:11, color:'#FFC933', fontFamily:'Nunito,sans-serif' }}>
                No questions for the selected topics yet. Select more topics or generate practice questions in Admin.
              </div>
            )}
          </div>
        )}

        {/* Question count */}
        <div style={{ background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, padding:'16px' }}>
          <div style={{ fontSize:11, fontWeight:800, color:M.textSecondary, letterSpacing:0.8, textTransform:'uppercase', marginBottom:12, fontFamily:'Nunito,sans-serif' }}>
            Number of Questions
            <span style={{ fontSize:10, color:accent, marginLeft:8, textTransform:'none', letterSpacing:0 }}>({max} available)</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {COUNT_OPTIONS.map(n => (
              <button key={n} onClick={() => setCount(n)} style={{
                flex:1, minWidth:60, padding:'10px 8px', borderRadius:10,
                background: count===n ? `${accent}20` : 'transparent',
                border:`2px solid ${count===n ? accent : accent+'25'}`,
                color: count===n ? accent : M.textSecondary,
                cursor:'pointer', fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif',
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div style={{ background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, padding:'16px' }}>
          <div style={{ fontSize:11, fontWeight:800, color:M.textSecondary, letterSpacing:0.8, textTransform:'uppercase', marginBottom:12, fontFamily:'Nunito,sans-serif' }}>Timer (optional)</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {TIME_OPTIONS.map(t => (
              <button key={t.value} onClick={() => setTimeSec(t.value)} style={{
                flex:1, minWidth:72, padding:'9px 6px', borderRadius:10,
                background: timeSec===t.value ? `${accent}20` : 'transparent',
                border:`2px solid ${timeSec===t.value ? accent : accent+'25'}`,
                color: timeSec===t.value ? accent : M.textSecondary,
                cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'Nunito,sans-serif',
              }}>{t.label}</button>
            ))}
          </div>
          {timeSec > 0 && (
            <div style={{ fontSize:11, color:M.textSecondary, marginTop:8, fontFamily:'Nunito,sans-serif' }}>
              ⏱ {timeSec >= 60 ? `${timeSec/60} min${timeSec>60?'s':''}` : `${timeSec}s`} total for the whole session
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ background:`${accent}0A`, border:`1px solid ${accent}25`, borderRadius:M.cardRadius, padding:'14px 16px', fontFamily:'Nunito,sans-serif' }}>
          <div style={{ fontSize:12, color:M.textSecondary, lineHeight:1.7 }}>
            📋 <strong style={{ color:M.textPrimary }}>{actualCount} question{actualCount!==1?'s':''}</strong>
            {timeSec > 0 && <> · <strong style={{ color:M.textPrimary }}>{timeSec>=60?`${timeSec/60}min`:`${timeSec}s`} timer</strong></>}
            {' '}· shuffled · answers revealed at the end
          </div>
        </div>

        <button
          disabled={actualCount === 0}
          onClick={() => onStart(filteredQs, actualCount, timeSec)}
          style={{ ...M.primaryBtn, fontSize:16, padding:'16px', opacity: actualCount===0 ? 0.4 : 1 }}>
          {mode==='blaze' ? '⚡ START DRILL' : mode==='roots' ? '🇳🇬 Start Practice' : 'Start Practice →'}
        </button>
      </div>
    </div>
  )
}

// ── Review screen ─────────────────────────────────────────────────────────────
function ReviewScreen({ questions, answers, M, mode, topicId, xpEarned, onRetry }) {
  const router   = useRouter()
  const [reviewIdx, setReviewIdx] = useState(0)
  const [showWhy,   setShowWhy]   = useState({}) // { [idx]: bool }
  const correct  = answers.filter(Boolean).length
  const accuracy = Math.round((correct / Math.max(questions.length, 1)) * 100)
  const accent   = M.accentColor

  const current    = questions[reviewIdx]
  const wasCorrect = answers[reviewIdx]
  const correctOpt = current ? (current.options||[]).find(o => o.is_correct) : null

  return (
    <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${accent}18`, background:M.hudBg, flexShrink:0 }}>
        <button onClick={() => router.push('/learn')} style={{ width:32, height:32, borderRadius:'50%', background:M.lessonCard, border:M.lessonBorder, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:M.textSecondary, fontSize:14 }}>←</button>
        <div style={{ flex:1, fontSize:13, fontWeight:800, color:M.textPrimary, fontFamily:M.headingFont }}>
          Results · {correct}/{questions.length} correct
        </div>
        <div style={{ fontSize:13, fontWeight:900, color:accuracy>=70?M.correctColor:'#FFC933' }}>{accuracy}%</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Mascot + result message */}
        <div style={{ padding:'16px 16px 0', maxWidth:560, margin:'0 auto', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:16 }}>
            <BicPencil pose={accuracy>=70?'celebrate':'think'} size={74} style={{ flexShrink:0, animation:'float 2s ease-in-out infinite' }} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:M.headingFont, fontSize:18, fontWeight:900, color:M.textPrimary, marginBottom:4 }}>
                {accuracy===100?'🏆 Perfect score!':accuracy>=80?'🎉 Excellent!':accuracy>=60?'✅ Good effort!':'📚 Keep going!'}
              </div>
              <div style={{ fontSize:12, color:M.textSecondary, fontFamily:'Nunito,sans-serif', lineHeight:1.6 }}>
                {accuracy>=70
                  ? (mode==='roots' ? `${correct} out of ${questions.length} — you dey try well! 🇳🇬` : `${correct} out of ${questions.length} — solid session!`)
                  : (mode==='roots' ? `${correct} out of ${questions.length}. No worry — go back to the lesson and try again! 💪` : `${correct} out of ${questions.length} — review the steps below and try again!`)}
              </div>
              {accuracy < 60 && (
                <button onClick={() => router.push(topicId ? `/learn` : '/learn')}
                  style={{ marginTop:8, background:'none', border:`1px solid ${accent}40`, borderRadius:8, padding:'5px 12px', color:accent, cursor:'pointer', fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>
                  Go to Lesson →
                </button>
              )}
            </div>
          </div>

          {/* Score stats — now includes XP */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[
              { label:'Score',    value:`${correct}/${questions.length}`, color:accuracy>=70?M.correctColor:'#FFC933' },
              { label:'Accuracy', value:`${accuracy}%`,                   color:accuracy>=70?M.correctColor:'#FFC933' },
              { label:'XP Earned', value:`+${xpEarned||0}`,              color:'#FFC933' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex:1, background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, textAlign:'center', padding:'12px 6px' }}>
                <div style={{ fontSize:18, fontWeight:900, color, fontFamily:M.headingFont }}>{value}</div>
                <div style={{ fontSize:10, color:M.textSecondary, fontFamily:'Nunito,sans-serif' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Question-by-question flipper */}
        <div style={{ flex:1, padding:'0 16px 16px', maxWidth:560, margin:'0 auto', width:'100%' }}>
          <div style={{ fontSize:10, fontWeight:800, color:M.textSecondary, letterSpacing:0.8, textTransform:'uppercase', fontFamily:'Nunito,sans-serif', marginBottom:10 }}>
            Question {reviewIdx+1} of {questions.length}
          </div>

          {/* Dot nav */}
          <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => { setReviewIdx(i); setShowWhy(w => ({ ...w, [i]: false })) }} style={{
                width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer',
                background: i===reviewIdx ? accent : answers[i] ? M.correctColor+'30' : '#FF6B6B30',
                outline: i===reviewIdx ? `2px solid ${accent}` : 'none',
                outlineOffset:2, fontSize:10, fontWeight:900,
                color: i===reviewIdx ? '#fff' : answers[i] ? M.correctColor : '#FF6B6B',
                transition:'all 0.15s',
              }}>{i+1}</button>
            ))}
          </div>

          {/* Question card */}
          {current && (
            <div style={{ background:M.lessonCard, border:`1.5px solid ${wasCorrect ? M.correctColor+'35' : '#FF6B6B35'}`, borderRadius:M.cardRadius, overflow:'visible', marginBottom:12 }}>

              {/* Status bar */}
              <div style={{ padding:'8px 14px', background: wasCorrect ? M.correctColor+'12' : '#FF6B6B12', display:'flex', alignItems:'center', gap:8, borderRadius:`${M.cardRadius}px ${M.cardRadius}px 0 0` }}>
                <span style={{ fontSize:16 }}>{wasCorrect ? '✅' : '❌'}</span>
                <span style={{ fontSize:11, fontWeight:800, color: wasCorrect ? M.correctColor : '#FF6B6B', fontFamily:'Nunito,sans-serif' }}>
                  {wasCorrect ? 'Correct!' : 'Incorrect'}
                </span>
                {current.difficulty && (
                  <span style={{ marginLeft:'auto', fontSize:9, fontWeight:900, color:DIFF_COLOR[current.difficulty]||accent, background:(DIFF_COLOR[current.difficulty]||accent)+'18', border:`1px solid ${(DIFF_COLOR[current.difficulty]||accent)}30`, borderRadius:20, padding:'2px 8px', textTransform:'uppercase', letterSpacing:1 }}>
                    {current.difficulty}
                  </span>
                )}
              </div>

              {/* Question text */}
              <div style={{ padding:'14px', borderBottom:`1px solid ${accent}15` }}>
                <div style={{ fontSize:14, fontWeight:700, color:M.textPrimary, lineHeight:1.65, fontFamily:'Nunito,sans-serif', whiteSpace:'normal', overflowWrap:'break-word', wordBreak:'break-word' }}>
                  {current.question_text}
                </div>
              </div>

              {/* Answer options — highlight correct */}
              <div style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {(current.options||[]).map((opt, j) => (
                  <div key={j} style={{
                    padding:'8px 10px', borderRadius:8, lineHeight:1.5,
                    background: opt.is_correct ? M.correctColor+'14' : 'rgba(0,0,0,0.02)',
                    border:`1px solid ${opt.is_correct ? M.correctColor+'40' : accent+'15'}`,
                    color: opt.is_correct ? M.correctColor : M.textSecondary,
                    fontFamily:'Nunito,sans-serif', fontWeight: opt.is_correct ? 800 : 500,
                    fontSize:12, whiteSpace:'normal', overflowWrap:'break-word', wordBreak:'break-word',
                  }}>
                    {opt.is_correct && <span style={{ marginRight:4 }}>✓</span>}{opt.option_text}
                  </div>
                ))}
              </div>

              {/* Explanation — always accessible via "Why?" button */}
              {current.explanation && (
                <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${accent}12` }}>
                  {!showWhy[reviewIdx] ? (
                    <button onClick={() => setShowWhy(w => ({ ...w, [reviewIdx]: true }))} style={{
                      marginTop:10, background:'none',
                      border:`1px dashed ${wasCorrect ? M.correctColor+'60' : accent+'50'}`,
                      borderRadius:8, padding:'7px 14px', width:'100%', textAlign:'left',
                      color: wasCorrect ? M.correctColor : accent,
                      cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Nunito,sans-serif',
                    }}>
                      💡 {wasCorrect ? 'Why is this correct?' : 'Show solution'}
                    </button>
                  ) : (
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:accent, marginBottom:10, textTransform:'uppercase', letterSpacing:0.8, fontFamily:'Nunito,sans-serif' }}>
                        Solution — step by step
                      </div>
                      <StepExplanation text={current.explanation} M={M} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prev / Next navigation */}
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <button onClick={() => { setReviewIdx(i => Math.max(0, i-1)); setShowWhy({}) }} disabled={reviewIdx===0}
              style={{ flex:1, ...M.ghostBtn, opacity:reviewIdx===0?0.3:1 }}>← Prev</button>
            <button onClick={() => { setReviewIdx(i => Math.min(questions.length-1, i+1)); setShowWhy({}) }} disabled={reviewIdx===questions.length-1}
              style={{ flex:1, ...M.ghostBtn, opacity:reviewIdx===questions.length-1?0.3:1 }}>Next →</button>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={onRetry} style={{ ...M.primaryBtn }}>{mode==='blaze'?'⚡ GO AGAIN!':'Try Again →'}</button>
            <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn }}>Back to Learn Map</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Session timer ─────────────────────────────────────────────────────────────
function SessionTimer({ totalSecs, onExpire, M }) {
  const [left, setLeft] = useState(totalSecs)
  const accent = M.accentColor

  useEffect(() => {
    if (totalSecs === 0) return
    const iv = setInterval(() => {
      setLeft(t => {
        if (t <= 1) { clearInterval(iv); onExpire(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  if (totalSecs === 0) return null
  const pct   = (left / totalSecs) * 100
  const color = left > totalSecs*0.4 ? M.correctColor : left > totalSecs*0.2 ? '#FFC933' : '#FF6B6B'
  const mins  = Math.floor(left / 60)
  const secs  = left % 60

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:60, height:4, background:M.progressTrack, borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, transition:'width 1s linear' }} />
      </div>
      <span style={{ fontSize:12, fontWeight:900, color, fontFamily:'Nunito,sans-serif', minWidth:36 }}>
        {mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${left}s`}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PracticeMode({ questions: allQuestions, topicTitle, topicId, student, levels, questionTopicIds }) {
  const router   = useRouter()
  const { M, mode } = useMode()
  const supabase = createClient()

  const [phase,      setPhase]      = useState('setup')
  const [sessionQs,  setSessionQs]  = useState([])
  const [answers,    setAnswers]    = useState([])
  const [qIdx,       setQIdx]       = useState(0)
  const [selected,   setSelected]   = useState(null)
  const [showHint,   setShowHint]   = useState(false)
  const [totalSecs,  setTotalSecs]  = useState(0)
  const [xpEarned,   setXpEarned]   = useState(0)

  const accent = M.accentColor
  const card   = { background:M.lessonCard, border:M.lessonBorder, borderRadius:M.cardRadius, boxShadow:M.cardShadow }

  // Show ALL topics — question count shown per topic so user knows what's available
  const topicsWithQs = new Set(questionTopicIds || allQuestions.map(q => q.topic_id))
  const allTopics = (levels || []).flatMap(l =>
    (l.terms||[]).flatMap(t =>
      (t.units||[]).flatMap(u =>
        (u.topics||[]).map(tp => ({
          ...tp,
          levelName: l.name,
          hasQuestions: topicsWithQs.has(tp.id),
          questionCount: allQuestions.filter(q => q.topic_id === tp.id).length,
        }))
      )
    )
  )

  function startSession(filteredQs, count, timeSec) {
    const shuffled = [...filteredQs].sort(() => Math.random() - 0.5).slice(0, count)
    setSessionQs(shuffled)
    setAnswers([])
    setQIdx(0)
    setSelected(null)
    setShowHint(false)
    setTotalSecs(timeSec)
    setXpEarned(0)
    setPhase('quiz')
  }

  async function handleNext() {
    if (selected === null) return
    const correct = sessionQs[qIdx]?.options?.[selected]?.is_correct || false
    const newAnswers = [...answers, correct]
    setAnswers(newAnswers)

    if (student?.id && sessionQs[qIdx]?.id) {
      supabase.from('practice_attempts').insert({
        student_id: student.id,
        question_id: sessionQs[qIdx].id,
        is_correct: correct,
      })
    }

    setSelected(null)
    setShowHint(false)

    if (qIdx + 1 < sessionQs.length) {
      setQIdx(i => i + 1)
    } else {
      const correctCount = newAnswers.filter(Boolean).length
      const xp = Math.max(correctCount * 2, 1)
      setXpEarned(xp)
      if (student?.id) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: fresh } = await supabase
              .from('students').select('xp, monthly_xp').eq('profile_id', user.id).single()
            const { error: xpErr } = await supabase.from('students').update({
              xp:         (fresh?.xp        || 0) + xp,
              monthly_xp: (fresh?.monthly_xp || 0) + xp,
            }).eq('profile_id', user.id)
            if (xpErr) console.error('[practice] XP update error:', xpErr.message)
          }
        } catch (e) { console.error('[practice] XP error:', e.message) }
      }
      setPhase('review')
    }
  }

  async function handleTimerExpire() {
    const partial      = [...answers]
    const finalAnswers = [...partial, ...Array(sessionQs.length - partial.length).fill(false)]
    const xp = Math.max(partial.filter(Boolean).length * 2, 1)
    setXpEarned(xp)
    if (student?.id) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: fresh } = await supabase
            .from('students').select('xp, monthly_xp').eq('profile_id', user.id).single()
          await supabase.from('students').update({
            xp:         (fresh?.xp        || 0) + xp,
            monthly_xp: (fresh?.monthly_xp || 0) + xp,
          }).eq('profile_id', user.id)
        }
      } catch (e) { console.error('[practice] timer XP error:', e.message) }
    }
    setAnswers(finalAnswers)
    setPhase('review')
  }

  function handleRetry() {
    setPhase('setup')
    setAnswers([])
    setQIdx(0)
    setSelected(null)
    setShowHint(false)
  }

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <SetupScreen
        allTopics={allTopics}
        currentTopicId={topicId}
        allQuestions={allQuestions}
        M={M}
        mode={mode}
        onStart={startSession}
      />
    )
  }

  // ── Review ───────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    return (
      <ReviewScreen
        questions={sessionQs}
        answers={answers}
        M={M}
        mode={mode}
        topicId={topicId}
        xpEarned={xpEarned}
        onRetry={handleRetry}
      />
    )
  }

  // ── No questions ─────────────────────────────────────────────────────────────
  const currentQ = sessionQs[qIdx]
  if (!currentQ) {
    return (
      <div style={{ minHeight:'100vh', background:M.lessonBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:M.font }}>
        <BicPencil pose="think" size={90} />
        <div style={{ fontFamily:M.headingFont, fontSize:18, fontWeight:900, color:M.textPrimary, margin:'16px 0 8px', textAlign:'center' }}>No questions yet!</div>
        <div style={{ fontSize:13, color:M.textSecondary, textAlign:'center', maxWidth:280, lineHeight:1.6, fontFamily:'Nunito,sans-serif', marginBottom:20 }}>
          Practice questions haven't been generated for this topic yet.
        </div>
        <button onClick={() => router.push('/learn/practice')} style={{ ...M.primaryBtn }}>Try Mixed Practice →</button>
        <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn, marginTop:10 }}>Back to Map</button>
      </div>
    )
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  const pct     = Math.round((qIdx / sessionQs.length) * 100)
  const letters = ['A','B','C','D']

  return (
    <div style={{ minHeight:'100vh', background:M.lessonBg, fontFamily:M.font, display:'flex', flexDirection:'column' }}>

      {/* Progress bar */}
      <div style={{ height:4, background:M.progressTrack, flexShrink:0 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:accent, transition:'width 0.3s ease' }} />
      </div>

      {/* Top bar */}
      <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${accent}18`, background:M.hudBg, flexShrink:0 }}>
        <button onClick={() => setPhase('setup')} style={{ width:32, height:32, borderRadius:'50%', background:M.lessonCard, border:M.lessonBorder, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:M.textSecondary, fontSize:14 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:800, color:M.textPrimary, fontFamily:M.headingFont }}>{topicTitle}</div>
          <div style={{ fontSize:10, color:M.textSecondary, fontFamily:'Nunito,sans-serif' }}>{qIdx+1} of {sessionQs.length}</div>
        </div>
        {/* Dot progress */}
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {sessionQs.slice(0, 10).map((_, i) => (
            <div key={i} style={{ width:i===qIdx?10:6, height:i===qIdx?10:6, borderRadius:'50%', flexShrink:0, transition:'all 0.2s', background:i<qIdx?accent:i===qIdx?accent:`${accent}25` }} />
          ))}
          {sessionQs.length > 10 && <span style={{ fontSize:9, color:M.textSecondary }}>+{sessionQs.length-10}</span>}
        </div>
        <SessionTimer totalSecs={totalSecs} onExpire={handleTimerExpire} M={M} />
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', padding:'16px', gap:12, maxWidth:560, margin:'0 auto', width:'100%' }}>

        {/* Difficulty + exam tag */}
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

        {/* Question */}
        <div style={{ ...card, padding:'16px 18px' }}>
          <div style={{ fontSize:15, fontWeight:800, color:M.textPrimary, lineHeight:1.65, fontFamily:'Nunito,sans-serif' }}>
            {currentQ.question_text}
          </div>
        </div>

        {/* Hint — hidden until tapped */}
        {currentQ.hint && (
          <div>
            {!showHint ? (
              <button onClick={() => setShowHint(true)} style={{
                background:'none', border:`1px dashed ${accent}50`, borderRadius:10,
                padding:'8px 14px', color:accent, cursor:'pointer',
                fontSize:12, fontWeight:700, fontFamily:'Nunito,sans-serif', width:'100%', textAlign:'left',
              }}>
                💡 Need a hint?
              </button>
            ) : (
              <div style={{ background:`${accent}08`, border:`1px solid ${accent}25`, borderRadius:10, padding:'10px 14px', fontSize:12, color:M.textSecondary, fontFamily:'Nunito,sans-serif', lineHeight:1.6 }}>
                💡 {currentQ.hint}
              </div>
            )}
          </div>
        )}

        {/* Options — tap to select, tap again to deselect */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {(currentQ.options||[]).map((opt, i) => {
            const isSelected = selected === i
            return (
              <button key={i}
                onClick={() => setSelected(isSelected ? null : i)}
                style={{
                  background: isSelected ? `${accent}18` : M.lessonCard,
                  border:`2px solid ${isSelected ? accent : accent+'22'}`,
                  borderRadius:M.cardRadius, padding:'14px 10px',
                  cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  fontFamily:'Nunito,sans-serif', transition:'all 0.15s', minHeight:72,
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  boxShadow: isSelected ? `0 4px 12px ${accent}25` : 'none',
                }}
              >
                <span style={{ width:24, height:24, borderRadius:'50%', background:isSelected?accent:`${accent}20`, color:isSelected?'#fff':accent, fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>{letters[i]}</span>
                <span style={{ fontSize:13, fontWeight:700, color:M.textPrimary, lineHeight:1.3, textAlign:'center' }}>{opt.option_text}</span>
              </button>
            )
          })}
        </div>

        {/* Info / Next */}
        <div style={{ fontSize:11, color:M.textSecondary, textAlign:'center', fontFamily:'Nunito,sans-serif', opacity:0.7 }}>
          {selected === null ? 'Tap an answer to select it — tap again to change' : '✓ Selected — tap Next to lock it in'}
        </div>

        {selected !== null && (
          <button onClick={handleNext} style={{ ...M.primaryBtn, fontSize:15 }}>
            {qIdx+1 < sessionQs.length
              ? (mode==='blaze' ? '⚡ NEXT' : 'Next →')
              : (mode==='blaze' ? '⚡ SEE RESULTS' : 'See Results →')}
          </button>
        )}

        {selected === null && (
          <button onClick={() => {
            const newAnswers = [...answers, false]
            setAnswers(newAnswers)
            setShowHint(false)
            if (qIdx + 1 < sessionQs.length) setQIdx(i => i + 1)
            else { setPhase('review') }
          }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:M.textSecondary, fontFamily:'Nunito,sans-serif', textAlign:'center', padding:'4px 0', opacity:0.5 }}>
            Skip →
          </button>
        )}
      </div>
    </div>
  )
}