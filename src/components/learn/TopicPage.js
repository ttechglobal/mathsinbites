'use client'

import { useRouter } from 'next/navigation'
import { useMode } from '@/lib/ModeContext'
import { BicPencil } from '@/components/BiteMarkIcon'

function AnkaraStripe() {
  return (
    <div style={{
      height: 4,
      background: 'repeating-linear-gradient(90deg,#C0392B 0,#C0392B 8px,#E6B800 8px,#E6B800 16px,#1A1F6B 16px,#1A1F6B 24px,#2D6A4F 24px,#2D6A4F 32px)',
      animation: 'ankaraScroll 6s linear infinite',
    }} />
  )
}

export default function TopicPage({ topic, subtopics, progress }) {
  const router = useRouter()
  const { M, mode } = useMode()

  const isNova = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isSpark = mode === 'spark'
  const isRoots = mode === 'roots'

  const headWeight = isBlaze ? 900 : 800
  const bodyWeight = isBlaze ? 700 : 600

  const completedIds = new Set(progress?.filter(p => p.status === 'completed').map(p => p.subtopic_id) || [])

  // Unlock logic: each subtopic unlocks the next
  function getState(subtopicId, idx) {
    const done = completedIds.has(subtopicId)
    const locked = idx > 0 && !completedIds.has(subtopics[idx - 1]?.id)
    return { done, locked, isNext: !done && !locked }
  }

  const doneCount = subtopics?.filter(s => completedIds.has(s.id)).length || 0

  const heroBg = isNova ? 'linear-gradient(160deg,#1E1B4B,#0F0C29)'
    : isSpark ? 'linear-gradient(160deg,#FF8C42,#FFD93D)'
    : isRoots ? 'linear-gradient(160deg,#C0392B,#8B1A1A)'
    : isBlaze ? 'linear-gradient(160deg,#E63946,#1D3557)'
    : `linear-gradient(160deg,${M.accentColor},${M.accent2 || M.accentColor})`

  return (
    <div style={{ minHeight: '100vh', background: M.mapBg, fontFamily: M.font }}>
      {/* Back bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: M.hudBg, backdropFilter: 'blur(10px)',
        borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {isRoots && <AnkaraStripe />}
        <button onClick={() => router.back()} style={{
          width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
          background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: M.textSecondary, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: headWeight, color: M.textPrimary, fontFamily: M.headingFont }}>
            {topic?.title || 'Topic'}
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800, color: M.accentColor,
          background: `${M.accentColor}15`, borderRadius: 20, padding: '3px 10px',
          fontFamily: M.headingFont,
        }}>{doneCount}/{subtopics?.length || 0}</div>
      </div>

      {/* Hero */}
      <div style={{ background: heroBg, padding: '24px 20px 20px' }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6, fontFamily: M.headingFont }}>
              {isBlaze ? 'TOPIC' : isRoots ? 'Subject Area' : 'Topic'}
            </div>
            <div style={{ fontSize: 24, fontWeight: headWeight, color: '#fff', lineHeight: 1.2, marginBottom: 10, fontFamily: M.headingFont }}>
              {topic?.title}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', border: isBlaze ? '1px solid rgba(255,255,255,0.3)' : 'none' }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 0.5s ease',
                  width: `${subtopics?.length ? (doneCount / subtopics.length) * 100 : 0}%`,
                  background: isBlaze ? '#FFD700' : '#fff',
                }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                {doneCount} of {subtopics?.length || 0} subtopics complete
              </div>
            </div>
          </div>
          <BicPencil pose={doneCount === subtopics?.length ? 'correct' : 'idle'} size={70} style={{ flexShrink: 0, marginBottom: -8 }} />
        </div>
      </div>

      {/* Subtopics list */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 16px 60px' }}>
        {!subtopics?.length ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <BicPencil pose="think" size={80} style={{ display: 'inline-block', marginBottom: 16 }} />
            <p style={{ fontFamily: M.headingFont, fontSize: 16, fontWeight: headWeight, color: M.textPrimary }}>No subtopics yet</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: M.textSecondary, marginTop: 4 }}>Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subtopics.map((sub, idx) => {
              const { done, locked, isNext } = getState(sub.id, idx)

              return (
                <button
                  key={sub.id}
                  onClick={() => !locked && router.push(`/learn/lesson/${sub.id}`)}
                  disabled={locked}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px', textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer',
                    background: done ? (isBlaze ? `${M.accentColor}18` : `${M.accentColor}10`)
                      : isNext ? (isBlaze ? '#FFF9D6' : isNova ? 'rgba(124,58,237,0.1)' : `${M.accentColor}08`)
                      : (isNova ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)'),
                    border: isBlaze
                      ? `2px solid ${locked ? '#e8e8e8' : done ? M.accentColor : isNext ? '#0d0d0d' : '#e8e8e8'}`
                      : `1.5px solid ${locked ? (isNova ? 'rgba(255,255,255,0.05)' : '#eee') : done ? `${M.accentColor}30` : isNext ? `${M.accentColor}40` : '#eee'}`,
                    borderRadius: isBlaze ? 10 : 16,
                    boxShadow: isNext
                      ? (isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow)
                      : done ? (isBlaze ? '2px 2px 0 #ccc' : 'none') : 'none',
                    opacity: locked ? 0.5 : 1,
                    transition: 'all 0.12s', width: '100%',
                    animation: isNext ? 'none' : 'none',
                  }}>

                  {/* Icon circle */}
                  <div style={{
                    width: isNext ? 46 : 38, height: isNext ? 46 : 38,
                    borderRadius: isBlaze ? '30%' : '50%', flexShrink: 0,
                    background: locked
                      ? (isNova ? 'rgba(255,255,255,0.06)' : '#f0f0f0')
                      : done ? `linear-gradient(135deg,${M.accentColor},${M.accent2 || M.accentColor}CC)`
                      : isBlaze ? '#FFD700' : `linear-gradient(135deg,${M.accentColor},${M.accentColor}CC)`,
                    border: isBlaze ? `2px solid ${locked ? '#ccc' : '#0d0d0d'}` : 'none',
                    boxShadow: isNext
                      ? (isBlaze ? '3px 3px 0 #0d0d0d' : `0 0 16px ${M.accentColor}60`)
                      : done ? (isBlaze ? '2px 2px 0 #0d0d0d' : `0 0 8px ${M.accentColor}30`) : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isNext ? 18 : 16,
                    animation: isNext ? 'float 2.5s ease-in-out infinite' : 'none',
                  }}>
                    {done ? '★' : locked ? '🔒' : isNext ? '▶️' : '📖'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: headWeight,
                      color: locked ? M.textSecondary : M.textPrimary,
                      fontFamily: M.headingFont, marginBottom: 3, lineHeight: 1.3,
                    }}>
                      {sub.title}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isNova ? 'rgba(180,170,255,0.7)' : M.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {done && <span style={{ color: M.correctColor }}>✓ Complete</span>}
                      {isNext && <span style={{ color: M.accentColor, fontWeight: 800 }}>
                        {isBlaze ? '⚡ START' : isSpark ? '✨ Up next!' : isRoots ? '→ Start' : '→ Up next'}
                      </span>}
                      {locked && <span>🔒 Complete previous first</span>}
                      {!done && !locked && !isNext && <span>Ready</span>}
                    </div>
                  </div>

                  {/* XP badge */}
                  <div style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 800,
                    color: done ? M.correctColor : M.accentColor,
                    fontFamily: M.headingFont,
                    background: done ? `${M.correctColor}10` : `${M.accentColor}10`,
                    border: `1px solid ${done ? M.correctColor : M.accentColor}30`,
                    borderRadius: 20, padding: '3px 9px',
                  }}>
                    {done ? '✓ 10XP' : '10 XP'}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}