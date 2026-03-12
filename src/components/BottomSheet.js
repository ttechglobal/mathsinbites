'use client'

import { useEffect } from 'react'

// Design concept colours — always dark regardless of mode
// (the mode picker itself handles its own theming inside)
const N = {
  purpleCard: '#1E1B4B',
  purpleDeep: '#0F0C29',
  border:     'rgba(165,180,252,0.15)',
}

export default function BottomSheet({ open, onClose, children }) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 520,
          zIndex: 101,
          background: N.purpleDeep,
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${N.border}`,
          borderBottom: 'none',
          boxShadow: `0 -16px 60px rgba(0,0,0,0.7), 0 0 0 1px ${N.border}`,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'sheetUp 0.3s cubic-bezier(0.34,1.1,0.64,1)',
          // Safe area for iOS home bar
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
    </>
  )
}