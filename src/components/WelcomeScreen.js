'use client'

// WelcomeScreen — shown once to new users on first login.
// Triggered by localStorage flag 'mib_new_user'.
// Full-screen overlay with mascot, platform intro, and "Let's go!" dismiss.

import { useState, useEffect } from 'react'
import { BicPencil } from '@/components/BiteMarkIcon'
import { useMode } from '@/lib/ModeContext'

const FEATURES = [
  { emoji: '📚', title: 'NERDC-aligned lessons',   desc: 'Primary 4 to SS3, covering every topic you need for WAEC, NECO, JAMB & BECE.' },
  { emoji: '🏆', title: 'Monthly leaderboards',     desc: 'Compete with classmates and students across Nigeria. Rankings reset every month — anyone can reach #1.' },
  { emoji: '⚡', title: 'Daily challenges',          desc: '5 timed questions every day. Get them all right and earn 50 bonus XP.' },
  { emoji: '🔥', title: 'Streak rewards',            desc: 'Keep your daily streak alive. Even 10 minutes a day adds up fast.' },
]

export default function WelcomeScreen({ student, onDismiss }) {
  const { M, mode } = useMode()
  const [page, setPage] = useState(0)   // 0 = welcome, 1 = features
  const [leaving, setLeaving] = useState(false)

  const firstName = student?.display_name?.split(' ')[0] || 'there'
  const accent    = M?.accentColor || '#7C3AED'
  const isNova    = mode === 'nova'
  const isBlaze   = mode === 'blaze'

  function dismiss() {
    setLeaving(true)
    localStorage.removeItem('mib_new_user')
    setTimeout(onDismiss, 400)
  }

  const mascotMessages = [
    `Hey ${firstName}! I'm so excited you're here! 🎉`,
    "MathsInBites is the best way to master maths in Nigeria — and I'll be right here with you every step of the way!",
  ]

  return (
    <>
      <style>{`
        @keyframes wFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes wSlideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wFadeOut { from{opacity:1} to{opacity:0} }
        @keyframes floatMascot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Full-screen backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: isNova ? 'rgba(10,8,32,0.97)' : 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
        animation: leaving ? 'wFadeOut 0.4s ease forwards' : 'wFadeIn 0.4s ease',
      }}>

        <div style={{
          width: '100%', maxWidth: 420,
          background: isNova ? '#1A1740' : isBlaze ? '#FFFBF0' : '#fff',
          borderRadius: 28,
          border: isBlaze ? '3px solid #0d0d0d' : `2px solid ${accent}30`,
          boxShadow: isBlaze ? '6px 6px 0 #0d0d0d' : `0 32px 80px ${accent}30, 0 0 0 1px ${accent}10`,
          overflow: 'hidden',
          animation: 'wSlideUp 0.45s cubic-bezier(0.34,1.1,0.64,1)',
          fontFamily: 'Nunito, sans-serif',
        }}>

          {/* Gradient header strip */}
          <div style={{
            height: 5,
            background: isBlaze
              ? 'repeating-linear-gradient(90deg,#FFD700 0,#FFD700 8px,#0d0d0d 8px,#0d0d0d 16px)'
              : `linear-gradient(90deg,${accent},${M?.accent2 || accent})`,
          }} />

          <div style={{ padding: '28px 28px 32px' }}>

            {page === 0 ? (
              /* ── PAGE 0: Welcome ── */
              <div style={{ animation: 'wSlideUp 0.35s ease', textAlign: 'center' }}>

                {/* Mascot */}
                <div style={{ animation: 'floatMascot 3.5s ease-in-out infinite', marginBottom: 16, display: 'inline-block', filter: `drop-shadow(0 10px 28px ${accent}40)` }}>
                  <BicPencil pose="celebrate" size={120} />
                </div>

                {/* Sparkles */}
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  {['✨','🌟','⭐','✨'].map((s, i) => (
                    <span key={i} style={{ position: 'absolute', fontSize: 18, top: -20 + (i%2)*10, left: `${15 + i*20}%`, animation: `sparkle ${1.5 + i*0.3}s ease-in-out ${i*0.25}s infinite` }}>{s}</span>
                  ))}
                  <div style={{ fontSize: 26, fontWeight: 900, color: isNova ? '#F8F7FF' : '#1a1a1a', lineHeight: 1.2, marginBottom: 8 }}>
                    Welcome to<br /><span style={{ color: accent }}>MathsInBites</span>! 🎉
                  </div>
                  <div style={{ fontSize: 14, color: isNova ? 'rgba(200,195,255,0.75)' : '#555', fontWeight: 600, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                    {mascotMessages[0]}
                  </div>
                </div>

                {/* Speech bubble */}
                <div style={{ background: isNova ? 'rgba(124,58,237,0.15)' : isBlaze ? '#FFD700' : `${accent}10`, border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`, borderRadius: '16px 16px 16px 4px', padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: accent, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {mode === 'nova' ? 'KolaNova' : mode === 'blaze' ? 'ZapBlaze' : mode === 'spark' ? 'AdeSpark' : mode === 'roots' ? 'ChinweRoots' : 'TayoSteady'} ✏️
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isNova ? 'rgba(220,215,255,0.8)' : isBlaze ? '#0d0d0d' : '#444', lineHeight: 1.65, margin: 0 }}>
                    {mascotMessages[1]}
                  </p>
                </div>

                <button onClick={() => setPage(1)}
                  style={{ width: '100%', padding: '15px', borderRadius: isBlaze ? 10 : 16, cursor: 'pointer', background: isBlaze ? '#0d0d0d' : accent, border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 900, color: '#fff', boxShadow: isBlaze ? '3px 3px 0 rgba(0,0,0,0.2)' : `0 5px 20px ${accent}50` }}>
                  Show me what&apos;s inside! →
                </button>
              </div>
            ) : (
              /* ── PAGE 1: Features ── */
              <div style={{ animation: 'wSlideUp 0.35s ease' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: isNova ? '#F8F7FF' : '#1a1a1a', marginBottom: 4 }}>
                  Here&apos;s what you get 🚀
                </div>
                <div style={{ fontSize: 13, color: isNova ? 'rgba(200,195,255,0.6)' : '#777', fontWeight: 600, marginBottom: 20 }}>
                  Everything you need to ace your exams
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 14px', background: isNova ? 'rgba(255,255,255,0.05)' : isBlaze ? 'rgba(0,0,0,0.04)' : `${accent}07`, border: isNova ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${accent}18`, borderRadius: 14 }}>
                      <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{f.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: isNova ? '#F8F7FF' : '#1a1a1a', marginBottom: 3 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: isNova ? 'rgba(200,195,255,0.6)' : '#666', fontWeight: 600, lineHeight: 1.5 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={dismiss}
                  style={{ width: '100%', padding: '16px', borderRadius: isBlaze ? 10 : 16, cursor: 'pointer', background: isBlaze ? '#FFD700' : accent, border: isBlaze ? '2.5px solid #0d0d0d' : 'none', fontFamily: 'Nunito, sans-serif', fontSize: 17, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', boxShadow: isBlaze ? '4px 4px 0 #0d0d0d' : `0 6px 24px ${accent}55` }}>
                  ▶ Let&apos;s start learning!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}