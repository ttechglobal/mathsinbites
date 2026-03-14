'use client'
import { BicPencil } from '@/components/BiteMarkIcon'

export default function ExitConfirmModal({ open, onStay, onExit, M, mode }) {
  if (!open) return null

  const isBlaze = mode === 'blaze'
  const isRoots = mode === 'roots'
  const isSpark = mode === 'spark'
  const accent  = M.accentColor

  const title = isBlaze ? "WAIT — DON'T BAIL!"
    : isRoots ? "Oga, no go now! 🇳🇬"
    : isSpark ? "Don't leave yet! ✨"
    : "Are you sure you want to leave?"

  const body = isBlaze
    ? "If you exit now, you'll lose all your XP for this session. Push through — you're almost there!"
    : isRoots
    ? "If you comot now, you go lose your XP for this session. E better make you finish am — you fit do am! 💪"
    : isSpark
    ? "If you leave now, you'll lose all your XP for this session! You've come so far — keep going! 🌟"
    : "If you exit now, you won't earn any XP for this session. Stay and finish to collect your reward!"

  const stayLabel = isBlaze ? "⚡ KEEP GOING!"
    : isRoots ? "🇳🇬 Stay & Finish!"
    : isSpark ? "✨ Keep Going!"
    : "Continue →"

  const exitLabel = isBlaze ? "Exit anyway" : isRoots ? "Comot" : "Exit anyway"

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onStay}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: M.lessonCard,
            border: M.lessonBorder,
            borderRadius: 20,
            padding: '28px 24px',
            maxWidth: 340,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            animation: 'slideUp 0.2s ease',
          }}
        >
          {/* Sad mascot */}
          <div style={{ animation: 'float 2s ease-in-out infinite' }}>
            <BicPencil pose="think" size={80} />
          </div>

          {/* Title */}
          <div style={{
            fontFamily: M.headingFont,
            fontSize: 20,
            fontWeight: 900,
            color: M.textPrimary,
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            {title}
          </div>

          {/* XP warning pill */}
          <div style={{
            background: 'rgba(255,107,107,0.10)',
            border: '1px solid rgba(255,107,107,0.30)',
            borderRadius: 12,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>💔</span>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#FF6B6B',
              fontFamily: 'Nunito, sans-serif',
              lineHeight: 1.5,
            }}>
              You will <strong>lose all XP</strong> from this session if you exit now!
            </div>
          </div>

          {/* Body message */}
          <div style={{
            fontSize: 13,
            color: M.textSecondary,
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
            lineHeight: 1.7,
          }}>
            {body}
          </div>

          {/* Buttons */}
          <button
            onClick={onStay}
            style={{
              ...M.primaryBtn,
              width: '100%',
              fontSize: 15,
              padding: '14px',
            }}
          >
            {stayLabel}
          </button>

          <button
            onClick={onExit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: M.textSecondary,
              fontFamily: 'Nunito, sans-serif',
              opacity: 0.6,
              padding: '4px',
            }}
          >
            {exitLabel}
          </button>
        </div>
      </div>
    </>
  )
}