'use client'

import { useMode } from '@/lib/ModeContext'
import KolaNova    from '@/components/mascots/KolaNova'
import AdeSpark    from '@/components/mascots/AdeSpark'
import ChinweRoots from '@/components/mascots/ChinweRoots'
import ZapBlaze    from '@/components/mascots/ZapBlaze'
import HalimaShine from '@/components/mascots/HalimaShine'
import TayoSteady  from '@/components/mascots/TayoSteady'

// ── BiteMarkIcon — the MIB shield logo SVG ──────────────────────────────────
export function BiteMarkIcon({ size = 48, animate = false }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <linearGradient id="mGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="boltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" /><stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
        </radialGradient>
        <clipPath id="biteClip">
          <path d="M0 0 L48 0 L48 48 L0 48 Z M34 4 A12 12 0 0 1 46 16 L34 16 Z" />
        </clipPath>
      </defs>
      <circle cx="37" cy="10" r="10" fill="url(#glowGrad)" />
      <g clipPath="url(#biteClip)">
        <rect x="1" y="1" width="46" height="46" rx="11" fill="url(#mGrad)" />
        <rect x="8" y="10" width="7" height="28" rx="3.5" fill="white" />
        <rect x="33" y="10" width="7" height="28" rx="3.5" fill="white" />
        <polygon points="8,10 15,10 24,26 15,42 8,42" fill="url(#mGrad)" />
        <polygon points="8,10 24,26 15,10" fill="white" opacity="0.9" />
        <polygon points="40,10 33,10 24,26 33,42 40,42" fill="url(#mGrad)" />
        <polygon points="40,10 24,26 33,10" fill="white" opacity="0.9" />
        <polygon points="15,10 33,10 24,24" fill="url(#mGrad)" />
      </g>
      <path d="M34 4 A12 12 0 0 1 46 16" fill="none" stroke="rgba(253,224,71,0.5)" strokeWidth="1.5" strokeDasharray="3,2" />
      <g style={animate ? { animation: 'float 4s ease-in-out infinite' } : {}}>
        <path d="M36 5 L31 13 L35 13 L32 21 L40 11 L36 11 Z" fill="url(#boltGrad)" />
        <path d="M36 5 L31 13 L35 13 L32 21 L40 11 L36 11 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      </g>
      <circle cx="9" cy="7" r="1.5" fill="rgba(253,224,71,0.5)" />
    </svg>
  )
}

// ── MIBLogo — icon + wordmark ────────────────────────────────────────────────
export function MIBLogo({ size = 36, theme = 'dark', animated = false, M }) {
  const scale = size / 48
  const isDark = theme === 'dark' || (M && (M.id === 'nova'))
  const primaryText = isDark ? '#F8F7FF' : (M?.textPrimary || '#1E1B4B')
  const subText = isDark ? 'rgba(165,180,252,0.7)' : 'rgba(78,70,159,0.6)'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 * scale, userSelect: 'none' }}>
      <div style={{ animation: animated ? 'floatSlow 4s ease-in-out infinite' : 'none' }}>
        <BiteMarkIcon size={44 * scale} animate={animated} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 900,
          fontSize: 22 * scale, lineHeight: 1, letterSpacing: -0.5,
          display: 'flex', alignItems: 'baseline', gap: 0,
        }}>
          <span style={{ color: primaryText }}>Maths</span>
          <span style={{ color: '#F59E0B', fontSize: 18 * scale, fontWeight: 800, margin: `0 ${1 * scale}px` }}>In</span>
          <span style={{ color: primaryText }}>Bites</span>
        </div>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 700,
          fontSize: 7.5 * scale, letterSpacing: 2.2 * scale,
          color: subText, textTransform: 'uppercase', paddingLeft: 1,
        }}>Learn · Level Up · Win</div>
      </div>
    </div>
  )
}

// ── BicPencil — mode-aware mascot wrapper ────────────────────────────────────
// Automatically picks the right mascot for the active mode.
// Poses: 'idle' | 'correct' | 'wrong' | 'celebrate' | 'happy' | 'think'
export function BicPencil({ pose = 'idle', size = 80, style: extraStyle = {} }) {
  const { mode } = useMode()

  const MASCOTS = {
    normal: TayoSteady,
    nova:   KolaNova,
    spark:  AdeSpark,
    roots:  ChinweRoots,
    blaze:  ZapBlaze,
    halima: HalimaShine,
  }

  const Mascot = MASCOTS[mode] || TayoSteady

  // Normalise pose aliases
  const normPose = pose === 'celebrate' ? 'correct'
    : pose === 'happy' ? 'correct'
    : pose === 'think' ? 'idle'
    : pose

  return (
    <div style={extraStyle}>
      <Mascot size={size} pose={normPose} />
    </div>
  )
}

export default BiteMarkIcon