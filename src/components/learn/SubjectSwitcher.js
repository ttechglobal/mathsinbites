'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'

export default function SubjectSwitcher({ student, nextLesson, onSubjectChange, onContinue }) {
  const { M, mode } = useMode()
  const supabase = createClient()

  const isBlaze = mode === 'blaze'
  const isNova  = mode === 'nova'
  const accent  = M.accentColor

  // Derive values needed for hook initialisations
  const classLevel = student?.class_level || ''
  const isSS       = ['SS1', 'SS2', 'SS3'].includes(classLevel)
  const subjects   = student?.subjects || ['maths']
  const active     = student?.active_subject || 'maths'
  const hasFM      = subjects.includes('further_maths')

  // All hooks must be called before any early return (Rules of Hooks)
  const [cur,        setCur]        = useState(active === 'further_maths' ? 1 : 0)
  const [switching,  setSwitching]  = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [enrolling,  setEnrolling]  = useState(false)
  const [enrolled,   setEnrolled]   = useState(false)
  const startX = useRef(null)

  const heroGradient = isBlaze ? '#FFD700'
    : isNova  ? 'linear-gradient(135deg,#7C3AED,#4C1D95)'
    : `linear-gradient(135deg,${accent},${M.accent2 || accent}DD)`

  // JSS students: simple single Maths card, no FM switcher
  if (!isSS) {
    return (
      <div style={{ background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', border: isBlaze ? '2.5px solid #0d0d0d' : isNova ? '1px solid rgba(255,255,255,0.12)' : `1.5px solid ${accent}20`, borderRadius: isBlaze ? 14 : 24, overflow: 'hidden', boxShadow: isBlaze ? '4px 4px 0 #0d0d0d' : `0 8px 32px ${accent}14`, marginBottom: 16 }}>
        <div style={{ background: heroGradient, padding: '16px 20px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>Subject</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1, marginBottom: 2 }}>Mathematics</div>
          <div style={{ fontSize: 11, color: isBlaze ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{classLevel} · {(student?.xp || 0).toLocaleString()} XP</div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          {nextLesson && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: isBlaze ? 8 : 10, flexShrink: 0, background: `${accent}14`, border: `1.5px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>Next lesson</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextLesson.title}</div>
              </div>
            </div>
          )}
          <button onClick={() => onContinue?.()} style={{ width: '100%', padding: '13px', background: isBlaze ? '#0d0d0d' : accent, border: 'none', borderRadius: isBlaze ? 8 : 14, fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 900, color: isBlaze ? '#FFD700' : '#fff', cursor: 'pointer', boxShadow: isBlaze ? '3px 3px 0 rgba(0,0,0,0.25)' : `0 4px 16px ${accent}45` }}>
            {nextLesson ? '▶ Continue Learning' : '✓ Review Topics'}
          </button>
        </div>
      </div>
    )
  }


  async function switchTo(subject) {
    if (subject === active || switching) return
    setSwitching(true)
    await supabase.from('students')
      .update({ active_subject: subject })
      .eq('id', student.id)
    setSwitching(false)
    onSubjectChange?.(subject)
  }

  function slideTo(n) {
    setCur(n)
    // Only switch active subject if student is enrolled in that subject
    if (n === 0) switchTo('maths')
    else if (n === 1 && hasFM) switchTo('further_maths')
    // If not enrolled, just show the card — user can choose to enroll via button
  }

  function onTouchStart(e) { startX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -40) slideTo(1)
    else if (dx > 40) slideTo(0)
    startX.current = null
  }

  async function handleEnroll() {
    setEnrolling(true)
    await supabase.from('students')
      .update({
        subjects:       [...subjects, 'further_maths'],
        active_subject: 'further_maths',
      })
      .eq('id', student.id)
    setEnrolling(false)
    setEnrolled(true)
    setTimeout(() => {
      setShowEnroll(false)
      setEnrolled(false)
      setCur(1)
      onSubjectChange?.('further_maths')
    }, 900)
  }

  // Card data
  const cards = [
    {
      key:   'maths',
      label: 'Mathematics',
      sub:   classLevel,
      xp:    student?.xp || 0,
    },
    {
      key:    'further_maths',
      label:  'Further Mathematics',
      sub:    classLevel,
      xp:     student?.fm_xp || 0,
      locked: !hasFM,
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        {/* Swipeable track */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ overflow: 'hidden', borderRadius: isBlaze ? 14 : 24 }}>
          <div style={{
            display: 'flex',
            transform: `translateX(-${cur * 100}%)`,
            transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {cards.map((card, i) => (
              <div
                key={card.key}
                style={{
                  minWidth: '100%',
                  background: isNova ? 'rgba(255,255,255,0.06)' : '#fff',
                  border: isBlaze ? '2.5px solid #0d0d0d'
                    : isNova  ? '1px solid rgba(255,255,255,0.12)'
                    : `1.5px solid ${accent}20`,
                  borderRadius: isBlaze ? 14 : 24,
                  overflow: 'hidden',
                  boxShadow: isBlaze ? '4px 4px 0 #0d0d0d' : `0 8px 32px ${accent}14`,
                }}>

                {/* Header */}
                <div style={{
                  background: heroGradient,
                  padding: '16px 20px 14px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {!isBlaze && (
                    <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                  )}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Subject label + active badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif' }}>
                        {card.locked ? 'Available to enroll' : 'Subject'}
                      </div>
                      {active === card.key && (
                        <div style={{ background: isBlaze ? '#0d0d0d' : 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 9px' }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: isBlaze ? '#FFD700' : '#fff', fontFamily: 'Nunito, sans-serif', letterSpacing: 0.5 }}>ACTIVE</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1, marginBottom: 2 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: 11, color: isBlaze ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                      {card.locked ? `${classLevel} · Tap to enroll` : `${classLevel} · ${card.xp.toLocaleString()} XP`}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px' }}>
                  {card.locked ? (
                    /* Not enrolled — enroll CTA */
                    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                      <div style={{ fontSize: 13, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginBottom: 12, lineHeight: 1.6 }}>
                        Step-by-step lessons for vectors, sequences, functions and more.
                      </div>
                      <button
                        onClick={() => setShowEnroll(true)}
                        style={{
                          width: '100%', padding: '13px',
                          background: isBlaze ? '#0d0d0d' : accent,
                          border: 'none', borderRadius: isBlaze ? 8 : 14,
                          fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 900,
                          color: isBlaze ? '#FFD700' : '#fff', cursor: 'pointer',
                        }}>
                        Enroll in Further Maths →
                      </button>
                    </div>
                  ) : (
                    /* Enrolled — show next lesson + continue */
                    <>
                      {nextLesson && active === card.key ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: isBlaze ? 8 : 10, flexShrink: 0, background: `${accent}14`, border: `1.5px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            ▶
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>Next lesson</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {nextLesson.title}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', marginBottom: 12, fontWeight: 600 }}>
                          {active !== card.key ? 'Switch to access this subject' : 'All lessons complete!'}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (active !== card.key) {
                            switchTo(card.key)
                          } else {
                            onContinue?.()
                          }
                        }}
                        style={{
                          width: '100%', padding: '13px',
                          background: isBlaze ? '#0d0d0d' : accent,
                          border: 'none', borderRadius: isBlaze ? 8 : 14,
                          fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 900,
                          color: isBlaze ? '#FFD700' : '#fff', cursor: 'pointer',
                          boxShadow: isBlaze ? '3px 3px 0 rgba(0,0,0,0.25)' : `0 4px 16px ${accent}45`,
                          opacity: switching ? 0.6 : 1,
                        }}>
                        {switching ? '...'
                          : active !== card.key ? '⇄ Switch Subject'
                          : nextLesson ? '▶ Continue Learning'
                          : '✓ Review Topics'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {cards.map((_, i) => (
            <div
              key={i}
              onClick={() => slideTo(i)}
              style={{
                height: 5,
                width: i === cur ? 18 : 5,
                borderRadius: 99,
                background: i === cur ? accent : `${accent}35`,
                transition: 'all 0.25s',
                cursor: 'pointer',
              }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 600, opacity: 0.65 }}>
          {cur === 0 ? 'Swipe to see Further Maths →' : '← Swipe back to Mathematics'}
        </div>
      </div>

      {/* Enroll bottom sheet */}
      {showEnroll && (
        <>
          <div onClick={() => setShowEnroll(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 520, zIndex: 51,
            background: isNova ? '#1a1040' : M.lessonCard || '#fff',
            borderRadius: isBlaze ? '14px 14px 0 0' : '24px 24px 0 0',
            padding: '0 20px 40px',
            border: isBlaze ? '2px solid #0d0d0d' : 'none',
            fontFamily: 'Nunito, sans-serif',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 10 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: `${accent}35` }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont, marginBottom: 8 }}>
              Enroll in Further Maths?
            </div>
            <div style={{ fontSize: 14, color: M.textSecondary, lineHeight: 1.7, fontWeight: 600, marginBottom: 14 }}>
              Deeper topics — vectors, sequences, functions, calculus and more. Step-by-step lessons built for SS1–SS3 exam success.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {['SS1','SS2','SS3','WAEC','NECO','JAMB'].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: `${accent}14`, color: accent, fontFamily: 'Nunito, sans-serif' }}>{t}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: M.textSecondary, background: `${accent}0A`, borderRadius: isBlaze ? 8 : 14, padding: '10px 14px', marginBottom: 18, lineHeight: 1.6, fontWeight: 600 }}>
              Your Maths progress and XP stay exactly as they are. Further Maths tracks separately — own XP, own leaderboard.
            </div>
            <button
              onClick={handleEnroll}
              disabled={enrolling || enrolled}
              style={{
                width: '100%', padding: '14px',
                background: enrolled ? M.correctColor : isBlaze ? '#0d0d0d' : accent,
                border: 'none', borderRadius: isBlaze ? 8 : 14,
                fontFamily: 'Nunito, sans-serif', fontSize: 15, fontWeight: 900,
                color: '#fff', cursor: enrolling || enrolled ? 'default' : 'pointer',
                marginBottom: 10, opacity: enrolling ? 0.7 : 1,
              }}>
              {enrolled ? '✓ Enrolled!' : enrolling ? 'Enrolling...' : 'Enroll in Further Maths'}
            </button>
            <button
              onClick={() => setShowEnroll(false)}
              style={{
                width: '100%', padding: '13px', background: 'transparent',
                border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`,
                borderRadius: isBlaze ? 8 : 14,
                fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800,
                color: M.textSecondary, cursor: 'pointer',
              }}>
              Not now
            </button>
          </div>
        </>
      )}
    </>
  )
}