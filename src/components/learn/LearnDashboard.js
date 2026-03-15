'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { MIBLogo, BicPencil } from '@/components/BiteMarkIcon'
import BottomSheet from '@/components/BottomSheet'
import ModePicker from '@/components/ModePicker'

function MathFloats({ M }) {
  const syms = M?.floatSyms || ['x²', '∑', 'π', '√', '∫', 'θ', '∞', '±', 'Δ']
  const color = M?.floatColor || 'rgba(0,0,0,0.035)'
  const font  = M?.floatFont  || "'Courier New',monospace"
  const pos   = [
    { x: 3, y: 10 }, { x: 88, y: 7  }, { x: 6, y: 72 },
    { x: 80, y: 55 }, { x: 44, y: 88 }, { x: 92, y: 38 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {syms.slice(0, 6).map((sym, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${pos[i % pos.length].x}%`,
          top: `${pos[i % pos.length].y}%`,
          fontSize: 14, fontWeight: 700, color, fontFamily: font,
          animation: `float${i % 4} ${10 + i}s ease-in-out ${i * 0.8}s infinite`,
          userSelect: 'none',
        }}>{sym}</div>
      ))}
    </div>
  )
}

function AnkaraStripe() {
  return (
    <div style={{
      height: 3,
      background: 'repeating-linear-gradient(90deg,#C0392B 0,#C0392B 8px,#E6B800 8px,#E6B800 16px,#1A1F6B 16px,#1A1F6B 24px,#2D6A4F 24px,#2D6A4F 32px)',
      animation: 'ankaraScroll 6s linear infinite',
    }} />
  )
}

function NovaStars() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[...Array(16)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 71 + 5) % 96}%`,
          top: `${(i * 43 + 3) % 92}%`,
          width: i % 7 === 0 ? 2.5 : 1,
          height: i % 7 === 0 ? 2.5 : 1,
          borderRadius: '50%', background: '#fff', opacity: 0.25,
          animation: `twinkle ${2 + (i % 3)}s ease-in-out ${(i * 0.2) % 2}s infinite`,
        }} />
      ))}
    </div>
  )
}

function getMonthLabel() {
  return new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

const CLASS_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']

function getTopicIcon(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('fraction'))                                                    return '½'
  if (t.includes('multipli') || t.includes('division'))                         return '×÷'
  if (t.includes('addition') || t.includes('subtract'))                         return '+-'
  if (t.includes('algebra')  || t.includes('equation'))                         return 'x='
  if (t.includes('binary')   || t.includes('base 2') || t.includes('number system')) return '01'
  if (t.includes('decimal'))                                                     return '0.1'
  if (t.includes('percentage') || t.includes('percent'))                        return '%'
  if (t.includes('ratio')    || t.includes('proportion'))                       return 'a:b'
  if (t.includes('geometry') || t.includes('shape') || t.includes('angle'))    return '△'
  if (t.includes('circle')   || t.includes('circumference'))                    return '○'
  if (t.includes('triangle') || t.includes('trigon'))                           return '△'
  if (t.includes('square')   || t.includes('rectangle') || t.includes('area')) return '□'
  if (t.includes('volume')   || t.includes('cube'))                             return '∛'
  if (t.includes('root')     || t.includes('surd'))                             return '√'
  if (t.includes('power')    || t.includes('exponent') || t.includes('index')) return 'xⁿ'
  if (t.includes('logarithm') || t.includes('log'))                             return 'log'
  if (t.includes('statistics') || t.includes('data') || t.includes('average') || t.includes('mean')) return '∑'
  if (t.includes('probability'))                                                 return 'P()'
  if (t.includes('sequence') || t.includes('series') || t.includes('pattern')) return 'nᵢ'
  if (t.includes('set')      || t.includes('venn'))                             return '∪∩'
  if (t.includes('matrix')   || t.includes('vector'))                           return '[]'
  if (t.includes('graph')    || t.includes('coordinate') || t.includes('linear') || t.includes('gradient')) return 'f(x)'
  if (t.includes('quadratic') || t.includes('parabola'))                        return 'x²'
  if (t.includes('rational') || t.includes('irrational'))                       return 'ℚ'
  if (t.includes('integer')  || t.includes('whole number'))                     return 'ℤ'
  if (t.includes('prime')    || t.includes('factor') || t.includes('hcf') || t.includes('lcm')) return '∏'
  if (t.includes('money')    || t.includes('profit') || t.includes('loss') || t.includes('interest')) return '₦'
  if (t.includes('time')     || t.includes('distance') || t.includes('speed')) return 'd/t'
  if (t.includes('mensuration') || t.includes('perimeter'))                     return 'P='
  if (t.includes('word problem') || t.includes('problem'))                      return '?='
  return '#'
}

export default function LearnDashboard({ student: initialStudent, level, progress }) {
  const router   = useRouter()
  const supabase = createClient()
  const { M, mode } = useMode()

  const [student,         setStudent]         = useState(initialStudent)
  const [progressData,    setProgressData]    = useState(progress)
  const [leaderboard,     setLeaderboard]     = useState([])
  const [leaderboardType, setLeaderboardType] = useState('class')
  const [activeTab,       setActiveTab]       = useState('learn')
  const [showModePicker,  setShowModePicker]  = useState(false)
  const [popup,           setPopup]           = useState(null)
  const [editName,        setEditName]        = useState(initialStudent?.display_name || '')
  const [editSchool,      setEditSchool]      = useState(initialStudent?.school || '')
  const [editClass,       setEditClass]       = useState(initialStudent?.class_level || '')
  const [saving,          setSaving]          = useState(false)
  const [saveMsg,         setSaveMsg]         = useState('')

  const scrollRef   = useRef(null)
  const sectionRefs = useRef({})

  const isNova  = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isSpark = mode === 'spark'
  const isRoots = mode === 'roots'

  const bodyColor   = isNova ? 'rgba(200,195,255,0.78)' : M.textSecondary
  const accent      = M.accentColor
  const termAccents = M.termAccents || ['#0d9488', '#f97316', '#8b5cf6']

  useEffect(() => {
    async function refreshAll() {
      if (!initialStudent?.id) return
      const [prog, stud] = await Promise.all([
        supabase.from('student_progress').select('*').eq('student_id', initialStudent.id),
        supabase.from('students').select('xp, monthly_xp, streak_days').eq('id', initialStudent.id).single(),
      ])
      if (prog.data) setProgressData(prog.data)
      if (stud.data) setStudent(s => ({ ...s, ...stud.data }))
    }
    refreshAll()
    window.addEventListener('focus', refreshAll)
    return () => window.removeEventListener('focus', refreshAll)
  }, [initialStudent?.id])

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const params = new URLSearchParams({ type: leaderboardType })
        if (leaderboardType === 'class'  && student?.class_level) params.set('class_level', student.class_level)
        if (leaderboardType === 'school' && student?.school)      params.set('school', student.school)
        const res = await fetch(`/api/leaderboard?${params}`)
        if (res.ok) setLeaderboard((await res.json()) || [])
      } catch (e) { console.error('[leaderboard]', e.message) }
    }
    if (activeTab === 'leaderboard' || (activeTab === 'learn' && leaderboard.length === 0)) fetchLeaderboard()
  }, [activeTab, leaderboardType, student?.class_level, student?.school])

  // ── Computed ──────────────────────────────────────────────────────────────
  const completedIds = new Set(progressData.filter(p => p.status === 'completed').map(p => p.subtopic_id))
  const xp        = student?.xp        || 0
  const monthlyXp = student?.monthly_xp || 0
  const streak    = student?.streak_days || 0

  const allSubtopics = (level?.terms || [])
    .sort((a, b) => a.term_number - b.term_number)
    .flatMap(t =>
      (t.units || []).flatMap(u =>
        (u.topics || []).flatMap(tp =>
          (tp.subtopics || []).map(s => ({ ...s, topicTitle: tp.title, termName: t.name }))
        )
      )
    )

  const nextLesson   = allSubtopics.find(s => !completedIds.has(s.id))
  const totalLessons = allSubtopics.length
  const doneLessons  = completedIds.size
  const overallPct   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0

  const myRank        = leaderboard.findIndex(e => e.id === student?.id)
  const myRankDisplay = myRank >= 0 ? `#${myRank + 1}` : '—'
  const nextUp        = myRank > 0 ? leaderboard[myRank - 1] : null
  const xpToNextRank  = nextUp ? Math.max(0, (nextUp.monthly_xp || 0) - monthlyXp) : 0

  const allTopics = (level?.terms || []).flatMap(t => (t.units || []).flatMap(u => u.topics || []))

  async function saveProfile() {
    if (!editName.trim()) return
    setSaving(true)
    const updates = { display_name: editName.trim(), school: editSchool.trim(), class_level: editClass }
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

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    fontFamily: 'Nunito, sans-serif',
    color: isNova ? '#F8F7FF' : '#1a1a1a',
    background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)',
    border: isBlaze ? '2px solid #0d0d0d' : isNova
      ? '1.5px solid rgba(165,180,252,0.2)'
      : `1.5px solid ${M.navBorder}`,
    borderRadius: isBlaze ? 8 : 12,
    outline: 'none', boxSizing: 'border-box', fontWeight: 500,
  }
  const selectStyle = { ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }

  // Computed hero gradient — assigned to a variable, not inline JSX
  const heroGradient = isBlaze
    ? 'linear-gradient(135deg,#FFD700,#FFA500)'
    : isNova
      ? 'linear-gradient(135deg,#1E1B4B,#2D1F6E)'
      : isSpark
        ? 'linear-gradient(135deg,#FF8C42,#F59E0B)'
        : isRoots
          ? 'linear-gradient(135deg,#C0392B,#8B1A1A)'
          : `linear-gradient(135deg,${accent},${M.accent2 || accent})`

  // ── HUD ───────────────────────────────────────────────────────────────────
  const HUD = (
    <div style={{
      flexShrink: 0, position: 'relative', zIndex: 20,
      background: M.hudBg, backdropFilter: 'blur(10px)',
      borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
    }}>
      {isRoots && <AnkaraStripe />}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MIBLogo size={30} theme={isNova ? 'dark' : 'light'} M={M} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {streak > 0 && (
            <div style={{
              background: isBlaze ? '#FFD700' : 'rgba(255,150,0,0.1)',
              border: isBlaze ? '1.5px solid #0d0d0d' : '1.5px solid rgba(255,150,0,0.3)',
              borderRadius: 20, padding: '4px 10px',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#FF9500', fontFamily: 'Nunito, sans-serif' }}>{streak}</span>
            </div>
          )}
          <div style={{
            background: M.badgeBg, border: `1.5px solid ${M.badgeBorder}`,
            borderRadius: isBlaze ? 8 : 20, padding: '4px 11px',
            display: 'flex', gap: 4, alignItems: 'center',
            boxShadow: isBlaze ? `2px 2px 0 ${M.badgeBorder}` : 'none',
          }}>
            <span style={{ fontSize: 12 }}>⚡</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: M.badgeText, fontFamily: 'Nunito, sans-serif' }}>{xp} XP</span>
          </div>
          <button
            onClick={() => setShowModePicker(true)}
            style={{
              background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)'
                : isNova   ? 'linear-gradient(135deg,#7C3AED,#4C1D95)'
                : isSpark  ? 'linear-gradient(135deg,#FF8C42,#F59E0B)'
                : isRoots  ? 'linear-gradient(135deg,#C0392B,#8B1A1A)'
                : `linear-gradient(135deg,${accent},${M.accent2 || accent})`,
              border: isBlaze ? '2px solid #0d0d0d' : 'none',
              borderRadius: isBlaze ? 8 : 20,
              padding: '4px 10px 4px 8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : '0 2px 10px rgba(0,0,0,0.18)',
              color: '#fff', fontFamily: 'Nunito, sans-serif', fontWeight: 800,
            }}>
            <span style={{ fontSize: 13 }}>{M.emoji}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>Mode</span>
          </button>
        </div>
      </div>
    </div>
  )

  // ── Bottom Nav ────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'learn',       icon: '📚', label: 'Learn'     },
    { id: 'practice',    icon: '✏️', label: 'Practice'  },
    { id: 'challenge',   icon: '⚡', label: 'Challenge' },
    { id: 'leaderboard', icon: '🏆', label: 'Leaders'   },
    { id: 'profile',     icon: '👤', label: 'Profile'   },
  ]

  const BottomNav = (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: M.navBg,
      borderTop: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
      display: 'flex', justifyContent: 'space-around',
      padding: '5px 0 max(10px, env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    }}>
      {TABS.map(t => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
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
  // LEARN TAB
  // ══════════════════════════════════════════════════════════════════════════
  const LearnTab = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {isNova ? <NovaStars /> : <MathFloats M={M} />}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* 1. PROGRESS HEADER — avatar row + hero % + taller bar + separated chips + scallop */}
        <div style={{ background: heroGradient, paddingTop: 18, paddingBottom: 0, paddingLeft: 20, paddingRight: 20 }}>
          {isRoots && <AnkaraStripe />}
          <div style={{ maxWidth: 520, margin: '0 auto' }}>

            {/* Avatar row: initial + greeting + streak pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isBlaze ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)',
                border: isBlaze ? '2px solid rgba(0,0,0,0.2)' : '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 900,
                color: isBlaze ? '#0d0d0d' : '#fff',
                fontFamily: 'Nunito, sans-serif',
              }}>
                {student?.display_name?.[0]?.toUpperCase() || '🧑🏾'}
              </div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>
                {student?.display_name ? `Hey, ${student.display_name.split(' ')[0]}! 👋` : 'Welcome back! 👋'}
              </div>
              {streak > 0 && (
                <div style={{
                  background: isBlaze ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                  border: isBlaze ? '1.5px solid rgba(0,0,0,0.15)' : '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: 20, padding: '4px 10px',
                  display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13 }}>🔥</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif' }}>{streak}</span>
                </div>
              )}
            </div>

            {/* Progress label row: small label left, BIG % right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isBlaze ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.3 }}>
                {doneLessons === 0
                  ? 'Start your journey'
                  : doneLessons === totalLessons
                    ? 'All done! 🏁'
                    : `${doneLessons} of ${totalLessons} done`}
              </div>
              {/* Hero number — large and bold */}
              <div style={{ fontSize: 28, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
                {overallPct}%
              </div>
            </div>

            {/* Taller progress bar — 10px, more visible */}
            <div style={{ height: 10, background: isBlaze ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.22)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${overallPct}%`, height: '100%', background: isBlaze ? '#0d0d0d' : 'rgba(255,255,255,0.95)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>

            {/* Stat chips — separated with gap, not fused into one block */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 0, paddingBottom: 16 }}>
              {[
                { value: String(xp), label: 'XP' },
                { value: myRankDisplay, label: 'Rank' },
                { value: student?.class_level || '—', label: 'Class' },
              ].map((chip, idx) => (
                <div key={idx} style={{
                  flex: 1, textAlign: 'center',
                  background: isBlaze ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                  border: isBlaze ? '1.5px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12, padding: '8px 6px',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1.1, marginBottom: 3 }}>{chip.value}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: isBlaze ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Nunito, sans-serif' }}>{chip.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scalloped bottom edge — page bg peeks through, creates a clean content break */}
          <div style={{
            height: 20, marginLeft: -20, marginRight: -20,
            background: M.mapBg || '#F8F9FF',
            borderRadius: '18px 18px 0 0',
          }} />
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 18px 0' }}>

          {/* 2. CONTINUE LEARNING — no redundant label, depth via glow + icon shadow + pressable Go */}
          {nextLesson && (
            <div style={{ marginBottom: 14 }}>
              <button
                onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.14)' : `${accent}0E`,
                  border: isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}40`,
                  borderRadius: isBlaze ? 10 : 20,
                  padding: '18px 18px',
                  boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 24px ${accent}22`,
                  display: 'flex', alignItems: 'center', gap: 14,
                  fontFamily: 'Nunito, sans-serif',
                }}>
                {/* Decorative glow in top-right corner */}
                {!isBlaze && (
                  <div style={{
                    position: 'absolute', right: -24, top: -24,
                    width: 90, height: 90, borderRadius: '50%',
                    background: `${accent}12`, pointerEvents: 'none',
                  }} />
                )}
                {/* Play icon with colour shadow */}
                <div style={{
                  width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                  background: isBlaze ? 'rgba(0,0,0,0.1)' : accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: isBlaze ? '2px solid rgba(0,0,0,0.12)' : 'none',
                  boxShadow: isBlaze ? 'none' : `0 4px 14px ${accent}55`,
                  position: 'relative', zIndex: 1,
                }}>
                  <span style={{ color: isBlaze ? '#0d0d0d' : '#fff', fontSize: 18, marginLeft: 3 }}>▶</span>
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isBlaze ? '#555' : bodyColor, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>
                    {nextLesson.topicTitle}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, lineHeight: 1.3, fontFamily: 'Nunito, sans-serif' }}>
                    {nextLesson.title}
                  </div>
                </div>
                {/* Go button — pressable shadow makes it feel tappable */}
                <div style={{
                  fontSize: 12, fontWeight: 900,
                  color: isBlaze ? '#0d0d0d' : '#fff',
                  background: isBlaze ? '#0d0d0d' : accent,
                  borderRadius: isBlaze ? 6 : 20, padding: '8px 16px', flexShrink: 0,
                  fontFamily: 'Nunito, sans-serif',
                  boxShadow: isBlaze ? '2px 2px 0 rgba(0,0,0,0.15)' : `0 3px 10px ${accent}55`,
                  position: 'relative', zIndex: 1,
                }}>
                  Go →
                </div>
              </button>
            </div>
          )}

          {/* 3+4. RANK PREVIEW + CHALLENGE — 2-column grid, compact, saves vertical space */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>

            {/* Rank card — always shown (shows "—" when not yet ranked) */}
            <button
              onClick={() => setActiveTab('leaderboard')}
              style={{
                flex: 1, textAlign: 'left', cursor: 'pointer',
                background: M.cardBg, border: M.cardBorder,
                borderRadius: isBlaze ? 10 : 16,
                boxShadow: M.cardShadow,
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'Nunito, sans-serif',
              }}>
              <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
                {myRank === 0 ? '🥇' : myRank === 1 ? '🥈' : myRank === 2 ? '🥉' : '🏆'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}>
                  {myRankDisplay}
                </div>
                <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>
                  {xpToNextRank > 0 ? `+${xpToNextRank} XP to move up` : myRank === 0 ? 'Top of class! 👑' : 'Complete a lesson'}
                </div>
              </div>
            </button>

            {/* Challenge card — BONUS badge floats above card top edge */}
            <button
              onClick={() => router.push('/learn/challenge?mode=daily')}
              style={{
                flex: 1, textAlign: 'left', cursor: 'pointer', position: 'relative',
                background: isBlaze ? '#111' : 'rgba(255,200,0,0.08)',
                border: isBlaze ? '2px solid #0d0d0d' : '1.5px solid rgba(255,200,0,0.32)',
                borderRadius: isBlaze ? 10 : 16,
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'Nunito, sans-serif',
                boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : 'none',
              }}>
              {/* Floating BONUS badge above card */}
              <div style={{
                position: 'absolute', top: -9, right: 10,
                background: '#FFC933', color: '#0d0d0d',
                fontSize: 8, fontWeight: 900,
                borderRadius: 20, padding: '2px 8px',
                letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif',
              }}>
                BONUS
              </div>
              <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: isBlaze ? '#FFD700' : isNova ? '#FFC933' : '#A06600', fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}>
                  Challenge
                </div>
                <div style={{ fontSize: 10, color: isBlaze ? 'rgba(255,255,255,0.5)' : bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>
                  +50 XP today
                </div>
              </div>
            </button>
          </div>

        </div>

        {/* No content */}
        {!level?.terms?.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BicPencil pose="think" size={100} style={{ display: 'inline-block', marginBottom: 18 }} />
            <p style={{ fontWeight: 800, fontSize: 18, color: M.textPrimary, fontFamily: M.headingFont }}>Content coming soon!</p>
            <p style={{ fontSize: 13, marginTop: 6, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
              We&apos;re preparing lessons for {student?.class_level}.
            </p>
          </div>
        )}

        {/* Lesson list */}
        {[...(level?.terms || [])].sort((a, b) => a.term_number - b.term_number).map((term, termIdx) => {
          const tAccent  = termAccents[termIdx % termAccents.length]
          const termSubs = (term.units || []).flatMap(u => (u.topics || []).flatMap(t => t.subtopics || []))
          const termDone = termSubs.length > 0 && termSubs.every(s => completedIds.has(s.id))
          const termProg = termSubs.filter(s => completedIds.has(s.id)).length

          return (
            <div key={term.id} style={{ marginBottom: 32 }} ref={el => { sectionRefs.current[term.name] = el }}>

              {/* Term header — pill label, divider, count inline, progress bar under name */}
              <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 18px 16px' }}>
                {/* Row 1: pill + divider line + count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: tAccent,
                    background: `${tAccent}14`, border: `1px solid ${tAccent}30`,
                    borderRadius: 20, padding: '3px 11px',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: 'Nunito, sans-serif', flexShrink: 0,
                  }}>
                    Term {termIdx + 1}
                  </div>
                  <div style={{ flex: 1, height: 1, background: `${tAccent}20` }} />
                  {termDone && <span style={{ fontSize: 14, flexShrink: 0 }}>🏆</span>}
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: tAccent,
                    fontFamily: 'Nunito, sans-serif', flexShrink: 0,
                  }}>
                    {termProg}/{termSubs.length}
                  </div>
                </div>
                {/* Row 2: term name */}
                <div style={{ fontSize: 17, fontWeight: 800, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.15, marginBottom: 8 }}>
                  {term.name}
                </div>
                {/* Row 3: term-level progress bar — clearly belongs to this term */}
                <div style={{ height: 4, background: `${tAccent}18`, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${termSubs.length > 0 ? Math.round((termProg / termSubs.length) * 100) : 0}%`,
                    height: '100%', background: tAccent, borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Topic cards — clean vertical list, no zigzag */}
              <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(term.units || []).flatMap((unit, unitIdx) =>
                  (unit.topics || []).map((topic, topicIdx) => {
                    const topicSubs  = topic.subtopics || []
                    const doneCount  = topicSubs.filter(s => completedIds.has(s.id)).length
                    const allDone    = topicSubs.length > 0 && doneCount === topicSubs.length
                    const inProgress = doneCount > 0 && !allDone
                    const isNext     = !allDone && !inProgress && topicSubs.some(s => s.id === nextLesson?.id)
                    const topicIcon  = getTopicIcon(topic.title)
                    const pct        = topicSubs.length > 0 ? Math.round((doneCount / topicSubs.length) * 100) : 0

                    // Find the unit for this topic to pass to popup
                    const parentUnit = unit

                    return (
                      <button
                        key={topic.id}
                        onClick={() => setPopup({ topic, term, unit: parentUnit })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%',
                          background: allDone
                            ? `${M.correctColor}06`
                            : (inProgress || isNext)
                              ? (isBlaze ? '#FFF9D6' : isNova ? 'rgba(124,58,237,0.09)' : `${tAccent}09`)
                              : M.cardBg,
                          border: allDone
                            ? `1.5px solid ${M.correctColor}28`
                            : (inProgress || isNext)
                              ? `1.5px solid ${tAccent}45`
                              : M.cardBorder,
                          borderRadius: isBlaze ? 10 : 16,
                          boxShadow: (inProgress || isNext) ? (isBlaze ? '3px 3px 0 #0d0d0d' : `0 2px 14px ${tAccent}18`) : 'none',
                          fontFamily: 'Nunito, sans-serif', transition: 'all 0.12s',
                        }}>
                        {/* Icon — rounded square, not circle */}
                        <div style={{
                          width: 44, height: 44,
                          borderRadius: isBlaze ? 8 : 12,
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: allDone
                            ? `${M.correctColor}15`
                            : (inProgress || isNext) ? `${tAccent}18` : isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                          border: allDone
                            ? `1.5px solid ${M.correctColor}30`
                            : (inProgress || isNext) ? `1.5px solid ${tAccent}40` : `1.5px solid ${isNova ? 'rgba(255,255,255,0.1)' : '#eee'}`,
                        }}>
                          {allDone
                            ? <span style={{ fontSize: 18, color: M.correctColor }}>✓</span>
                            : <span style={{ fontFamily: 'monospace', fontSize: topicIcon.length > 2 ? 10 : 14, fontWeight: 900, color: (inProgress || isNext) ? tAccent : M.textSecondary }}>{topicIcon}</span>
                          }
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: M.textPrimary, lineHeight: 1.35, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>
                            {topic.title}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
                            {allDone && <span style={{ color: M.correctColor, fontWeight: 800 }}>✓ Complete</span>}
                            {inProgress && <span style={{ color: tAccent, fontWeight: 800 }}>→ Continue</span>}
                            {isNext && !inProgress && !allDone && <span style={{ color: tAccent, fontWeight: 800 }}>▶ Up next</span>}
                            {!allDone && !inProgress && !isNext && <span style={{ color: bodyColor }}>Tap to start</span>}
                          </div>
                          {/* Mini inline progress bar — only for in-progress topics */}
                          {inProgress && (
                            <div style={{ marginTop: 7, height: 3, background: `${tAccent}20`, borderRadius: 99, overflow: 'hidden', width: '80%' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: tAccent, borderRadius: 99, transition: 'width 0.4s ease' }} />
                            </div>
                          )}
                        </div>
                        {/* Badge */}
                        <div style={{
                          fontSize: 10, fontWeight: 800, flexShrink: 0,
                          color: allDone ? M.correctColor : (isBlaze ? '#0d0d0d' : tAccent),
                          border: isBlaze ? '1px solid #0d0d0d' : `1px solid ${allDone ? M.correctColor : tAccent}35`,
                          borderRadius: 20, padding: '3px 9px',
                          background: allDone ? `${M.correctColor}12` : (isBlaze ? '#FFD700' : `${tAccent}10`),
                          fontFamily: 'Nunito, sans-serif',
                        }}>
                          {doneCount}/{topicSubs.length}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Term complete */}
              {termDone && (
                <div style={{ maxWidth: 520, margin: '16px auto 0', padding: '0 18px' }}>
                  <div style={{
                    textAlign: 'center', padding: '13px',
                    background: isBlaze ? '#FFD700' : `${tAccent}10`,
                    borderRadius: isBlaze ? 8 : 14,
                    border: isBlaze ? '2px solid #0d0d0d' : `1px solid ${tAccent}20`,
                  }}>
                    <span style={{ fontSize: 20 }}>{M.chestDone}</span>
                    <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: isBlaze ? '#0d0d0d' : tAccent, marginLeft: 8 }}>
                      {isBlaze ? 'TERM COMPLETE!' : 'Term Complete! 🎉'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div style={{ textAlign: 'center', padding: '12px 0 120px' }}>
          <div style={{ color: isNova ? 'rgba(165,180,252,0.3)' : '#d0d0d0', fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            {M.endText || '— end of curriculum —'}
          </div>
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // PRACTICE TAB
  // ══════════════════════════════════════════════════════════════════════════
  const PracticeTab = (
    <div style={{ padding: '20px 18px 120px', maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 800, color: M.textPrimary, marginBottom: 4 }}>✏️ Practice</h2>
      <p style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.5, marginBottom: 18 }}>
        {isRoots ? 'Practise your maths — no lesson needed, just go!' : isBlaze ? 'DRILL YOUR SKILLS. NO EXCUSES.' : 'Jump into any topic — no need to finish the lesson first!'}
      </p>

      <button
        onClick={() => router.push('/learn/practice')}
        style={{
          width: '100%', marginBottom: 16, padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
          borderRadius: isBlaze ? 10 : 18,
          background: isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(76,29,149,0.2))' : `linear-gradient(135deg,${accent}22,${M.accent2 || accent}10)`,
          border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}40`,
          boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow,
          display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Nunito, sans-serif',
        }}>
        <div style={{ width: 50, height: 50, borderRadius: isBlaze ? 10 : '50%', flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.08)' : `${accent}20`, border: isBlaze ? '2px solid rgba(0,0,0,0.15)' : `2px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎲</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, marginBottom: 3 }}>
            {isBlaze ? 'MIXED DRILL' : 'Mixed Practice'}
          </div>
          <div style={{ fontSize: 11, color: isBlaze ? '#444' : bodyColor, fontWeight: 500 }}>
            Questions from all {student?.class_level || ''} topics · shuffled
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', background: isBlaze ? '#0d0d0d' : accent, borderRadius: isBlaze ? 6 : 20, padding: '5px 12px', fontFamily: 'Nunito, sans-serif' }}>GO →</div>
      </button>

      <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>By Topic</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allTopics.map(topic => {
          const subs     = topic.subtopics || []
          const doneCount = subs.filter(s => completedIds.has(s.id)).length
          const hasDone  = doneCount > 0
          return (
            <button
              key={topic.id}
              onClick={() => router.push(`/learn/practice?topicId=${topic.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: M.cardBg, border: hasDone ? `1.5px solid ${accent}28` : M.cardBorder, borderRadius: M.cardRadius, boxShadow: M.cardShadow, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Nunito, sans-serif' }}>
              <div style={{ width: 38, height: 38, borderRadius: isBlaze ? '30%' : '50%', flexShrink: 0, background: hasDone ? `${accent}18` : 'rgba(0,0,0,0.04)', border: hasDone ? `1.5px solid ${accent}30` : '1.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {hasDone ? '✏️' : '📖'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary, marginBottom: 2 }}>{topic.title}</div>
                <div style={{ fontSize: 10, color: bodyColor, fontWeight: 500 }}>
                  {hasDone
                    ? <span style={{ color: M.correctColor }}>✓ {doneCount}/{subs.length} done</span>
                    : `${subs.length} subtopic${subs.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: hasDone ? accent : M.textSecondary, background: hasDone ? `${accent}12` : 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '3px 9px' }}>Practice</span>
            </button>
          )
        })}
        {allTopics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <BicPencil pose="think" size={90} style={{ display: 'inline-block', marginBottom: 16 }} />
            <p style={{ fontFamily: M.headingFont, fontSize: 16, fontWeight: 800, color: M.textPrimary, marginBottom: 6 }}>No content yet!</p>
            <p style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>Content for {student?.class_level} is on the way.</p>
          </div>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // CHALLENGE TAB
  // ══════════════════════════════════════════════════════════════════════════
  // FIX: moved challenge button label to a variable to avoid mixed-quote ternary in JSX children
  const challengeLabel = isBlaze
    ? '⚡ ACCEPT CHALLENGE'
    : isSpark
      ? '✨ Start Today\'s Challenge!'
      : isRoots
        ? '🇳🇬 Take Today\'s Challenge'
        : 'Start Daily Challenge →'

  const ChallengeTab = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '32px 20px 120px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ animation: 'float 2.5s ease-in-out infinite', marginBottom: 20 }}>
        <BicPencil pose="celebrate" size={110} />
      </div>
      <div style={{ fontFamily: M.headingFont, fontSize: 26, fontWeight: 900, color: M.textPrimary, textAlign: 'center', marginBottom: 8, lineHeight: 1.2 }}>
        🏆 Daily Challenge
      </div>
      <div style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.7, textAlign: 'center', maxWidth: 300, marginBottom: 28 }}>
        {isRoots
          ? '5 questions every day. Get all correct — collect 50 XP and climb the leaderboard! 🇳🇬'
          : isBlaze
            ? '5 QUESTIONS. TIMED. NO HINTS. ALL CORRECT = 50 XP.'
            : '5 personalised questions every day. Get them all right to earn 50 XP!'}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {[
          { icon: '⚡', label: '5 questions', color: accent },
          { icon: '⏱', label: '30s per Q',   color: '#FFC933' },
          { icon: '🏆', label: '+50 XP bonus', color: M.correctColor },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 12px', textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color, fontFamily: 'Nunito, sans-serif', lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push('/learn/challenge?mode=daily')}
        style={{ ...M.primaryBtn, fontSize: 16, padding: '16px 40px', width: '100%', maxWidth: 300 }}>
        {challengeLabel}
      </button>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // LEADERBOARD TAB
  // ══════════════════════════════════════════════════════════════════════════
  const LB_TABS = [
    { id: 'class',   label: student?.class_level || 'My Class' },
    { id: 'school',  label: '🏫 School' },
    { id: 'overall', label: '🌍 All' },
  ]

  const LeaderboardTab = (
    <div style={{ padding: '20px 18px 120px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 800, color: M.textPrimary, marginBottom: 2 }}>👑 Leaderboard</h2>
          <p style={{ fontSize: 11, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>{getMonthLabel()} · resets monthly</p>
        </div>
        <div style={{ background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.15)' : `${accent}12`, border: isBlaze ? '2px solid #0d0d0d' : `1px solid ${accent}30`, borderRadius: isBlaze ? 8 : 20, padding: '6px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: 'Nunito, sans-serif' }}>{monthlyXp}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: isBlaze ? '#444' : M.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif' }}>Your XP</div>
        </div>
      </div>

      <div style={{ display: 'flex', background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: isBlaze ? 8 : 12, padding: 3, gap: 3, marginBottom: 16, border: isBlaze ? '2px solid #ccc' : 'none' }}>
        {LB_TABS.map(t => (
          <div
            key={t.id}
            onClick={() => setLeaderboardType(t.id)}
            style={{
              flex: 1, textAlign: 'center', padding: '7px 4px',
              borderRadius: isBlaze ? 6 : 9, cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 800, transition: 'all 0.15s',
              background: leaderboardType === t.id ? (isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,#7C3AED,#4C1D95)' : accent) : 'transparent',
              color: leaderboardType === t.id ? (isBlaze ? '#0d0d0d' : '#fff') : M.textSecondary,
            }}>
            {t.label}
          </div>
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
          const isMe  = entry.id === student?.id
          const xpVal = entry.monthly_xp || 0
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                background: isMe ? (isNova ? 'rgba(124,58,237,0.12)' : `${accent}08`) : 'transparent',
                borderLeft: `3px solid ${isMe ? accent : 'transparent'}`,
                borderBottom: `1px solid ${isNova ? 'rgba(255,255,255,0.05)' : '#f2f2f2'}`,
              }}>
              <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: M.textSecondary }}>#{idx + 1}</span>
                )}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${accent}22`, border: `1.5px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: accent, flexShrink: 0 }}>
                {entry.display_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: isNova ? '#F8F7FF' : M.textPrimary, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Nunito, sans-serif' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.display_name}</span>
                  {isMe && <span style={{ fontSize: 9, fontWeight: 900, color: accent, flexShrink: 0, background: `${accent}18`, borderRadius: 20, padding: '1px 6px' }}>YOU</span>}
                </p>
                <p style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
                  {entry.class_level}{entry.school ? ` · ${entry.school}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif', fontSize: 15 }}>{xpVal}</div>
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
  // PROFILE TAB
  // ══════════════════════════════════════════════════════════════════════════
  const heroBg = isNova   ? 'linear-gradient(160deg,#1E1B4B,#0F0C29)'
    : isSpark  ? 'linear-gradient(160deg,#FF8C42,#FFD93D)'
    : isRoots  ? 'linear-gradient(160deg,#C0392B,#8B1A1A)'
    : isBlaze  ? 'linear-gradient(160deg,#E63946,#1D3557)'
    : `linear-gradient(160deg,${accent},${M.accent2 || accent})`

  const ProfileTab = (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ background: heroBg, padding: '28px 20px 24px', position: 'relative' }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.2)', fontSize: 40, border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
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
                { v: String(xp),          label: 'Total XP', color: '#FFD700' },
                { v: String(monthlyXp),   label: 'Monthly',  color: '#fff' },
                { v: `${streak}🔥`,       label: 'Streak',   color: '#fff' },
                { v: String(completedIds.size), label: 'Done', color: '#fff' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: stat.color, fontFamily: 'Nunito, sans-serif' }}>{stat.v}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: M.cardBg, border: M.cardBorder, borderRadius: M.cardRadius, padding: '18px 16px', boxShadow: M.cardShadow }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 14 }}>
            My Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>Display Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>Class</label>
              <div style={{ position: 'relative' }}>
                <select value={editClass} onChange={e => setEditClass(e.target.value)} style={selectStyle}>
                  <option value="">Select class...</option>
                  {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: M.textSecondary }}>▾</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>School</label>
              <input value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="Your school name" style={inputStyle} />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              style={{ ...M.primaryBtn, width: '100%', marginTop: 4, opacity: saving ? 0.7 : 1, fontSize: 14 }}>
              {saving ? 'Saving...' : saveMsg || 'Save Changes'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowModePicker(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
            borderRadius: isBlaze ? 10 : 18, cursor: 'pointer', textAlign: 'left', width: '100%',
            background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)'
              : isNova   ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(76,29,149,0.15))'
              : isSpark  ? 'linear-gradient(135deg,rgba(255,140,66,0.18),rgba(255,217,61,0.12))'
              : isRoots  ? 'linear-gradient(135deg,rgba(192,57,43,0.15),rgba(46,106,79,0.1))'
              : `linear-gradient(135deg,${accent}1A,${M.accent2 || accent}0D)`,
            border: isBlaze ? '2px solid #0d0d0d'
              : isNova   ? '1px solid rgba(124,58,237,0.4)'
              : isSpark  ? '1px solid rgba(255,140,66,0.35)'
              : isRoots  ? '1px solid rgba(192,57,43,0.35)'
              : `1.5px solid ${accent}35`,
            boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow,
            fontFamily: 'Nunito, sans-serif',
          }}>
          <div style={{ width: 54, height: 54, borderRadius: isBlaze ? 12 : '50%', flexShrink: 0, background: isBlaze ? '#fff' : isNova ? 'rgba(124,58,237,0.2)' : isSpark ? 'rgba(255,140,66,0.2)' : isRoots ? 'rgba(192,57,43,0.2)' : `${accent}18`, border: isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>
            {M.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 3 }}>{M.name}</div>
            <div style={{ fontSize: 11, color: isBlaze ? '#555' : bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.4 }}>
              {M.tagline || 'Tap to change learning style'}
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#fff', background: isBlaze ? '#0d0d0d' : isNova ? '#7C3AED' : isSpark ? '#FF8C42' : isRoots ? '#C0392B' : accent, borderRadius: isBlaze ? 6 : 20, padding: '4px 11px', fontFamily: 'Nunito, sans-serif', flexShrink: 0, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>
            CHANGE
          </div>
        </button>

        <button
          onClick={handleSignOut}
          style={{ width: '100%', padding: '13px', cursor: 'pointer', background: 'transparent', border: isBlaze ? '2px solid #ef4444' : '1.5px solid #fecaca', borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ef4444', boxShadow: isBlaze ? '2px 2px 0 #ef4444' : 'none' }}>
          Sign Out
        </button>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // TOPIC POPUP
  // ══════════════════════════════════════════════════════════════════════════
  const TopicPopup = popup && (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={() => setPopup(null)}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520, zIndex: 50,
        background: isNova ? '#1A1740' : M.cardBg,
        borderRadius: isBlaze ? '12px 12px 0 0' : '24px 24px 0 0',
        padding: '0 20px 40px',
        boxShadow: '0 -10px 60px rgba(0,0,0,0.2)',
        border: isBlaze ? '2px solid #0d0d0d' : 'none',
        animation: 'sheetUp 0.3s cubic-bezier(0.34,1.1,0.64,1)',
        fontFamily: 'Nunito, sans-serif',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 10 }}>
          <div style={{ width: 44, height: 4, borderRadius: 2, background: isNova ? 'rgba(255,255,255,0.12)' : '#e0e0e0' }} />
        </div>
        <div style={{ height: 3, borderRadius: 3, marginBottom: 16, background: `linear-gradient(90deg,${accent},${M.accent2 || accent})` }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.textSecondary, marginBottom: 4 }}>
              {popup.term.name}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isNova ? '#F8F7FF' : M.textPrimary, lineHeight: 1.2 }}>
              {popup.topic.title}
            </div>
          </div>
          <BicPencil pose="celebrate" size={56} style={{ flexShrink: 0, marginTop: -6 }} />
        </div>

        <div style={{ fontSize: 12, color: bodyColor, marginBottom: 16, lineHeight: 1.6, fontWeight: 500 }}>
          {isRoots ? 'Complete this lesson — e go sweet! 🇳🇬' : isBlaze ? 'COMPLETE THIS MISSION! ⚡' : isNova ? 'Unlock this to go further. 🌌' : 'Complete this lesson to level up!'}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            ['⭐', '10 XP',          accent],
            ['📘', `${popup.topic.subtopics?.length || '?'} parts`, M.accent2 || accent],
            ['✏️', 'Practice',       M.correctColor],
          ].map(([ic, txt, clr], i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', background: `${clr}10`, borderRadius: isBlaze ? 7 : 12, padding: '10px 4px', border: isBlaze ? `2px solid ${clr}` : `1.5px solid ${clr}28` }}>
              <div style={{ fontSize: 17, marginBottom: 2 }}>{ic}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: clr }}>{txt}</div>
            </div>
          ))}
        </div>

        {popup.topic.subtopics?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Subtopics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {popup.topic.subtopics.map(sub => {
                const isDone = completedIds.has(sub.id)
                return (
                  <div
                    key={sub.id}
                    onClick={() => { setPopup(null); router.push(`/learn/lesson/${sub.id}`) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: isDone ? `${M.correctColor}0F` : isNova ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderRadius: 12, border: isDone ? `1px solid ${M.correctColor}25` : `1px solid ${accent}18`, cursor: 'pointer', transition: 'all 0.12s' }}>
                    <span style={{ fontSize: 16 }}>{isDone ? '✅' : '▶️'}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: isNova ? '#F8F7FF' : M.textPrimary, lineHeight: 1.3 }}>{sub.title}</span>
                    {isDone
                      ? <span style={{ fontSize: 10, fontWeight: 700, color: M.correctColor }}>Done ✓</span>
                      : <span style={{ fontSize: 10, fontWeight: 800, color: accent, background: `${accent}15`, borderRadius: 20, padding: '3px 10px' }}>Go →</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(() => {
          const subs      = popup.topic.subtopics || []
          const allDone   = subs.length > 0 && subs.every(s => completedIds.has(s.id))
          const firstLeft = subs.find(s => !completedIds.has(s.id))
          const targetId  = firstLeft?.id || subs[0]?.id
          const btnLabel  = allDone
            ? '↩ Replay'
            : (firstLeft && subs.some(s => completedIds.has(s.id)))
              ? '→ Continue'
              : (isBlaze ? '⚡ START MISSION' : '▶ Start Lesson')
          return (
            <button
              onClick={() => { if (targetId) { router.push(`/learn/lesson/${targetId}`); setPopup(null) } }}
              style={{ ...M.primaryBtn, width: '100%', fontSize: 15 }}>
              {btnLabel}
            </button>
          )
        })()}
      </div>
    </>
  )

  // ── Root ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, sans-serif', background: M.mapBg, position: 'relative', overflow: 'hidden' }}>
      {HUD}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'learn'       && LearnTab}
        {activeTab === 'practice'    && <div style={{ height: '100%', overflowY: 'auto' }}>{PracticeTab}</div>}
        {activeTab === 'challenge'   && <div style={{ height: '100%', overflowY: 'auto' }}>{ChallengeTab}</div>}
        {activeTab === 'leaderboard' && <div style={{ height: '100%', overflowY: 'auto' }}>{LeaderboardTab}</div>}
        {activeTab === 'profile'     && <div style={{ height: '100%', overflowY: 'auto' }}>{ProfileTab}</div>}
      </div>
      {BottomNav}
      {TopicPopup}
      <BottomSheet open={showModePicker} onClose={() => setShowModePicker(false)} M={M}>
        <ModePicker onClose={() => setShowModePicker(false)} />
      </BottomSheet>
    </div>
  )
}