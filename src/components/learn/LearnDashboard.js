'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { MIBLogo, BicPencil } from '@/components/BiteMarkIcon'
import BottomSheet from '@/components/BottomSheet'
import ModePicker from '@/components/ModePicker'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import WelcomeScreen from '@/components/WelcomeScreen'

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

export default function LearnDashboard({ student: initialStudent, allStudents = [], profileId, level, progress }) {
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
  const [rankVisible,     setRankVisible]     = useState(true)
  const [activeTab,       setActiveTab]       = useState('home')
  const [showModePicker,  setShowModePicker]  = useState(false)
  const [showSwitcher,    setShowSwitcher]    = useState(false)
  const [showWelcome,     setShowWelcome]     = useState(false)
  const [popup,           setPopup]           = useState(null)
  const [editName,        setEditName]        = useState(initialStudent?.display_name || '')
  const [editSchool,      setEditSchool]      = useState(initialStudent?.school || '')
  const [editClass,       setEditClass]       = useState(initialStudent?.class_level || '')
  const [saving,          setSaving]          = useState(false)
  const [saveMsg,         setSaveMsg]         = useState('')
  const [editOpen,        setEditOpen]        = useState(false)

  const scrollRef   = useRef(null)
  const sectionRefs = useRef({})

  const isNova  = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isRoots = mode === 'roots'

  const bodyColor   = isNova ? 'rgba(200,195,255,0.78)' : M.textSecondary
  const accent      = M.accentColor
  const termAccents = M.termAccents || ['#0d9488', '#f97316', '#8b5cf6']

  // Show welcome screen once for new users
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mib_new_user')) {
      setShowWelcome(true)
    }
  }, [])

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
    const timer = setInterval(() => {
      setRankVisible(false)
      setTimeout(() => { setRankFaceIdx(i => (i + 1) % 3); setRankVisible(true) }, 500)
    }, 8000)
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
      [...(t.units || [])].sort((a,b) => (a.order_index||0) - (b.order_index||0)).flatMap(u =>
        [...(u.topics || [])].sort((a,b) => (a.order_index||0) - (b.order_index||0)).flatMap(tp =>
          [...(tp.subtopics || [])].sort((a,b) => (a.order_index||0) - (b.order_index||0))
            .map(s => ({ ...s, topicTitle: tp.title, termName: t.name }))
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

  const allTopics = (level?.terms || []).sort((a,b)=>a.term_number-b.term_number).flatMap(t => [...(t.units||[])].sort((a,b)=>(a.order_index||0)-(b.order_index||0)).flatMap(u => [...(u.topics||[])].sort((a,b)=>(a.order_index||0)-(b.order_index||0))))

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
      : isRoots
          ? 'linear-gradient(135deg,#C0392B,#8B1A1A)'
          : `linear-gradient(135deg,${accent},${M.accent2 || accent})`

  // ── HUD ──────────────────────────────────────────────────────────────────
  const onHome = activeTab === 'home'

  const ProfileBtn = (
    <button
      onClick={() => setShowSwitcher(true)}
      style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.3)' : `${accent}22`,
        border: isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent,
        cursor: 'pointer', position: 'relative',
        boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
      }}>
      {student?.display_name?.[0]?.toUpperCase() || '?'}
      {allStudents.length > 1 && (
        <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: accent, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#fff' }}>
          {allStudents.length}
        </div>
      )}
    </button>
  )

  const ModeBtn = (
    <button
      onClick={() => setShowModePicker(true)}
      style={{
        background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)' : isNova ? 'linear-gradient(135deg,#7C3AED,#4C1D95)' : isRoots ? 'linear-gradient(135deg,#C0392B,#8B1A1A)' : `linear-gradient(135deg,${accent},${M.accent2 || accent})`,
        border: isBlaze ? '2px solid #0d0d0d' : 'none',
        borderRadius: isBlaze ? 8 : 20, padding: '4px 10px 4px 8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : '0 2px 10px rgba(0,0,0,0.18)',
        color: '#fff', fontFamily: 'Nunito, sans-serif', fontWeight: 800,
      }}>
      <span style={{ fontSize: 13 }}>{M.emoji}</span>
      <span style={{ fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' }}>Mode</span>
    </button>
  )

  const HUD = (
    <div style={{
      flexShrink: 0, position: 'relative', zIndex: 20,
      background: M.hudBg, backdropFilter: 'blur(10px)',
      borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
    }}>
      {isRoots && <AnkaraStripe />}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {onHome ? (
          <>
            <MIBLogo size={28} theme={isNova ? 'dark' : 'light'} M={M} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {ProfileBtn}
              {ModeBtn}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: isBlaze ? 8 : 12, background: isBlaze ? 'rgba(0,0,0,0.06)' : isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: isBlaze ? '1.5px solid #0d0d0d' : `1.5px solid ${isNova ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                🏠
              </div>
            </button>
            {ModeBtn}
            <div style={{ background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.2)' : `${accent}14`, border: isBlaze ? '1.5px solid #0d0d0d' : `1.5px solid ${accent}30`, borderRadius: isBlaze ? 8 : 20, padding: '4px 12px', display: 'flex', gap: 4, alignItems: 'center', boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>
              <span style={{ fontSize: 11 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: 'Nunito, sans-serif' }}>{xp.toLocaleString()}</span>
            </div>
            {ProfileBtn}
          </>
        )}
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
  const [selectedNode,    setSelectedNode]    = useState(null)
  const currentNodeRef  = useRef(null)   // ref on the current lesson node
  const [currentNodeDir, setCurrentNodeDir]  = useState(null) // 'up' | 'down' | null (visible)

  // Track whether current node is visible as user scrolls
  function handlePathScrollFull() {
    handlePathScroll()
    if (!currentNodeRef.current || !pathScrollRef.current) return
    const scrollTop    = pathScrollRef.current.scrollTop
    const containerH   = pathScrollRef.current.clientHeight
    const nodeTop      = currentNodeRef.current.offsetTop
    const nodeH        = currentNodeRef.current.offsetHeight
    const isAbove      = nodeTop + nodeH < scrollTop + 80
    const isBelow      = nodeTop > scrollTop + containerH - 80
    if (isAbove)       setCurrentNodeDir('up')
    else if (isBelow)  setCurrentNodeDir('down')
    else               setCurrentNodeDir(null)
  }

  function jumpToCurrent() {
    currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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

    ;[...(term.units || [])].sort((a,b)=>(a.order_index||0)-(b.order_index||0)).forEach(unit => {
      ;[...(unit.topics || [])].sort((a,b)=>(a.order_index||0)-(b.order_index||0)).forEach(topic => {
        const subs = [...(topic.subtopics || [])].sort((a,b)=>(a.order_index||0)-(b.order_index||0))
        const doneCount = subs.filter(s => completedIds.has(s.id)).length
        const allDone   = subs.length > 0 && doneCount === subs.length

        pathItems.push({ kind: 'topic', topic, tAccent, doneCount, allDone })

        subs.forEach((sub, subIdx) => {
          const isDone    = completedIds.has(sub.id)
          const isCurrent = sub.id === nextLesson?.id
          const isLocked  = !isDone && !isCurrent && subIdx > 0 && !completedIds.has(subs[subIdx - 1]?.id)
          pathItems.push({ kind: 'lesson', sub, tAccent, isDone, isCurrent, isLocked, subIdx, globalIdx: pathItems.filter(p=>p.kind==='lesson').length })
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
  // HOME TAB — simplified dashboard
  // Shows: greeting, subject card, stats row, quick actions
  // ══════════════════════════════════════════════════════════════════════════
  // First two topics for the subject card preview
  // ── Greeting helpers — must be before mascotGreeting ────────────────────
  const firstName = student?.display_name?.split(' ')[0] || 'there'
  const timeOfDay = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  // ── Mascot greeting — simple and encouraging ────────────────────────────
  const mascotGreeting = (() => {
    const greetings = [
      `Hi ${firstName}! Ready to make today count? Let's learn something great! 🚀`,
      `Hey ${firstName}! Every lesson brings you closer to your best. Let's go! 💡`,
      `${firstName}! Maths gets easier one lesson at a time. You've got this! 📚`,
      `Hi ${firstName}! Small steps every day lead to big results. Let's learn! ⚡`,
      `Hey ${firstName}! Your future self is counting on today's you. Let's go! 🎯`,
      `${firstName}! Champions are made by showing up. You showed up — now let's learn! 🏆`,
    ]
    if (doneLessons === 0) return `Hi ${firstName}! 👋 Welcome to MathsInBites — maths made fun, one lesson at a time. Let's go!`
    if (streak >= 7) return `${firstName}, ${streak} days strong! 🔥 That's the spirit — keep the momentum going!`
    if (myClassRank === 0) return `${firstName}, you're #1 in your class! 👑 Keep learning and stay on top!`
    return greetings[doneLessons % greetings.length]
  })()

  // Smart preview topics: show current + next, or first 2 if not started
  const previewTopics = (() => {
    if (doneLessons === 0) return allTopics.slice(0, 2)
    // Find the topic containing the next lesson
    const currentTopic = allTopics.find(t =>
      (t.subtopics || []).some(s => s.id === nextLesson?.id)
    )
    if (!currentTopic) return allTopics.slice(0, 2)
    const currentIdx = allTopics.indexOf(currentTopic)
    // Show current topic + next one (or previous if last)
    const next = allTopics[currentIdx + 1] || allTopics[currentIdx - 1]
    return next ? [currentTopic, next] : [currentTopic]
  })()

  const HomeTab = (
    <div style={{ height: '100%', overflowY: 'auto', background: isNova ? '#0F0C29' : M.mapBg || '#F4F5FA', position: 'relative' }}>
      {isNova ? <NovaStars /> : <MathFloats M={M} />}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 18px 140px', position: 'relative', zIndex: 1 }}>

        {/* ── Mascot greeting ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 22 }}>
          {/* Mascot */}
          <div style={{ flexShrink: 0, filter: `drop-shadow(0 6px 18px ${accent}40)` }}>
            <BicPencil pose="celebrate" size={72} />
          </div>

          {/* Speech bubble */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: isNova ? 'rgba(124,58,237,0.18)' : isBlaze ? '#FFD700' : `${accent}12`,
              border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}30`,
              borderRadius: isBlaze ? '12px 12px 12px 0' : '18px 18px 18px 0',
              padding: '12px 16px',
              boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 4px 18px ${accent}18`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Nunito, sans-serif' }}>
                {M.name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isNova ? '#F8F7FF' : isBlaze ? '#0d0d0d' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
                {mascotGreeting}
              </div>
            </div>
            {/* Bubble tail */}
            <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '0 solid transparent', borderTop: `10px solid ${isBlaze ? '#0d0d0d' : `${accent}30`}`, marginLeft: 14 }} />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {[
            { emoji: activeFace.emoji, value: activeFace.display, label: `${activeFace.label} Rank`, color: accent, fade: !rankVisible },
            { emoji: '🔥', value: String(streak || 0), label: 'Streak', color: '#FF9500' },
            { emoji: '⚡', value: xp.toLocaleString(), label: 'XP', color: accent },
            { emoji: '🎓', value: String(doneLessons), label: 'Done', color: M.correctColor },
          ].map((s, i) => (
            <div key={i} onClick={i === 2 ? () => setActiveTab('leaderboard') : undefined}
              style={{ flex: 1, textAlign: 'center', padding: '12px 4px', background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', border: isNova ? '1px solid rgba(255,255,255,0.1)' : `1.5px solid ${s.color}18`, borderRadius: isBlaze ? 10 : 16, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : '0 2px 12px rgba(0,0,0,0.05)', cursor: i === 2 ? 'pointer' : 'default', opacity: s.fade ? 0 : 1, transition: 'opacity 0.5s ease' }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{s.emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: isNova ? '#F8F7FF' : s.color, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Nunito, sans-serif', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Subject card — Mathematics ── */}
        <div style={{ background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', border: isBlaze ? '2.5px solid #0d0d0d' : isNova ? '1px solid rgba(255,255,255,0.12)' : `1.5px solid ${accent}20`, borderRadius: isBlaze ? 14 : 24, overflow: 'hidden', boxShadow: isBlaze ? '4px 4px 0 #0d0d0d' : `0 8px 32px ${accent}14`, marginBottom: 16 }}>

          {/* Card header */}
          <div style={{ background: heroGradient, padding: '18px 20px 16px', position: 'relative', overflow: 'hidden' }}>
            {!isBlaze && <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: isBlaze ? 12 : 16, flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.22)', border: `2px solid ${isBlaze ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                📐
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 3 }}>
                  Subject
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
                  Mathematics
                </div>
                <div style={{ fontSize: 11, color: isBlaze ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginTop: 2 }}>
                  {student?.class_level} · {doneLessons}/{totalLessons} lessons
                </div>
              </div>
              {/* Overall progress ring */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{overallPct}%</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>done</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, marginTop: 14, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: isBlaze ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)', borderRadius: 99, transition: 'width 0.9s ease', boxShadow: isBlaze ? 'none' : '0 0 8px rgba(255,255,255,0.6)' }} />
            </div>
          </div>

          {/* Topic previews */}
          <div style={{ padding: '14px 16px' }}>
            {previewTopics.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {previewTopics.map((topic, i) => {
                  const subs = topic.subtopics || []
                  const done = subs.filter(s => completedIds.has(s.id)).length
                  const pct  = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0
                  const tAcc = termAccents[i % termAccents.length]
                  return (
                    <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: isBlaze ? 8 : 10, flexShrink: 0, background: `${tAcc}18`, border: `1.5px solid ${tAcc}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'monospace', fontWeight: 900, color: tAcc }}>
                        {getTopicIcon(topic.title)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic.title}</div>
                        <div style={{ height: 4, background: isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? M.correctColor : tAcc, borderRadius: 99, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: bodyColor, fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>{done}/{subs.length}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0 10px', color: bodyColor, fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>
                Content coming soon for {student?.class_level}!
              </div>
            )}

            {/* Continue / Start button */}
            <button
              onClick={() => doneLessons > 0 ? setActiveTab('learn') : setActiveTab('learn')}
              style={{
                width: '100%', padding: '14px', cursor: 'pointer', textAlign: 'center',
                background: isBlaze ? '#0d0d0d' : accent,
                border: 'none', borderRadius: isBlaze ? 8 : 14,
                fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 900,
                color: '#fff', boxShadow: isBlaze ? '3px 3px 0 rgba(0,0,0,0.25)' : `0 4px 16px ${accent}45`,
              }}>
              {doneLessons === 0 ? '▶ Start Learning' : doneLessons === totalLessons ? '✓ Review Topics' : '▶ Continue Learning'}
            </button>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActiveTab('challenge')}
            style={{ flex: 1, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', background: 'rgba(255,196,0,0.1)', border: '1.5px solid rgba(255,196,0,0.35)', borderRadius: isBlaze ? 10 : 16, fontFamily: 'Nunito, sans-serif', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -8, right: 8, background: 'linear-gradient(135deg,#FFD700,#FF9500)', color: '#fff', fontSize: 8, fontWeight: 900, borderRadius: 20, padding: '2px 8px', fontFamily: 'Nunito, sans-serif' }}>+50 XP</div>
            <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#A06000', fontFamily: 'Nunito, sans-serif' }}>Daily Challenge</div>
          </button>
          <button onClick={() => setActiveTab('practice')}
            style={{ flex: 1, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', background: isNova ? 'rgba(255,255,255,0.06)' : `${accent}08`, border: isNova ? '1px solid rgba(255,255,255,0.1)' : `1.5px solid ${accent}25`, borderRadius: isBlaze ? 10 : 16, fontFamily: 'Nunito, sans-serif' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>✏️</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif' }}>Practice</div>
          </button>
          <button onClick={() => setActiveTab('leaderboard')}
            style={{ flex: 1, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(255,196,0,0.06)', border: '1.5px solid rgba(255,196,0,0.2)', borderRadius: isBlaze ? 10 : 16, fontFamily: 'Nunito, sans-serif' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>👑</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#A06000', fontFamily: 'Nunito, sans-serif' }}>Rankings</div>
          </button>
        </div>

        {/* ── Profile switcher shortcut (if multiple profiles) ── */}
        {allStudents.length > 1 && (
          <button onClick={() => setShowSwitcher(true)}
            style={{ width: '100%', padding: '13px', cursor: 'pointer', background: 'transparent', border: `1.5px solid ${accent}30`, borderRadius: isBlaze ? 8 : 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Nunito, sans-serif', color: accent, fontSize: 13, fontWeight: 800 }}>
            <span style={{ fontSize: 18 }}>👥</span>
            Switch Profile
          </button>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // LEARN TAB
  // Design: centred vertical spine, all nodes centred, labels below
  // ══════════════════════════════════════════════════════════════════════════
  const LearnTab = (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      background: isNova ? '#0F0C29' : M.mapBg || '#F4F5FA',
    }}>
      {isNova && <NovaStars />}

      <div
        ref={pathScrollRef}
        onScroll={handlePathScrollFull}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Path starts immediately — all context lives on Home tab */}

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
              const { sub, tAccent, isDone, isCurrent, isLocked, subIdx, globalIdx } = item
              const isSelected = selectedNode?.sub?.id === sub.id
              const nodeSize = isCurrent ? 64 : isDone ? 52 : isLocked ? 38 : 46

              return (
                <div key={`lesson-${sub.id}`} ref={isCurrent ? currentNodeRef : null} style={{ position: 'relative', zIndex: 2, marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexDirection: globalIdx % 2 === 0 ? 'row' : 'row-reverse', alignItems: 'center', paddingLeft: globalIdx % 2 === 0 ? '5%' : 0, paddingRight: globalIdx % 2 === 0 ? 0 : '5%', gap: 10, paddingBottom: 2 }}>
                    <button
                      onClick={() => !isLocked && setSelectedNode(isSelected ? null : { sub, isCurrent, isDone, tAccent })}
                      style={{
                        width: Math.round(nodeSize * 1.2), height: nodeSize, borderRadius: '40%', flexShrink: 0, position: 'relative',
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
                        : <span style={{ fontSize: nodeSize * 0.40, opacity: 0.8 }}>{M.emoji}</span>
                      }
                    </button>

                    <div style={{ textAlign: 'left', maxWidth: isCurrent ? 200 : 170 }}>
                      <div style={{ fontSize: isCurrent ? 14 : 12, fontWeight: isCurrent ? 900 : isDone ? 500 : 600, color: isDone ? bodyColor : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.35 }}>
                        {sub.title}
                      </div>
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

      {/* STICKY TOPIC BANNER — big, full-width, Duolingo-style */}
      {stickyTopic && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          pointerEvents: 'none',
        }}>
          <div style={{
            background: isNova ? 'rgba(10,8,32,0.96)' : isBlaze ? '#FFD700' : `${M.hudBg || '#fff'}F5`,
            backdropFilter: 'blur(20px)',
            borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : `${accent}20`}`,
            padding: '10px 20px 10px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: isBlaze ? 'none' : '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            {/* Term badge */}
            {(() => {
              // Find which term this topic belongs to
              const termEntry = (level?.terms || []).find(t =>
                (t.units || []).some(u =>
                  (u.topics || []).some(tp => tp.title === stickyTopic)
                )
              )
              const termIdx = termEntry ? (level?.terms || []).indexOf(termEntry) : 0
              const tAcc = termAccents[termIdx % termAccents.length]
              return (
                <>
                  <div style={{
                    flexShrink: 0, background: tAcc, borderRadius: isBlaze ? 6 : 10,
                    padding: '4px 10px', fontSize: 9, fontWeight: 900,
                    color: '#fff', fontFamily: 'Nunito, sans-serif',
                    textTransform: 'uppercase', letterSpacing: 1,
                    boxShadow: `0 3px 10px ${tAcc}55`,
                  }}>
                    {termEntry ? termEntry.name.split(' ').slice(0, 2).join(' ') : 'Term'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 900,
                      color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary,
                      fontFamily: 'Nunito, sans-serif', lineHeight: 1.1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {stickyTopic}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* JUMP-TO-CURRENT — smooth fade in/out */}
      {nextLesson && (
        <div style={{
          position: 'absolute', bottom: 90, right: 16, zIndex: 11,
          opacity: currentNodeDir ? 1 : 0,
          transform: currentNodeDir ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(8px)',
          pointerEvents: currentNodeDir ? 'auto' : 'none',
          transition: 'opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.34,1.1,0.64,1)',
        }}>
          <button
            onClick={jumpToCurrent}
            style={{
              width: 46, height: 46, borderRadius: '50%', cursor: 'pointer',
              background: isBlaze ? '#FFD700' : accent,
              border: isBlaze ? '2px solid #0d0d0d' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900,
              boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 20px ${accent}65`,
              color: isBlaze ? '#0d0d0d' : '#fff',
            }}>
            {currentNodeDir === 'up' ? '↑' : '↓'}
          </button>
        </div>
      )}

      {/* CONTINUE BANNER — smooth fade, visible when current node is on screen */}
      {nextLesson && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          zIndex: 11, width: 'calc(100% - 32px)', maxWidth: 420,
          opacity: currentNodeDir === null ? 1 : 0,
          pointerEvents: currentNodeDir === null ? 'auto' : 'none',
          transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <button
            onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', cursor: 'pointer',
              background: isBlaze ? '#FFD700' : isNova ? 'linear-gradient(135deg,#7C3AED,#4C1D95)' : `linear-gradient(135deg,${accent},${M.accent2 || accent}DD)`,
              border: isBlaze ? '2.5px solid #0d0d0d' : 'none',
              borderRadius: isBlaze ? 14 : 22,
              boxShadow: isBlaze ? '4px 4px 0 #0d0d0d' : `0 8px 28px ${accent}55`,
              fontFamily: 'Nunito, sans-serif',
            }}>
            {/* Play circle */}
            <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: isBlaze ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: isBlaze ? '#0d0d0d' : '#fff' }}>▶</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>Continue</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: isBlaze ? '#0d0d0d' : '#fff', fontFamily: 'Nunito, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextLesson.title}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: isBlaze ? '#fff' : accent, background: isBlaze ? '#0d0d0d' : '#fff', borderRadius: isBlaze ? 8 : 20, padding: '8px 16px', flexShrink: 0, fontFamily: 'Nunito, sans-serif', boxShadow: isBlaze ? '2px 2px 0 rgba(0,0,0,0.2)' : `0 3px 10px ${accent}40` }}>Go →</div>
          </button>
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
    : isRoots  ? 'linear-gradient(160deg,#C0392B,#8B1A1A)'
    : isBlaze  ? 'linear-gradient(160deg,#E63946,#1D3557)'
    : `linear-gradient(160deg,${accent},${M.accent2 || accent})`

  const PROFILE_AVATAR_COLORS = ['#7C3AED', '#0d9488', '#f97316', '#8b5cf6', '#e11d48', '#0ea5e9']

  const ProfileTab = (
    <div style={{ paddingBottom: 120 }}>

      {/* ── Hero banner ── */}
      <div style={{ background: heroBg, padding: '28px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        {isRoots && <AnkaraStripe />}
        {!isBlaze && <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />}
        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.22)', border: '3px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif', boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>
              {student?.display_name?.[0]?.toUpperCase() || '🧑🏾'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif', lineHeight: 1.1, marginBottom: 3 }}>
                {student?.display_name || 'Student'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>
                {student?.class_level}{student?.school ? ` · ${student.school}` : ''}
              </div>
            </div>
            {/* Edit button — opens the edit form */}
            <button
              onClick={() => setEditOpen(v => !v)}
              style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, color: editOpen ? (isBlaze ? '#0d0d0d' : accent) : '#fff', background: editOpen ? '#fff' : 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
              {editOpen ? '✓ Done' : '✏️ Edit'}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: xp.toLocaleString(), label: 'Total XP',  color: '#FFD700' },
              { v: monthlyXp,           label: 'Monthly XP', color: '#fff' },
              { v: `${streak}`,         label: '🔥 Streak',  color: '#fff' },
              { v: completedIds.size,   label: 'Lessons',    color: '#fff' },
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: stat.color, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>{stat.v}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif', marginTop: 3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '18px 18px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Edit form — collapsed by default, opens on Edit tap ── */}
        {editOpen && (
          <div style={{ background: M.cardBg, border: `2px solid ${accent}30`, borderRadius: M.cardRadius, padding: '18px 16px', boxShadow: `0 4px 20px ${accent}18`, animation: 'slideDown 0.22s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif', marginBottom: 14 }}>
              Edit Profile
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>Display Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>Class</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {CLASS_OPTIONS.map(cl => (
                    <button key={cl} onClick={() => setEditClass(cl)}
                      style={{ padding: '9px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, border: editClass === cl ? `2px solid ${accent}` : `1.5px solid ${accent}25`, background: editClass === cl ? accent : 'transparent', color: editClass === cl ? '#fff' : (isNova ? 'rgba(255,255,255,0.7)' : M.textSecondary), transition: 'all 0.15s' }}>
                      {cl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', display: 'block', marginBottom: 5 }}>School</label>
                <input value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="Your school name" style={inputStyle} />
              </div>
              <button onClick={() => { saveProfile(); setEditOpen(false) }} disabled={saving}
                style={{ ...M.primaryBtn, width: '100%', marginTop: 4, opacity: saving ? 0.7 : 1, fontSize: 14 }}>
                {saving ? 'Saving…' : saveMsg ? `✓ ${saveMsg}` : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── All profiles on this account ── */}
        <div style={{ background: M.cardBg, border: M.cardBorder, borderRadius: M.cardRadius, padding: '16px', boxShadow: M.cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>
              Profiles on this account
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: bodyColor, fontFamily: 'Nunito, sans-serif' }}>
              {allStudents.length} profile{allStudents.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {allStudents.map((s, i) => {
              const isActive = s.id === student?.id
              const avatarBg = PROFILE_AVATAR_COLORS[i % PROFILE_AVATAR_COLORS.length]
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: isBlaze ? 8 : 14, background: isActive ? (isNova ? 'rgba(124,58,237,0.12)' : `${accent}08`) : (isNova ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'), border: isActive ? `1.5px solid ${accent}40` : `1.5px solid ${isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', boxShadow: isActive ? `0 3px 10px ${avatarBg}55` : 'none' }}>
                    {s.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isNova ? '#F8F7FF' : M.textPrimary, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.display_name}
                      {isActive && <span style={{ fontSize: 9, fontWeight: 900, color: accent, background: `${accent}16`, borderRadius: 20, padding: '2px 7px' }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: 10, color: bodyColor, fontWeight: 500, marginTop: 2 }}>{s.class_level}{s.school ? ` · ${s.school}` : ''}</div>
                  </div>
                  {!isActive && (
                    <button onClick={() => setShowSwitcher(true)}
                      style={{ fontSize: 11, fontWeight: 800, color: accent, background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>
                      Switch
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <button onClick={() => setShowSwitcher(true)}
            style={{ width: '100%', padding: '11px', cursor: 'pointer', background: 'transparent', border: `2px dashed ${accent}35`, borderRadius: isBlaze ? 8 : 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Nunito, sans-serif', color: accent, fontSize: 13, fontWeight: 800 }}>
            <span style={{ fontSize: 18 }}>+</span> Add another profile
          </button>
        </div>

        {/* ── Learning mode ── */}
        <button onClick={() => setShowModePicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: isBlaze ? 10 : 18, cursor: 'pointer', textAlign: 'left', width: '100%', background: isBlaze ? 'linear-gradient(135deg,#FFD700,#FFA500)' : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(76,29,149,0.15))' : isRoots ? 'linear-gradient(135deg,rgba(192,57,43,0.15),rgba(46,106,79,0.1))' : `linear-gradient(135deg,${accent}1A,${M.accent2 || accent}0D)`, border: isBlaze ? '2px solid #0d0d0d' : isNova ? '1px solid rgba(124,58,237,0.4)' : isRoots ? '1px solid rgba(192,57,43,0.35)' : `1.5px solid ${accent}35`, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow, fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ width: 54, height: 54, borderRadius: isBlaze ? 12 : '50%', flexShrink: 0, background: isBlaze ? '#fff' : isNova ? 'rgba(124,58,237,0.2)' : isRoots ? 'rgba(192,57,43,0.2)' : `${accent}18`, border: isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>{M.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 3 }}>{M.name}</div>
            <div style={{ fontSize: 11, color: isBlaze ? '#555' : bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: 1.4 }}>{M.tagline || 'Tap to change learning style'}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#fff', background: isBlaze ? '#0d0d0d' : isNova ? '#7C3AED' : isRoots ? '#C0392B' : accent, borderRadius: isBlaze ? 6 : 20, padding: '4px 11px', fontFamily: 'Nunito, sans-serif', flexShrink: 0, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none' }}>CHANGE</div>
        </button>

        <button onClick={handleSignOut} style={{ width: '100%', padding: '13px', cursor: 'pointer', background: 'transparent', border: isBlaze ? '2px solid #ef4444' : '1.5px solid #fecaca', borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ef4444', boxShadow: isBlaze ? '2px 2px 0 #ef4444' : 'none' }}>
          Sign Out
        </button>
      </div>

      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )

  // ── Root ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, sans-serif', background: M.mapBg, position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.55} 50%{opacity:1} } @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
      {HUD}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'home'        && HomeTab}
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

      {showWelcome && (
        <WelcomeScreen student={student} onDismiss={() => setShowWelcome(false)} />
      )}

      {showSwitcher && (
        <ProfileSwitcher
          students={allStudents}
          activeId={student?.id}
          onClose={() => setShowSwitcher(false)}
          M={M}
          mode={mode}
        />
      )}
    </div>
  )
}