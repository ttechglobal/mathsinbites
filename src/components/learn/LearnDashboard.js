'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { MIBLogo, BicPencil } from '@/components/BiteMarkIcon'
import BottomSheet from '@/components/BottomSheet'
import ModePicker from '@/components/ModePicker'

// ── Background decorations ───────────────────────────────────────────────────
function MathFloats({ M }) {
  const syms = M?.floatSyms || ['x²', '∑', 'π', '√', '∫', 'θ', '∞', '±', 'Δ']
  const color = M?.floatColor || 'rgba(0,0,0,0.04)'
  const font = M?.floatFont || "'Courier New',monospace"
  const positions = [
    { x: 5, y: 8 }, { x: 85, y: 6 }, { x: 15, y: 68 }, { x: 72, y: 50 },
    { x: 46, y: 16 }, { x: 31, y: 80 }, { x: 60, y: 74 }, { x: 3, y: 45 }, { x: 64, y: 12 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {syms.map((sym, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${positions[i % positions.length].x}%`,
          top: `${positions[i % positions.length].y}%`,
          fontSize: 16, fontWeight: 700, color, fontFamily: font,
          animation: `float${i % 4} ${8 + i}s ease-in-out ${i * 0.5}s infinite`,
          userSelect: 'none',
        }}>{sym}</div>
      ))}
    </div>
  )
}

function AnkaraStripe() {
  return (
    <div style={{
      height: 4,
      background: 'repeating-linear-gradient(90deg,#C0392B 0,#C0392B 8px,#E6B800 8px,#E6B800 16px,#1A1F6B 16px,#1A1F6B 24px,#2D6A4F 24px,#2D6A4F 32px)',
      animation: 'ankaraScroll 6s linear infinite',
    }} />
  )
}

function NovaStars() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 71 + 5) % 96}%`,
          top: `${(i * 43 + 3) % 92}%`,
          width: i % 7 === 0 ? 2.5 : 1.2,
          height: i % 7 === 0 ? 2.5 : 1.2,
          borderRadius: '50%', background: '#fff', opacity: 0.3,
          animation: `twinkle ${2 + (i % 3)}s ease-in-out ${(i * 0.2) % 2}s infinite`,
        }} />
      ))}
    </div>
  )
}

function getMonthLabel() {
  return new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

// ── Nova text helpers — Fredoka One is naturally heavy, so we use opacity + lighter colours ──
// We avoid fontWeight manipulation since Fredoka One is a single-weight display font.
// Instead, use color opacity and slightly reduced size for body text to make it feel lighter.

// ── CLASS_OPTIONS for profile editing ───────────────────────────────────────
const CLASS_OPTIONS = [
  'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3',
]

// ─────────────────────────────────────────────────────────────────────────────
export default function LearnDashboard({ student: initialStudent, level, progress }) {
  const router = useRouter()
  const supabase = createClient()
  const { M, mode, setMode } = useMode()

  // Local editable student state
  const [student, setStudent] = useState(initialStudent)

  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardType, setLeaderboardType] = useState('class')
  const [activeTab, setActiveTab] = useState('learn')
  const [showModePicker, setShowModePicker] = useState(false)
  const [popup, setPopup] = useState(null)
  const [floatingLabel, setFloatingLabel] = useState(null)

  // Profile editing state
  const [editName, setEditName] = useState(initialStudent?.display_name || '')
  const [editSchool, setEditSchool] = useState(initialStudent?.school || '')
  const [editClass, setEditClass] = useState(initialStudent?.class_level || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const scrollRef = useRef(null)
  const sectionRefs = useRef({})

  const isNova = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isSpark = mode === 'spark'
  const isRoots = mode === 'roots'

  // Nova: Fredoka One is a display font — use opacity/color to reduce visual weight
  // Other modes: normal weight differences
  const bodyColor = isNova ? 'rgba(200,195,255,0.78)' : M.textSecondary
  const bodySize = isNova ? 12 : 13

  // ── Leaderboard fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchLeaderboard() {
      let query = supabase.from('students')
        .select('id, display_name, class_level, school, xp, monthly_xp')
        .order('monthly_xp', { ascending: false })
        .limit(30)
      if (leaderboardType === 'class') query = query.eq('class_level', student?.class_level)
      else if (leaderboardType === 'school') query = query.eq('school', student?.school)
      const { data } = await query
      setLeaderboard(data || [])
    }
    if (activeTab === 'leaderboard' && student?.class_level) fetchLeaderboard()
  }, [activeTab, leaderboardType, student?.class_level, student?.school])

  // ── Scroll floating label ─────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const scrollTop = el.scrollTop
      let current = null
      Object.entries(sectionRefs.current).forEach(([key, ref]) => {
        if (ref && ref.offsetTop - 90 <= scrollTop) current = key
      })
      setFloatingLabel(current)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // ── Save profile ───────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!editName.trim()) return
    setSaving(true)
    const updates = {
      display_name: editName.trim(),
      school: editSchool.trim(),
      class_level: editClass,
    }
    const { error } = await supabase.from('students').update(updates).eq('id', student.id)
    setSaving(false)
    if (!error) {
      setStudent(s => ({ ...s, ...updates }))
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2500)
    } else {
      setSaveMsg('Error saving')
      setTimeout(() => setSaveMsg(''), 2500)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Progress data
  const allSubtopicIds = (level?.terms || [])
    .flatMap(t => t.units || [])
    .flatMap(u => u.topics || [])
    .flatMap(t => (t.subtopics || []).map(s => s.id))

  const completedIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.subtopic_id))

  function getSubtopicState(subtopicId) {
    const idx = allSubtopicIds.indexOf(subtopicId)
    const done = completedIds.has(subtopicId)
    const locked = idx > 0 && !completedIds.has(allSubtopicIds[idx - 1])
    return { done, locked, isNext: !done && !locked }
  }

  const termAccents = M.termAccents || ['#0d9488', '#f97316', '#8b5cf6']
  const xp = student?.xp || 0
  const monthlyXp = student?.monthly_xp || 0
  const streak = student?.streak_days || 0

  // ── Input style for profile forms ─────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '11px 14px',
    fontSize: 14, fontFamily: 'Nunito, sans-serif', // always Nunito for readability in inputs
    color: isNova ? '#F8F7FF' : '#1a1a1a',
    background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)',
    border: isBlaze ? '2px solid #0d0d0d' : isNova ? '1.5px solid rgba(165,180,252,0.2)' : `1.5px solid ${M.navBorder}`,
    borderRadius: isBlaze ? 8 : 12, outline: 'none',
    boxSizing: 'border-box', fontWeight: 500,
    boxShadow: isBlaze ? 'inset 1px 1px 0 rgba(0,0,0,0.05)' : 'none',
  }

  const selectStyle = { ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }

  // ══════════════════════════════════════════════════════════════════════════
  // HUD
  // ══════════════════════════════════════════════════════════════════════════
  const HUD = (
    <div style={{
      flexShrink: 0, position: 'relative', zIndex: 20,
      background: M.hudBg, backdropFilter: 'blur(10px)',
      borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
    }}>
      {isRoots && <AnkaraStripe />}
      <div style={{
        maxWidth: 600, margin: '0 auto', padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <MIBLogo size={32} theme={isNova ? 'dark' : 'light'} M={M} />
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[['❤️', 5], ['🔥', streak], ['⭐', xp]].map(([ic, v], i) => (
            <div key={i} style={{
              background: M.badgeBg, border: `1.5px solid ${M.badgeBorder}`,
              borderRadius: isBlaze ? 8 : 20, padding: '3px 9px',
              display: 'flex', gap: 3, alignItems: 'center',
              boxShadow: isBlaze ? `2px 2px 0 ${M.badgeBorder}` : 'none',
            }}>
              <span style={{ fontSize: 11 }}>{ic}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: M.badgeText, fontFamily: 'Nunito, sans-serif' }}>{v}</span>
            </div>
          ))}
          {/* Mode button — fully styled per theme */}
          <button
            onClick={() => setShowModePicker(true)}
            style={{
              background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)'
                : isNova ? 'linear-gradient(135deg,#7C3AED,#4C1D95)'
                : isSpark ? 'linear-gradient(135deg,#FF8C42,#F59E0B)'
                : isRoots ? 'linear-gradient(135deg,#C0392B,#8B1A1A)'
                : `linear-gradient(135deg,${M.accentColor},${M.accent2 || M.accentColor})`,
              border: isBlaze ? '2px solid #0d0d0d' : 'none',
              borderRadius: isBlaze ? 8 : 20,
              padding: '4px 11px 4px 8px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : '0 2px 10px rgba(0,0,0,0.2)',
              color: '#fff',
              fontFamily: 'Nunito, sans-serif', fontWeight: 800,
            }}
          >
            <span style={{ fontSize: 14 }}>{M.emoji}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>Mode</span>
          </button>
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // BOTTOM NAV — 5 tabs: Learn, Practice, Challenge, Leaders, Profile
  // ══════════════════════════════════════════════════════════════════════════
  const TABS = [
    { id: 'learn',      icon: '📚', label: 'Learn' },
    { id: 'practice',   icon: '✏️', label: 'Practice' },
    { id: 'challenge',  icon: '⚡', label: 'Challenge' },
    { id: 'leaderboard',icon: '🏆', label: 'Leaders' },
    { id: 'profile',    icon: '👤', label: 'Profile' },
  ]

  const BottomNav = (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: M.navBg,
      borderTop: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
      display: 'flex', justifyContent: 'space-around',
      padding: '5px 0 max(10px, env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
    }}>
      {TABS.map(t => {
        const isActive = activeTab === t.id
        return (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, cursor: 'pointer', padding: '3px 8px', minWidth: 52,
              fontFamily: 'Nunito, sans-serif',
            }}>
            <div style={{
              width: 40, height: 30, borderRadius: 10,
              background: isActive ? M.navActivePill : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              border: isActive && isBlaze ? '1.5px solid #0d0d0d' : 'none',
              boxShadow: isActive && isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
            }}>
              <span style={{ fontSize: isActive ? 18 : 16, lineHeight: 1 }}>{t.icon}</span>
            </div>
            <span style={{
              fontSize: 9, fontWeight: isActive ? 800 : 600,
              color: isActive ? M.navActive : M.navText,
              letterSpacing: 0.2,
            }}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // LEARN TAB — quest map with wide spacing
  // ══════════════════════════════════════════════════════════════════════════
  const LearnTab = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {isNova ? <NovaStars /> : <MathFloats M={M} />}

      {floatingLabel && (
        <div style={{
          position: 'fixed', top: 62, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, pointerEvents: 'none',
          background: isNova ? 'rgba(18,14,50,0.96)' : isBlaze ? '#FFD700'
            : isSpark ? 'rgba(200,75,0,0.92)' : isRoots ? 'rgba(140,30,20,0.94)'
            : 'rgba(10,80,74,0.93)',
          backdropFilter: 'blur(10px)',
          border: isBlaze ? '2px solid #0d0d0d' : 'none',
          borderRadius: isBlaze ? 8 : 24, padding: '5px 18px',
          boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : '0 4px 20px rgba(0,0,0,0.25)',
          animation: 'slideDown 0.25s ease',
        }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
            color: isBlaze ? '#0d0d0d' : '#fff', whiteSpace: 'nowrap',
          }}>{floatingLabel}</span>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Welcome bubble */}
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <BicPencil pose="happy" size={68} style={{ flexShrink: 0 }} />
            <div style={{
              background: isBlaze ? '#FFD700' : isNova ? 'rgba(30,27,75,0.92)' : M.cardBg,
              borderRadius: '20px 20px 20px 4px', padding: '14px 18px',
              border: isBlaze ? '2px solid #0d0d0d' : isNova ? '1px solid rgba(165,180,252,0.15)' : M.cardBorder,
              boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow, flex: 1,
            }}>
              <div style={{
                fontSize: 14, fontWeight: 800,
                color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary,
                fontFamily: M.headingFont, marginBottom: 4,
              }}>{M.welcomeTitle}</div>
              <div style={{ fontSize: bodySize, color: isBlaze ? '#333' : bodyColor, lineHeight: 1.55, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
                {M.hookPhrase}
              </div>
            </div>
          </div>
        </div>

        {(!level?.terms?.length) && (
          <div style={{ textAlign: 'center', padding: '70px 20px' }}>
            <BicPencil pose="think" size={110} style={{ display: 'inline-block', marginBottom: 20 }} />
            <p style={{ fontWeight: 800, fontSize: 19, color: M.textPrimary, fontFamily: M.headingFont }}>Content coming soon!</p>
            <p style={{ fontSize: 13, marginTop: 6, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
              We&apos;re preparing lessons for {student?.class_level}.
            </p>
          </div>
        )}

        {[...(level?.terms || [])].sort((a, b) => a.term_number - b.term_number).map((term, termIdx) => {
          const accent = termAccents[termIdx % termAccents.length]
          const termSubs = (term.units || []).flatMap(u => (u.topics || []).flatMap(t => t.subtopics || []))
          const termDone = termSubs.length > 0 && termSubs.every(s => completedIds.has(s.id))
          const termProgress = termSubs.filter(s => completedIds.has(s.id)).length

          return (
            <div key={term.id} style={{ marginBottom: 4 }} ref={el => { sectionRefs.current[term.name] = el }}>

              {/* Sticky term banner */}
              <div style={{
                position: 'sticky', top: 0, zIndex: 15,
                background: isBlaze ? '#111' : isNova ? 'rgba(10,8,30,0.97)' : `${accent}F0`,
                backdropFilter: 'blur(14px)',
                borderBottom: isBlaze ? `3px solid ${accent}` : `1px solid rgba(255,255,255,0.1)`,
              }}>
                {isRoots && <AnkaraStripe />}
                <div style={{
                  maxWidth: 520, margin: '0 auto', padding: '10px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: isBlaze ? accent : 'rgba(255,255,255,0.5)', fontFamily: 'Nunito, sans-serif', marginBottom: 1 }}>
                      Term {termIdx + 1}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: isBlaze ? accent : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}>
                      {term.name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {termDone && <span style={{ fontSize: 18 }}>{M.chestDone}</span>}
                    <div style={{
                      background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: isBlaze ? 6 : 20, padding: '3px 10px',
                      fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: 'Nunito, sans-serif',
                    }}>
                      {termProgress}/{termSubs.length}
                    </div>
                  </div>
                </div>
              </div>

              {(term.units || []).map((unit) => (
                <div key={unit.id} ref={el => { sectionRefs.current[`${term.name} · ${unit.title}`] = el }}>

                  {/* Unit pill — clean, no lines */}
                  <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 20px 8px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.2)' : `${accent}18`,
                      border: isBlaze ? '1.5px solid #0d0d0d' : isNova ? '1px solid rgba(124,58,237,0.35)' : `1px solid ${accent}35`,
                      borderRadius: isBlaze ? 6 : 20, padding: '5px 13px',
                      boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
                    }}>
                      <span style={{ fontSize: 11 }}>📂</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: isBlaze ? '#0d0d0d' : isNova ? 'rgba(180,170,255,0.95)' : M.textSecondary,
                        letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif',
                      }}>{unit.title}</span>
                    </div>
                  </div>

                  {/* Topics — spacious layout */}
                  <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 8px' }}>
                    {(unit.topics || []).map((topic, topicIdx) => {
                      const topicSubs = topic.subtopics || []
                      const firstSub = topicSubs[0]
                      const { done, locked, isNext } = firstSub ? getSubtopicState(firstSub.id) : { done: false, locked: true, isNext: false }
                      const doneCount = topicSubs.filter(s => completedIds.has(s.id)).length
                      const isLeft = topicIdx % 2 === 0

                      return (
                        <div key={topic.id} style={{
                          display: 'flex',
                          flexDirection: isLeft ? 'row' : 'row-reverse',
                          alignItems: 'center',
                          // Wide spacing between nodes — negative margin for zig-zag overlap feeling
                          marginBottom: 2,
                          marginLeft: isLeft ? 0 : 32,
                          marginRight: isLeft ? 32 : 0,
                          position: 'relative',
                        }}>
                          {/* Node */}
                          <div style={{
                            flexShrink: 0, width: 80,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            // Extra vertical padding for big breathing room
                            padding: '18px 0 12px',
                            position: 'relative', zIndex: 2,
                          }}>
                            {isNext && (
                              <div style={{
                                position: 'absolute', top: 6,
                                background: isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : M.accentColor,
                                color: isBlaze ? '#0d0d0d' : isNova ? '#0F0C29' : '#fff',
                                fontSize: 7, fontWeight: 900, padding: '2px 8px',
                                borderRadius: isBlaze ? 4 : 12,
                                fontFamily: 'Nunito, sans-serif',
                                border: isBlaze ? '1.5px solid #0d0d0d' : 'none',
                                boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : '0 2px 8px rgba(0,0,0,0.2)',
                                whiteSpace: 'nowrap', zIndex: 3,
                              }}>▶ NEXT</div>
                            )}

                            <button
                              onClick={() => !locked && setPopup({ topic, term, unit })}
                              style={{
                                // Larger nodes for more presence
                                width: isNext ? 58 : 48, height: isNext ? 58 : 48,
                                borderRadius: isBlaze ? '18%' : '50%',
                                marginTop: isNext ? 14 : 0,
                                background: locked
                                  ? (isNova ? 'linear-gradient(145deg,#2a2550,#1e1b3a)' : '#ebebeb')
                                  : done ? `linear-gradient(145deg,${accent},${accent}BB)`
                                  : isBlaze ? '#FFD700' : `linear-gradient(145deg,${accent},${accent}CC)`,
                                border: isBlaze
                                  ? `2.5px solid ${locked ? '#ccc' : '#0d0d0d'}`
                                  : `2.5px solid ${locked ? (isNova ? 'rgba(255,255,255,0.08)' : '#d8d8d8') : accent}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                boxShadow: isNext
                                  ? (isBlaze ? '3px 3px 0 #0d0d0d' : `0 0 22px ${accent}80, 0 6px 16px rgba(0,0,0,0.18)`)
                                  : done ? (isBlaze ? '2px 2px 0 #0d0d0d' : `0 0 10px ${accent}40`) : 'none',
                                animation: isNext ? 'float 2.5s ease-in-out infinite' : 'none',
                                transition: 'transform 0.12s',
                              }}>
                              <span style={{ fontSize: isNext ? 20 : 17 }}>
                                {done ? '★' : locked ? '🔒' : '📖'}
                              </span>
                            </button>

                            <div style={{
                              marginTop: 6, textAlign: 'center',
                              fontSize: 9, fontWeight: 700,
                              fontFamily: 'Nunito, sans-serif', lineHeight: 1.25, maxWidth: 72,
                              color: locked ? (isNova ? 'rgba(165,180,252,0.3)' : '#c0c0c0')
                                : done ? accent : isBlaze ? '#111' : accent,
                            }}>{topic.title}</div>
                          </div>

                          {/* Info card — more padding, softer */}
                          <button
                            onClick={() => !locked && setPopup({ topic, term, unit })}
                            disabled={locked}
                            style={{
                              flex: 1, margin: '10px 0',
                              padding: '14px 16px', textAlign: 'left',
                              background: locked
                                ? (isNova ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)')
                                : done ? `${accent}0E`
                                : isNext ? (isBlaze ? '#FFF9D6' : isNova ? 'rgba(124,58,237,0.1)' : `${accent}08`)
                                : (isNova ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.7)'),
                              borderRadius: isBlaze ? 10 : 16,
                              border: isBlaze
                                ? `2px solid ${locked ? '#e8e8e8' : done ? accent : isNext ? '#0d0d0d' : '#e8e8e8'}`
                                : `1.5px solid ${locked
                                  ? (isNova ? 'rgba(255,255,255,0.04)' : '#eee')
                                  : done ? `${accent}28` : isNext ? `${accent}3A` : '#eee'}`,
                              boxShadow: isNext
                                ? (isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow) : 'none',
                              cursor: locked ? 'not-allowed' : 'pointer',
                              opacity: locked ? 0.45 : 1, transition: 'all 0.12s',
                            }}>
                            <div style={{
                              fontSize: 13, fontWeight: 700,
                              color: locked ? (isNova ? 'rgba(165,180,252,0.35)' : M.textSecondary) : (isNova ? '#F8F7FF' : M.textPrimary),
                              fontFamily: 'Nunito, sans-serif', marginBottom: 4, lineHeight: 1.3,
                            }}>{topic.title}</div>
                            <div style={{ fontSize: 11, color: bodyColor, lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
                              {done && <span style={{ color: M.correctColor, fontWeight: 700 }}>✓ Done</span>}
                              {isNext && !done && <span style={{ color: accent, fontWeight: 800 }}>
                                {isBlaze ? '⚡ UP NEXT' : isSpark ? '✨ Next!' : isRoots ? '→ Next' : '→ Up next'}
                              </span>}
                              {locked && <span>🔒 Locked</span>}
                              <span style={{
                                marginLeft: 'auto', fontSize: 9, fontWeight: 800,
                                color: isBlaze ? '#0d0d0d' : accent,
                                border: isBlaze ? '1px solid #0d0d0d' : `1px solid ${accent}40`,
                                borderRadius: isBlaze ? 4 : 20, padding: '2px 7px',
                                background: isBlaze ? '#FFD700' : `${accent}10`,
                                fontFamily: 'Nunito, sans-serif',
                              }}>{doneCount}/{topicSubs.length}</span>
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {termDone && (
                <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 20px' }}>
                  <div style={{
                    textAlign: 'center', padding: '16px',
                    background: isBlaze ? '#FFD700' : `${accent}12`,
                    borderRadius: isBlaze ? 8 : 16,
                    border: isBlaze ? '2px solid #0d0d0d' : `1px solid ${accent}25`,
                    boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : 'none',
                  }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{M.chestDone}</div>
                    <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: isBlaze ? '#0d0d0d' : accent }}>
                      {isBlaze ? 'TERM COMPLETE! 💥' : 'Term Complete! 🎉'}
                    </div>
                  </div>
                </div>
              )}

              {/* Spacer between terms */}
              <div style={{ height: 12 }} />
            </div>
          )
        })}

        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '24px 0 120px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: isBlaze ? 12 : '50%',
            background: isBlaze ? '#E8E8E8' : 'rgba(0,0,0,0.04)',
            border: isBlaze ? '2px solid #ccc' : '2px dashed #ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px',
          }}>🏁</div>
          <div style={{ color: isNova ? 'rgba(165,180,252,0.35)' : '#c8c8c8', fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            {M.endText}
          </div>
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // PRACTICE TAB
  // ══════════════════════════════════════════════════════════════════════════
  const allTopics = (level?.terms || []).flatMap(t => (t.units || []).flatMap(u => (u.topics || [])))

  const PracticeTab = (
    <div style={{ padding: '20px 20px 120px', maxWidth: 520, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 800, color: M.textPrimary, marginBottom: 4 }}>
          ✏️ Practice
        </h2>
        <p style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.5 }}>
          {isRoots ? 'Practise your maths — no lesson needed, just go!' : isBlaze ? 'DRILL YOUR SKILLS. NO EXCUSES.' : 'Jump into any topic — no need to finish the lesson first!'}
        </p>
      </div>

      {/* Mixed practice card */}
      <button
        onClick={() => router.push('/learn/practice')}
        style={{
          width: '100%', marginBottom: 14, padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
          borderRadius: isBlaze ? 10 : 18,
          background: isBlaze ? '#FFD700'
            : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(76,29,149,0.2))'
            : `linear-gradient(135deg,${M.accentColor}22,${M.accent2 || M.accentColor}10)`,
          border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${M.accentColor}40`,
          boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow,
          display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'Nunito, sans-serif',
        }}>
        <div style={{
          width: 52, height: 52, borderRadius: isBlaze ? 10 : '50%', flexShrink: 0,
          background: isBlaze ? 'rgba(0,0,0,0.08)' : `${M.accentColor}20`,
          border: isBlaze ? '2px solid rgba(0,0,0,0.15)' : `2px solid ${M.accentColor}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>🎲</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, marginBottom: 3 }}>
            {isBlaze ? 'MIXED DRILL' : isRoots ? 'Random Mix' : 'Mixed Practice'}
          </div>
          <div style={{ fontSize: 11, color: isBlaze ? '#444' : bodyColor, fontWeight: 500 }}>
            Questions from all {student?.class_level || ''} topics · shuffled
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff',
          background: isBlaze ? '#0d0d0d' : M.accentColor,
          borderRadius: isBlaze ? 6 : 20, padding: '5px 12px', fontFamily: 'Nunito, sans-serif',
        }}>GO →</div>
      </button>

      {/* By topic */}
      <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
        By Topic
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allTopics.map(topic => {
          const topicSubs = topic.subtopics || []
          const doneCount = topicSubs.filter(s => completedIds.has(s.id)).length
          const hasDone = doneCount > 0
          return (
            <button key={topic.id}
              onClick={() => router.push(`/learn/practice?topicId=${topic.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                background: M.cardBg,
                border: hasDone ? `1.5px solid ${M.accentColor}28` : M.cardBorder,
                borderRadius: M.cardRadius, boxShadow: M.cardShadow,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                fontFamily: 'Nunito, sans-serif',
              }}>
              <div style={{
                width: 38, height: 38, borderRadius: isBlaze ? '30%' : '50%', flexShrink: 0,
                background: hasDone ? `${M.accentColor}18` : isNova ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: hasDone ? `1.5px solid ${M.accentColor}30` : `1.5px solid ${isNova ? 'rgba(255,255,255,0.08)' : '#eee'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{hasDone ? '✏️' : '📖'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isNova ? '#F8F7FF' : M.textPrimary, marginBottom: 2 }}>
                  {topic.title}
                </div>
                <div style={{ fontSize: 10, color: bodyColor, fontWeight: 500 }}>
                  {hasDone
                    ? <span style={{ color: M.correctColor }}>✓ {doneCount}/{topicSubs.length} subtopics done</span>
                    : `${topicSubs.length} subtopic${topicSubs.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: hasDone ? M.accentColor : M.textSecondary,
                background: hasDone ? `${M.accentColor}12` : isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                borderRadius: 20, padding: '3px 9px',
              }}>Practice</span>
            </button>
          )
        })}

        {allTopics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <BicPencil pose="think" size={90} style={{ display: 'inline-block', marginBottom: 16 }} />
            <p style={{ fontFamily: M.headingFont, fontSize: 16, fontWeight: 800, color: M.textPrimary, marginBottom: 6 }}>
              No content yet!
            </p>
            <p style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
              Content for {student?.class_level} is on the way.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // CHALLENGE TAB — Daily Challenge only
  // ══════════════════════════════════════════════════════════════════════════
  const ChallengeTab = (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', padding:'32px 20px 120px', maxWidth:520, margin:'0 auto' }}>

      <div style={{ animation:'float 2.5s ease-in-out infinite', marginBottom:20 }}>
        <BicPencil pose="celebrate" size={110} />
      </div>

      <div style={{ fontFamily:M.headingFont, fontSize:26, fontWeight:900, color:M.textPrimary, textAlign:'center', marginBottom:8, lineHeight:1.2 }}>
        🏆 Daily Challenge
      </div>
      <div style={{ fontSize:13, color:bodyColor, fontFamily:'Nunito,sans-serif', fontWeight:500, lineHeight:1.7, textAlign:'center', maxWidth:300, marginBottom:28 }}>
        {isRoots
          ? `5 questions every day. Get all correct — collect 50 XP and climb the leaderboard! New set drops at midnight. 🇳🇬`
          : isBlaze
          ? `5 QUESTIONS. TIMED. NO HINTS. ALL CORRECT = 50 XP. CLOCK RESETS AT MIDNIGHT.`
          : `5 personalised questions every day. Get them all right to earn 50 XP and boost your leaderboard position! New challenge drops at midnight.`}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:28 }}>
        {[
          { icon:'⚡', label:'5 questions', color:M.accentColor },
          { icon:'⏱', label:'30s per Q',   color:'#FFC933'     },
          { icon:'🏆', label:'+50 XP bonus',color:M.correctColor},
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ background:`${color}12`, border:`1px solid ${color}30`, borderRadius:12, padding:'10px 12px', textAlign:'center', flex:1 }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:10, fontWeight:800, color, fontFamily:'Nunito,sans-serif', lineHeight:1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/learn/challenge?mode=daily')}
        style={{ ...M.primaryBtn, fontSize:16, padding:'16px 40px', width:'100%', maxWidth:300 }}>
        {isBlaze ? '⚡ ACCEPT CHALLENGE' : isSpark ? '✨ Start Today\'s Challenge!' : isRoots ? '🇳🇬 Take Today\'s Challenge' : 'Start Daily Challenge →'}
      </button>
    </div>
  )
  
  // ══════════════════════════════════════════════════════════════════════════
  // LEADERBOARD TAB
  // ══════════════════════════════════════════════════════════════════════════
  const LB_TABS = [
    { id: 'class', label: student?.class_level || 'My Class' },
    { id: 'school', label: '🏫 School' },
    { id: 'overall', label: '🌍 All' },
  ]

  const LeaderboardTab = (
    <div style={{ padding: '20px 20px 120px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 800, color: M.textPrimary, marginBottom: 2 }}>
            👑 Leaderboard
          </h2>
          <p style={{ fontSize: 11, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>{getMonthLabel()} · resets monthly</p>
        </div>
        <div style={{
          background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.15)' : `${M.accentColor}12`,
          border: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.accentColor}30`,
          borderRadius: isBlaze ? 8 : 20, padding: '6px 14px', textAlign: 'center',
          boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: isBlaze ? '#0d0d0d' : M.accentColor, fontFamily: 'Nunito, sans-serif' }}>{monthlyXp}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: isBlaze ? '#444' : M.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif' }}>Your XP</div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderRadius: isBlaze ? 8 : 12, padding: 3, gap: 3, marginBottom: 16,
        border: isBlaze ? '2px solid #ccc' : 'none',
      }}>
        {LB_TABS.map(t => (
          <div key={t.id} onClick={() => setLeaderboardType(t.id)}
            style={{
              flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: isBlaze ? 6 : 9,
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 800,
              transition: 'all 0.15s',
              background: leaderboardType === t.id
                ? (isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,#7C3AED,#4C1D95)' : M.accentColor)
                : 'transparent',
              color: leaderboardType === t.id ? (isBlaze ? '#0d0d0d' : '#fff') : M.textSecondary,
              boxShadow: leaderboardType === t.id && isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
            }}>{t.label}</div>
        ))}
      </div>

      <div style={{ background: M.cardBg, border: M.cardBorder, borderRadius: M.cardRadius, boxShadow: M.cardShadow, overflow: 'hidden' }}>
        {leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <p style={{ fontWeight: 800, color: M.textPrimary, fontSize: 15, fontFamily: 'Nunito, sans-serif' }}>No rankings yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>Complete lessons to appear here!</p>
          </div>
        ) : leaderboard.map((entry, idx) => {
          const isMe = entry.id === student?.id
          const xpVal = entry.monthly_xp || 0
          return (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              background: isMe ? (isNova ? 'rgba(124,58,237,0.12)' : `${M.accentColor}08`) : 'transparent',
              borderLeft: `3px solid ${isMe ? M.accentColor : 'transparent'}`,
              borderBottom: `1px solid ${isNova ? 'rgba(255,255,255,0.05)' : '#f2f2f2'}`,
            }}>
              <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: M.textSecondary }}>#{idx + 1}</span>
                )}
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: `${M.accentColor}22`,
                border: `1.5px solid ${M.accentColor}44`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 900, fontSize: 14, color: M.accentColor, flexShrink: 0,
              }}>
                {entry.display_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: isNova ? '#F8F7FF' : M.textPrimary, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Nunito, sans-serif' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.display_name}</span>
                  {isMe && <span style={{ fontSize: 9, fontWeight: 900, color: M.accentColor, flexShrink: 0, background: `${M.accentColor}18`, borderRadius: 20, padding: '1px 6px' }}>YOU</span>}
                </p>
                <p style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
                  {entry.class_level}{entry.school ? ` · ${entry.school}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, color: M.accentColor, fontFamily: 'Nunito, sans-serif', fontSize: 15 }}>{xpVal}</div>
                <div style={{ fontSize: 9, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>XP</div>
              </div>
            </div>
          )
        })}
      </div>
      {leaderboard.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginTop: 12 }}>
          🔄 Rankings reset on the 1st of each month
        </p>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE TAB — merged: stats + editable fields + mode picker + sign out
  // ══════════════════════════════════════════════════════════════════════════
  const heroBg = isNova ? 'linear-gradient(160deg,#1E1B4B,#0F0C29)'
    : isSpark ? 'linear-gradient(160deg,#FF8C42,#FFD93D)'
    : isRoots ? 'linear-gradient(160deg,#C0392B,#8B1A1A)'
    : isBlaze ? 'linear-gradient(160deg,#E63946,#1D3557)'
    : `linear-gradient(160deg,${M.accentColor},${M.accent2 || M.accentColor})`

  const ProfileTab = (
    <div style={{ paddingBottom: 120 }}>
      {/* Hero */}
      <div style={{ background: heroBg, padding: '28px 20px 24px', position: 'relative' }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.2)', fontSize: 40,
            border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          }}>
            {student?.display_name?.[0]?.toUpperCase() || '🧑🏾'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>
              {student?.display_name || 'Student'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
              {student?.class_level}{student?.school ? ` · ${student.school}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 18 }}>
              {[
                { v: xp, label: 'Total XP', color: '#FFD700' },
                { v: monthlyXp, label: 'Monthly', color: '#fff' },
                { v: `${streak}🔥`, label: 'Streak', color: '#fff' },
                { v: completedIds.size, label: 'Done', color: '#fff' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: s.color, fontFamily: 'Nunito, sans-serif' }}>{s.v}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Edit profile ──────────────────────────────────── */}
        <div style={{
          background: M.cardBg, border: M.cardBorder, borderRadius: M.cardRadius, padding: '18px 16px', boxShadow: M.cardShadow,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 14 }}>
            My Details
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>
                Display Name
              </label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>

            {/* Class */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>
                Class
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={editClass}
                  onChange={e => setEditClass(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select class...</option>
                  {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: M.textSecondary }}>▾</span>
              </div>
            </div>

            {/* School */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>
                School
              </label>
              <input
                value={editSchool}
                onChange={e => setEditSchool(e.target.value)}
                placeholder="Your school name"
                style={inputStyle}
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                ...M.primaryBtn, width: '100%', marginTop: 4,
                opacity: saving ? 0.7 : 1,
                fontSize: 14,
              }}>
              {saving ? 'Saving...' : saveMsg || 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── Change learning mode ───────────────────────────── */}
        <button onClick={() => setShowModePicker(true)} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
          borderRadius: isBlaze ? 10 : 18, cursor: 'pointer', textAlign: 'left', width: '100%',
          // Mode-specific styling
          background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)'
            : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(76,29,149,0.15))'
            : isSpark ? 'linear-gradient(135deg,rgba(255,140,66,0.18),rgba(255,217,61,0.12))'
            : isRoots ? 'linear-gradient(135deg,rgba(192,57,43,0.15),rgba(46,106,79,0.1))'
            : `linear-gradient(135deg,${M.accentColor}1A,${M.accent2 || M.accentColor}0D)`,
          border: isBlaze ? '2px solid #0d0d0d'
            : isNova ? '1px solid rgba(124,58,237,0.4)'
            : isSpark ? '1px solid rgba(255,140,66,0.35)'
            : isRoots ? '1px solid rgba(192,57,43,0.35)'
            : `1.5px solid ${M.accentColor}35`,
          boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow,
          fontFamily: 'Nunito, sans-serif',
        }}>
          {/* Mode emoji in styled circle */}
          <div style={{
            width: 54, height: 54, borderRadius: isBlaze ? 12 : '50%', flexShrink: 0,
            background: isBlaze ? '#fff'
              : isNova ? 'rgba(124,58,237,0.2)'
              : isSpark ? 'rgba(255,140,66,0.2)'
              : isRoots ? 'rgba(192,57,43,0.2)'
              : `${M.accentColor}18`,
            border: isBlaze ? '2px solid #0d0d0d'
              : `2px solid ${M.accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
          }}>{M.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 3 }}>
              {M.name}
            </div>
            <div style={{ fontSize: 11, color: isBlaze ? '#555' : bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.4 }}>
              {M.tagline || 'Tap to change learning style'}
            </div>
          </div>
          {/* CHANGE pill */}
          <div style={{
            fontSize: 10, fontWeight: 800,
            color: isBlaze ? '#0d0d0d' : '#fff',
            background: isBlaze ? '#0d0d0d'
              : isNova ? '#7C3AED'
              : isSpark ? '#FF8C42'
              : isRoots ? '#C0392B'
              : M.accentColor,
            borderRadius: isBlaze ? 6 : 20, padding: '4px 11px',
            fontFamily: 'Nunito, sans-serif', flexShrink: 0,
            boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
          }}>CHANGE</div>
        </button>

        {/* ── Sign out ───────────────────────────────────────── */}
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '13px', cursor: 'pointer',
          background: 'transparent',
          border: isBlaze ? '2px solid #ef4444' : '1.5px solid #fecaca',
          borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif',
          fontSize: 13, fontWeight: 800, color: '#ef4444',
          boxShadow: isBlaze ? '2px 2px 0 #ef4444' : 'none',
        }}>
          Sign Out
        </button>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // TOPIC POPUP — subtopic list, direct navigation
  // ══════════════════════════════════════════════════════════════════════════
  const TopicPopup = popup && (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={() => setPopup(null)} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520, zIndex: 50,
        background: isNova ? '#1A1740' : M.cardBg,
        borderRadius: isBlaze ? '12px 12px 0 0' : '26px 26px 0 0',
        padding: '0 20px 36px',
        boxShadow: '0 -10px 60px rgba(0,0,0,0.22)',
        border: isBlaze ? '2px solid #0d0d0d' : 'none',
        animation: 'sheetUp 0.3s cubic-bezier(0.34,1.1,0.64,1)',
        fontFamily: 'Nunito, sans-serif',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 10 }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, background: isNova ? 'rgba(255,255,255,0.12)' : '#e0e0e0' }} />
        </div>

        {/* Colour accent bar */}
        <div style={{
          height: 3, borderRadius: 3, marginBottom: 14,
          background: `linear-gradient(90deg,${M.accentColor},${M.accent2 || M.accentColor})`,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.textSecondary, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>
              {popup.term.name} · {popup.unit?.title}
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: isNova ? '#F8F7FF' : M.textPrimary, lineHeight: 1.2, fontFamily: 'Nunito, sans-serif' }}>
              {popup.topic.title}
            </div>
          </div>
          <BicPencil pose="celebrate" size={62} style={{ flexShrink: 0, marginTop: -8 }} />
        </div>

        <div style={{ fontSize: 12, color: bodyColor, marginBottom: 16, lineHeight: 1.6, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
          {isRoots ? 'Complete this lesson — e go sweet! 🇳🇬'
            : isBlaze ? 'COMPLETE THIS MISSION TO LEVEL UP! ⚡'
            : isNova ? 'Unlock this node to explore further. 🌌'
            : isSpark ? 'This lesson will light up your understanding! ✨'
            : 'Complete this lesson to unlock the next topic.'}
        </div>

        {/* XP chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            ['⭐', '10 XP', M.accentColor],
            ['📘', `${popup.topic.subtopics?.length || '?'} parts`, M.accent2 || M.accentColor],
            ['✏️', 'Practice', M.correctColor],
          ].map(([ic, txt, clr], i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', background: `${clr}10`,
              borderRadius: isBlaze ? 7 : 12, padding: '10px 4px',
              border: isBlaze ? `2px solid ${clr}` : `1.5px solid ${clr}28`,
            }}>
              <div style={{ fontSize: 17, marginBottom: 2 }}>{ic}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: clr, fontFamily: 'Nunito, sans-serif' }}>{txt}</div>
            </div>
          ))}
        </div>

        {/* Subtopic list with direct navigation */}
        {(popup.topic.subtopics?.length > 0) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Nunito, sans-serif' }}>
              Subtopics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {popup.topic.subtopics.map((sub) => {
                const subState = getSubtopicState(sub.id)
                return (
                  <div key={sub.id}
                    onClick={() => !subState.locked && (setPopup(null), router.push(`/learn/lesson/${sub.id}`))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: subState.done ? `${M.correctColor}0F`
                        : subState.isNext ? `${M.accentColor}0A`
                        : isNova ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      borderRadius: 11,
                      border: subState.done ? `1px solid ${M.correctColor}25`
                        : subState.isNext ? `1px solid ${M.accentColor}30` : '1px solid transparent',
                      cursor: subState.locked ? 'default' : 'pointer',
                      opacity: subState.locked ? 0.45 : 1,
                      transition: 'all 0.12s',
                    }}>
                    <span style={{ fontSize: 15 }}>
                      {subState.done ? '✅' : subState.locked ? '🔒' : subState.isNext ? '▶️' : '📖'}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.3 }}>
                      {sub.title}
                    </span>
                    {subState.isNext && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: M.accentColor, background: `${M.accentColor}15`, borderRadius: 20, padding: '2px 8px', fontFamily: 'Nunito, sans-serif' }}>
                        START
                      </span>
                    )}
                    {subState.done && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: M.correctColor, fontFamily: 'Nunito, sans-serif' }}>Done</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => { router.push(`/learn/topic/${popup.topic.id}`); setPopup(null) }}
          style={{ ...M.primaryBtn, width: '100%', display: 'block', fontSize: 15 }}>
          {isBlaze ? '⚡ START MISSION' : isNova ? '🚀 LAUNCH LESSON' : isRoots ? '🇳🇬 Start Lesson' : isSpark ? '✨ Let\'s Go!' : 'VIEW ALL SUBTOPICS →'}
        </button>
      </div>
    </>
  )

  // ── Root render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, sans-serif', background: M.mapBg, position: 'relative', overflow: 'hidden' }}>
      {HUD}

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'learn' && LearnTab}
        {activeTab === 'practice' && <div style={{ height: '100%', overflowY: 'auto' }}>{PracticeTab}</div>}
        {activeTab === 'challenge' && <div style={{ height: '100%', overflowY: 'auto' }}>{ChallengeTab}</div>}
        {activeTab === 'leaderboard' && <div style={{ height: '100%', overflowY: 'auto' }}>{LeaderboardTab}</div>}
        {activeTab === 'profile' && <div style={{ height: '100%', overflowY: 'auto' }}>{ProfileTab}</div>}
      </div>

      {BottomNav}
      {TopicPopup}

      <BottomSheet open={showModePicker} onClose={() => setShowModePicker(false)} M={M}>
        <ModePicker onClose={() => setShowModePicker(false)} />
      </BottomSheet>
    </div>
  )
}