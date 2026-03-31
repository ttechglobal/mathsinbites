'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'
import ExitConfirmModal from '@/components/learn/ExitConfirmModal'
import { createClient } from '@/lib/supabase/client'

// ─── Math renderer: 2^8 → 2⁸, x_n → xₙ ──────────────────────────────────────
// ── Format explanation: break long text into digestible chunks ────────────────
// Splits on sentence boundaries, groups into short paragraphs of 1-2 sentences
// Returns array of string chunks for rendering as separate <p> elements
function formatExplanation(text) {
  if (!text) return []
  // Split on sentence boundaries but keep the delimiter
  const raw = text.trim()

  // If it has explicit newlines or bullet markers, split on those first
  if (raw.includes('\n') || raw.includes('• ') || raw.includes('* ')) {
    return raw
      .split(/\n|(?:^|\n)[•*]\s+/)
      .map(s => s.trim())
      .filter(Boolean)
  }

  // Otherwise split on sentence endings and group into chunks of ~1-2 sentences
  const sentences = raw
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1|||')
    .split('|||')
    .map(s => s.trim())
    .filter(Boolean)

  // Group into chunks: if a sentence is short (<60 chars), merge with next
  const chunks = []
  let cur = ''
  for (const s of sentences) {
    if (cur && (cur.length + s.length) > 120) {
      chunks.push(cur.trim())
      cur = s
    } else {
      cur = cur ? cur + ' ' + s : s
    }
  }
  if (cur.trim()) chunks.push(cur.trim())
  return chunks.length > 0 ? chunks : [raw]
}

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


// ════════════════════════════════════════════════════════════════════════════
// BITE RENDERERS — Guided experience v2
// Design principles:
//   1. Each slide = one moment. No scrolling within a slide.
//   2. Content auto-animates in with staggered reveals — NO tap to reveal
//   3. Mascot speech always first, content flows in after
//   4. ONLY "Next →" requires a tap — nothing else
//   5. Steps text is large and easy to read
// ════════════════════════════════════════════════════════════════════════════

// ── Shared: mascot speech bubble ─────────────────────────────────────────────
function MascotSpeech({ text, accent, M, pose = 'happy' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 10,
      animation: 'revealUp 0.35s ease both',
      marginBottom: 14, flexShrink: 0,
    }}>
      <div style={{ flexShrink: 0 }}>
        <BicPencil pose={pose} size={48} />
      </div>
      <div style={{
        flex: 1, minWidth: 0,
        background: M.lessonCard, border: `1.5px solid ${accent}28`,
        borderRadius: '16px 16px 16px 4px',
        padding: '10px 14px',
        fontSize: 13, fontWeight: 700, color: M.textPrimary,
        lineHeight: 1.55, fontFamily: 'Nunito, sans-serif',
      }}>
        <MathText text={text} />
      </div>
    </div>
  )
}

// ── Shared: back button ───────────────────────────────────────────────────────
function BackBtn({ onBack, isFirst }) {
  if (isFirst) return <div style={{ height: 32 }} />
  return (
    <button onClick={onBack} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 14, color: '#888', fontFamily: 'Nunito, sans-serif',
      fontWeight: 800, padding: '0 0 8px', alignSelf: 'flex-start',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      ← Back
    </button>
  )
}

// ── Shared: next button ───────────────────────────────────────────────────────
function NextBtn({ onNext, label = 'Next →', accent, M }) {
  return (
    <button
      onClick={onNext}
      style={{
        width: '100%', padding: '16px',
        borderRadius: 16, border: 'none',
        background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
        color: '#fff', fontSize: 17, fontWeight: 900,
        cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
        boxShadow: `0 6px 22px ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform 0.1s',
      }}
      onMouseDown={e => e.currentTarget.style.transform='scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
      onTouchStart={e => e.currentTarget.style.transform='scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform='scale(1)'}
    >
      {label}
    </button>
  )
}

// ── Format explanation into lines ─────────────────────────────────────────────
// Returns array of string chunks for rendering line-by-line like a board
function fmtExp(text) {
  if (!text) return []
  const raw = text.trim()
  // Explicit newlines or bullets — split there
  if (raw.includes('\n') || /(?:^|\n)[•\-\*]\s/.test(raw)) {
    return raw
      .split(/\n|(?:^|\n)[•\-\*]\s+/)
      .map(s => s.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean)
  }
  // Split on sentence endings
  const sentences = raw
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1|||')
    .split('|||')
    .map(s => s.trim())
    .filter(Boolean)
  // Each sentence = its own line (board-style)
  return sentences.length > 0 ? sentences : [raw]
}

// ── HOOK — inviting opener, auto-flows ───────────────────────────────────────
function BiteHook({ bite, accent, M, onNext, onBack, isFirst }) {
  const openers = [
    `Here's something interesting…`,
    `Before we start — picture this.`,
    `Let me show you something real.`,
    `This is where it starts.`,
    `Stay with me on this.`,
  ]
  const opener = openers[(bite.title || '').length % openers.length]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />

      {/* Topic pill */}
      <div style={{ alignSelf: 'center', background: `${accent}14`, border: `1px solid ${accent}25`, borderRadius: 20, padding: '4px 14px', marginBottom: 14, fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', animation: 'revealUp 0.3s ease both' }}>
        {bite.title}
      </div>

      {/* Mascot speaks */}
      <MascotSpeech text={opener} accent={accent} M={M} />

      {/* Hook scene — auto-animates in */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: 'revealUp 0.5s 0.25s ease both' }}>
        <div style={{
          background: M.lessonCard, border: `1.5px solid ${accent}22`,
          borderRadius: 18, padding: '20px 18px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${accent},${accent}50)`, borderRadius: '18px 18px 0 0' }} />
          {fmtExp(bite.explanation || '').map((chunk, i) => (
            <div key={i} style={{
              fontSize: 16, color: M.textPrimary, lineHeight: 1.8,
              fontFamily: 'Nunito, sans-serif', fontWeight: 600,
              marginBottom: i < fmtExp(bite.explanation || '').length - 1 ? 12 : 0,
              animation: `revealUp 0.4s ${0.3 + i * 0.12}s ease both`,
            }}>
              <MathText text={chunk} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 14, flexShrink: 0, animation: 'revealUp 0.4s 0.5s ease both' }}>
        <NextBtn onNext={onNext} label="Let's explore this →" accent={accent} M={M} />
      </div>
    </div>
  )
}

// ── CONCEPT / DEFINITION / INTRODUCTION / RULE — all auto-flow ───────────────
function BiteConcept({ bite, accent, M, onNext, onBack, isFirst }) {
  const mascotLines = {
    concept:      `Here's the big idea.`,
    definition:   `Let's get this definition right.`,
    introduction: `We're starting something new. Stay with me.`,
    rule:         `This is the rule — read it carefully.`,
    summary:      `Let's pull everything together.`,
    default:      `Here's what you need to know.`,
  }
  const mascotText = mascotLines[bite.type] || mascotLines.default
  const lines = fmtExp(bite.explanation || '')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />

      <MascotSpeech text={mascotText} accent={accent} M={M} />

      {/* Title */}
      <div style={{ fontSize: 22, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2, fontFamily: M.headingFont, marginBottom: 14, animation: 'revealUp 0.4s 0.2s ease both' }}>
        {bite.title}
      </div>

      {/* SVG illustration — if present, auto-flows in */}
      {bite.svg_code && (
        <div style={{ marginBottom: 14, flexShrink: 0, animation: 'revealUp 0.4s 0.3s ease both' }}>
          <SvgIllustration svg_code={bite.svg_code} M={M} />
        </div>
      )}

      {/* Explanation — line by line like a board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontSize: 15, color: M.textSecondary, lineHeight: 1.8,
            fontFamily: 'Nunito, sans-serif', fontWeight: 600,
            paddingLeft: 12, borderLeft: `2px solid ${accent}28`,
            animation: `revealUp 0.4s ${0.25 + i * 0.1}s ease both`,
          }}>
            <MathText text={line} />
          </div>
        ))}

        {/* Formula — auto-flows in after explanation */}
        {bite.formula && (
          <div style={{
            background: M.mathBg, borderRadius: 14, padding: '16px 18px',
            borderLeft: `4px solid ${accent}`, marginTop: 8,
            animation: `revealUp 0.4s ${0.25 + lines.length * 0.1}s ease both`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Nunito, sans-serif' }}>Formula</div>
            <div style={{ fontFamily: 'monospace', fontSize: 21, fontWeight: 700, color: accent, lineHeight: 1.6 }}>
              <MathText text={bite.formula} />
            </div>
            {bite.formula_note && <div style={{ fontSize: 12, color: M.textSecondary, marginTop: 10, lineHeight: 1.65, fontFamily: 'Nunito, sans-serif' }}>{bite.formula_note}</div>}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 14, flexShrink: 0, animation: `revealUp 0.4s ${0.4 + lines.length * 0.1}s ease both` }}>
        <NextBtn onNext={onNext} accent={accent} M={M} />
      </div>
    </div>
  )
}

function BiteRule({ bite, accent, M, onNext, onBack, isFirst }) {
  return <BiteConcept bite={bite} accent={accent} M={M} onNext={onNext} onBack={onBack} isFirst={isFirst} />
}

// ── WORKED EXAMPLE — all steps shown at once, big text, flow in ───────────────
function BiteExample({ bite, accent, M, onNext, onBack, isFirst }) {
  const steps = bite.steps || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />

      <MascotSpeech text="Watch how I work through this." accent={accent} M={M} pose="think" />

      {/* Question card */}
      <div style={{ background: `${accent}0C`, border: `1.5px solid ${accent}25`, borderRadius: 14, padding: '14px 16px', marginBottom: 14, flexShrink: 0, animation: 'revealUp 0.4s 0.2s ease both' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Nunito, sans-serif' }}>Question</div>
        <div style={{ fontSize: 16, color: M.textPrimary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          <MathText text={bite.explanation || bite.title || ''} />
        </div>
      </div>

      {/* ALL steps shown, staggered animation, BIG text */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, i) => {
          const text    = step.text || step.content || String(step)
          const label   = (step.label || '').trim()
          const isAns   = /^(answer|solution)/i.test(label) || /^answer:/i.test(text.trim())
          return (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '11px 0',
              borderBottom: `1px solid ${M.progressTrack}`,
              animation: `revealUp 0.4s ${0.3 + i * 0.09}s ease both`,
            }}>
              {/* Step number */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: isAns ? accent : `${accent}18`,
                border: `2px solid ${isAns ? accent : accent + '35'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900,
                color: isAns ? '#fff' : accent, marginTop: 2,
              }}>
                {isAns ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                {label && (
                  <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3, fontFamily: 'Nunito, sans-serif' }}>{label}</div>
                )}
                <div style={{
                  fontSize: isAns ? 19 : 16,
                  fontWeight: isAns ? 900 : 700,
                  color: isAns ? accent : M.textPrimary,
                  fontFamily: 'Nunito, sans-serif', lineHeight: 1.65,
                }}>
                  <MathText text={text} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ paddingTop: 14, flexShrink: 0, animation: `revealUp 0.4s ${0.4 + steps.length * 0.09}s ease both` }}>
        <NextBtn onNext={onNext} label="Got it →" accent={accent} M={M} />
      </div>
    </div>
  )
}

// ── YOU TRY — attempt → optional hint → reveal solution ──────────────────────
function BiteYouTry({ bite, accent, M, onNext, onBack, isFirst }) {
  const [phase, setPhase] = useState('attempt')
  const steps = bite.steps || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />

      <MascotSpeech
        text={phase === 'attempt' ? `Your turn. Give this a try!` : phase === 'hint' ? `Here's a nudge.` : `Here's the full working.`}
        accent={accent} M={M}
        pose={phase === 'solution' ? 'celebrate' : phase === 'hint' ? 'think' : 'happy'}
      />

      {/* Problem */}
      <div style={{ background: `${accent}0C`, border: `1.5px solid ${accent}22`, borderRadius: 14, padding: '14px 16px', marginBottom: 14, flexShrink: 0, animation: 'revealUp 0.4s 0.2s ease both' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'Nunito, sans-serif' }}>Your turn</div>
        <div style={{ fontSize: 16, color: M.textPrimary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          <MathText text={bite.explanation || bite.title || ''} />
        </div>
      </div>

      {/* Hint — shown when phase = hint or solution */}
      {(phase === 'hint' || phase === 'solution') && bite.hint && (
        <div style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, animation: 'revealUp 0.35s ease both' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#FFC107', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>💡 Hint</div>
          <div style={{ fontSize: 15, color: M.textPrimary, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{bite.hint}</div>
        </div>
      )}

      {/* Solution steps — all shown at once */}
      {phase === 'solution' && steps.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {steps.map((step, i) => {
            const text  = step.text || step.content || String(step)
            const label = (step.label || '').trim()
            const isAns = /^(answer|solution)/i.test(label)
            return (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${M.progressTrack}`, animation: `revealUp 0.4s ${i * 0.08}s ease both` }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isAns ? accent : `${accent}18`, border: `2px solid ${isAns ? accent : accent+'35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: isAns ? '#fff' : accent, marginTop: 2 }}>
                  {isAns ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1, fontSize: isAns ? 18 : 15, fontWeight: isAns ? 900 : 700, color: isAns ? accent : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.65 }}>
                  {label && <span style={{ fontSize: 9, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginRight: 6 }}>{label}:</span>}
                  <MathText text={text} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ paddingTop: 14, flexShrink: 0 }}>
        {phase === 'attempt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NextBtn onNext={() => setPhase('solution')} label="Show solution →" accent={accent} M={M} />
            {bite.hint && (
              <button onClick={() => setPhase('hint')} style={{ padding: '12px', borderRadius: 14, border: `1.5px solid ${accent}30`, background: 'transparent', color: accent, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                Give me a hint first
              </button>
            )}
          </div>
        )}
        {phase === 'hint' && <NextBtn onNext={() => setPhase('solution')} label="Now show solution →" accent={accent} M={M} />}
        {phase === 'solution' && <NextBtn onNext={onNext} label="Continue →" accent={accent} M={M} />}
      </div>
    </div>
  )
}

// ── OBSERVATION — table + pattern auto-reveals ────────────────────────────────
function BiteObservation({ bite, accent, M, onNext, onBack, isFirst }) {
  let hdrs = [], rows = []
  try {
    hdrs = bite.table_headers || bite._table_headers || []
    rows = bite.table_rows    || bite._table_rows    || []
    if (!hdrs.length && bite.steps) {
      const p = typeof bite.steps === 'string' ? JSON.parse(bite.steps) : bite.steps
      hdrs = p._table_headers || p.table_headers || []
      rows = p._table_rows    || p.table_rows    || []
    }
  } catch {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />
      <MascotSpeech text="Look at this pattern carefully." accent={accent} M={M} pose="think" />

      <div style={{ fontSize: 18, fontWeight: 900, color: M.textPrimary, marginBottom: 12, animation: 'revealUp 0.4s 0.2s ease both' }}>{bite.title}</div>

      {/* Table auto-flows in */}
      {hdrs.length > 0 && rows.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${M.progressTrack}`, marginBottom: 14, animation: 'revealUp 0.4s 0.3s ease both' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Nunito, sans-serif' }}>
            <thead>
              <tr style={{ background: `${accent}16` }}>
                {hdrs.map((h, i) => <th key={i} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderTop: `1px solid ${M.progressTrack}` }}>
                  {(Array.isArray(row) ? row : Object.values(row)).map((cell, ci) => (
                    <td key={ci} style={{ padding: '10px 14px', fontSize: 15, fontWeight: 700, color: M.textPrimary, textAlign: 'center' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Explanation lines */}
      {fmtExp(bite.explanation || '').map((line, i) => (
        <div key={i} style={{ fontSize: 15, color: M.textSecondary, lineHeight: 1.8, fontFamily: 'Nunito, sans-serif', fontWeight: 600, paddingLeft: 12, borderLeft: `2px solid ${accent}28`, marginBottom: 8, animation: `revealUp 0.4s ${0.35 + i * 0.1}s ease both` }}>
          <MathText text={line} />
        </div>
      ))}

      {/* Pattern reveal — auto-shows */}
      {bite.reveal && (
        <div style={{ background: `${accent}10`, border: `1.5px solid ${accent}25`, borderRadius: 12, padding: '13px 15px', marginTop: 8, animation: 'revealUp 0.4s 0.55s ease both' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>The pattern</div>
          <div style={{ fontSize: 15, color: M.textPrimary, lineHeight: 1.7, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}><MathText text={bite.reveal} /></div>
        </div>
      )}

      <div style={{ paddingTop: 14, flexShrink: 0, animation: 'revealUp 0.4s 0.7s ease both' }}>
        <NextBtn onNext={onNext} accent={accent} M={M} />
      </div>
    </div>
  )
}

// ── PREDICTION / METHOD PICKER ────────────────────────────────────────────────
function BitePrediction({ bite, accent, M, onNext, onBack, isFirst }) {
  const [picked, setPicked] = useState(null)
  let options = []
  try {
    const raw = bite.options || (bite.steps ? (typeof bite.steps === 'string' ? JSON.parse(bite.steps) : bite.steps)?._options : null) || []
    options = Array.isArray(raw) ? raw : []
  } catch {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />
      <MascotSpeech text="Quick — what do you think?" accent={accent} M={M} pose="think" />

      <div style={{ fontSize: 18, fontWeight: 900, color: M.textPrimary, marginBottom: 10, lineHeight: 1.35, animation: 'revealUp 0.4s 0.2s ease both' }}>{bite.title}</div>

      {fmtExp(bite.explanation || '').map((line, i) => (
        <div key={i} style={{ fontSize: 14, color: M.textSecondary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginBottom: 6, animation: `revealUp 0.4s ${0.25 + i * 0.08}s ease both` }}>
          <MathText text={line} />
        </div>
      ))}

      {options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, animation: 'revealUp 0.4s 0.35s ease both' }}>
          {options.map((opt, i) => {
            const label = typeof opt === 'string' ? opt : opt.label || opt.text || String(opt)
            const sel   = picked === i
            return (
              <button key={i} onClick={() => !picked && setPicked(i)}
                style={{ padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${sel ? accent : M.progressTrack}`, background: sel ? `${accent}14` : 'transparent', cursor: picked ? 'default' : 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 700, color: sel ? accent : M.textPrimary, fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s' }}>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {picked !== null && bite.reveal && (
        <div style={{ background: `${accent}10`, border: `1.5px solid ${accent}25`, borderRadius: 12, padding: '12px 14px', marginTop: 12, animation: 'revealUp 0.35s ease both' }}>
          <MathText text={bite.reveal} />
        </div>
      )}

      <div style={{ paddingTop: 14, flexShrink: 0, marginTop: 'auto' }}>
        <NextBtn onNext={onNext} accent={accent} M={M} />
      </div>
    </div>
  )
}

function BitePattern({ bite, accent, M, onNext, onBack, isFirst }) {
  return <BiteObservation bite={bite} accent={accent} M={M} onNext={onNext} onBack={onBack} isFirst={isFirst} />
}

// ── PRACTICE / QUIZ ───────────────────────────────────────────────────────────
function BitePractice({ bite, accent, M, onNext, onBack, isFirst, onCorrect, supabase, student }) {
  const [picked,  setPicked]  = useState(null)
  const [showExp, setShowExp] = useState(false)

  const options = bite.options || []

  function pick(opt) {
    if (picked !== null) return
    setPicked(opt)
    if (opt.is_correct) onCorrect?.()
  }

  const correct = picked?.is_correct

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      <BackBtn onBack={onBack} isFirst={isFirst} />

      <MascotSpeech
        text={picked == null ? `Here's a question.` : correct ? `Yes! Correct! 🎉` : `Not quite — but let's see why.`}
        accent={accent} M={M}
        pose={picked ? (correct ? 'celebrate' : 'think') : 'happy'}
      />

      {/* Question */}
      <div style={{ fontSize: 17, fontWeight: 700, color: M.textPrimary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', marginBottom: 16, animation: 'revealUp 0.4s 0.2s ease both' }}>
        <MathText text={bite.question_text || bite.title || ''} />
      </div>

      {/* Options */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {options.map((opt, i) => {
          const isCor  = opt.is_correct
          const isSel  = picked === opt
          const shown  = picked !== null
          let bg = 'transparent', border = M.progressTrack, color = M.textPrimary
          if (shown && isCor)             { bg = 'rgba(34,197,94,0.1)';   border = '#22c55e'; color = '#16a34a' }
          if (shown && isSel && !isCor)   { bg = 'rgba(239,68,68,0.08)';  border = '#EF4444'; color = '#DC2626' }
          if (!shown && isSel)            { bg = `${accent}12`;           border = accent;    color = accent    }
          return (
            <button key={i} onClick={() => pick(opt)}
              style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${border}`, background: bg, cursor: picked ? 'default' : 'pointer', textAlign: 'left', fontSize: 16, fontWeight: 700, color, fontFamily: 'Nunito, sans-serif', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 12, animation: `revealUp 0.4s ${0.25 + i * 0.07}s ease both` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `${border}18`, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: border }}>
                {shown ? (isCor ? '✓' : isSel ? '✗' : String.fromCharCode(65+i)) : String.fromCharCode(65+i)}
              </div>
              <MathText text={opt.option_text || ''} />
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {picked && bite.explanation_text && (
        <div style={{ marginTop: 10 }}>
          {showExp
            ? <div style={{ background: M.mathBg, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: M.textSecondary, lineHeight: 1.75, fontFamily: 'Nunito, sans-serif', fontWeight: 600, animation: 'revealUp 0.3s ease both' }}>
                <MathText text={bite.explanation_text} />
              </div>
            : <button onClick={() => setShowExp(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: accent, fontFamily: 'Nunito, sans-serif', fontWeight: 800, padding: '4px 0' }}>
                Why? See explanation →
              </button>
          }
        </div>
      )}

      <div style={{ paddingTop: 12, flexShrink: 0 }}>
        {picked !== null && (
          <NextBtn onNext={onNext} label={bite._isLast ? 'Finish lesson' : 'Next question →'} accent={accent} M={M} />
        )}
      </div>
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
  // Generate an excited pitch from the subtopic title
  const lessonTitle = subtopic?.title || lesson?.title || ''
  const entryPitch = (() => {
    const t = lessonTitle.toLowerCase()
    if (t.includes('introduc')) return `It\'s time to meet something new. Let\'s dive in!`
    if (t.includes('convert') || t.includes('chang')) return `Time to learn how to convert — this one\'s actually useful in real life.`
    if (t.includes('formula') || t.includes('rule')) return `There\'s a rule that makes this easy. Let me show you.`
    if (t.includes('problem') || t.includes('solv')) return `Problem-solving time. You\'ve got this — I promise.`
    if (t.includes('application') || t.includes('apply')) return `Let\'s see how this maths actually works in the real world.`
    if (t.includes('proof') || t.includes('theorem')) return `This one will make you feel like a mathematician. Ready?`
    if (t.includes('simplif') || t.includes('factor')) return `This looks complicated. But once you see the trick — it\'s easy.`
    if (t.includes('graph') || t.includes('plot')) return `Time to draw — this is where maths gets visual.`
    return `It\'s time to learn about ${lessonTitle}. Stay with me — this is going to make sense.`
  })()

  const entryCTA = isBlaze ? "⚡ LET'S GO!" : isRoots ? '🇳🇬 Let\'s Go!' : isSpark ? '✨ I\'m ready!' : "Let's go →"

  const EntryScreen = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', animation: 'slideUp 0.35s ease' }}>
      {/* Top: mascot + speech bubble */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ animation: 'float 3s ease-in-out infinite', marginBottom: 20 }}>
          <BicPencil pose="celebrate" size={100} />
        </div>

        {/* Speech bubble */}
        <div style={{
          background: M.lessonCard, border: `2px solid ${accent}30`,
          borderRadius: '20px 20px 20px 4px',
          padding: '18px 22px', marginBottom: 28, maxWidth: 300,
          boxShadow: `0 8px 28px ${accent}18`,
          position: 'relative',
        }}>
          {/* Excited opener line */}
          <div style={{ fontSize: 13, fontWeight: 800, color: accent, marginBottom: 10, fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
            {entryPitch}
          </div>
          {/* The actual topic — big and bold */}
          <div style={{ fontSize: 22, fontWeight: 900, color: M.textPrimary, lineHeight: 1.2, fontFamily: M.headingFont }}>
            {lessonTitle}
          </div>
          {/* topic breadcrumb removed — not needed on entry */}
        </div>

        {/* step count removed — keep it clean */}
      </div>

      {/* CTA at bottom */}
      <button
        onClick={() => setStep(0)}
        style={{ ...M.primaryBtn, fontSize: 18, padding: '18px 32px', width: '100%', borderRadius: 18, boxShadow: `0 8px 28px ${accent}45` }}>
        {entryCTA}
      </button>
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
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes revealUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
      `}</style>
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