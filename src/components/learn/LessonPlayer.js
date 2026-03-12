'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'

export default function LessonPlayer({ lesson, subtopic, topic, student, onComplete }) {
  const router = useRouter()
  const { M, mode } = useMode()

  const slides    = lesson?.slides    || []
  const questions = lesson?.questions || []

  // step: 0=hook, 1=concept (per-slide), 2=example, 3=practice
  const [step,      setStep]      = useState(0)
  const [slideIdx,  setSlideIdx]  = useState(0)
  const [qIdx,      setQIdx]      = useState(0)
  const [phase,     setPhase]     = useState('question') // question | correct | wrong
  const [combo,     setCombo]     = useState(0)
  const [results,   setResults]   = useState([])

  // ── helpers ──────────────────────────────────────────────────────────────────
  const slideText = s => s?.explanation || s?.content || s?.body_text || ''
  const slideType = s => s?.type || s?.slide_type || 'concept'

  // Separate slides by type for step routing
  const conceptSlides = slides.filter(s => ['concept','definition','introduction'].includes(slideType(s)))
  const exampleSlides = slides.filter(s => ['example','worked_example'].includes(slideType(s)))
  // If no typed separation, all slides go to concept step
  const learnSlides   = conceptSlides.length > 0 ? conceptSlides : slides
  const showSlides    = learnSlides

  const currentSlide = showSlides[slideIdx]
  const currentQ     = questions[qIdx]

  const progressPct = step === 0 ? 5
    : step === 1 ? Math.round(10 + (slideIdx / Math.max(showSlides.length, 1)) * 45)
    : step === 2 ? 60
    : Math.round(65 + (qIdx / Math.max(questions.length, 1)) * 35)

  // ── answer handler ───────────────────────────────────────────────────────────
  function handleAnswer(opt) {
    const correct = opt.is_correct
    setResults(r => [...r, correct])
    if (correct) {
      setCombo(c => c + 1)
      setPhase('correct')
      setTimeout(() => {
        setPhase('question')
        if (qIdx + 1 < questions.length) setQIdx(i => i + 1)
        else {
          const all = [...results, true]
          onComplete && onComplete({ accuracy: Math.round(all.filter(Boolean).length / all.length * 100), xpEarned: 10 })
        }
      }, 1800)
    } else {
      setCombo(0)
      setPhase('wrong')
    }
  }

  // ── shared card style using M tokens ─────────────────────────────────────────
  const card = {
    background: M.lessonCard,
    border: M.lessonBorder,
    borderRadius: M.cardRadius,
    padding: '14px 16px',
    boxShadow: M.cardShadow,
  }

  // ── TOP BAR ──────────────────────────────────────────────────────────────────
  const TopBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexShrink: 0,
      borderBottom: `1px solid ${M.lessonBorder?.split(' ').pop() || '#eee'}`,
      background: M.hudBg,
    }}>
      <button
        onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
        style={{
          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
          background: M.lessonCard, border: M.lessonBorder,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: M.textSecondary,
        }}>←</button>

      {/* Progress bar */}
      <div style={{ flex: 1, height: 6, background: M.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          width: `${progressPct}%`, height: '100%', borderRadius: 99,
          background: M.accentColor, transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Combo badge */}
      <div style={{
        background: combo >= 3 ? M.accentColor : M.lessonCard,
        border: M.lessonBorder, borderRadius: 20, padding: '4px 10px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ fontSize: 10 }}>⚡</span>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 900, color: combo >= 3 ? M.textOnAccent : M.textSecondary }}>
          ×{combo}
        </span>
      </div>
    </div>
  )

  // ── STEP 0: Hook ─────────────────────────────────────────────────────────────
  const HookStep = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 12px', gap: 12, overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
      <div style={{ ...card, background: M.hookBg, borderColor: M.accentColor + '40' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: M.accentColor, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Today's Topic
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: M.textPrimary, lineHeight: 1.3, marginBottom: 8, fontFamily: M.headingFont }}>
          {subtopic?.title || topic?.title || lesson?.title || 'Lesson'}
        </div>
        <div style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.6 }}>
          {slideText(slides[0])?.slice(0, 200) || M.hookPhrase}
        </div>
      </div>

      {/* Mascot + speech bubble */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BicPencil pose="idle" size={60} style={{ flexShrink: 0 }} />
        <div style={{ ...card, flex: 1, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5 }}>
            {M.hookPhrase}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Slides', value: showSlides.length || '—', icon: '📖' },
          { label: 'Questions', value: questions.length || '—', icon: '🎯' },
          { label: 'XP', value: '+10', icon: '⚡' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ ...card, flex: 1, textAlign: 'center', padding: '10px 6px' }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontFamily: M.headingFont, fontSize: 15, fontWeight: 900, color: M.textPrimary }}>{value}</div>
            <div style={{ fontSize: 10, color: M.textSecondary }}>{label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => showSlides.length > 0 ? setStep(1) : setStep(3)} style={{ ...M.primaryBtn, marginTop: 'auto' }}>
        {mode === 'blaze' ? "⚡ LET'S GO!" : mode === 'roots' ? '🇳🇬 Make we start!' : mode === 'spark' ? '✨ Let\'s dive in!' : "Let's go! →"}
      </button>
    </div>
  )

  // ── STEP 1: Concept slides (per slide, paginated) ─────────────────────────────
  const slideTypeLabel = { concept: 'The Big Idea', definition: 'Definition', introduction: 'Introduction', example: 'Worked Example', worked_example: 'Worked Example', summary: 'Key Takeaway' }

  const ConceptStep = showSlides.length > 0 ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, letterSpacing: 1, textTransform: 'uppercase', fontFamily: M.headingFont }}>
          {slideTypeLabel[slideType(currentSlide)] || 'Slide'}
        </div>
        <div style={{ fontSize: 10, color: M.textSecondary }}>{slideIdx + 1} / {showSlides.length}</div>
      </div>

      <div style={{ ...card, flex: 1, overflowY: 'auto' }}>
        {/* Title */}
        <div style={{ fontSize: 14, fontWeight: 900, color: M.textPrimary, marginBottom: 10, fontFamily: M.headingFont }}>
          {currentSlide?.title || subtopic?.title}
        </div>

        {/* Body text */}
        {slideText(currentSlide) && (
          <div style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.75, marginBottom: 10 }}>
            {slideText(currentSlide)}
          </div>
        )}

        {/* Formula block */}
        {currentSlide?.formula && (
          <div style={{ background: M.mathBg, borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.9, marginBottom: 8, whiteSpace: 'pre-line' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: M.accentColor, marginBottom: 4, letterSpacing: 1 }}>FORMULA</div>
            <div style={{ color: M.accentColor, fontWeight: 700 }}>{currentSlide.formula}</div>
            {currentSlide.formula_note && (
              <div style={{ fontSize: 11, color: M.textSecondary, marginTop: 6 }}>{currentSlide.formula_note}</div>
            )}
          </div>
        )}

        {/* Worked steps (if any) */}
        {currentSlide?.steps && Array.isArray(currentSlide.steps) && currentSlide.steps.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {currentSlide.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: i % 2 === 0 ? M.accentColor : M.accent2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 11, color: M.textOnAccent, flexShrink: 0, marginTop: 2,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  {s.label && <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, marginBottom: 3 }}>{s.label}</div>}
                  <div style={{ background: M.mathBg, borderRadius: 8, padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, color: M.textPrimary, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {s.text || s.content || String(s)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SVG illustration */}
        {currentSlide?.svg_code && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: `1px solid ${M.accentColor}20` }}
            dangerouslySetInnerHTML={{ __html: currentSlide.svg_code }} />
        )}

        {/* Hint / key insight */}
        {currentSlide?.hint && (
          <div style={{ marginTop: 6, padding: '8px 12px', background: M.hintBg, borderRadius: 8, borderLeft: `3px solid ${M.accentColor}` }}>
            <div style={{ fontSize: 11, color: M.textSecondary, lineHeight: 1.5 }}>
              💡 <strong style={{ color: M.textPrimary }}>Key insight:</strong> {currentSlide.hint}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => slideIdx > 0 ? setSlideIdx(i => i - 1) : setStep(0)} style={{ ...M.ghostBtn, flex: 1 }}>← Back</button>
        <button onClick={() => {
          if (slideIdx + 1 < showSlides.length) setSlideIdx(i => i + 1)
          else if (exampleSlides.length > 0) setStep(2)
          else if (questions.length > 0) setStep(3)
          else onComplete && onComplete({ accuracy: 100, xpEarned: 10 })
        }} style={{ ...M.primaryBtn, flex: 2 }}>
          {slideIdx + 1 < showSlides.length ? 'Next →'
            : exampleSlides.length > 0 ? 'See examples →'
            : questions.length > 0 ? 'Practice time →'
            : 'Complete ✓'}
        </button>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'slideUp 0.3s ease' }}>
      <BicPencil pose="idle" size={90} />
      <p style={{ marginTop: 16, fontFamily: M.headingFont, fontSize: 16, fontWeight: 900, color: M.textPrimary, textAlign: 'center' }}>Slides loading soon!</p>
      <button onClick={() => setStep(3)} style={{ ...M.primaryBtn, marginTop: 24 }}>Skip to Practice →</button>
    </div>
  )

  // ── STEP 2: Worked examples ───────────────────────────────────────────────────
  const ExampleStep = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 8, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, letterSpacing: 1, textTransform: 'uppercase', fontFamily: M.headingFont }}>Step-by-Step</div>
      <div style={{ ...card, flex: 1, overflowY: 'auto' }}>
        {(exampleSlides.length > 0 ? exampleSlides : showSlides).slice(0, 4).map((s, i) => {
          const clr = [M.accentColor, M.accent2, M.accentColor, M.correctColor][i]
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: M.textOnAccent, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, marginBottom: 3, fontFamily: M.headingFont }}>{s.title || `Step ${i + 1}`}</div>
                <div style={{ background: M.mathBg, borderRadius: 8, padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, color: M.textPrimary, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {slideText(s)?.slice(0, 280) || '—'}
                </div>
                {s.formula && (
                  <div style={{ marginTop: 6, background: M.mathBg, borderRadius: 8, padding: '6px 10px', fontFamily: 'monospace', fontSize: 13, color: M.accentColor, fontWeight: 700, whiteSpace: 'pre-line' }}>
                    {s.formula}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setStep(1)} style={{ ...M.ghostBtn, flex: 1 }}>← Back</button>
        <button onClick={() => questions.length > 0 ? setStep(3) : onComplete && onComplete({ accuracy: 100, xpEarned: 10 })} style={{ ...M.primaryBtn, flex: 2 }}>
          {questions.length > 0 ? (mode === 'blaze' ? '⚡ TRY IT!' : 'Try one yourself →') : 'Complete ✓'}
        </button>
      </div>
    </div>
  )

  // ── STEP 3: Practice (duel-style MCQ) ────────────────────────────────────────
  const PracticeStep = questions.length > 0 ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease' }}>
      {/* Round label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, letterSpacing: 1, textTransform: 'uppercase', fontFamily: M.headingFont }}>Your Turn</div>
        <div style={{ fontSize: 10, color: M.textSecondary }}>{qIdx + 1} / {questions.length}</div>
      </div>

      {/* Question card */}
      <div style={{ ...card }}>
        {currentQ?.difficulty && (
          <div style={{ fontSize: 10, fontWeight: 800, color: M.accentColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            {currentQ.difficulty}
          </div>
        )}
        <div style={{ fontSize: 14, fontWeight: 800, color: M.textPrimary, lineHeight: 1.55 }}>
          {currentQ?.question_text || currentQ?.question}
        </div>
        {currentQ?.hint && phase === 'question' && (
          <div style={{ marginTop: 8, fontSize: 11, color: M.textSecondary }}>
            💡 {currentQ.hint}
          </div>
        )}
      </div>

      {/* Mascot */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <BicPencil pose={phase === 'correct' ? 'celebrate' : phase === 'wrong' ? 'wrong' : 'think'} size={64} />
      </div>

      {/* Speech bubble */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: phase === 'correct' ? M.hintBg : phase === 'wrong' ? M.wrongBg : M.lessonCard,
          border: `1.5px solid ${phase === 'correct' ? M.correctColor : phase === 'wrong' ? M.wrongColor : M.lessonBorder?.split(' ').pop() || '#eee'}`,
          borderRadius: 14, padding: '7px 16px',
          fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
          color: phase === 'correct' ? M.correctColor : phase === 'wrong' ? M.wrongColor : M.textSecondary,
        }}>
          {phase === 'correct' ? M.correctPhrase
            : phase === 'wrong' ? M.wrongPhrase
            : 'What is the correct answer?'}
        </div>
      </div>

      {/* Wrong explanation */}
      {phase === 'wrong' && currentQ?.explanation && (
        <div style={{ ...card, background: M.wrongBg, borderColor: M.wrongColor + '40' }}>
          <div style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.6 }}>
            📖 {currentQ.explanation}
          </div>
        </div>
      )}

      {/* Options grid */}
      {phase !== 'correct' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
          {(currentQ?.options || []).map((opt, i) => {
            const letters = ['A', 'B', 'C', 'D']
            const showCorrect = phase === 'wrong' && opt.is_correct
            return (
              <button key={i}
                onClick={() => phase === 'question' && handleAnswer(opt)}
                style={{
                  background: showCorrect ? M.correctColor + '18' : M.lessonCard,
                  border: `2px solid ${showCorrect ? M.correctColor : phase === 'wrong' && !opt.is_correct ? M.lessonBorder?.split(' ').pop() || '#eee' : M.lessonBorder?.split(' ').pop() || '#eee'}`,
                  borderRadius: M.cardRadius, padding: '12px 8px',
                  fontFamily: M.font, fontSize: 14, fontWeight: 900,
                  color: M.textPrimary, cursor: phase === 'question' ? 'pointer' : 'default',
                  textAlign: 'center', transition: 'all 0.15s', boxShadow: M.cardShadow,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { if (phase !== 'question') return; e.currentTarget.style.borderColor = M.accentColor; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: M.accentColor + '22', color: M.accentColor, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {letters[i]}
                </span>
                <span style={{ fontSize: 12, lineHeight: 1.3 }}>{opt.option_text || opt.text || opt.value}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Wrong → try again */}
      {phase === 'wrong' && (
        <button onClick={() => setPhase('question')} style={{ ...M.primaryBtn }}>
          Got it — try again ↩
        </button>
      )}
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <BicPencil pose="idle" size={80} />
      <p style={{ marginTop: 16, fontFamily: M.headingFont, fontSize: 16, fontWeight: 900, color: M.textPrimary, textAlign: 'center' }}>No practice questions yet!</p>
      <button onClick={() => onComplete && onComplete({ accuracy: 100, xpEarned: 10 })} style={{ ...M.primaryBtn, marginTop: 24 }}>Complete Lesson →</button>
    </div>
  )

  // ── Correct overlay ──────────────────────────────────────────────────────────
  const CorrectOverlay = phase === 'correct' && step === 3 && (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: M.correctOverlay, animation: 'pop 0.3s ease',
    }}>
      <BicPencil pose="celebrate" size={90} />
      <div style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 900, color: M.textPrimary, marginTop: 14 }}>{M.correctPhrase}</div>
      <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: M.textSecondary, marginTop: 6 }}>+10 XP earned!</div>
    </div>
  )

  // ── Flash overlays ───────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: M.font, background: M.lessonBg, position: 'relative', overflow: 'hidden' }}>
      {phase === 'correct' && <div style={{ position: 'absolute', inset: 0, background: M.correctColor + '15', zIndex: 10, pointerEvents: 'none', animation: 'pulse 0.3s ease' }} />}
      {phase === 'wrong' && <div style={{ position: 'absolute', inset: 0, background: M.wrongColor + '10', zIndex: 10, pointerEvents: 'none', animation: 'pulse 0.3s ease' }} />}

      {/* Thin top progress strip */}
      <div style={{ height: 4, background: M.progressTrack, flexShrink: 0 }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: M.accentColor, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {TopBar}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {step === 0 && HookStep}
        {step === 1 && ConceptStep}
        {step === 2 && ExampleStep}
        {step === 3 && PracticeStep}
        {CorrectOverlay}
      </div>
    </div>
  )
}