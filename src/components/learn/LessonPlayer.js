'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import ExitConfirmModal from '@/components/learn/ExitConfirmModal'
import { createClient } from '@/lib/supabase/client'

// ─── Math renderer: 2^8 → 2⁸, x_n → xₙ ──────────────────────────────────────
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

// ─── SVG illustration ─────────────────────────────────────────────────────────
function SvgIllustration({ svg_code, M }) {
  if (!svg_code) return null
  const vb = svg_code.match(/viewBox=["']([^"']+)["']/)
  const vbp = vb ? vb[1].split(/[\s,]+/).map(Number) : null
  const ar = vbp?.[2] && vbp?.[3] ? vbp[3] / vbp[2] : null
  const html = svg_code.replace(/<svg([^>]*)>/, (_, a) =>
    '<svg' + a.replace(/\s+width=["'][^"']*["']/g,'').replace(/\s+height=["'][^"']*["']/g,'').replace(/\s+style=["'][^"']*["']/g,'')
    + ' width="100%" height="100%" style="display:block;position:absolute;top:0;left:0">'
  )
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: ar ? `${(ar*100).toFixed(2)}%` : '56%', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${M.accentColor}20`, background: '#F8F9FF' }}>
      <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

// ─── Pill progress dots ───────────────────────────────────────────────────────
function BiteDots({ total, current, accent }) {
  if (total <= 1) return null
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 18 : 6, height: 6, borderRadius: 3, background: i <= current ? accent : `${accent}28`, transition: 'all 0.25s' }} />
      ))}
    </div>
  )
}

// ─── Board-style Mathematical Working ────────────────────────────────────────
//
// Renders EXACTLY like a teacher solving on a classroom board:
//
//   Set up                       ← step label (tiny muted pill)
//   5x + 10 = 25                 ← MATH LINE: large, bold, monospace
//   Subtract 10 from both sides. ← EXPLANATION LINE: smaller, italic, Nunito
//   5x = 15                      ← MATH LINE
//   Divide both sides by 5.      ← EXPLANATION LINE
//   x = 3                        ← MATH LINE
//   ─────────────────────────────
//   Answer: x = 3                ← ANSWER LINE: accent colour, largest, bold
//
// Line type rules (applied to each \n-separated line):
//
//   ANSWER LINE  — starts with "Answer:" or "Solution:"
//   EXPLANATION  — starts with a capital letter AND contains 2+ lowercase words
//                  AND has no = sign AND is not a fraction/number start
//   MATH LINE    — everything else
//
// This matches the spec exactly:
//   • Every equation on its own line (math)
//   • Every sentence on its own line (explanation)
//   • Answer highlighted in accent colour
//   • No paragraph-style rendering ever
//
function StepList({ steps, M, accent }) {
  if (!steps?.length) return null
  const ac = accent || M.accentColor

  // ── Line type detector ──────────────────────────────────────────────────
  function lineType(line) {
    const t = line.trim()
    if (!t) return 'empty'

    // Answer / Solution line
    if (/^(Answer|Solution)\s*:/i.test(t)) return 'answer'

    // Explanation: starts capital, has multiple word characters, no = sign,
    // not starting with a digit, not a fraction-like pattern
    const isWordStart   = /^[A-Z][a-z]/.test(t)
    const hasWords      = (t.match(/[a-z]{2,}/g) || []).length >= 2
    const hasEquals     = t.includes('=')
    const startsDigit   = /^\d/.test(t)
    const isFraction    = /^\d+\/\d+/.test(t)
    const hasOperator   = /[+\-×÷*/^]/.test(t) && !isWordStart

    if (isWordStart && hasWords && !hasEquals && !startsDigit && !isFraction && !hasOperator) {
      return 'explanation'
    }

    return 'math'
  }

  return (
    <div>
      {steps.map((s, i) => {
        const rawText   = s.text || s.content || String(s)
        const label     = (s.label || '').trim()
        const isLast    = i === steps.length - 1
        const isAnswer  = /^(answer|solution)/i.test(label)

        // Split on literal \n — each becomes one display line
        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

        return (
          <div key={i} style={{ marginBottom: isLast ? 0 : 8 }}>

            {/* Step label — only for non-answer steps that have a label */}
            {label && !isAnswer && (
              <div style={{
                display: 'inline-block',
                background: `${ac}14`,
                borderRadius: 20,
                padding: '1px 9px',
                marginBottom: 6,
                marginTop: i > 0 ? 10 : 2,
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, color: ac,
                  textTransform: 'uppercase', letterSpacing: 1,
                  fontFamily: 'Nunito, sans-serif',
                }}>{label}</span>
              </div>
            )}

            {/* Lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {lines.map((line, li) => {
                const type = lineType(line)

                if (type === 'answer') return (
                  <div key={li} style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 20,
                    fontWeight: 900,
                    color: ac,
                    lineHeight: 2.2,
                    letterSpacing: 0.3,
                    marginTop: 6,
                  }}>
                    <MathText text={line} />
                  </div>
                )

                if (type === 'explanation') return (
                  <div key={li} style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    fontStyle: 'italic',
                    color: M.textSecondary,
                    lineHeight: 1.6,
                    marginTop: 3,
                    marginBottom: 1,
                    paddingLeft: 2,
                  }}>
                    {line}
                  </div>
                )

                // math line
                return (
                  <div key={li} style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: M.textPrimary,
                    lineHeight: 2.0,
                    letterSpacing: 0.2,
                  }}>
                    <MathText text={line} />
                  </div>
                )
              })}
            </div>

            {/* Thin rule between steps — not after last */}
            {!isLast && (
              <div style={{
                height: 1,
                background: `${ac}15`,
                marginTop: 10,
                borderRadius: 1,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared nav buttons ───────────────────────────────────────────────────────
function NavButtons({ onNext, onBack, isFirst, M, nextLabel = 'Next →' }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {!isFirst && <button onClick={onBack} style={{ ...M.ghostBtn, flex: 1, padding: '14px' }}>← Back</button>}
      <button onClick={onNext} style={{ ...M.primaryBtn, flex: isFirst ? 1 : 2, padding: '14px' }}>{nextLabel}</button>
    </div>
  )
}

// ─── Badge label ─────────────────────────────────────────────────────────────
function Badge({ text, color }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 14 }}>{text}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// BITE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// HOOK ─ step into a scene — pure curiosity, zero maths ─────────────────────
// First screen after the entry. No maths, no questions. Just a vivid real-world
// moment that makes the student think: "I want to know how this works."
function BiteHook({ bite, accent, M, onNext, onBack, isFirst }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 22px 22px', animation: 'slideUp 0.3s ease', overflow: 'hidden' }}>

      {/* Mascot */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, flexShrink: 0 }}>
        <BicPencil pose="happy" size={80} />
      </div>

      {/* Topic pill — anchors what this lesson is about */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, flexShrink: 0 }}>
        <div style={{
          background: `${accent}15`, border: `1.5px solid ${accent}35`,
          borderRadius: 20, padding: '5px 16px',
          fontSize: 12, fontWeight: 800, color: accent,
          letterSpacing: 0.6, textTransform: 'uppercase',
          fontFamily: 'Nunito, sans-serif',
        }}>
          {bite.title}
        </div>
      </div>

      {/* Scene card — the vivid real-world moment, no label */}
      <div style={{
        background: M.lessonCard,
        border: `1.5px solid ${accent}28`,
        borderRadius: 20,
        padding: '22px 20px',
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Accent strip at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${accent},${M.accent2 || accent}66)`, borderRadius: '20px 20px 0 0' }} />
        <div style={{
          fontSize: 18, color: M.textPrimary, lineHeight: 1.9,
          fontFamily: 'Nunito, sans-serif', fontWeight: 600,
          textAlign: 'center',
        }}>
          <MathText text={bite.explanation || ''} />
        </div>
      </div>

      {bite.svg_code && (
        <div style={{ marginTop: 16, flexShrink: 0 }}>
          <SvgIllustration svg_code={bite.svg_code} M={M} />
        </div>
      )}

      <div style={{ paddingTop: 20, flexShrink: 0 }}>
        <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} nextLabel="Let's explore this! →" />
      </div>
    </div>
  )
}

// PREDICTION ─ curiosity guess — always AFTER observation, never a test ────────
// UX principle: the student has already SEEN the data (observation bite).
// Now they commit to a guess about the pattern. Right or wrong = same journey.
// The reveal is a bridge to the concept name — not a verdict on the student.
function BitePrediction({ bite, accent, M, onNext, onBack, isFirst }) {
  const [picked, setPicked] = useState(null)
  const opts     = bite.options || []
  const answered = picked !== null
  const correct  = opts[picked]?.is_correct

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 20px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}12`, border: `1px solid ${accent}22`, borderRadius: 20, padding: '5px 14px', marginBottom: 16, alignSelf: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>🤔</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>
          Quick guess
        </span>
      </div>

      {/* Question title */}
      <div style={{ fontSize: 20, fontWeight: 900, color: M.textPrimary, lineHeight: 1.3, fontFamily: M.headingFont, marginBottom: 10 }}>
        {bite.title}
      </div>

      {bite.explanation && (
        <div style={{ fontSize: 15, color: M.textSecondary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginBottom: 16 }}>
          <MathText text={bite.explanation} />
        </div>
      )}

      {bite.svg_code && <div style={{ marginBottom: 16 }}><SvgIllustration svg_code={bite.svg_code} M={M} /></div>}

      {/* No-pressure note — only shown before answering */}
      {!answered && (
        <div style={{
          fontSize: 12, color: M.textSecondary, fontFamily: 'Nunito, sans-serif',
          fontWeight: 500, marginBottom: 14, padding: '10px 14px',
          background: `${accent}08`, borderRadius: 12,
          textAlign: 'center',
        }}>
          ✨ Just have a guess — you will see why after!
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {opts.map((opt, i) => {
          const chosen = picked === i
          const right  = opt.is_correct
          let bg = M.lessonCard, border = `2px solid ${accent}25`, color = M.textPrimary
          if (answered) {
            if (right)       { bg = `${M.correctColor}14`; border = `2px solid ${M.correctColor}`; color = M.correctColor }
            else if (chosen) { bg = `${M.wrongColor}10`;   border = `2px solid ${M.wrongColor}`;   color = M.wrongColor   }
            else             { border = `2px solid ${accent}10`; color = M.textSecondary }
          }
          return (
            <button
              key={i}
              onClick={() => !answered && setPicked(i)}
              style={{
                background: bg, border, borderRadius: 14,
                padding: '14px 18px', fontFamily: 'Nunito, sans-serif',
                fontWeight: 700, color, fontSize: 15,
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: answered && right ? M.correctColor : answered && chosen ? M.wrongColor : `${accent}18`,
                color: answered && (right || chosen) ? '#fff' : accent,
                fontSize: 12, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}>
                {answered && right ? '✓' : answered && chosen && !right ? '✗' : String.fromCharCode(65 + i)}
              </span>
              <MathText text={opt.option_text} />
            </button>
          )
        })}
      </div>

      {/* Reveal — always forward-pointing, never shaming */}
      {answered && (
        <div style={{
          background: `${accent}0D`, border: `1.5px solid ${accent}28`,
          borderRadius: 16, padding: '16px 18px', marginBottom: 18,
          animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif', marginBottom: 5 }}>
            {correct ? 'Great instinct! 🎉' : 'Good try! 🤔'}
          </div>
          <div style={{ fontSize: 14, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.7, fontWeight: 500 }}>
            {bite.reveal || 'Keep going — you are about to see exactly why!'}
          </div>
        </div>
      )}

      {answered && (
        <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} nextLabel="I see the pattern →" />
      )}
    </div>
  )
}

// OBSERVATION ─ full table shown at once — just look and read ─────────────────
function BiteObservation({ bite, accent, M, onNext, onBack, isFirst }) {
  const rows = bite.table_rows    || []
  const hdrs = bite.table_headers || []
  const cols = Math.max(hdrs.length, rows[0]?.length || 0)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 16px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}12`, borderRadius: 20, padding: '5px 13px', marginBottom: 14, alignSelf: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>👀</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>Look at this</span>
      </div>

      <div style={{ fontSize: 20, fontWeight: 900, color: M.textPrimary, lineHeight: 1.25, fontFamily: M.headingFont, marginBottom: 10 }}>{bite.title}</div>

      {bite.explanation && (
        <div style={{ fontSize: 15, color: M.textSecondary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginBottom: 16 }}>
          <MathText text={bite.explanation} />
        </div>
      )}

      {bite.svg_code && <div style={{ marginBottom: 16 }}><SvgIllustration svg_code={bite.svg_code} M={M} /></div>}

      {/* Full table — all rows shown at once, no hiding */}
      {rows.length > 0 && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${accent}25`, marginBottom: 20 }}>
          {hdrs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, background: accent }}>
              {hdrs.map((h, i) => (
                <div key={i} style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>{h}</div>
              ))}
            </div>
          )}
          {rows.map((row, ri) => (
            <div key={ri} style={{
              display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
              background: ri % 2 === 0 ? M.lessonCard : `${accent}07`,
              borderTop: `1px solid ${accent}15`,
            }}>
              {row.map((cell, ci) => (
                <div key={ci} style={{ padding: '13px 14px', fontSize: 17, fontWeight: 700, color: M.textPrimary, fontFamily: "'Courier New', Courier, monospace", textAlign: 'center' }}>
                  <MathText text={String(cell)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} nextLabel="I see a pattern! →" />
      </div>
    </div>
  )
}

// PATTERN ─ what do you notice? — unlock feel on correct answer ───────────────
function BitePattern({ bite, accent, M, onNext, onBack, isFirst }) {
  const [picked, setPicked] = useState(null)
  const opts = bite.options || []
  const answered = picked !== null
  const correct  = opts[picked]?.is_correct

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 16px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}12`, borderRadius: 20, padding: '5px 13px', marginBottom: 14, alignSelf: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>What do you notice?</span>
      </div>

      <div style={{ fontSize: 20, fontWeight: 900, color: M.textPrimary, lineHeight: 1.25, fontFamily: M.headingFont, marginBottom: 10 }}>{bite.title}</div>

      {bite.explanation && (
        <div style={{ fontSize: 15, color: M.textSecondary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginBottom: 18 }}>
          <MathText text={bite.explanation} />
        </div>
      )}

      {bite.svg_code && <div style={{ marginBottom: 18 }}><SvgIllustration svg_code={bite.svg_code} M={M} /></div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {opts.map((opt, i) => {
          const chosen = picked === i
          const right  = opt.is_correct
          let bg = M.lessonCard, border = `2px solid ${accent}25`, color = M.textPrimary
          if (answered) {
            if (right)       { bg = `${M.correctColor}15`; border = `2px solid ${M.correctColor}`; color = M.correctColor }
            else if (chosen) { bg = `${M.wrongColor}12`;   border = `2px solid ${M.wrongColor}`;   color = M.wrongColor   }
            else             { border = `2px solid ${accent}10`; color = M.textSecondary }
          }
          return (
            <button
              key={i}
              onClick={() => !answered && setPicked(i)}
              style={{ background: bg, border, borderRadius: 14, padding: '14px 18px', fontFamily: 'Nunito, sans-serif', fontWeight: 700, color, fontSize: 15, cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: answered && right ? M.correctColor : answered && chosen ? M.wrongColor : `${accent}18`, color: answered && (right || chosen) ? '#fff' : accent, fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {answered && right ? '✓' : answered && chosen && !right ? '✗' : String.fromCharCode(65 + i)}
              </span>
              <MathText text={opt.option_text} />
            </button>
          )
        })}
      </div>

      {/* Reveal — feels like unlocking a discovery */}
      {answered && bite.reveal && (
        <div style={{
          background: `${M.correctColor}10`,
          border: `1.5px solid ${M.correctColor}35`,
          borderRadius: 16, padding: '16px 18px', marginBottom: 16,
          animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: M.correctColor, fontFamily: 'Nunito, sans-serif', marginBottom: 6, letterSpacing: 0.4 }}>
            🔓 Pattern unlocked!
          </div>
          <div style={{ fontSize: 14, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.7 }}>
            {bite.reveal}
          </div>
        </div>
      )}

      {answered && <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} nextLabel="Now let's name it →" />}
    </div>
  )
}

// CONCEPT ─ the "aha!" moment ─────────────────────────────────────────────────
function BiteConcept({ bite, accent, M, onNext, onBack, isFirst }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 16px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <Badge text="💡 The Big Idea" color={accent} />
      {bite.svg_code && <div style={{ marginBottom: 20, flexShrink: 0 }}><SvgIllustration svg_code={bite.svg_code} M={M} /></div>}
      <div style={{ fontSize: 22, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2, fontFamily: M.headingFont, marginBottom: 16 }}>{bite.title}</div>
      {bite.explanation && (
        <div style={{ fontSize: 17, color: M.textSecondary, lineHeight: 1.85, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
          <MathText text={bite.explanation} />
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 20 }}>
        <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} />
      </div>
    </div>
  )
}

// RULE ─ the maths rule + formula ─────────────────────────────────────────────
function BiteRule({ bite, accent, M, onNext, onBack, isFirst }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 16px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>
      <Badge text="📐 The Rule" color={accent} />
      <div style={{ fontSize: 22, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2, fontFamily: M.headingFont, marginBottom: 16 }}>{bite.title}</div>
      {bite.svg_code && <div style={{ marginBottom: 18 }}><SvgIllustration svg_code={bite.svg_code} M={M} /></div>}
      {bite.explanation && (
        <div style={{ fontSize: 17, color: M.textSecondary, lineHeight: 1.85, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginBottom: bite.formula ? 20 : 0 }}>
          <MathText text={bite.explanation} />
        </div>
      )}
      {bite.formula && (
        <div style={{ background: M.mathBg, borderRadius: 16, padding: '20px 22px', borderLeft: `5px solid ${accent}`, marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Formula</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: accent, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            <MathText text={bite.formula} />
          </div>
          {bite.formula_note && <div style={{ fontSize: 13, color: M.textSecondary, marginTop: 12, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>{bite.formula_note}</div>}
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 20 }}>
        <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} />
      </div>
    </div>
  )
}

// WORKED EXAMPLE ─ problem card + board-style working ────────────────────────
function BiteExample({ bite, accent, M, onNext, onBack, isFirst }) {
  const steps = bite.steps || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 16px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}12`, borderRadius: 20, padding: '5px 13px', marginBottom: 14, alignSelf: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>📝</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>Worked Example</span>
      </div>

      {/* Problem — clean card, clearly the question */}
      <div style={{ background: `${accent}0C`, border: `1.5px solid ${accent}28`, borderRadius: 16, padding: '16px 18px', marginBottom: 20, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Nunito, sans-serif' }}>
          Question
        </div>
        <div style={{ fontSize: 16, color: M.textPrimary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
          <MathText text={bite.explanation || ''} />
        </div>
      </div>

      {bite.svg_code && <div style={{ marginBottom: 18, flexShrink: 0 }}><SvgIllustration svg_code={bite.svg_code} M={M} /></div>}

      {/* Working — sits on a light math background, no border, just breathing room */}
      {steps.length > 0 && (
        <div style={{
          background: M.mathBg,
          borderRadius: 16,
          padding: '18px 20px 14px',
          marginBottom: 18,
          flexShrink: 0,
        }}>
          {/* "Working" label — tiny, muted */}
          <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 8, opacity: 0.6 }}>
            Working
          </div>
          <StepList steps={steps} M={M} accent={accent} />
        </div>
      )}

      {/* Mistake callout — FM lessons only, shows common exam error */}
      {bite.mistake_callout && (
        <div style={{
          borderLeft: '3px solid #EF5350',
          borderRadius: '0 12px 12px 0',
          background: 'rgba(239,83,80,0.06)',
          padding: '12px 16px',
          marginBottom: 16,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#EF5350', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 5 }}>⚠ Where marks are lost</div>
          <div style={{ fontSize: 13, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.65, fontWeight: 500 }}>{bite.mistake_callout}</div>
        </div>
      )}

      {/* Nav always visible */}
      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} nextLabel="Got it! Next →" />
      </div>
    </div>
  )
}

// YOU TRY ─ attempt → hint → reveal solution tap-through ─────────────────────
function BiteYouTry({ bite, accent, M, onNext, onBack, isFirst }) {
  const [phase, setPhase] = useState('attempt')  // 'attempt' | 'hint' | 'solution'
  const steps = bite.steps || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 22px 16px', animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,83,80,0.1)', borderRadius: 20, padding: '5px 13px', marginBottom: 14, alignSelf: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>🎯</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#EF5350', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>Your Turn</span>
      </div>

      {/* Problem card — always visible */}
      <div style={{ background: 'rgba(239,83,80,0.06)', border: '1.5px solid rgba(239,83,80,0.28)', borderRadius: 16, padding: '16px 18px', marginBottom: 18, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#EF5350', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Nunito, sans-serif' }}>
          Your Problem
        </div>
        <div style={{ fontSize: 16, color: M.textPrimary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
          <MathText text={bite.explanation || ''} />
        </div>
      </div>

      {/* Phase: attempt — Show Solution is prominent, hint is optional secondary */}
      {phase === 'attempt' && (
        <div style={{ animation: 'slideUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500, textAlign: 'center', padding: '2px 0 6px' }}>
            Try it on paper first, then check the solution.
          </div>

          {/* Show Solution — BIG primary button, always visible */}
          <button
            onClick={() => setPhase('solution')}
            style={{ ...M.primaryBtn, fontSize: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>👁</span> Show Solution
          </button>

          {/* Hint — smaller ghost option below, only if hint exists */}
          {bite.hint && (
            <button
              onClick={() => setPhase('hint')}
              style={{ ...M.ghostBtn, fontSize: 13, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderStyle: 'dashed' }}>
              <span>💡</span> I need a hint first
            </button>
          )}
        </div>
      )}

      {/* Phase: hint */}
      {phase === 'hint' && bite.hint && (
        <div style={{ animation: 'slideUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: M.hintBg, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Nunito, sans-serif' }}>💡 Hint</div>
            <div style={{ fontSize: 14, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.7 }}>
              {bite.hint}
            </div>
          </div>
          <div style={{ fontSize: 13, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
            Give it another try, then check the solution.
          </div>
          <button
            onClick={() => setPhase('solution')}
            style={{ ...M.ghostBtn, borderStyle: 'dashed', borderColor: `${accent}45`, color: accent, fontSize: 14, fontWeight: 800, padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>👁</span> Show Solution
          </button>
        </div>
      )}

      {/* Phase: solution — all steps shown, nav always reachable */}
      {phase === 'solution' && (
        <div style={{ animation: 'slideUp 0.25s ease' }}>
          {steps.length > 0 ? (
            <div style={{ background: M.mathBg, borderRadius: 16, padding: '18px 20px 14px', marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 8, opacity: 0.6 }}>
                Solution
              </div>
              <StepList steps={steps} M={M} accent={accent} />
            </div>
          ) : (
            <div style={{ fontSize: 14, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', marginBottom: 18 }}>
              No solution steps provided.
            </div>
          )}
          <NavButtons onNext={onNext} onBack={onBack} isFirst={isFirst} M={M} nextLabel="I got it! →" />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE (MCQ) — BUG-FREE VERSION
//
// BUGS FIXED:
//   1. Auto-select bug: `picked` starts as `null` — no answer is pre-selected.
//      The component is keyed by bite index so state resets between questions.
//   2. Shows-explanation-not-question bug: question text comes from `bite.question_text`
//      (never overwritten). Explanation (solution walkthrough) comes from
//      `bite.explanation_text` and is only shown AFTER the student picks an answer.
//
// CORRECT FLOW: Question shown → student picks → colours update → feedback panel
//               shows with "Why?" button → Continue/Next button appears.
// ─────────────────────────────────────────────────────────────────────────────
function BitePractice({ bite, accent, M, onNext, onCorrect, supabase, student }) {
  const [picked, setPicked] = useState(null)   // null = unanswered
  const opts       = bite.options || []
  const answered   = picked !== null
  const isCorrect  = answered && opts[picked]?.is_correct

  // question_text = what to show as the question (never the solution)
  const questionText = bite.question_text || bite.title || ''

  // explanation_text = step-by-step solution shown only after answering
  const explanationText = bite.explanation_text || ''

  // correctOpt — used in feedback banner
  const correctOpt = opts.find(o => o.is_correct)

  // Post-answer explanation panel (inline, expandable)
  const [showExp, setShowExp] = useState(false)
  const expLines = explanationText.split('\n').map(s => s.trim()).filter(Boolean)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px 16px', gap: 12, animation: 'slideUp 0.3s ease', overflowY: 'auto' }}>

      {/* Badge */}
      <div style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>
        ✏️ Practice — {bite.difficulty || 'question'}
      </div>

      {/* ── QUESTION TEXT (always visible, never replaced by explanation) ── */}
      <div style={{ background: M.lessonCard, border: M.lessonBorder, borderRadius: M.cardRadius, boxShadow: M.cardShadow, padding: '18px', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: M.textPrimary, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>
          <MathText text={questionText} />
        </div>
      </div>

      {/* ── ANSWER OPTIONS — shown immediately, student must click one ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
        {opts.map((opt, i) => {
          const letters  = ['A', 'B', 'C', 'D']
          const isChosen = answered && picked === i
          const isRight  = opt.is_correct
          // Colours only change AFTER the student has picked
          let border = `2px solid ${accent}25`, bg = M.lessonCard, color = M.textPrimary
          if (answered) {
            if (isRight)       { border = `2px solid ${M.correctColor}`; bg = `${M.correctColor}15`; color = M.correctColor }
            else if (isChosen) { border = `2px solid ${M.wrongColor}`;   bg = `${M.wrongColor}12`;   color = M.wrongColor   }
            else               { border = `2px solid ${accent}10`;       color = M.textSecondary }
          }
          return (
            <button
              key={i}
              onClick={() => {
                if (!answered) {
                  setPicked(i)
                  if (opt.is_correct && onCorrect) onCorrect()
                }
              }}
              style={{ background: bg, border, borderRadius: 14, padding: '14px 10px', fontFamily: 'Nunito, sans-serif', fontWeight: 800, color, cursor: answered ? 'default' : 'pointer', textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: 72 }}
              onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = `${accent}25`; e.currentTarget.style.transform = '' } }}
            >
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: answered && isRight ? M.correctColor : answered && isChosen ? M.wrongColor : `${accent}22`, color: answered && (isRight || isChosen) ? '#fff' : accent, fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {answered && isRight ? '✓' : answered && isChosen && !isRight ? '✗' : letters[i]}
              </span>
              <MathText text={opt.option_text || opt.text} style={{ fontSize: 13, lineHeight: 1.35 }} />
            </button>
          )
        })}
      </div>

      {/* ── FEEDBACK — only shown after the student picks ── */}
      {answered && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${isCorrect ? M.correctColor : M.wrongColor}40`, background: isCorrect ? `${M.correctColor}08` : `${M.wrongColor}06`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isCorrect ? `${M.correctColor}14` : `${M.wrongColor}12` }}>
            <span style={{ fontSize: 22 }}>{isCorrect ? '🎉' : '💡'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'Nunito, sans-serif', color: isCorrect ? M.correctColor : M.wrongColor }}>
                {isCorrect ? 'Correct! Great work! 🌟' : 'Not quite!'}
              </div>
              {!isCorrect && correctOpt && (
                <div style={{ fontSize: 12, color: M.correctColor, fontFamily: 'Nunito, sans-serif', marginTop: 3, fontWeight: 700 }}>
                  ✅ Answer: <MathText text={correctOpt.option_text} />
                </div>
              )}
            </div>
            {expLines.length > 0 && (
              <button onClick={() => setShowExp(v => !v)} style={{ background: showExp ? accent : 'transparent', border: `1.5px solid ${accent}`, borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Nunito, sans-serif', color: showExp ? '#fff' : accent, flexShrink: 0, transition: 'all 0.15s' }}>
                {showExp ? 'Hide ▲' : 'Why? 💡'}
              </button>
            )}
          </div>
          {/* Explanation steps — only shown when "Why?" is tapped */}
          {showExp && expLines.length > 0 && (
            <div style={{ padding: '4px 16px 14px' }}>
              <div style={{ background: M.mathBg, borderRadius: 14, padding: '16px 18px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 8, opacity: 0.6 }}>Working</div>
                <StepList
                  steps={expLines.map(line => ({ text: line }))}
                  M={M}
                  accent={accent}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONTINUE — only shown after answering ── */}
      {answered && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button onClick={onNext} style={{ ...M.primaryBtn, fontSize: 16, padding: '15px' }}>
            {bite._isLast ? 'Finish Lesson ✓' : 'Next Question →'}
          </button>
          {bite.question_id && (
            <button onClick={async () => {
              await supabase?.from('flagged_questions').insert({ question_id: bite.question_id, student_id: student?.id || null, reason: 'Seems incorrect or unclear', status: 'open' })
            }} style={{ background: 'none', border: 'none', color: M.textSecondary, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', padding: '2px' }}>
              🚩 Report this question
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Bite dispatcher ──────────────────────────────────────────────────────────
function renderBite(bite, props, idx) {
  // Key each practice bite so useState resets between questions
  const key = `${bite.type}-${idx}`
  const p = { ...props, bite }
  switch (bite.type) {
    case 'hook':           return <BiteHook        key={key} {...p} />
    case 'prediction':
    case 'method_picker':  return <BitePrediction  key={key} {...p} />
    case 'observation':    return <BiteObservation key={key} {...p} />
    case 'pattern':        return <BitePattern      key={key} {...p} />
    case 'concept':
    case 'definition':
    case 'introduction':   return <BiteConcept     key={key} {...p} />
    case 'rule':           return <BiteRule        key={key} {...p} />
    case 'worked_example': return <BiteExample     key={key} {...p} />
    case 'you_try':        return <BiteYouTry      key={key} {...p} />
    case 'practice':
    case 'quiz':           return <BitePractice    key={key} {...p} />
    default:               return <BiteConcept     key={key} {...p} />
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LESSON PLAYER
// ─────────────────────────────────────────────────────────────────────────────
export default function LessonPlayer({ lesson, subtopic, student, nextSubtopicId, isGuest = false, onGuestComplete }) {
  const router   = useRouter()
  const { M, mode } = useMode()
  const [showExit, setShowExit] = useState(false)
  const supabase = createClient()

  const slides    = lesson?.slides    || []
  const questions = lesson?.questions || []

  // ── Decode slides that have encoded interactive data in the steps field ────
  // Also: filter out 'hook' type slides (the hook comes from lesson.hook and is
  // rendered as hookBite — keeping it in decodedSlides would show it twice).
  // Also: filter out 'prediction' and 'pattern' bites — they interrupt the lesson
  // flow without adding value; the observation → concept flow is smoother without them.
  const SKIP_TYPES = new Set(['hook', 'prediction', 'pattern'])
  const decodedSlides = slides
    .map(slide => {
      if (!slide.steps) return slide
      try {
        const parsed = typeof slide.steps === 'string' ? JSON.parse(slide.steps) : slide.steps
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed._type !== undefined) {
          return { ...slide, type: parsed._type || slide.type, options: parsed._options || null, reveal: parsed._reveal || null, table_headers: parsed._table_headers || null, table_rows: parsed._table_rows || null, steps: parsed._steps || null }
        }
        return { ...slide, steps: Array.isArray(parsed) ? parsed : slide.steps }
      } catch { return slide }
    })
    .filter(slide => !SKIP_TYPES.has(slide.type))

  // ── Build practice bites from questions ───────────────────────────────────
  // IMPORTANT: question_text and explanation_text are SEPARATE fields.
  // question_text = what the student sees as the question (never replaced)
  // explanation_text = the solution walkthrough (only shown after answering via "Why?")
  const practiceBites = questions.map((q, i) => ({
    type:             'practice',
    title:            `Question ${i + 1}`,
    question_text:    q.question_text,           // ← THE QUESTION (displayed first)
    explanation_text: q.explanation || '',       // ← THE SOLUTION (shown only after pick)
    options:          q.options || [],
    hint:             q.hint || null,
    question_id:      q.id,
    difficulty:       q.difficulty || 'medium',
    _isLast:          i === questions.length - 1,
  }))

  // ── Hook bite — first screen after entry ──────────────────────────────────
  const hookBite = lesson?.hook
    ? [{ type: 'hook', title: subtopic?.title || lesson?.title, explanation: lesson.hook }]
    : []

  // All bites in order
  const bites = [...hookBite, ...decodedSlides, ...practiceBites]

  // step === -1 is the ENTRY SCREEN (mascot + title + Start button)
  const [step, setStep] = useState(-1)
  const [completed,    setCompleted]    = useState(false)
  const [correctCount, setCorrectCount] = useState(0)   // tracks correct practice answers

  const isEntry    = step === -1
  const isComplete = step >= bites.length
  const currentBite = !isEntry && !isComplete ? bites[step] : null

  const accent     = M.accentColor
  const isFMLesson = student?.active_subject === 'further_maths'
  const isNova  = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isRoots = mode === 'roots'
  const isSpark = mode === 'spark'

  // Progress %: 0 on entry, 100 on complete
  const progressPct = isEntry ? 0 : isComplete ? 100 : bites.length > 0 ? Math.round(((step) / bites.length) * 100) : 0

  async function handleComplete(finalCorrectCount, totalPractice) {
    // Guest mode — no DB calls, delegate to parent
    if (isGuest) { onGuestComplete?.(finalCorrectCount); return }

    if (completed) return
    setCompleted(true)
    if (!student?.id || !subtopic?.id) {
      console.error('[lesson] handleComplete: missing student.id or subtopic.id', { studentId: student?.id, subtopicId: subtopic?.id })
      return
    }

    // XP scale: 0 correct → 1 XP, 1 correct → 4 XP, all correct → 10 XP
    // If no practice questions, award full 10 XP for completing the lesson
    let earnedXP = 10
    if (totalPractice > 0) {
      if (finalCorrectCount === 0)                  earnedXP = 1
      else if (finalCorrectCount === totalPractice) earnedXP = 10
      else {
        earnedXP = Math.round(4 + ((finalCorrectCount - 1) / Math.max(totalPractice - 1, 1)) * 6)
        earnedXP = Math.max(4, Math.min(9, earnedXP))
      }
    }

    // ── Save lesson progress ────────────────────────────────────────────────
    // NOTE: Supabase client NEVER throws — always check { error } in the return value.
    const { data: existing, error: selErr } = await supabase
      .from('student_progress')
      .select('id')
      .eq('student_id', student.id)
      .eq('subtopic_id', subtopic.id)
      .maybeSingle()

    if (selErr) {
      console.error('[lesson] progress select error:', selErr.message, selErr)
    } else if (existing?.id) {
      const { error: updErr } = await supabase
        .from('student_progress')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (updErr) console.error('[lesson] progress update error:', updErr.message, updErr)
    } else {
      const { error: insErr } = await supabase
        .from('student_progress')
        .insert({ student_id: student.id, subtopic_id: subtopic.id, status: 'completed', completed_at: new Date().toISOString() })
      if (insErr) console.error('[lesson] progress insert error:', insErr.message, insErr)
    }

    // ── Award XP ────────────────────────────────────────────────────────────
    // Route XP to the correct columns based on active subject
    const isFMLesson   = student?.active_subject === 'further_maths'
    const xpCol        = isFMLesson ? 'fm_xp'         : 'xp'
    const monthlyXpCol = isFMLesson ? 'fm_monthly_xp' : 'monthly_xp'
    const selectCols   = `${xpCol}, ${monthlyXpCol}`

    const { data: fresh, error: freshErr } = await supabase
      .from('students')
      .select(selectCols)
      .eq('id', student.id)
      .single()
    if (freshErr) {
      console.error('[lesson] XP fetch error:', freshErr.message, freshErr)
      return
    }

    const { error: xpErr } = await supabase
      .from('students')
      .update({
        [xpCol]:        (fresh?.[xpCol]        || 0) + earnedXP,
        [monthlyXpCol]: (fresh?.[monthlyXpCol] || 0) + earnedXP,
      })
      .eq('id', student.id)
    if (xpErr) console.error('[lesson] XP update error:', xpErr.message, xpErr)
  }

  function goNext() {
    const nextStep = step + 1
    if (nextStep >= bites.length) {
      const totalPractice = practiceBites.length
      handleComplete(correctCount, totalPractice)
      setStep(bites.length)
    }
    else setStep(nextStep)
  }

  function goBack() {
    if (step <= -1) { router.push('/learn?tab=learn'); return }
    if (step === 0) { setStep(-1); return }
    setStep(s => s - 1)
  }

  // ── ENTRY SCREEN — spec: mascot + topic title + Start/Continue button ─────
  // No hook text here. Clean. Just sets the stage.
  const EntryScreen = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', animation: 'slideUp 0.3s ease' }}>
      {/* Mascot */}
      <div style={{ marginBottom: 32 }}>
        <BicPencil pose="happy" size={110} />
      </div>

      {/* Topic title — the only text on this screen */}
      <div style={{ fontSize: 26, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2, fontFamily: M.headingFont, textAlign: 'center', marginBottom: 12 }}>
        {subtopic?.title || lesson?.title}
      </div>

      {/* Optional: lesson number / class level — tiny, secondary */}
      {subtopic?.topic?.title && (
        <div style={{ fontSize: 13, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500, textAlign: 'center', marginBottom: 40 }}>
          {subtopic.topic.title}
        </div>
      )}

      {/* CTA — full-width */}
      <button
        onClick={() => setStep(0)}
        style={{ ...M.primaryBtn, fontSize: 17, padding: '16px 32px', width: '100%', maxWidth: 320 }}>
        {isBlaze ? "⚡ LET'S GO!" : isRoots ? '🇳🇬 Start Lesson' : isSpark ? '✨ Begin!' : 'Start Lesson →'}
      </button>

      {/* Bite count — shows student how long the lesson is */}
      {bites.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 12, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
          {bites.length} short steps
        </div>
      )}
    </div>
  )

  // ── COMPLETE SCREEN ────────────────────────────────────────────────────────
  const CompleteScreen = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px 28px', background: M.lessonBg, overflow: 'hidden', position: 'relative' }}>
      {[
        { left: '10%', top: '12%', color: '#C8F135', size: 10, delay: 0 },
        { left: '85%', top: '8%',  color: '#FFC933', size: 8,  delay: 0.1 },
        { left: '25%', top: '18%', color: accent,    size: 12, delay: 0.2 },
        { left: '70%', top: '20%', color: '#FF6B6B', size: 7,  delay: 0.15 },
      ].map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.left, top: c.top, width: c.size, height: c.size, borderRadius: '50%', background: c.color, opacity: 0.7, animation: `float ${1.5 + i * 0.3}s ease-in-out ${c.delay}s infinite alternate`, pointerEvents: 'none' }} />
      ))}

      <div style={{ animation: 'float 2.5s ease-in-out infinite', marginBottom: 16 }}>
        <BicPencil pose="celebrate" size={110} />
      </div>

      <div style={{ fontFamily: M.headingFont, fontSize: 28, fontWeight: 900, color: M.textPrimary, textAlign: 'center', lineHeight: 1.15, marginBottom: 8 }}>
        {isBlaze ? 'LESSON COMPLETE' : 'Lesson Complete! 🎉'}
      </div>
      <div style={{ fontSize: 15, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textAlign: 'center', lineHeight: 1.65, marginBottom: 32, maxWidth: 280 }}>
        {isRoots ? 'You sabi this topic! Keep going! 🇳🇬' : isBlaze ? 'ANOTHER ONE DOWN. KEEP GOING.' : 'Great work — you made it through every step!'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: isBlaze ? '#FFD700' : `${accent}12`, border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`, borderRadius: isBlaze ? 12 : 20, padding: '20px 48px', marginBottom: 32, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 4px 20px ${accent}20` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: isBlaze ? '#0d0d0d' : M.textSecondary, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>XP EARNED</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#FFC933', fontFamily: M.headingFont, lineHeight: 1, letterSpacing: -1 }}>
          +{practiceBites.length > 0 ? Math.max(1, Math.round((correctCount / practiceBites.length) * 10)) : 10}<span style={{ fontSize: 22, marginLeft: 6 }}>✨</span>
        </div>
        {practiceBites.length > 0 && (
          <div style={{ fontSize: 12, fontWeight: 600, color: isBlaze ? 'rgba(0,0,0,0.5)' : M.textSecondary, fontFamily: 'Nunito, sans-serif', marginTop: 6 }}>
            {correctCount} of {practiceBites.length} correct
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {nextSubtopicId
          ? <button onClick={() => router.push(`/learn/lesson/${nextSubtopicId}`)} style={{ ...M.primaryBtn, fontSize: 16, padding: '16px' }}>
              {isBlaze ? '⚡ NEXT MISSION!' : isSpark ? '✨ Continue!' : isRoots ? '🇳🇬 Next Lesson' : 'Continue →'}
            </button>
          : <button onClick={() => router.push('/learn?tab=learn')} style={{ ...M.primaryBtn, fontSize: 16, padding: '16px' }}>
              {isBlaze ? '⚡ BACK TO MAP' : '🗺️ Back to Learn Map'}
            </button>
        }
        <button onClick={() => router.push('/learn?tab=learn')} style={{ ...M.ghostBtn, fontSize: 14 }}>Back to Learn Map</button>
      </div>
    </div>
  )

  // ── TOP BAR ────────────────────────────────────────────────────────────────
  const TopBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', flexShrink: 0, borderBottom: `1px solid ${accent}18`, background: M.hudBg }}>
      <button onClick={() => setShowExit(true)} style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: M.lessonCard, border: M.lessonBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: M.textSecondary, flexShrink: 0 }}>✕</button>
      <div style={{ flex: 1, height: 6, background: M.progressTrack, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${accent},${M.accent2 || accent})`, transition: 'width 0.4s ease' }} />
      </div>
      {/* Step counter — hidden on entry and complete */}
      {!isEntry && !isComplete && (
        <div style={{ background: M.lessonCard, border: M.lessonBorder, borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 800, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {step + 1} / {bites.length}
        </div>
      )}
      {/* Subject pill — shows Further Maths label so student always knows which subject */}
      {isFMLesson && (
        <div style={{ background: `${accent}14`, border: `1.5px solid ${accent}30`, borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif', letterSpacing: 0.4 }}>FM</span>
        </div>
      )}
    </div>
  )

  const biteProps = {
    accent, M,
    onNext:    goNext,
    onBack:    goBack,
    isFirst:   step === 0,
    onCorrect: () => setCorrectCount(n => n + 1),
    supabase,
    student,
  }

  return (
    <div style={{ minHeight: '100vh', background: M.lessonBg, display: 'flex', justifyContent: 'center' }}>
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: M.font, background: M.lessonBg, position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 680 }}>
      {/* Thin progress strip at very top */}
      <div style={{ height: 4, background: M.progressTrack, flexShrink: 0 }}>
        <div style={{ width: `${progressPct}%`, height: '100%', background: accent, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {TopBar}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {isEntry    && EntryScreen}
        {isComplete && CompleteScreen}
        {!isEntry && !isComplete && currentBite && renderBite(currentBite, biteProps, step)}
      </div>
    </div>
      <ExitConfirmModal
        open={showExit}
        onStay={() => setShowExit(false)}
        onExit={() => { setShowExit(false); router.push('/learn?tab=learn') }}
        M={M}
        mode={mode}
      />
    </div>
    
  )
}