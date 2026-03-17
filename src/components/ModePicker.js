'use client'

import { MODES } from '@/lib/modes'
import { useMode } from '@/lib/ModeContext'
import KolaNova    from '@/components/mascots/KolaNova'
import ChinweRoots from '@/components/mascots/ChinweRoots'
import ZapBlaze    from '@/components/mascots/ZapBlaze'
import HalimaShine from '@/components/mascots/HalimaShine'
import TayoSteady  from '@/components/mascots/TayoSteady'

// Spark removed. 5 modes: normal(Tayo), nova(Kola), roots(Chinwe), blaze(Zap), halima(Halima)

const MASCOTS = {
  normal: TayoSteady,
  nova:   KolaNova,
  roots:  ChinweRoots,
  blaze:  ZapBlaze,
  halima: HalimaShine,
}

const MODE_META = {
  normal: {
    accent: '#0d9488',
    grad:   'linear-gradient(135deg,#0d9488,#0891b2)',
    bg:     'linear-gradient(160deg,#0a2f2c,#0d2a27)',
    desc:   'Clean · focused · distraction-free',
  },
  nova: {
    accent: '#7C3AED',
    grad:   'linear-gradient(135deg,#7C3AED,#4C1D95)',
    bg:     'linear-gradient(160deg,#0F0C29,#1E1B4B)',
    desc:   'Deep focus · cosmic vibes · night mode',
  },
  roots: {
    accent: '#C0392B',
    grad:   'linear-gradient(135deg,#C0392B,#2D6A4F)',
    bg:     'linear-gradient(160deg,#2a0a06,#0a1f14)',
    desc:   'Nigerian culture · warm · grounded',
  },
  blaze: {
    accent: '#FFD700',
    grad:   'linear-gradient(135deg,#FFD700,#FF8C00)',
    bg:     'linear-gradient(160deg,#1a1000,#2a1800)',
    desc:   'Bold · high energy · comic style',
  },
  halima: {
    accent: '#C46428',
    grad:   'linear-gradient(135deg,#C46428,#D4A853)',
    bg:     'linear-gradient(160deg,#1a0e04,#2a1a08)',
    desc:   'Calm · graceful · steady focus',
  },
}

const MODE_ORDER = ['normal', 'nova', 'roots', 'blaze', 'halima']

export default function ModePicker({ onPick, onClose }) {
  const { setMode, mode: currentMode } = useMode()

  function handlePick(modeId) {
    setMode(modeId)
    onPick?.(modeId)
    onClose?.()
  }

  return (
    <div style={{ background: '#0C0820', fontFamily: 'Nunito, sans-serif', paddingBottom: 28 }}>

      {/* Handle + header */}
      <div style={{ padding: '16px 20px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(165,180,252,0.2)' }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#F8F7FF', marginBottom: 4, lineHeight: 1 }}>
          Choose your learning mascot
        </div>
        <div style={{ fontSize: 12, color: 'rgba(165,180,252,0.6)', fontWeight: 600 }}>
          Same lessons · your style · change anytime
        </div>
      </div>

      {/* Mode grid — 2 columns, then 1 centred on last */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {MODE_ORDER.map((id, i) => {
          const m      = MODES[id]
          if (!m) return null
          const meta   = MODE_META[id]
          const Mascot = MASCOTS[id]
          const active = id === currentMode

          // Last item if odd count — span full width
          const isLast = i === MODE_ORDER.length - 1 && MODE_ORDER.length % 2 === 1

          return (
            <button
              key={id}
              onClick={() => handlePick(id)}
              style={{
                gridColumn: isLast ? '1 / -1' : undefined,
                position: 'relative', overflow: 'hidden',
                background: active ? meta.bg : 'rgba(255,255,255,0.04)',
                border: active ? `2px solid ${meta.accent}80` : '1px solid rgba(165,180,252,0.12)',
                borderRadius: 20, padding: '16px 14px 14px',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: active ? `0 0 28px ${meta.accent}35, 0 4px 16px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.25)',
              }}
            >
              {/* Active left stripe */}
              {active && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 20, border: `2px solid ${meta.accent}50`, pointerEvents: 'none' }} />
              )}

              {/* Active top glow line */}
              {active && (
                <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 2, background: meta.grad, borderRadius: 99 }} />
              )}

              {/* Mascot */}
              <div style={{
                display: 'flex', justifyContent: 'center', marginBottom: 8,
                filter: active ? `drop-shadow(0 6px 18px ${meta.accent}55)` : 'none',
                transition: 'filter 0.2s',
              }}>
                <Mascot size={isLast ? 80 : 68} pose={active ? 'correct' : 'idle'} />
              </div>

              {/* Name */}
              <div style={{
                fontSize: 14, fontWeight: 900, color: active ? meta.accent : '#F8F7FF',
                marginBottom: 3, lineHeight: 1,
                transition: 'color 0.2s',
              }}>
                {m.name}
              </div>

              {/* Desc */}
              <div style={{
                fontSize: 10, color: active ? 'rgba(255,255,255,0.65)' : 'rgba(165,180,252,0.45)',
                fontWeight: 600, lineHeight: 1.4,
              }}>
                {meta.desc}
              </div>

              {/* Active badge */}
              {active && (
                <div style={{
                  marginTop: 8,
                  display: 'inline-block',
                  background: meta.grad,
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: 0.5,
                }}>
                  ✓ ACTIVE
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}