'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import { createClient } from '@/lib/supabase/client'

// ─── helpers ─────────────────────────────────────────────────────────────────
const slideText = s => s?.explanation || s?.content || ''
const slideType = s => s?.type || 'concept'

// Renders math strings: 2^8 → 2⁸  x_2 → x₂  — no raw ^ or _ shown to students
function parseMath(text) {
  const parts = []
  let i = 0
  let buf = ''
  while (i < text.length) {
    const ch = text[i]
    if ((ch === '^' || ch === '_') && i + 1 < text.length) {
      if (buf) { parts.push({ t: 'text', v: buf }); buf = '' }
      const type = ch === '^' ? 'sup' : 'sub'
      i++
      if (text[i] === '{') {
        const end = text.indexOf('}', i)
        const val = end === -1 ? text.slice(i + 1) : text.slice(i + 1, end)
        parts.push({ t: type, v: val })
        i = end === -1 ? text.length : end + 1
      } else {
        let val = ''
        while (i < text.length && /[a-zA-Z0-9.]/.test(text[i])) { val += text[i]; i++ }
        if (val) parts.push({ t: type, v: val })
        else { buf += ch }
      }
    } else {
      buf += ch; i++
    }
  }
  if (buf) parts.push({ t: 'text', v: buf })
  return parts
}

// Splits an explanation string into step-by-step lines — no regex
function splitExplanation(text) {
  if (!text) return []
  // If it has real newlines, split on those
  const byNewline = text.split('\n').map(s => s.trim()).filter(Boolean)
  if (byNewline.length > 1) return byNewline
  // Otherwise split on ". " boundaries into ~60 char chunks
  const sentences = []
  let current = ''
  const words = text.split(' ')
  for (const word of words) {
    current += (current ? ' ' : '') + word
    if (current.length > 55 && current.endsWith('.')) {
      sentences.push(current)
      current = ''
    }
  }
  if (current) sentences.push(current)
  return sentences.length > 0 ? sentences : [text]
}

function MathText({ text, style }) {
  if (!text) return null
  const parts = parseMath(String(text))
  return (
    <span style={style}>
      {parts.map((p, i) =>
        p.t === 'sup' ? <sup key={i} style={{ fontSize: '0.72em', verticalAlign: 'super', lineHeight: 0 }}>{p.v}</sup>
        : p.t === 'sub' ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{p.v}</sub>
        : <span key={i}>{p.v}</span>
      )}
    </span>
  )
}

function SvgIllustration({ svg_code, M }) {
  if (!svg_code) return null
  // Inject responsive attributes into the SVG so it scales to container width
  // on mobile while keeping max-width on desktop
  const responsive = svg_code
    .replace(/<svg([^>]*)>/, (match, attrs) => {
      // Remove fixed width/height attrs, keep viewBox, add 100% width
      const withoutWH = attrs
        .replace(/\s+width="[^"]*"/g, '')
        .replace(/\s+height="[^"]*"/g, '')
      return `<svg${withoutWH} width="100%" style="display:block;max-width:100%">`
    })
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', margin: '12px 0',
      border: `1.5px solid ${M.accentColor}25`,
      background: '#F8F9FF',
      lineHeight: 0,
      width: '100%',
      // On desktop give it a bit more room; on mobile it fills container
      maxWidth: '100%',
    }}
      dangerouslySetInnerHTML={{ __html: responsive }}
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
        <MathText text={formula} />
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
  const [open, setOpen] = React.useState(false)
  if (!hint) return null
  return (
    <div style={{ margin: '8px 0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: `1.5px dashed ${M.accentColor}50`,
          borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
          fontSize: 12, color: M.accentColor, fontWeight: 800,
          fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
        }}>
        💡 {open ? 'Hide hint' : 'Show hint'}
      </button>
      {open && (
        <div style={{
          marginTop: 6, padding: '10px 14px', background: M.hintBg, borderRadius: 10,
          borderLeft: `3px solid ${M.accentColor}`,
        }}>
          <span style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.55, fontFamily: 'Nunito, sans-serif' }}>
            {hint}
          </span>
        </div>
      )}
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
              <MathText text={s.text || s.content || String(s)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ResultPanel — collapsible explanation, shown after answering ─────────────
function ResultPanel({ isCorrect, currentQ, accent, M }) {
  const [showExp, setShowExp] = React.useState(false)
  const correctOpt = (currentQ?.options || []).find(o => o.is_correct)

  return (
    <div style={{
      borderRadius: 12, flexShrink: 0, overflow: 'hidden',
      border: `1.5px solid ${isCorrect ? M.correctColor + '40' : M.wrongColor + '40'}`,
      background: isCorrect ? `${M.correctColor}06` : `${M.wrongColor}05`,
    }}>
      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: isCorrect ? `${M.correctColor}12` : `${M.wrongColor}10`,
      }}>
        <span style={{ fontSize: 20 }}>{isCorrect ? '🎉' : '💡'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'Nunito, sans-serif',
            color: isCorrect ? M.correctColor : M.wrongColor }}>
            {isCorrect ? 'Correct! Great job! 🌟' : "Not quite!"}
          </div>
          {!isCorrect && correctOpt && (
            <div style={{ fontSize: 11, color: M.correctColor, fontFamily: 'Nunito, sans-serif', marginTop: 2, fontWeight: 700 }}>
              ✅ Answer: <MathText text={correctOpt.option_text} />
            </div>
          )}
        </div>
        {/* Toggle explanation button */}
        {currentQ?.explanation && (
          <button
            onClick={() => setShowExp(v => !v)}
            style={{
              background: showExp ? accent : 'transparent',
              border: `1.5px solid ${accent}`,
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
              fontSize: 11, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
              color: showExp ? '#fff' : accent, flexShrink: 0,
              transition: 'all 0.15s',
            }}>
            {showExp ? 'Hide ▲' : 'Why? 💡'}
          </button>
        )}
      </div>

      {/* Collapsible step-by-step explanation */}
      {showExp && currentQ?.explanation && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            How to solve it — step by step
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {splitExplanation(currentQ.explanation).map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900,
                }}>{i + 1}</div>
                <div style={{
                  flex: 1, background: M.mathBg || 'rgba(0,0,0,0.03)', borderRadius: 8,
                  padding: '8px 11px', fontSize: 12, fontWeight: 600, color: M.textPrimary,
                  lineHeight: 1.75, fontFamily: 'Nunito, sans-serif',
                }}>
                  {step.trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [phase,         setPhase]         = useState('question') // question | answered_correct | answered_wrong
  const [selectedOpt,   setSelectedOpt]   = useState(null)
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
    if (phase !== 'question') return // already answered
    const correct = opt.is_correct
    const newResults = [...results, correct]
    setResults(newResults)
    setSelectedOpt(opt)
    if (correct) {
      setCombo(c => c + 1)
      setPhase('answered_correct')
    } else {
      setCombo(0)
      setPhase('answered_wrong')
    }
  }

  function advanceQuestion() {
    setPhase('question')
    setSelectedOpt(null)
    if (qIdx + 1 < questions.length) {
      setQIdx(i => i + 1)
    } else {
      // results is up to date (was set in handleAnswer before phase change)
      const accuracy = results.length > 0
        ? Math.round(results.filter(Boolean).length / results.length * 100)
        : 100
      completeLesson(accuracy)
    }
  }

  async function completeLesson(accuracy = 100) {
    setStep(5)
    setCompleted(true)
    if (!student?.id || !subtopic?.id) {
      console.warn('[lesson] missing student or subtopic id', { student: student?.id, subtopic: subtopic?.id })
      return
    }

    // Save progress — use student_id filter for RLS compatibility
    try {
      // Check if row already exists
      const { data: existing, error: selectErr } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', student.id)
        .eq('subtopic_id', subtopic.id)
        .maybeSingle()

      if (selectErr) console.error('[lesson] progress select error:', selectErr.message, selectErr.code)

      if (existing?.id) {
        // Update — filter by both id AND student_id to satisfy RLS
        const { error: updateErr } = await supabase
          .from('student_progress')
          .update({
            status:       'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .eq('student_id', student.id)
        if (updateErr) console.error('[lesson] progress update error:', updateErr.message, updateErr.code, updateErr.details)
        else console.log('[lesson] progress updated for subtopic', subtopic.id)
      } else {
        // Insert new row
        const { error: insertErr } = await supabase
          .from('student_progress')
          .insert({
            student_id:   student.id,
            subtopic_id:  subtopic.id,
            status:       'completed',
            completed_at: new Date().toISOString(),
          })
        if (insertErr) console.error('[lesson] progress insert error:', insertErr.message, insertErr.code, insertErr.details)
        else console.log('[lesson] progress inserted for subtopic', subtopic.id)
      }
    } catch (e) {
      console.error('[lesson] progress save exception:', e.message)
    }

    // Update XP
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: fresh } = await supabase
          .from('students').select('xp, monthly_xp').eq('profile_id', user.id).single()
        const { error: xpErr } = await supabase.from('students').update({
          xp:         (fresh?.xp        || 0) + 10,
          monthly_xp: (fresh?.monthly_xp || 0) + 10,
        }).eq('profile_id', user.id)
        if (xpErr) console.error('[lesson] XP update error:', xpErr.message)
        else console.log('[lesson] XP updated +10')
      }
    } catch (e) { console.error('[lesson] XP error:', e.message) }
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
  const isAnswered = phase === 'answered_correct' || phase === 'answered_wrong'
  const isCorrect  = phase === 'answered_correct'

  const PracticeStep = questions.length > 0 ? (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 10, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: M.headingFont }}>
          Quick Check — {qIdx + 1} of {questions.length}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < qIdx ? M.correctColor : i === qIdx ? accent : `${accent}25`,
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
          <MathText text={currentQ?.question_text} />
        </div>
        {!isAnswered && <HintBox hint={currentQ?.hint} M={M} />}
      </div>

      {/* Answer options — always visible, colour-coded after pick */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
        {(currentQ?.options || []).map((opt, i) => {
          const letters = ['A', 'B', 'C', 'D']
          const isPicked  = isAnswered && selectedOpt === opt
          const isOptCorrect = opt.is_correct
          let borderColor = `${accent}22`
          let bgColor     = M.lessonCard
          let labelColor  = M.textPrimary
          if (isAnswered) {
            if (isOptCorrect)             { borderColor = M.correctColor; bgColor = `${M.correctColor}15`; labelColor = M.correctColor }
            else if (isPicked)            { borderColor = M.wrongColor;   bgColor = `${M.wrongColor}12`;   labelColor = M.wrongColor   }
            else                          { borderColor = `${accent}10`;  bgColor = `${M.lessonCard}`;     labelColor = M.textSecondary }
          }
          return (
            <button key={i}
              onClick={() => phase === 'question' && handleAnswer(opt)}
              style={{
                background: bgColor, border: `2px solid ${borderColor}`,
                borderRadius: M.cardRadius, padding: '12px 8px',
                fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                color: labelColor, cursor: phase === 'question' ? 'pointer' : 'default',
                textAlign: 'center', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                minHeight: 64,
              }}
              onMouseEnter={e => { if (phase !== 'question') return; e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if (phase !== 'question') return; e.currentTarget.style.borderColor = `${accent}22`; e.currentTarget.style.transform = '' }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: isAnswered && isOptCorrect ? M.correctColor
                  : isAnswered && isPicked ? M.wrongColor : `${accent}22`,
                color: isAnswered && (isOptCorrect || isPicked) ? '#fff' : accent,
                fontSize: 11, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {isAnswered && isOptCorrect ? '✓' : isAnswered && isPicked && !isOptCorrect ? '✗' : letters[i]}
              </span>
              <MathText text={opt.option_text || opt.text} style={{ fontSize: 12, lineHeight: 1.3 }} />
            </button>
          )
        })}
      </div>

      {/* Result banner — always shown after answering */}
      {isAnswered && (
        <ResultPanel
          isCorrect={isCorrect}
          currentQ={currentQ}
          accent={accent}
          M={M}
        />
      )}

      {/* Mascot — only shown when unanswered */}
      {!isAnswered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <BicPencil pose="think" size={40} style={{ flexShrink: 0 }} />
          <div style={{
            flex: 1, padding: '7px 12px', background: M.lessonCard,
            border: `1.5px solid ${accent}20`, borderRadius: 12,
            fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', color: M.textSecondary,
          }}>
            Pick the correct answer 👆
          </div>
        </div>
      )}

      {/* Continue — always shown after answering */}
      {isAnswered && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button onClick={advanceQuestion} style={{ ...M.primaryBtn, fontSize: 15 }}>
            {qIdx + 1 < questions.length ? 'Next Question →' : 'Finish Lesson ✓'}
          </button>
          <button
            onClick={async () => {
              if (!currentQ?.id) return
              await supabase.from('flagged_questions').insert({
                question_id: currentQ.id, student_id: student?.id || null,
                reason: 'Seems incorrect or unclear', status: 'open',
              })
            }}
            style={{
              background: 'none', border: 'none', color: M.textSecondary,
              fontSize: 11, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', padding: '2px',
            }}>🚩 Report this question</button>
        </div>
      )}
    </div>
  ) : null

  // ── STEP 5: Complete ─────────────────────────────────────────────────────────
  const accuracy = results.length > 0
    ? Math.round(results.filter(Boolean).length / results.length * 100)
    : 100

  const xpEarned = 10
  const isNova  = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isRoots = mode === 'roots'
  const isSpark = mode === 'spark'

  const completeMsg =
    accuracy === 100 ? (isRoots ? 'You sabi! Perfect score! 🇳🇬' : isBlaze ? 'PERFECT. FLAWLESS.' : 'Perfect score! 🏆')
    : accuracy >= 80 ? (isRoots ? 'You do well! Keep going! 💪' : isBlaze ? 'SOLID WORK. KEEP GOING.' : 'Excellent work!')
    : accuracy >= 60 ? (isRoots ? 'Good try! Practice more!' : 'Good effort — keep going!')
    : (isRoots ? 'No worry — try again! 💪' : 'Keep practising — you\'ll get there!')

  const CompleteStep = (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 24px 24px',
      background: M.lessonBg, overflow: 'hidden', position: 'relative',
    }}>

      {/* Confetti dots — pure CSS */}
      {accuracy >= 60 && [
        { left: '10%', top: '12%', color: '#C8F135', size: 10, delay: 0 },
        { left: '85%', top: '8%',  color: '#FFC933', size: 8,  delay: 0.1 },
        { left: '25%', top: '18%', color: accent,    size: 12, delay: 0.2 },
        { left: '70%', top: '20%', color: '#FF6B6B', size: 7,  delay: 0.15 },
        { left: '50%', top: '6%',  color: '#C8F135', size: 9,  delay: 0.05 },
        { left: '90%', top: '30%', color: accent,    size: 6,  delay: 0.25 },
        { left: '5%',  top: '35%', color: '#FFC933', size: 11, delay: 0.18 },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.left, top: c.top,
          width: c.size, height: c.size, borderRadius: '50%',
          background: c.color, opacity: 0.7,
          animation: `float ${1.5 + i * 0.3}s ease-in-out ${c.delay}s infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Trophy / mascot */}
      <div style={{ animation: 'float 2.5s ease-in-out infinite', marginBottom: 8 }}>
        <BicPencil pose={accuracy >= 60 ? 'celebrate' : 'think'} size={110} />
      </div>

      {/* Lesson complete heading */}
      <div style={{
        fontFamily: M.headingFont, fontSize: 28, fontWeight: 900,
        color: M.textPrimary, textAlign: 'center', lineHeight: 1.15, marginBottom: 4,
      }}>
        {accuracy >= 60 ? (isBlaze ? 'LESSON COMPLETE' : 'Lesson Complete!') : 'Lesson Done'}
      </div>
      <div style={{
        fontSize: 13, color: M.textSecondary, fontFamily: 'Nunito, sans-serif',
        textAlign: 'center', lineHeight: 1.6, marginBottom: 20, maxWidth: 280,
      }}>
        {completeMsg}
      </div>

      {/* Big XP display — Brilliant style */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: isBlaze ? '#FFD700' : `${accent}12`,
        border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`,
        borderRadius: isBlaze ? 12 : 20,
        padding: '18px 40px', marginBottom: 20,
        boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 4px 20px ${accent}20`,
        minWidth: 160,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
          textTransform: 'uppercase', color: isBlaze ? '#0d0d0d' : M.textSecondary,
          fontFamily: 'Nunito, sans-serif', marginBottom: 4,
        }}>TOTAL XP</div>
        <div style={{
          fontSize: 52, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#FFC933',
          fontFamily: M.headingFont, lineHeight: 1, letterSpacing: -1,
        }}>
          +{xpEarned}
          <span style={{ fontSize: 22, marginLeft: 6 }}>✨</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300, marginBottom: 24 }}>
        {[
          { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? M.correctColor : '#FFA726' },
          { label: 'Questions', value: `${results.filter(Boolean).length}/${results.length || questions.length}`, color: accent },
          { label: 'Streak',   value: `×${combo}`,   color: combo >= 3 ? '#FFC933' : M.textSecondary },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, background: M.lessonCard, border: M.lessonBorder,
            borderRadius: M.cardRadius, textAlign: 'center', padding: '10px 4px',
          }}>
            <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: M.headingFont }}>{value}</div>
            <div style={{ fontSize: 9, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {nextSubtopicId ? (
          <button
            onClick={() => router.push(`/learn/lesson/${nextSubtopicId}`)}
            style={{ ...M.primaryBtn, fontSize: 16, padding: '16px' }}>
            {isBlaze ? '⚡ NEXT MISSION!' : isSpark ? '✨ Continue!' : isRoots ? '🇳🇬 Next Lesson' : 'Continue →'}
          </button>
        ) : (
          <button
            onClick={() => router.push('/learn')}
            style={{ ...M.primaryBtn, fontSize: 16, padding: '16px' }}>
            {isBlaze ? '⚡ BACK TO MAP' : '🗺️ Back to Learn Map'}
          </button>
        )}
        <button onClick={() => router.push('/learn')} style={{ ...M.ghostBtn, fontSize: 14 }}>
          Back to Learn Map
        </button>
      </div>
    </div>
  )

  // Correct overlay removed — question advances immediately on correct answer

  // ── Root render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: M.font, background: M.lessonBg, position: 'relative', overflow: 'hidden' }}>


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
      </div>
    </div>
  )
}