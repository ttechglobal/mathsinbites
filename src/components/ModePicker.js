'use client'

import { MODES } from '@/lib/modes'
import { useMode } from '@/lib/ModeContext'
import KolaNova from '@/components/mascots/KolaNova'
import AdeSpark from '@/components/mascots/AdeSpark'
import ChinweRoots from '@/components/mascots/ChinweRoots'
import ZapBlaze from '@/components/mascots/ZapBlaze'

// Design concept colours
const N = {
  purpleDeep: '#0F0C29',
  purpleCard: '#1E1B4B',
  purpleMid:  '#4C1D95',
  purpleHi:   '#7C3AED',
  slate:      '#312E81',
  gold:       '#FCD34D',
  goldGlow:   '#F59E0B',
  coral:      '#FF6B6B',
  lime:       '#A3E635',
  cyan:       '#67E8F9',
  white:      '#F8F7FF',
  lavender:   '#A5B4FC',
  dimText:    '#6D6B8F',
  border:     'rgba(165,180,252,0.15)',
}

const MASCOTS = {
  normal: KolaNova,
  nova:   KolaNova,
  spark:  AdeSpark,
  roots:  ChinweRoots,
  blaze:  ZapBlaze,
}

// Per-mode accent + gradient for the card
const MODE_STYLE = {
  normal: { accent: '#0d9488', grad: 'linear-gradient(135deg,#0d9488,#0891b2)', glow: '#0d948840' },
  nova:   { accent: N.purpleHi, grad: `linear-gradient(135deg,${N.purpleMid},${N.purpleHi})`, glow: `${N.purpleHi}50` },
  spark:  { accent: '#FF8C42', grad: 'linear-gradient(135deg,#FF8C42,#FFD93D)', glow: '#FF8C4250' },
  roots:  { accent: '#C0392B', grad: 'linear-gradient(135deg,#C0392B,#8B1A1A)', glow: '#C0392B50' },
  blaze:  { accent: '#E63946', grad: 'linear-gradient(135deg,#E63946,#FFD700)', glow: '#E6394650' },
}

export default function ModePicker({ onPick, onClose }) {
  const { setMode, mode: currentMode } = useMode()
  const modeList = [MODES.normal, MODES.nova, MODES.spark, MODES.roots, MODES.blaze]

  function handlePick(modeId) {
    setMode(modeId)
    onPick?.(modeId)
    onClose?.()
  }

  return (
    <div style={{
      background: N.purpleDeep,
      minHeight: onPick ? '100vh' : 'auto',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '4px 20px 18px', textAlign: 'center', flexShrink: 0 }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, background: N.border }} />
        </div>

        <div style={{ fontFamily: 'Fredoka One, sans-serif', fontSize: 22, color: N.white, marginBottom: 6, lineHeight: 1 }}>
          <span style={{ color: N.white }}>Choose Your </span>
          <span style={{
            background: `linear-gradient(135deg,${N.gold},${N.coral})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Vibe</span>
        </div>
        <div style={{ fontSize: 12, color: N.lavender, lineHeight: 1.5 }}>
          Same lessons. Your style. Change anytime.
        </div>
      </div>

      {/* Mode cards */}
      <div style={{ padding: '0 16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modeList.map((m) => {
          const { accent, grad, glow } = MODE_STYLE[m.id]
          const Mascot = MASCOTS[m.id]
          const isActive = m.id === currentMode

          return (
            <button
              key={m.id}
              onClick={() => handlePick(m.id)}
              style={{
                background: isActive
                  ? `linear-gradient(135deg,${N.slate},${N.purpleCard})`
                  : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? `2px solid ${accent}70`
                  : `1px solid ${N.border}`,
                borderRadius: 18,
                padding: '14px 14px 14px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.18s',
                boxShadow: isActive ? `0 0 24px ${glow}, 0 4px 16px rgba(0,0,0,0.3)` : '0 2px 10px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Active glow strip on left edge */}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: grad, borderRadius: '18px 0 0 18px',
                }} />
              )}

              {/* Mascot */}
              <div style={{ flexShrink: 0, width: 56, display: 'flex', justifyContent: 'center' }}>
                <Mascot size={52} pose="idle" />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 15 }}>{m.emoji}</span>
                  <span style={{ fontFamily: 'Fredoka One, sans-serif', fontSize: 16, color: N.white, lineHeight: 1 }}>
                    {m.name}
                  </span>
                  {isActive && (
                    <span style={{
                      fontSize: 8, fontWeight: 900, letterSpacing: 0.8,
                      background: grad,
                      color: '#fff', borderRadius: 20, padding: '2px 8px',
                      fontFamily: 'Nunito, sans-serif',
                    }}>ACTIVE</span>
                  )}
                </div>
                <div style={{
                  fontSize: 11, color: isActive ? N.lavender : N.dimText,
                  fontStyle: 'italic', marginBottom: 3, lineHeight: 1.3,
                  fontWeight: 600,
                }}>
                  &ldquo;{m.tagline}&rdquo;
                </div>
                <div style={{ fontSize: 10, color: N.dimText, lineHeight: 1.4, fontWeight: 600 }}>
                  {m.description}
                </div>
              </div>

              {/* Select button */}
              <div style={{
                flexShrink: 0,
                background: isActive ? grad : 'rgba(255,255,255,0.06)',
                border: isActive ? 'none' : `1px solid ${N.border}`,
                borderRadius: 20, padding: '5px 12px',
                fontSize: 10, fontWeight: 900, fontFamily: 'Nunito, sans-serif',
                color: isActive ? '#fff' : N.lavender,
                letterSpacing: 0.5,
                boxShadow: isActive ? `0 0 12px ${glow}` : 'none',
                whiteSpace: 'nowrap',
              }}>
                {isActive ? '✓ ON' : 'SELECT'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}