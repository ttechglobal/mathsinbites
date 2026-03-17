'use client'

import { useMode } from '@/lib/ModeContext'
import KolaNova    from '@/components/mascots/KolaNova'
import AdeSpark    from '@/components/mascots/AdeSpark'
import ChinweRoots from '@/components/mascots/ChinweRoots'
import ZapBlaze    from '@/components/mascots/ZapBlaze'
import HalimaShine from '@/components/mascots/HalimaShine'
import TayoSteady  from '@/components/mascots/TayoSteady'

// ── BicPencil — mode-aware mascot wrapper ─────────────────────────────────────
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

// ── MIBLogo — mascot + "MathsInBites" wordmark ───────────────────────────────
// The mascot IS the logo mark. Mode-aware (mascot changes with theme).
// No tagline. Wordmark sits to the right of the mascot.
export function MIBLogo({ size = 36, theme = 'light', M }) {
  const { mode } = useMode()

  const MASCOTS = {
    normal: TayoSteady,
    nova:   KolaNova,
    spark:  AdeSpark,
    roots:  ChinweRoots,
    blaze:  ZapBlaze,
    halima: HalimaShine,
  }
  const Mascot  = MASCOTS[mode] || TayoSteady
  const isDark  = theme === 'dark' || M?.id === 'nova'
  const textCol = isDark ? '#F8F7FF' : (M?.textPrimary || '#1E1B4B')
  const inCol   = isDark ? 'rgba(165,180,252,0.85)' : '#F59E0B'

  // Scale wordmark font relative to mascot size
  const fs = Math.round(size * 0.52)

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
      {/* Mascot as logo mark */}
      <Mascot size={size} pose="idle" />

      {/* Wordmark: Maths·In·Bites */}
      <div style={{
        fontFamily: 'Nunito, sans-serif', fontWeight: 900,
        fontSize: fs, lineHeight: 1, letterSpacing: -0.3,
        display: 'flex', alignItems: 'baseline', gap: 0,
      }}>
        <span style={{ color: textCol }}>Maths</span>
        <span style={{ color: inCol, fontSize: fs * 0.82, fontWeight: 800, margin: '0 1px' }}>In</span>
        <span style={{ color: textCol }}>Bites</span>
      </div>
    </div>
  )
}

// Keep BiteMarkIcon export for any legacy usage
export function BiteMarkIcon({ size = 48 }) {
  return <BicPencil size={size} pose="idle" />
}

export default BiteMarkIcon