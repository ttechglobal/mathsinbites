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
  // ── Leaderboard: all 3 boards pre-fetched in parallel for instant switching ──
  const [boards,          setBoards]          = useState({ class: [], school: [], overall: [] })
  const [leaderboardType, setLeaderboardType] = useState('class')
  const [boardsLoaded,    setBoardsLoaded]    = useState(false)
  // Rotating rank display: cycles class → school → overall every 3s
  const [rankFaceIdx,     setRankFaceIdx]     = useState(0)
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

  // Pre-fetch all 3 leaderboards in one go as soon as we have student data.
  // After that, tab switching is instant — no per-tab loading delay.
  useEffect(() => {
    if (!student?.id) return
    async function fetchAll() {
      try {
        const classParams   = new URLSearchParams({ type: 'class' })
        const schoolParams  = new URLSearchParams({ type: 'school' })
        const overallParams = new URLSearchParams({ type: 'overall' })
        if (student.class_level) classParams.set('class_level', student.class_level)
        if (student.school)      schoolParams.set('school', student.school)

        const [classRes, schoolRes, overallRes] = await Promise.all([
          fetch(`/api/leaderboard?${classParams}`),
          fetch(`/api/leaderboard?${schoolParams}`),
          fetch(`/api/leaderboard?${overallParams}`),
        ])
        const [classData, schoolData, overallData] = await Promise.all([
          classRes.ok   ? classRes.json()   : [],
          schoolRes.ok  ? schoolRes.json()  : [],
          overallRes.ok ? overallRes.json() : [],
        ])
        setBoards({ class: classData || [], school: schoolData || [], overall: overallData || [] })
        setBoardsLoaded(true)
      } catch (e) { console.error('[leaderboard] fetch:', e.message) }
    }
    fetchAll()
  }, [student?.id, student?.class_level, student?.school])

  // Rotate rank display: class → school → overall, every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => setRankFaceIdx(i => (i + 1) % 3), 3000)
    return () => clearInterval(timer)
  }, [])

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

  // Active board for the Leaderboard tab
  const leaderboard   = boards[leaderboardType] || []

  // Rank in each dimension (0-indexed, -1 = not found)
  const myClassRank   = boards.class.findIndex(e => e.id === student?.id)
  const mySchoolRank  = boards.school.findIndex(e => e.id === student?.id)
  const myOverallRank = boards.overall.findIndex(e => e.id === student?.id)

  // Active rank for tab display
  const myRank        = leaderboard.findIndex(e => e.id === student?.id)
  const myRankDisplay = myRank >= 0 ? `#${myRank + 1}` : '—'
  const nextUp        = myRank > 0 ? leaderboard[myRank - 1] : null
  const xpToNextRank  = nextUp ? Math.max(0, (nextUp.monthly_xp || 0) - monthlyXp) : 0

  // Rotating rank faces for hero + mini-card
  const rankFaces = [
    { rank: myClassRank,   label: 'Class',   emoji: myClassRank === 0 ? '🥇' : myClassRank === 1 ? '🥈' : myClassRank === 2 ? '🥉' : '🏅', display: myClassRank >= 0 ? `#${myClassRank + 1}` : '—' },
    { rank: mySchoolRank,  label: 'School',  emoji: mySchoolRank === 0 ? '🥇' : mySchoolRank === 1 ? '🥈' : mySchoolRank === 2 ? '🥉' : '🏫', display: mySchoolRank >= 0 ? `#${mySchoolRank + 1}` : '—' },
    { rank: myOverallRank, label: 'Overall', emoji: myOverallRank === 0 ? '🥇' : myOverallRank === 1 ? '🥈' : myOverallRank === 2 ? '🥉' : '🌍', display: myOverallRank >= 0 ? `#${myOverallRank + 1}` : '—' },
  ]
  const activeFace = rankFaces[rankFaceIdx % rankFaces.length]

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

  // ── Node selection ─────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState(null)

  // ── Sticky topic pill ──────────────────────────────────────────────────
  const [stickyTopic, setStickyTopic] = useState(null)
  const topicNodeRefs = useRef({})
  const pathScrollRef = useRef(null)

  function handlePathScroll() {
    const scrollTop = pathScrollRef.current?.scrollTop || 0
    let current = null
    for (const [key, el] of Object.entries(topicNodeRefs.current)) {
      if (el && el.offsetTop - 100 <= scrollTop) current = key
    }
    setStickyTopic(current)
  }

  // ── Path builder ──────────────────────────────────────────────────────
  const pathItems = []
  let topicsCompletedCount = 0

  ;[...(level?.terms || [])].sort((a, b) => a.term_number - b.term_number).forEach((term, termIdx) => {
    const tAccent  = termAccents[termIdx % termAccents.length]
    const termSubs = (term.units || []).flatMap(u => (u.topics || []).flatMap(t => t.subtopics || []))
    const termProg = termSubs.filter(s => completedIds.has(s.id)).length
    const termDone = termSubs.length > 0 && termProg === termSubs.length
    pathItems.push({ kind: 'term', term, termIdx, tAccent, termProg, termDone, termSubs })

    ;(term.units || []).forEach(unit => {
      ;(unit.topics || []).forEach(topic => {
        const subs      = topic.subtopics || []
        const doneCount = subs.filter(s => completedIds.has(s.id)).length
        const allDone   = subs.length > 0 && doneCount === subs.length

        pathItems.push({ kind: 'topic', topic, tAccent, doneCount, allDone })

        subs.forEach((sub, subIdx) => {
          const isDone    = completedIds.has(sub.id)
          const isCurrent = sub.id === nextLesson?.id
          const isLocked  = !isDone && !isCurrent && subIdx > 0 && !completedIds.has(subs[subIdx - 1]?.id)
          pathItems.push({ kind: 'lesson', sub, tAccent, isDone, isCurrent, isLocked, subIdx })
        })

        if (subs.length > 0) {
          const reviewUnlocked = doneCount >= Math.ceil(subs.length * 0.5)
          pathItems.push({ kind: 'topic_review', topic, tAccent, reviewUnlocked, reviewDone: allDone })
        }

        if (allDone) topicsCompletedCount++
        if (topicsCompletedCount > 0 && topicsCompletedCount % 3 === 0 && allDone) {
          pathItems.push({ kind: 'challenge', tAccent, topicsCompletedCount })
        }
      })
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // LEARN TAB
  // Design: centred vertical spine, all nodes centred, labels below
  // ══════════════════════════════════════════════════════════════════════════
  const LearnTab = (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      background: isNova ? '#0F0C29' : M.mapBg || '#F4F5FA',
    }}>
      {isNova ? <NovaStars /> : <MathFloats M={M} />}

      <div
        ref={pathScrollRef}
        onScroll={handlePathScroll}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: heroGradient, padding: '22px 22px 0', position: 'relative', overflow: 'hidden' }}>
          {isRoots && <AnkaraStripe />}
          {!isBlaze && <>
            <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: -30, bottom: 10, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          </>}

          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.28)', border: `2.5px solid ${isBlaze ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.55)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', boxShadow: isBlaze ? 'none' : '0 4px 18px rgba(0,0,0,0.22)' }}>
                {student?.display_name?.[0]?.toUpperCase() || '🧑🏾'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}>
                  {student?.display_name ? `Hey, ${student.display_name.split(' ')[0]}! 👋` : 'Welcome back! 👋'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isBlaze ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.68)', fontFamily: 'Nunito, sans-serif', marginTop: 2 }}>
                  {doneLessons === 0 ? 'Start your maths journey!' : doneLessons === totalLessons ? 'All done! 🎓' : `${doneLessons} done · ${totalLessons - doneLessons} to go`}
                </div>
              </div>
              {streak > 0 && (
                <div style={{ background: isBlaze ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)', border: `2px solid ${isBlaze ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.38)'}`, borderRadius: 24, padding: '6px 13px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 17 }}>🔥</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{streak}</div>
                    <div style={{ fontSize: 7, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.6 }}>day streak</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[
                { emoji: '⚡', value: xp.toLocaleString(), label: 'Total XP' },
                { emoji: activeFace.emoji, value: activeFace.display, label: `${activeFace.label} Rank`, rotating: true },
                { emoji: '🎯', value: `${overallPct}%`, label: 'Complete' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: isBlaze ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)', border: `1.5px solid ${isBlaze ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)'}`, borderRadius: 16 }}>
                  <div style={{ fontSize: 15, lineHeight: 1, marginBottom: 4 }}>{stat.emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 7, background: isBlaze ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)', marginLeft: -22, marginRight: -22 }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: isBlaze ? '#0d0d0d' : 'rgba(255,255,255,0.92)', transition: 'width 0.9s cubic-bezier(0.34,1.2,0.64,1)', boxShadow: isBlaze ? 'none' : '0 0 12px rgba(255,255,255,0.65)' }} />
          </div>
          <div style={{ height: 26, marginLeft: -22, marginRight: -22, background: isNova ? '#0F0C29' : M.mapBg || '#F4F5FA', borderRadius: '24px 24px 0 0' }} />
        </div>

        {/* CONTINUE CTA */}
        {nextLesson && (
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 18px 0' }}>
            <button
              onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                background: isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,#7C3AED 0%,#4C1D95 100%)' : `linear-gradient(135deg,${accent} 0%,${M.accent2 || accent}CC 100%)`,
                border: isBlaze ? '3px solid #0d0d0d' : 'none',
                borderRadius: isBlaze ? 16 : 24, padding: '18px 20px',
                boxShadow: isBlaze ? '5px 5px 0 #0d0d0d' : `0 12px 40px ${accent}50, 0 2px 8px ${accent}30`,
                display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'Nunito, sans-serif', marginBottom: 12,
              }}>
              {!isBlaze && <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />}
              <div style={{ width: 58, height: 58, borderRadius: '50%', flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.28)', border: `2px solid ${isBlaze ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.45)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isBlaze ? 'none' : '0 4px 18px rgba(0,0,0,0.18)', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 22, color: isBlaze ? '#0d0d0d' : '#fff', marginLeft: 3 }}>▶</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5, fontFamily: 'Nunito, sans-serif' }}>Continue learning</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', lineHeight: 1.2, fontFamily: 'Nunito, sans-serif' }}>{nextLesson.title}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isBlaze ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.72)', fontFamily: 'Nunito, sans-serif', marginTop: 4 }}>{nextLesson.topicTitle}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: isBlaze ? '#fff' : accent, background: isBlaze ? '#0d0d0d' : '#fff', borderRadius: isBlaze ? 10 : 26, padding: '11px 22px', flexShrink: 0, fontFamily: 'Nunito, sans-serif', boxShadow: isBlaze ? '3px 3px 0 rgba(0,0,0,0.2)' : '0 4px 14px rgba(0,0,0,0.18)', position: 'relative', zIndex: 1 }}>
                GO →
              </div>
            </button>

            {/* Rank + Challenge row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <button onClick={() => setActiveTab('leaderboard')} style={{ flex: 1, cursor: 'pointer', textAlign: 'left', background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', border: isNova ? '1px solid rgba(255,255,255,0.1)' : `1.5px solid ${accent}18`, borderRadius: isBlaze ? 10 : 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Nunito, sans-serif', boxShadow: isNova ? 'none' : '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', position: 'relative' }}>
                <span style={{ fontSize: 22, transition: 'opacity 0.4s', opacity: 1 }}>{activeFace.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>{activeFace.label} Rank</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif', lineHeight: 1, transition: 'opacity 0.3s' }}>{activeFace.display}</div>
                  <div style={{ fontSize: 9, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginTop: 2 }}>
                    {activeFace.rank === 0 ? `Top of ${activeFace.label.toLowerCase()}! 👑` : activeFace.rank > 0 && (boards[activeFace.label.toLowerCase()]?.[activeFace.rank - 1]) ? `+${Math.max(0, (boards[activeFace.label.toLowerCase()][activeFace.rank - 1]?.monthly_xp || 0) - monthlyXp)} XP to climb` : 'Tap to view rankings'}
                  </div>
                </div>
                {/* Rotation indicator dots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                  {rankFaces.map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i === rankFaceIdx % 3 ? accent : `${accent}35`, transition: 'background 0.3s' }} />
                  ))}
                </div>
              </button>
              <button onClick={() => router.push('/learn/challenge?mode=daily')} style={{ flex: 1, cursor: 'pointer', textAlign: 'left', position: 'relative', background: 'rgba(255,196,0,0.08)', border: '1.5px solid rgba(255,196,0,0.38)', borderRadius: isBlaze ? 10 : 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Nunito, sans-serif' }}>
                <div style={{ position: 'absolute', top: -10, right: 10, background: 'linear-gradient(135deg,#FFD700,#FF9500)', color: '#fff', fontSize: 8, fontWeight: 900, borderRadius: 20, padding: '3px 9px', boxShadow: '0 2px 8px rgba(255,150,0,0.45)', fontFamily: 'Nunito, sans-serif' }}>+50 XP</div>
                <span style={{ fontSize: 22 }}>⚡</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#A06000', fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}>Challenge</div>
                  <div style={{ fontSize: 9, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginTop: 2 }}>Earn bonus XP</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {!level?.terms?.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BicPencil pose="think" size={100} style={{ display: 'inline-block', marginBottom: 18 }} />
            <p style={{ fontWeight: 800, fontSize: 18, color: M.textPrimary, fontFamily: M.headingFont }}>Content coming soon!</p>
            <p style={{ fontSize: 13, marginTop: 6, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>We&apos;re preparing lessons for {student?.class_level}.</p>
          </div>
        )}

        {/* ── LEARNING PATH — centred spine, all nodes centred, labels below ── */}
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 0 170px', position: 'relative' }}>

          {/* Dashed vertical spine */}
          <div style={{ position: 'absolute', left: '50%', top: 16, bottom: 16, width: 4, transform: 'translateX(-50%)', background: isNova ? 'repeating-linear-gradient(to bottom,rgba(255,255,255,0.15) 0,rgba(255,255,255,0.15) 10px,transparent 10px,transparent 22px)' : 'repeating-linear-gradient(to bottom,rgba(0,0,0,0.12) 0,rgba(0,0,0,0.12) 10px,transparent 10px,transparent 22px)', borderRadius: 2, zIndex: 0, pointerEvents: 'none' }} />

          {pathItems.map((item, idx) => {

            // ── TERM WORLD BANNER ──
            if (item.kind === 'term') {
              const { term, termIdx, tAccent, termProg, termDone, termSubs } = item
              const pct   = termSubs.length > 0 ? Math.round((termProg / termSubs.length) * 100) : 0
              const icons = ['🌱', '🔥', '⭐', '💎', '🚀']
              return (
                <div key={`term-${term.id}`} style={{ padding: '0 18px', marginBottom: 14, marginTop: termIdx > 0 ? 36 : 0, position: 'relative', zIndex: 2 }}>
                  <div style={{ borderRadius: isBlaze ? 14 : 24, background: isNova ? `linear-gradient(135deg,${tAccent}35,${tAccent}18)` : `linear-gradient(135deg,${tAccent}1A,${tAccent}08)`, border: `2.5px solid ${tAccent}${isNova ? '65' : '45'}`, padding: '18px 20px', position: 'relative', overflow: 'hidden', boxShadow: `0 6px 24px ${tAccent}22` }}>
                    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 72, fontWeight: 900, color: `${tAccent}12`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Nunito, sans-serif' }}>{termIdx + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 48, height: 48, borderRadius: isBlaze ? 12 : 16, flexShrink: 0, background: tAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px ${tAccent}55`, fontSize: 22 }}>
                        {icons[termIdx % icons.length]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: tAccent, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 3 }}>World {termIdx + 1}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.1 }}>{term.name}</div>
                      </div>
                      {termDone
                        ? <div style={{ background: M.correctColor, borderRadius: 20, padding: '6px 14px', flexShrink: 0, boxShadow: `0 3px 12px ${M.correctColor}40` }}><span style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif' }}>✓ Done</span></div>
                        : <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontSize: 24, fontWeight: 900, color: tAccent, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{pct}%</div><div style={{ fontSize: 9, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{termProg}/{termSubs.length}</div></div>
                      }
                    </div>
                    <div style={{ height: 8, background: `${tAccent}25`, borderRadius: 99, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${tAccent},${tAccent}BB)`, borderRadius: 99, transition: 'width 0.8s ease', boxShadow: `0 0 10px ${tAccent}75` }} />
                    </div>
                  </div>
                </div>
              )
            }

            // ── TOPIC CHAPTER CARD ──
            if (item.kind === 'topic') {
              const { topic, tAccent, doneCount, allDone } = item
              const topicIcon = getTopicIcon(topic.title)
              return (
                <div key={`topic-${topic.id}`} ref={el => { topicNodeRefs.current[topic.title] = el }} style={{ padding: '0 18px', marginTop: 28, marginBottom: 20, position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', borderRadius: isBlaze ? 12 : 20, border: allDone ? `2px solid ${M.correctColor}55` : `2px solid ${tAccent}32`, boxShadow: allDone ? `0 4px 18px ${M.correctColor}18` : '0 4px 18px rgba(0,0,0,0.07)' }}>
                    <div style={{ width: 46, height: 46, borderRadius: isBlaze ? 10 : 14, flexShrink: 0, background: allDone ? `linear-gradient(135deg,${M.correctColor},${M.correctColor}BB)` : `linear-gradient(135deg,${tAccent}28,${tAccent}0C)`, border: allDone ? `2px solid ${M.correctColor}` : `2px solid ${tAccent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: allDone ? `0 5px 16px ${M.correctColor}38` : `0 5px 14px ${tAccent}28` }}>
                      {allDone ? <span style={{ fontSize: 20, color: '#fff' }}>✓</span> : <span style={{ fontFamily: 'monospace', fontSize: topicIcon.length > 2 ? 11 : 16, fontWeight: 900, color: tAccent }}>{topicIcon}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>{topic.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: allDone ? M.correctColor : bodyColor, fontFamily: 'Nunito, sans-serif', marginTop: 3 }}>{allDone ? `All done · +${doneCount * 10} XP earned` : `${doneCount} of ${topic.subtopics?.length || 0} lessons done`}</div>
                    </div>
                  </div>
                </div>
              )
            }

            // ── LESSON NODE — centred, label below ──
            if (item.kind === 'lesson') {
              const { sub, tAccent, isDone, isCurrent, isLocked } = item
              const isSelected = selectedNode?.sub?.id === sub.id
              const nodeSize = isCurrent ? 64 : isDone ? 52 : isLocked ? 38 : 46

              return (
                <div key={`lesson-${sub.id}`} style={{ position: 'relative', zIndex: 2, marginBottom: isCurrent ? 10 : 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
                    <button
                      onClick={() => !isLocked && setSelectedNode(isSelected ? null : { sub, isCurrent, isDone, tAccent })}
                      style={{
                        width: nodeSize, height: nodeSize, borderRadius: '50%', flexShrink: 0, position: 'relative',
                        background: isDone ? `linear-gradient(145deg,${M.correctColor},${M.correctColor}99)` : isCurrent ? `linear-gradient(145deg,${accent},${M.accent2 || accent}CC)` : isLocked ? (isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : (isNova ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.07)'),
                        border: isDone ? `3px solid ${M.correctColor}` : isCurrent ? `3px solid ${accent}` : isLocked ? `2px solid ${isNova ? 'rgba(255,255,255,0.12)' : '#e0e0e0'}` : `2.5px solid ${tAccent}55`,
                        boxShadow: isCurrent ? `0 0 0 10px ${accent}16, 0 10px 32px ${accent}48` : isDone ? `0 0 0 6px ${M.correctColor}18, 0 5px 18px ${M.correctColor}32` : isSelected ? `0 0 0 6px ${tAccent}28` : '0 3px 12px rgba(0,0,0,0.11)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isLocked ? 'default' : 'pointer',
                        opacity: isLocked ? 0.36 : 1,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                      }}>
                      {isCurrent && !isBlaze && (
                        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${accent}28`, animation: 'pulse-glow 2s ease-in-out infinite', pointerEvents: 'none' }} />
                      )}
                      {isDone ? <span style={{ fontSize: nodeSize * 0.32, color: '#fff' }}>✓</span>
                        : isCurrent ? <span style={{ fontSize: nodeSize * 0.36, color: '#fff', marginLeft: 3 }}>▶</span>
                        : isLocked  ? <span style={{ fontSize: nodeSize * 0.38 }}>🔒</span>
                        : <div style={{ width: nodeSize * 0.3, height: nodeSize * 0.3, borderRadius: '50%', background: `${tAccent}65` }} />
                      }
                    </button>

                    <div style={{ textAlign: 'center', maxWidth: isCurrent ? 210 : 180, paddingBottom: 2 }}>
                      <div style={{ fontSize: isCurrent ? 14 : 12, fontWeight: isCurrent ? 900 : isDone ? 500 : 600, color: isDone ? bodyColor : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.35 }}>
                        {sub.title}
                      </div>
                      {isDone && <div style={{ fontSize: 9, color: M.correctColor, fontFamily: 'Nunito, sans-serif', fontWeight: 800, marginTop: 2 }}>+10 XP ✓</div>}
                      {isCurrent && <div style={{ fontSize: 11, fontWeight: 700, color: accent, fontFamily: 'Nunito, sans-serif', marginTop: 4 }}>Tap to start →</div>}
                    </div>
                  </div>
                </div>
              )
            }

            // ── TOPIC REVIEW — diamond ──
            if (item.kind === 'topic_review') {
              const { topic, tAccent, reviewUnlocked, reviewDone } = item
              return (
                <div key={`review-${topic.id}`} style={{ display: 'flex', justifyContent: 'center', padding: '18px 0', position: 'relative', zIndex: 2 }}>
                  <button onClick={() => reviewUnlocked && router.push(`/learn/practice?topicId=${topic.id}&mode=review`)} style={{ background: 'none', border: 'none', cursor: reviewUnlocked ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: reviewUnlocked ? 1 : 0.3 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 17, background: reviewDone ? 'linear-gradient(135deg,#FFD700,#FF9500)' : reviewUnlocked ? `linear-gradient(135deg,${tAccent}2C,${tAccent}10)` : (isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), border: `3px solid ${reviewDone ? '#FFD700' : reviewUnlocked ? tAccent : (isNova ? 'rgba(255,255,255,0.1)' : '#ddd')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)', boxShadow: reviewDone ? '0 0 0 7px rgba(255,210,0,0.18), 0 6px 22px rgba(255,180,0,0.38)' : reviewUnlocked ? `0 0 0 6px ${tAccent}18, 0 5px 16px ${tAccent}28` : 'none', transition: 'all 0.2s' }}>
                      <span style={{ transform: 'rotate(-45deg)', fontSize: 22 }}>{reviewDone ? '⭐' : reviewUnlocked ? '📝' : '🔒'}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: reviewDone ? '#A06000' : reviewUnlocked ? tAccent : bodyColor, fontFamily: 'Nunito, sans-serif' }}>Topic Review</div>
                      <div style={{ fontSize: 9, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{reviewDone ? 'Completed ✓' : reviewUnlocked ? 'Tap to review' : 'Finish more lessons'}</div>
                    </div>
                  </button>
                </div>
              )
            }

            // ── CHALLENGE BADGE ──
            if (item.kind === 'challenge') {
              return (
                <div key={`challenge-${item.topicsCompletedCount}`} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', position: 'relative', zIndex: 2 }}>
                  <button onClick={() => router.push('/learn/challenge?mode=topic')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 76, height: 76, borderRadius: 24, background: 'linear-gradient(135deg,#FFD700 0%,#FF8C00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 10px rgba(255,180,0,0.12), 0 10px 32px rgba(255,140,0,0.48)', animation: 'float 3s ease-in-out infinite', fontSize: 32 }}>🏆</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#A06000', fontFamily: 'Nunito, sans-serif' }}>Challenge Unlocked!</div>
                      <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Mixed topics · Earn bonus XP</div>
                    </div>
                  </button>
                </div>
              )
            }

            return null
          })}

          <div style={{ textAlign: 'center', paddingTop: 20, position: 'relative', zIndex: 1 }}>
            <div style={{ color: isNova ? 'rgba(165,180,252,0.2)' : 'rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif', letterSpacing: 0.6 }}>
              {M.endText || '— end of curriculum —'}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY TOPIC PILL */}
      {stickyTopic && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', justifyContent: 'center', paddingTop: 9 }}>
          <div style={{ background: isNova ? 'rgba(12,9,35,0.95)' : isBlaze ? '#FFD700' : `${accent}F4`, backdropFilter: 'blur(16px)', borderRadius: 26, padding: '7px 22px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : '0 8px 28px rgba(0,0,0,0.28)', border: isBlaze ? '2px solid #0d0d0d' : '1.5px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: 12 }}>📍</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif' }}>{stickyTopic}</span>
          </div>
        </div>
      )}

      {/* NODE LAUNCH CARD */}
      {selectedNode && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedNode(null)} />
          <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 490, zIndex: 40, background: isNova ? '#1E1B4B' : '#fff', borderRadius: isBlaze ? 18 : 28, padding: '22px 22px 24px', boxShadow: '0 -6px 50px rgba(0,0,0,0.22), 0 12px 40px rgba(0,0,0,0.16)', border: isBlaze ? '2.5px solid #0d0d0d' : `1.5px solid ${selectedNode.tAccent}28`, animation: 'sheetUp 0.28s cubic-bezier(0.34,1.1,0.64,1)', fontFamily: 'Nunito, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ width: 44, height: 5, borderRadius: 3, background: isNova ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ height: 4, borderRadius: 4, marginBottom: 20, background: selectedNode.isDone ? `linear-gradient(90deg,${M.correctColor},${M.correctColor}55)` : `linear-gradient(90deg,${selectedNode.tAccent},${selectedNode.tAccent}55)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: selectedNode.isDone ? `linear-gradient(145deg,${M.correctColor},${M.correctColor}99)` : selectedNode.isCurrent ? `linear-gradient(145deg,${accent},${M.accent2 || accent}CC)` : `${selectedNode.tAccent}18`, border: selectedNode.isDone ? `3px solid ${M.correctColor}` : selectedNode.isCurrent ? `3px solid ${accent}` : `2px solid ${selectedNode.tAccent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selectedNode.isCurrent ? `0 6px 22px ${accent}48` : selectedNode.isDone ? `0 6px 20px ${M.correctColor}32` : 'none', fontSize: 26, color: (selectedNode.isDone || selectedNode.isCurrent) ? '#fff' : selectedNode.tAccent }}>
                {selectedNode.isDone ? '✓' : selectedNode.isCurrent ? '▶' : '○'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 6, color: selectedNode.isDone ? M.correctColor : selectedNode.isCurrent ? accent : bodyColor }}>
                  {selectedNode.isDone ? '✓ Completed · +10 XP earned' : selectedNode.isCurrent ? '🎯 Your next lesson' : '🔓 Coming up'}
                </div>
                <div style={{ fontSize: 21, fontWeight: 900, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>{selectedNode.sub.title}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {selectedNode.isDone ? (
                <>
                  <button onClick={() => { router.push(`/learn/lesson/${selectedNode.sub.id}`); setSelectedNode(null) }} style={{ flex: 1, padding: '16px', background: `${M.correctColor}14`, border: `2px solid ${M.correctColor}42`, borderRadius: isBlaze ? 12 : 18, fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 800, color: M.correctColor, cursor: 'pointer' }}>↩ Replay lesson</button>
                  <button onClick={() => setSelectedNode(null)} style={{ flex: 1, padding: '16px', background: 'transparent', border: `2px solid ${isNova ? 'rgba(255,255,255,0.14)' : '#eaeaea'}`, borderRadius: isBlaze ? 12 : 18, fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 700, color: bodyColor, cursor: 'pointer' }}>Close</button>
                </>
              ) : (
                <button onClick={() => { router.push(`/learn/lesson/${selectedNode.sub.id}`); setSelectedNode(null) }} style={{ ...M.primaryBtn, flex: 1, fontSize: 18, padding: '17px', borderRadius: isBlaze ? 12 : 20, boxShadow: `0 8px 24px ${accent}48` }}>
                  {selectedNode.isCurrent ? '▶  Start Lesson' : '▶  Begin'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // PRACTICE TAB — single entry point, navigates to /learn/practice
  // ══════════════════════════════════════════════════════════════════════════
  const PracticeTab = (
    <div style={{ padding: '20px 18px 120px', maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ fontFamily: M.headingFont, fontSize: 22, fontWeight: 800, color: M.textPrimary, marginBottom: 4 }}>✏️ Practice</h2>
      <p style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.5, marginBottom: 24 }}>
        {isRoots ? 'Practise your maths — e go sweet! 🇳🇬' : isBlaze ? 'DRILL YOUR SKILLS. NO EXCUSES.' : 'Pick a topic and practise at your own pace — or mix it up!'}
      </p>

      {/* Main entry card */}
      <button
        onClick={() => router.push('/learn/practice')}
        style={{
          width: '100%', marginBottom: 20, padding: '20px', cursor: 'pointer', textAlign: 'left',
          borderRadius: isBlaze ? 10 : 20,
          background: isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.22),rgba(76,29,149,0.14))' : `linear-gradient(135deg,${accent}18,${M.accent2 || accent}0A)`,
          border: isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}35`,
          boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 24px ${accent}20`,
          display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'Nunito, sans-serif',
        }}>
        <div style={{ width: 54, height: 54, borderRadius: isBlaze ? 12 : '50%', flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.08)' : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: isBlaze ? 'none' : `0 4px 14px ${accent}55` }}>✏️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, marginBottom: 4 }}>
            {isBlaze ? 'OPEN PRACTICE' : 'Open Practice'}
          </div>
          <div style={{ fontSize: 12, color: isBlaze ? '#555' : bodyColor, fontWeight: 500 }}>
            Choose a topic · set question count · time yourself
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', background: isBlaze ? '#0d0d0d' : accent, borderRadius: isBlaze ? 6 : 22, padding: '10px 18px', flexShrink: 0, fontFamily: 'Nunito, sans-serif', boxShadow: isBlaze ? '2px 2px 0 rgba(0,0,0,0.15)' : `0 3px 12px ${accent}55` }}>Go →</div>
      </button>

      {/* Quick topic shortcuts — top 5 topics */}
      {allTopics.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
            Quick Jump
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allTopics.slice(0, 5).map(topic => {
              const subs      = topic.subtopics || []
              const doneCount = subs.filter(s => completedIds.has(s.id)).length
              const hasDone   = doneCount > 0
              return (
                <button
                  key={topic.id}
                  onClick={() => router.push(`/learn/practice?topicId=${topic.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: M.cardBg, border: hasDone ? `1.5px solid ${accent}28` : M.cardBorder, borderRadius: M.cardRadius, boxShadow: M.cardShadow, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Nunito, sans-serif' }}>
                  <div style={{ width: 34, height: 34, borderRadius: isBlaze ? '30%' : '50%', flexShrink: 0, background: hasDone ? `${accent}18` : 'rgba(0,0,0,0.04)', border: hasDone ? `1.5px solid ${accent}30` : '1.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                    {hasDone ? '✏️' : '📖'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary }}>{topic.title}</div>
                    {hasDone && <div style={{ fontSize: 10, color: M.correctColor, fontWeight: 600, marginTop: 1 }}>✓ {doneCount}/{subs.length} done</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: hasDone ? accent : M.textSecondary, background: hasDone ? `${accent}12` : 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>Go</span>
                </button>
              )
            })}
            {allTopics.length > 5 && (
              <button onClick={() => router.push('/learn/practice')} style={{ padding: '11px', background: 'transparent', border: `1.5px solid ${accent}25`, borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif' }}>
                See all {allTopics.length} topics →
              </button>
            )}
          </div>
        </>
      )}

      {allTopics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <BicPencil pose="think" size={90} style={{ display: 'inline-block', marginBottom: 16 }} />
          <p style={{ fontFamily: M.headingFont, fontSize: 16, fontWeight: 800, color: M.textPrimary, marginBottom: 6 }}>No content yet!</p>
          <p style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>Content for {student?.class_level} is on the way.</p>
        </div>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // CHALLENGE TAB
  // ══════════════════════════════════════════════════════════════════════════
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
        {isRoots ? '5 questions every day. Get all correct — collect 50 XP and climb the leaderboard! 🇳🇬' : isBlaze ? '5 QUESTIONS. TIMED. NO HINTS. ALL CORRECT = 50 XP.' : '5 personalised questions every day. Get them all right to earn 50 XP!'}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {[
          { icon: '⚡', label: '5 questions',  color: accent },
          { icon: '⏱', label: '60s per Q',    color: '#FFC933' },
          { icon: '🏆', label: '+50 XP bonus', color: M.correctColor },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 12px', textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color, fontFamily: 'Nunito, sans-serif', lineHeight: 1.3 }}>{label}</div>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/learn/challenge?mode=daily')} style={{ ...M.primaryBtn, fontSize: 16, padding: '16px 40px', width: '100%', maxWidth: 300 }}>
        {challengeLabel}
      </button>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // LEADERBOARD TAB
  // ══════════════════════════════════════════════════════════════════════════
  const LB_TABS = [
    { id: 'class',   label: student?.class_level || 'My Class', icon: '🎓' },
    { id: 'school',  label: 'My School',                        icon: '🏫' },
    { id: 'overall', label: 'Overall',                          icon: '🌍' },
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
          <div key={t.id} onClick={() => setLeaderboardType(t.id)} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: isBlaze ? 6 : 9, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 800, transition: 'all 0.15s', background: leaderboardType === t.id ? (isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,#7C3AED,#4C1D95)' : accent) : 'transparent', color: leaderboardType === t.id ? (isBlaze ? '#0d0d0d' : '#fff') : M.textSecondary }}>
            {t.label}
          </div>
        ))}
      </div>
      <div style={{ background: M.cardBg, border: M.cardBorder, borderRadius: M.cardRadius, boxShadow: M.cardShadow, overflow: 'hidden' }}>
        {!boardsLoaded ? (
          /* Loading skeleton — instant feel, no spinner */
          <div>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${isNova ? 'rgba(255,255,255,0.05)' : '#f2f2f2'}` }}>
                <div style={{ width: 28, height: 14, borderRadius: 7, background: isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', flexShrink: 0, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: `${55 + (i * 7) % 30}%`, height: 12, borderRadius: 6, background: isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', marginBottom: 6, animation: 'shimmer 1.2s ease-in-out infinite' }} />
                  <div style={{ width: '40%', height: 9, borderRadius: 5, background: isNova ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
                </div>
                <div style={{ width: 30, height: 18, borderRadius: 5, background: isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <p style={{ fontWeight: 800, color: M.textPrimary, fontSize: 15, fontFamily: 'Nunito, sans-serif' }}>No rankings yet</p>
            <p style={{ fontSize: 12, marginTop: 4, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>Complete lessons to appear here!</p>
          </div>
        ) : leaderboard.map((entry, idx) => {
          const isMe  = entry.id === student?.id
          const xpVal = entry.monthly_xp || 0
          return (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: isMe ? (isNova ? 'rgba(124,58,237,0.12)' : `${accent}08`) : 'transparent', borderLeft: `3px solid ${isMe ? accent : 'transparent'}`, borderBottom: `1px solid ${isNova ? 'rgba(255,255,255,0.05)' : '#f2f2f2'}` }}>
              <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span style={{ fontSize: 12, fontWeight: 700, color: M.textSecondary }}>#{idx + 1}</span>}
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
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>{student?.display_name || 'Student'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>{student?.class_level}{student?.school ? ` · ${student.school}` : ''}</div>
            <div style={{ display: 'flex', gap: 18 }}>
              {[
                { v: String(xp), label: 'Total XP', color: '#FFD700' },
                { v: String(monthlyXp), label: 'Monthly', color: '#fff' },
                { v: `${streak}🔥`, label: 'Streak', color: '#fff' },
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
          <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 14 }}>My Details</div>
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
            <button onClick={saveProfile} disabled={saving} style={{ ...M.primaryBtn, width: '100%', marginTop: 4, opacity: saving ? 0.7 : 1, fontSize: 14 }}>
              {saving ? 'Saving...' : saveMsg || 'Save Changes'}
            </button>
          </div>
        </div>

        <button onClick={() => setShowModePicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: isBlaze ? 10 : 18, cursor: 'pointer', textAlign: 'left', width: '100%', background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)' : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(76,29,149,0.15))' : isSpark ? 'linear-gradient(135deg,rgba(255,140,66,0.18),rgba(255,217,61,0.12))' : isRoots ? 'linear-gradient(135deg,rgba(192,57,43,0.15),rgba(46,106,79,0.1))' : `linear-gradient(135deg,${accent}1A,${M.accent2 || accent}0D)`, border: isBlaze ? '2px solid #0d0d0d' : isNova ? '1px solid rgba(124,58,237,0.4)' : isSpark ? '1px solid rgba(255,140,66,0.35)' : isRoots ? '1px solid rgba(192,57,43,0.35)' : `1.5px solid ${accent}35`, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow, fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ width: 54, height: 54, borderRadius: isBlaze ? 12 : '50%', flexShrink: 0, background: isBlaze ? '#fff' : isNova ? 'rgba(124,58,237,0.2)' : isSpark ? 'rgba(255,140,66,0.2)' : isRoots ? 'rgba(192,57,43,0.2)' : `${accent}18`, border: isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>
            {M.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 3 }}>{M.name}</div>
            <div style={{ fontSize: 11, color: isBlaze ? '#555' : bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.4 }}>{M.tagline || 'Tap to change learning style'}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#fff', background: isBlaze ? '#0d0d0d' : isNova ? '#7C3AED' : isSpark ? '#FF8C42' : isRoots ? '#C0392B' : accent, borderRadius: isBlaze ? 6 : 20, padding: '4px 11px', fontFamily: 'Nunito, sans-serif', flexShrink: 0, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>CHANGE</div>
        </button>

        <button onClick={handleSignOut} style={{ width: '100%', padding: '13px', cursor: 'pointer', background: 'transparent', border: isBlaze ? '2px solid #ef4444' : '1.5px solid #fecaca', borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ef4444', boxShadow: isBlaze ? '2px 2px 0 #ef4444' : 'none' }}>
          Sign Out
        </button>
      </div>
    </div>
  )

  // ── Root ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, sans-serif', background: M.mapBg, position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.55} 50%{opacity:1} }`}</style>
      {HUD}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'learn'       && LearnTab}
        {activeTab === 'practice'    && <div style={{ height: '100%', overflowY: 'auto' }}>{PracticeTab}</div>}
        {activeTab === 'challenge'   && <div style={{ height: '100%', overflowY: 'auto' }}>{ChallengeTab}</div>}
        {activeTab === 'leaderboard' && <div style={{ height: '100%', overflowY: 'auto' }}>{LeaderboardTab}</div>}
        {activeTab === 'profile'     && <div style={{ height: '100%', overflowY: 'auto' }}>{ProfileTab}</div>}
      </div>
      {BottomNav}
      <BottomSheet open={showModePicker} onClose={() => setShowModePicker(false)} M={M}>
        <ModePicker onClose={() => setShowModePicker(false)} />
      </BottomSheet>
    </div>
  )
}