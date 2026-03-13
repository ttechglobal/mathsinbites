'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import { createClient } from '@/lib/supabase/client'

// ─── helpers ─────────────────────────────────────────────────────────────────
const slideText = s => s?.explanation || s?.content || ''
const slideType = s => s?.type || 'concept'

function SvgIllustration({ svg_code, M }) {
  if (!svg_code) return null
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden', margin: '10px 0',
      border: `1px solid ${M.accentColor}20`,
      background: '#FAFAFA',
      lineHeight: 0,
    }}
      dangerouslySetInnerHTML={{ __html: svg_code }}
    />
  )
}

function FormulaBlock({ formula, formula_note, M }) {
  if (!formula) return null
  return (
    <div style={{
      background: M.mathBg, borderRadius: 12, padding: '12px 16px',
      margin: '10px 0',
      borderLeft: `4px solid ${M.accentColor}`,
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: M.accentColor, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>FORMULA</div>
      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: M.accentColor, whiteSpace: 'pre-line', lineHeight: 1.8 }}>
        {formula}
      </div>
      {formula_note && (
        <div style={{ fontSize: 11, color: M.textSecondary, marginTop: 8, lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}>
          {formula_note}
        </div>
      )}
    </div>
  )
}

function HintBox({ hint, M }) {
  if (!hint) return null
  return (
    <div style={{
      padding: '10px 14px', background: M.hintBg, borderRadius: 10,
      borderLeft: `3px solid ${M.accentColor}`, margin: '8px 0',
    }}>
      <span style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.55, fontFamily: 'Nunito, sans-serif' }}>
        💡 <strong style={{ color: M.textPrimary }}>Key insight:</strong> {hint}
      </span>
    </div>
  )
}

// ─── StepList ─────────────────────────────────────────────────────────────────
function StepList({ steps, M, hidden = false }) {
  if (!steps || !steps.length) return null
  const colors = [M.accentColor, M.accent2 || '#26A69A', '#EF5350', '#42A5F5']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, opacity: hidden ? 0.35 : 1 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            background: colors[i % colors.length],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 11, color: '#fff',
          }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            {s.label && (
              <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {s.label}
              </div>
            )}
            <div style={{
              background: M.mathBg, borderRadius: 9, padding: '9px 12px',
              fontFamily: 'monospace', fontSize: 13, color: M.textPrimary, lineHeight: 1.75, whiteSpace: 'pre-line',
            }}>
              {s.text || s.content || String(s)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LessonPlayer({ lesson, subtopic, topic, student, nextSubtopicId }) {
  const router = useRouter()
  const { M, mode } = useMode()
  const supabase = createClient()

  const slides    = lesson?.slides    || []
  const questions = lesson?.questions || []
  const hook      = lesson?.hook      || slideText(slides[0])?.slice(0, 250)

  // Partition slides by type
  const conceptSlides = slides.filter(s => ['concept', 'definition', 'introduction'].includes(slideType(s)))
  const exampleSlides = slides.filter(s => slideType(s) === 'worked_example')
  const youTrySlide   = slides.find(s => slideType(s) === 'you_try')

  // Steps:  0=hook  1=concept  2=examples  3=you_try  4=practice  5=complete
  const [step,          setStep]          = useState(0)
  const [slideIdx,      setSlideIdx]      = useState(0)
  const [exIdx,         setExIdx]         = useState(0)
  const [solutionShown, setSolutionShown] = useState(false)
  const [qIdx,          setQIdx]          = useState(0)
  const [phase,         setPhase]         = useState('question') // question | correct | wrong
  const [combo,         setCombo]         = useState(0)
  const [results,       setResults]       = useState([])
  const [completed,     setCompleted]     = useState(false)

  const currentSlide   = conceptSlides[slideIdx]
  const currentExample = exampleSlides[exIdx]
  const currentQ       = questions[qIdx]

  // Progress bar
  const STEPS = [0, 1, 2, 3, 4, 5]
  const progressPct =
    step === 0 ? 3
    : step === 1 ? Math.round(5  + (slideIdx / Math.max(conceptSlides.length, 1)) * 35)
    : step === 2 ? Math.round(42 + (exIdx / Math.max(exampleSlides.length, 1)) * 13)
    : step === 3 ? 58
    : step === 4 ? Math.round(62 + (qIdx / Math.max(questions.length, 1)) * 35)
    : 100

  // ── answer handler ──────────────────────────────────────────────────────────
  function handleAnswer(opt) {
    const correct = opt.is_correct
    const newResults = [...results, correct]
    setResults(newResults)
    if (correct) {
      setCombo(c => c + 1)
      setPhase('correct')
      setTimeout(() => {
        setPhase('question')
        if (qIdx + 1 < questions.length) {
          setQIdx(i => i + 1)
        } else {
          const accuracy = Math.round(newResults.filter(Boolean).length / newResults.length * 100)
          completeLesson(accuracy)
        }
      }, 1600)
    } else {
      setCombo(0)
      setPhase('wrong')
    }
  }

  async function completeLesson(accuracy = 100) {
    setStep(5)
    setCompleted(true)
    if (!student?.id || !subtopic?.id) return
    await supabase.from('student_progress').upsert({
      student_id:  student.id,
      subtopic_id: subtopic.id,
      status:      'completed',
      score:       accuracy,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,subtopic_id' })
    await supabase.from('students').update({
      xp:         (student.xp || 0) + 10,
      monthly_xp: (student.monthly_xp || 0) + 10,
    }).eq('id', student.id)
  }

  // ── Shared styles ───────────────────────────────────────────────────────────
  const card = {
    background: M.lessonCard,
    border: M.lessonBorder,
    borderRadius: M.cardRadius,
    padding: '14px 16px',
    boxShadow: M.cardShadow,
  }
  const accent = M.accentColor

  // ── TOP BAR ─────────────────────────────────────────────────────────────────
  const TopBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexShrink: 0,
      borderBottom: `1px solid ${accent}18`, background: M.hudBg,
    }}>
      <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} style={{
        width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
        background: M.lessonCard, border: M.lessonBorder,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: M.textSecondary,
      }}>←</button>

      <div style={{ flex: 1, height: 6, background: M.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          width: `${progressPct}%`, height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg,${accent},${M.accent2 || accent})`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{
        background: combo >= 3 ? accent : M.lessonCard,
        border: M.lessonBorder, borderRadius: 20, padding: '4px 10px',
        display: 'flex', alignItems: 'center', gap: 4, minWidth: 40,
      }}>
        <span style={{ fontSize: 10 }}>⚡</span>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 900,
          color: combo >= 3 ? M.textOnAccent : M.textSecondary }}>×{combo}</span>
      </div>
    </div>
  )

  // ── STEP 0: Hook ─────────────────────────────────────────────────────────────
  const HookStep = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 14px', gap: 12, overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
      {/* Title card */}
      <div style={{ ...card, background: `linear-gradient(135deg,${accent}15,${accent}08)`, borderColor: `${accent}40` }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Today's Lesson
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: M.textPrimary, lineHeight: 1.25, fontFamily: M.headingFont, marginBottom: 10 }}>
          {subtopic?.title || lesson?.title}
        </div>
        <div style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif' }}>
          {lesson?.summary}
        </div>
      </div>

      {/* Mascot + hook */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <BicPencil pose="happy" size={64} style={{ flexShrink: 0 }} />
        <div style={{ ...card, flex: 1, padding: '12px 14px', borderLeft: `3px solid ${accent}` }}>
          <div style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif', fontStyle: 'italic' }}>
            {hook || M.hookPhrase}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Slides',     value: conceptSlides.length, icon: '📖' },
          { label: 'Examples',   value: exampleSlides.length + (youTrySlide ? 1 : 0), icon: '✍️' },
          { label: 'Questions',  value: questions.length, icon: '🎯' },
          { label: 'XP',         value: '+10', icon: '⚡' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ ...card, flex: 1, textAlign: 'center', padding: '10px 4px' }}>
            <div style={{ fontSize: 15, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontFamily: M.headingFont, fontSize: 15, fontWeight: 900, color: M.textPrimary }}>{value}</div>
            <div style={{ fontSize: 9, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>{label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setStep(conceptSlides.length > 0 ? 1 : exampleSlides.length > 0 ? 2 : 4)}
        style={{ ...M.primaryBtn, marginTop: 'auto', fontSize: 15 }}>
        {mode === 'blaze' ? "⚡ LET'S GO!"
          : mode === 'roots' ? '🇳🇬 Make we start!'
          : mode === 'spark' ? '✨ Let\'s dive in!'
          : mode === 'halima' ? '📚 Begin Lesson'
          : "Let's start! →"}
      </button>
    </div>
  )

  // ── STEP 1: Concept slides ───────────────────────────────────────────────────
  const typeLabel = { concept: 'The Big Idea', definition: 'Key Terms', introduction: 'Introduction', summary: 'Key Takeaway' }

  const ConceptStep = conceptSlides.length > 0 ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: M.headingFont }}>
          {typeLabel[slideType(currentSlide)] || 'Concept'}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {conceptSlides.map((_, i) => (
            <div key={i} style={{
              width: i === slideIdx ? 18 : 6, height: 6, borderRadius: 3,
              background: i <= slideIdx ? accent : `${accent}25`,
              transition: 'all 0.25s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ ...card, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, lineHeight: 1.3, fontFamily: M.headingFont }}>
          {currentSlide?.title}
        </div>

        <SvgIllustration svg_code={currentSlide?.svg_code} M={M} />

        <div style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.8, fontFamily: 'Nunito, sans-serif', whiteSpace: 'pre-line' }}>
          {slideText(currentSlide)}
        </div>

        <FormulaBlock formula={currentSlide?.formula} formula_note={currentSlide?.formula_note} M={M} />
        <HintBox hint={currentSlide?.hint} M={M} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => slideIdx > 0 ? setSlideIdx(i => i - 1) : setStep(0)}
          style={{ ...M.ghostBtn, flex: 1 }}>← Back</button>
        <button onClick={() => {
          if (slideIdx + 1 < conceptSlides.length) { setSlideIdx(i => i + 1) }
          else if (exampleSlides.length > 0) { setStep(2); setExIdx(0) }
          else if (questions.length > 0) setStep(4)
          else completeLesson(100)
        }} style={{ ...M.primaryBtn, flex: 2 }}>
          {slideIdx + 1 < conceptSlides.length ? 'Next →'
            : exampleSlides.length > 0 ? 'See Examples →'
            : questions.length > 0 ? 'Practice! →'
            : 'Complete ✓'}
        </button>
      </div>
    </div>
  ) : null

  // ── STEP 2: Worked examples ──────────────────────────────────────────────────
  const ExampleStep = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: M.headingFont }}>
          Worked Example {exIdx + 1} of {exampleSlides.length}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {exampleSlides.map((_, i) => (
            <div key={i} style={{
              width: i === exIdx ? 18 : 6, height: 6, borderRadius: 3,
              background: i <= exIdx ? accent : `${accent}25`, transition: 'all 0.25s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ ...card, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont, lineHeight: 1.3 }}>
          {currentExample?.title}
        </div>

        {/* Problem statement */}
        <div style={{ background: `${accent}0D`, border: `1.5px solid ${accent}25`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Problem</div>
          <div style={{ fontSize: 13, color: M.textPrimary, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif' }}>
            {slideText(currentExample)}
          </div>
        </div>

        <SvgIllustration svg_code={currentExample?.svg_code} M={M} />

        {/* Solution steps */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Solution</div>
          <StepList steps={currentExample?.steps} M={M} />
        </div>

        <HintBox hint={currentExample?.hint} M={M} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => exIdx > 0 ? setExIdx(i => i - 1) : setStep(1)}
          style={{ ...M.ghostBtn, flex: 1 }}>← Back</button>
        <button onClick={() => {
          if (exIdx + 1 < exampleSlides.length) { setExIdx(i => i + 1) }
          else if (youTrySlide) setStep(3)
          else if (questions.length > 0) setStep(4)
          else completeLesson(100)
        }} style={{ ...M.primaryBtn, flex: 2 }}>
          {exIdx + 1 < exampleSlides.length ? 'Next Example →'
            : youTrySlide ? 'Now You Try! →'
            : questions.length > 0 ? 'Practice! →'
            : 'Complete ✓'}
        </button>
      </div>
    </div>
  )

  // ── STEP 3: You Try ──────────────────────────────────────────────────────────
  const YouTryStep = youTrySlide ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#EF5350', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: M.headingFont, flexShrink: 0 }}>
        🎯 Your Turn
      </div>

      <div style={{ ...card, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont, lineHeight: 1.3 }}>
          {youTrySlide.title}
        </div>

        {/* Problem */}
        <div style={{ background: 'rgba(239,83,80,0.07)', border: '1.5px solid rgba(239,83,80,0.25)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#EF5350', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Your Problem</div>
          <div style={{ fontSize: 13, color: M.textPrimary, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif' }}>
            {slideText(youTrySlide)}
          </div>
        </div>

        <SvgIllustration svg_code={youTrySlide?.svg_code} M={M} />

        {/* Hint always visible */}
        <HintBox hint={youTrySlide?.hint} M={M} />

        {/* Solution reveal */}
        {!solutionShown ? (
          <button onClick={() => setSolutionShown(true)} style={{
            ...M.ghostBtn, borderStyle: 'dashed',
            borderColor: `${accent}50`, color: accent, fontSize: 13, fontWeight: 800,
          }}>
            👁 Review Solution
          </button>
        ) : (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: M.correctColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              ✅ Full Solution
            </div>
            <StepList steps={youTrySlide?.steps} M={M} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => { setStep(2); setExIdx(exampleSlides.length - 1) }}
          style={{ ...M.ghostBtn, flex: 1 }}>← Back</button>
        <button onClick={() => questions.length > 0 ? setStep(4) : completeLesson(100)}
          style={{ ...M.primaryBtn, flex: 2 }}>
          {questions.length > 0 ? (mode === 'blaze' ? '⚡ QUIZ TIME!' : 'Practice Quiz →') : 'Complete ✓'}
        </button>
      </div>
    </div>
  ) : null

  // ── STEP 4: Practice (MCQ) ──────────────────────────────────────────────────
  const diffColor = { easy: '#26A69A', medium: '#FFA726', hard: '#EF5350' }

  const PracticeStep = questions.length > 0 ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: M.headingFont }}>
          Practice Quiz
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < qIdx ? M.correctColor
                : i === qIdx ? accent
                : `${accent}25`,
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div style={{ ...card, flexShrink: 0 }}>
        {currentQ?.difficulty && (
          <div style={{ fontSize: 9, fontWeight: 900, color: diffColor[currentQ.difficulty] || accent,
            letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            {currentQ.difficulty}
          </div>
        )}
        <div style={{ fontSize: 14, fontWeight: 800, color: M.textPrimary, lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}>
          {currentQ?.question_text}
        </div>
        {currentQ?.hint && phase === 'question' && (
          <div style={{ marginTop: 8, fontSize: 11, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>
            💡 {currentQ.hint}
          </div>
        )}
      </div>

      {/* Mascot speech */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <BicPencil pose={phase === 'correct' ? 'celebrate' : phase === 'wrong' ? 'wrong' : 'think'} size={52} style={{ flexShrink: 0 }} />
        <div style={{
          flex: 1, padding: '8px 14px',
          background: phase === 'correct' ? `${M.correctColor}15`
            : phase === 'wrong' ? `${M.wrongColor}12` : M.lessonCard,
          border: `1.5px solid ${phase === 'correct' ? M.correctColor
            : phase === 'wrong' ? M.wrongColor : `${accent}20`}`,
          borderRadius: 14,
          fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
          color: phase === 'correct' ? M.correctColor : phase === 'wrong' ? M.wrongColor : M.textSecondary,
        }}>
          {phase === 'correct' ? M.correctPhrase
            : phase === 'wrong' ? M.wrongPhrase
            : 'Pick the correct answer'}
        </div>
      </div>

      {/* Wrong answer explanation */}
      {phase === 'wrong' && currentQ?.explanation && (
        <div style={{ ...card, background: `${M.wrongColor}08`, borderColor: `${M.wrongColor}30`, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: M.wrongColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Explanation</div>
          <div style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif' }}>
            {currentQ.explanation}
          </div>
        </div>
      )}

      {/* Answer options */}
      {phase !== 'correct' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, alignContent: 'start' }}>
          {(currentQ?.options || []).map((opt, i) => {
            const letters = ['A', 'B', 'C', 'D']
            const showCorrect = phase === 'wrong' && opt.is_correct
            return (
              <button key={i}
                onClick={() => phase === 'question' && handleAnswer(opt)}
                style={{
                  background: showCorrect ? `${M.correctColor}18` : M.lessonCard,
                  border: `2px solid ${showCorrect ? M.correctColor : `${accent}22`}`,
                  borderRadius: M.cardRadius, padding: '12px 8px',
                  fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800,
                  color: M.textPrimary, cursor: phase === 'question' ? 'pointer' : 'default',
                  textAlign: 'center', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  minHeight: 70,
                }}
                onMouseEnter={e => { if (phase !== 'question') return; e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${accent}22`; e.currentTarget.style.transform = '' }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `${accent}22`, color: accent,
                  fontSize: 11, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{letters[i]}</span>
                <span style={{ fontSize: 12, lineHeight: 1.3 }}>{opt.option_text || opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {phase === 'wrong' && (
        <button onClick={() => setPhase('question')} style={{ ...M.primaryBtn, flexShrink: 0 }}>
          Got it — try again ↩
        </button>
      )}
    </div>
  ) : null

  // ── STEP 5: Complete ─────────────────────────────────────────────────────────
  const accuracy = results.length > 0
    ? Math.round(results.filter(Boolean).length / results.length * 100)
    : 100

  const CompleteStep = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', gap: 16, animation: 'slideUp 0.4s ease', textAlign: 'center' }}>
      <div style={{ animation: 'float 2s ease-in-out infinite' }}>
        <BicPencil pose="celebrate" size={100} />
      </div>
      <div style={{ fontFamily: M.headingFont, fontSize: 26, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2 }}>
        {accuracy >= 80 ? '🎉 Lesson Complete!' : accuracy >= 60 ? '✅ Good effort!' : '📚 Keep practising!'}
      </div>
      <div style={{ fontSize: 14, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.6 }}>
        You scored <strong style={{ color: accent }}>{accuracy}%</strong> on the quiz and earned <strong style={{ color: '#FFC933' }}>+10 XP</strong>!
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
        {[
          { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? M.correctColor : '#FFA726' },
          { label: 'XP Earned', value: '+10', color: '#FFC933' },
          { label: 'Combo', value: `×${combo}`, color: accent },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, ...card, textAlign: 'center', padding: '12px 6px' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: M.headingFont }}>{value}</div>
            <div style={{ fontSize: 10, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {nextSubtopicId && (
          <button onClick={() => router.push(`/learn/lesson/${nextSubtopicId}`)}
            style={{ ...M.primaryBtn, fontSize: 15 }}>
            {mode === 'blaze' ? '⚡ NEXT MISSION!' : 'Next Lesson →'}
          </button>
        )}
        <button onClick={() => router.push('/learn')}
          style={{ ...M.ghostBtn, fontSize: 14 }}>
          Back to Learn Map
        </button>
      </div>
    </div>
  )

  // ── Correct flash overlay ────────────────────────────────────────────────────
  const CorrectOverlay = phase === 'correct' && step === 4 && (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `${M.correctColor}18`, animation: 'pop 0.3s ease',
    }}>
      <div style={{ fontFamily: M.headingFont, fontSize: 28, fontWeight: 900, color: M.correctColor, animation: 'float 0.5s ease' }}>
        {M.correctPhrase}
      </div>
      <div style={{ fontSize: 13, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', marginTop: 6 }}>+10 XP!</div>
    </div>
  )

  // ── Root render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: M.font, background: M.lessonBg, position: 'relative', overflow: 'hidden' }}>
      {/* Flash overlays */}
      {phase === 'correct' && <div style={{ position: 'absolute', inset: 0, background: `${M.correctColor}12`, zIndex: 10, pointerEvents: 'none', animation: 'pulse 0.3s ease' }} />}
      {phase === 'wrong'   && <div style={{ position: 'absolute', inset: 0, background: `${M.wrongColor}08`,   zIndex: 10, pointerEvents: 'none', animation: 'pulse 0.3s ease' }} />}

      {/* Top progress strip */}
      <div style={{ height: 4, background: M.progressTrack, flexShrink: 0 }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: accent, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {TopBar}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {step === 0 && HookStep}
        {step === 1 && (ConceptStep || <div style={{ flex: 1 }} />)}
        {step === 2 && ExampleStep}
        {step === 3 && (YouTryStep || <div style={{ flex: 1 }} />)}
        {step === 4 && (PracticeStep || CompleteStep)}
        {step === 5 && CompleteStep}
        {CorrectOverlay}
      </div>
    </div>
  )
}