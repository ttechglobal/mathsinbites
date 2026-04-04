'use client'

import { useMode } from '@/lib/ModeContext'
import KolaNova    from '@/components/mascots/KolaNova'
import AdeSpark    from '@/components/mascots/AdeSpark'
import ChinweRoots from '@/components/mascots/ChinweRoots'
import ZapBlaze    from '@/components/mascots/ZapBlaze'
import HalimaShine from '@/components/mascots/HalimaShine'
import TayoSteady  from '@/components/mascots/TayoSteady'

// ── Pose map ──────────────────────────────────────────────────────────────────
// Public poses  → internal mascot pose
// 'idle'        → idle (neutral/welcoming, floating animation)
// 'happy'       → correct (big smile, celebrating)
// 'celebrate'   → correct
// 'thumbs'      → correct (maps to correct — each mascot shows approval)
// 'excited'     → correct
// 'think'       → idle (thoughtful, slow float)
// 'correct'     → correct
// 'wrong'       → wrong

function normalisePose(pose) {
  if (!pose) return 'idle'
  if (['happy', 'celebrate', 'thumbs', 'excited'].includes(pose)) return 'correct'
  if (pose === 'think') return 'idle'
  return pose // 'idle' | 'correct' | 'wrong'
}

// ── Speech bubble wrapper ─────────────────────────────────────────────────────
function WithSpeechBubble({ children, text, size, accentColor }) {
  const bubbleW  = Math.max(size * 1.1, 100)
  const fontSize = Math.max(8, size * 0.13)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bubble */}
      <div style={{
        position: 'absolute',
        top: -size * 0.38,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        border: `2px solid ${accentColor || '#0d9488'}`,
        borderRadius: size * 0.12,
        padding: `${size * 0.06}px ${size * 0.1}px`,
        whiteSpace: 'nowrap',
        boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
        zIndex: 10,
        minWidth: bubbleW,
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 900,
          fontSize: fontSize,
          color: accentColor || '#0d9488',
          letterSpacing: -0.2,
        }}>{text}</span>
        {/* Tail */}
        <div style={{
          position: 'absolute',
          bottom: -size * 0.09,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: `${size * 0.06}px solid transparent`,
          borderRight: `${size * 0.06}px solid transparent`,
          borderTop: `${size * 0.09}px solid ${accentColor || '#0d9488'}`,
        }}/>
        <div style={{
          position: 'absolute',
          bottom: -size * 0.07,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: `${size * 0.05}px solid transparent`,
          borderRight: `${size * 0.05}px solid transparent`,
          borderTop: `${size * 0.08}px solid #fff`,
        }}/>
      </div>
      {children}
    </div>
  )
}

// ── BicPencil — mode-aware mascot wrapper ─────────────────────────────────────
// Poses: 'idle' | 'correct' | 'wrong' | 'celebrate' | 'happy' | 'think' |
//        'thumbs' | 'excited' | 'speech' (shows "Math is Fun!" bubble)
export function BicPencil({ pose = 'idle', size = 80, style: extraStyle = {}, speechText }) {
  const { mode, M } = useMode()

  const MASCOTS = {
    normal: TayoSteady,
    nova:   KolaNova,
    spark:  AdeSpark,
    roots:  ChinweRoots,
    blaze:  ZapBlaze,
    halima: HalimaShine,
  }

  const Mascot    = MASCOTS[mode] || TayoSteady
  const normPose  = normalisePose(pose)
  const accent    = M?.accentColor || '#0d9488'

  // Speech bubble variant
  if (pose === 'speech' || speechText) {
    return (
      <div style={{ ...extraStyle, paddingTop: size * 0.45, display: 'inline-block' }}>
        <WithSpeechBubble text={speechText || 'Math is Fun!'} size={size} accentColor={accent}>
          <Mascot size={size} pose="correct" />
        </WithSpeechBubble>
      </div>
    )
  }

  return (
    <div style={extraStyle}>
      <Mascot size={size} pose={normPose} />
    </div>
  )
}

// ── MIBLogo — mascot + "MathsInBites" wordmark ───────────────────────────────
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
  const fs      = Math.round(size * 0.52)

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
      <Mascot size={size} pose="idle" />
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

// Legacy alias
export function BiteMarkIcon({ size = 48 }) {
  return <BicPencil size={size} pose="idle" />
}

export default BiteMarkIcon