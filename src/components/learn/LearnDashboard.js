'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { MIBLogo, BicPencil } from '@/components/BiteMarkIcon'
import BottomSheet from '@/components/BottomSheet'
import ModePicker from '@/components/ModePicker'
import ProfileSwitcher from '@/components/ProfileSwitcher'
import WelcomeScreen from '@/components/WelcomeScreen'
import SubjectSwitcher from '@/components/learn/SubjectSwitcher'
import PuzzleMode from '@/components/learn/PuzzleMode'

// ── Educational SVG icon system ─────────────────────────────────────────────
// Clean, academic, consistent — no emojis anywhere
function EduIcon({ id, size = 20, color = 'currentColor', style: extraStyle }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0, ...extraStyle }
  const p = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (id === 'learn' || id === 'book') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
  if (id === 'practice' || id === 'pencil') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  )
  if (id === 'challenge' || id === 'puzzle') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>
    </svg>
  )
  if (id === 'leaderboard' || id === 'rank' || id === 'trophy') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
  if (id === 'profile' || id === 'person') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
  if (id === 'home') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
  if (id === 'xp' || id === 'bolt') return (
    <svg style={s} viewBox="0 0 24 24" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )
  if (id === 'streak' || id === 'flame') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  )
  if (id === 'progress' || id === 'chart') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
  if (id === 'target' || id === 'bullseye') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
  if (id === 'users' || id === 'people') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
  if (id === 'lessons' || id === 'scroll') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
  if (id === 'brain' || id === 'mind') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14"/>
    </svg>
  )
  if (id === 'star' || id === 'award') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
  if (id === 'shield' || id === 'badge') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
  if (id === 'sword' || id === 'blade') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
      <line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>
    </svg>
  )
  if (id === 'crown') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21 6l-2 8H5L3 6l4.094 3.164a1 1 0 0 0 1.516-.294z"/>
      <path d="M5 21h14"/><path d="M5 17h14"/>
    </svg>
  )
  if (id === 'infinity') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/><path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
    </svg>
  )
  if (id === 'sparkle' || id === 'spark') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  )
  if (id === 'compass' || id === 'seeker') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  )
  if (id === 'close' || id === 'x') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
  if (id === 'switch' || id === 'mode') return (
    <svg style={s} viewBox="0 0 24 24" {...p}>
      <path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 1-10-10"/><path d="m12 6-4 4 4 4"/><path d="m12 18 4-4-4-4"/>
    </svg>
  )
  return null
}
// Alias for backwards compat
const TabIcon = EduIcon

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

const supabase = createClient()

// ── Responsive breakpoint hook ───────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}


export default function LearnDashboard({ student: initialStudent, allStudents = [], profileId, level, progress }) {
  const router   = useRouter()
  const { M, mode } = useMode()

  const [student,         setStudent]         = useState(initialStudent)
  const [currentLevel,    setCurrentLevel]    = useState(level)
  useSessionTracker(student?.id)   // passive ping every 60s — admin analytics only
  const [progressData,    setProgressData]    = useState(progress)
  // ── Leaderboard: all 3 boards pre-fetched in parallel for instant switching ──
  const [boards,          setBoards]          = useState({ class: [], school: [], overall: [] })
  const [leaderboardType, setLeaderboardType] = useState('class')
  const [boardsLoaded,    setBoardsLoaded]    = useState(false)
  // Rotating rank display: cycles class → school → overall every 3s
  const [rankFaceIdx,     setRankFaceIdx]     = useState(0)
  const [rankVisible,     setRankVisible]     = useState(true)
  const searchParams = useSearchParams()
  const [activeTab,       setActiveTab]       = useState(() => {
    // Allow external navigation to open a specific tab: /learn?tab=learn
    const t = searchParams?.get('tab')
    return ['home','learn','practice','challenge','rank','profile'].includes(t) ? t : 'home'
  })
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
  const [activeSubject,   setActiveSubject]   = useState(initialStudent?.active_subject || 'maths')
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)

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
        supabase.from('students').select('xp, monthly_xp, streak_days, fm_xp, fm_monthly_xp, subjects, active_subject, learning_mode, exam_type, exam_subject').eq('id', initialStudent.id).single(),
      ])
      if (prog.data) setProgressData(prog.data)
      if (stud.data) setStudent(s => ({ ...s, ...stud.data }))
    }
    refreshAll()
    window.addEventListener('focus', refreshAll)
    return () => window.removeEventListener('focus', refreshAll)
  }, [initialStudent?.id])

  // Pre-fetch all 3 leaderboards in one go as soon as we have student data.
  // Re-fetch when activeSubject changes so the leaderboard reflects the right XP column.
  useEffect(() => {
    if (!student?.id) return
    async function fetchAll() {
      try {
        const classParams   = new URLSearchParams({ type: 'class',   subject: activeSubject })
        const schoolParams  = new URLSearchParams({ type: 'school',  subject: activeSubject })
        const overallParams = new URLSearchParams({ type: 'overall', subject: activeSubject })
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
  }, [student?.id, student?.class_level, student?.school, activeSubject])

  // Rotate rank display: class → school → overall, every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRankVisible(false)
      setTimeout(() => { setRankFaceIdx(i => (i + 1) % 3); setRankVisible(true) }, 500)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  // ── Responsive breakpoints ───────────────────────────────────────────────
  const windowWidth  = useWindowWidth()
  const isDesktop    = windowWidth >= 1024
  const isTablet     = windowWidth >= 768 && windowWidth < 1024
  const isMobile     = windowWidth < 768

  // ── Computed ──────────────────────────────────────────────────────────────
  const completedIds = new Set(progressData.filter(p => p.status === 'completed').map(p => p.subtopic_id))
  const isFM      = activeSubject === 'further_maths'
  const isExamMode = student?.learning_mode === 'exam'

  // Re-fetch level curriculum when subject or class changes
  // In exam mode: merge SS1+SS2+SS3 into one synthetic level
  // Exam mode: load all subtopics across SS1+SS2+SS3 as one flat path
  const [examSubtopics, setExamSubtopics] = useState([])
  useEffect(() => {
    if (!isExamMode) { setExamSubtopics([]); return }
    const examSubject = isFM ? 'further_maths' : 'maths'
    const ssCodes = isFM ? ['FM_SS1','FM_SS2','FM_SS3'] : ['SS1','SS2','SS3']
    async function loadExamPath() {
      const { data: levels } = await supabase
        .from('levels').select('id, code').in('code', ssCodes)
      if (!levels?.length) return
      const levelIds = levels.sort((a,b) => a.code.localeCompare(b.code)).map(l => l.id)
      const allSubs = []
      for (const lid of levelIds) {
        const { data: terms } = await supabase.from('terms').select('id, term_number').eq('level_id', lid).order('term_number')
        for (const t of terms || []) {
          const { data: units } = await supabase.from('units').select('id, order_index').eq('term_id', t.id).order('order_index')
          for (const u of units || []) {
            const { data: topics } = await supabase.from('topics').select('id, title, order_index').eq('unit_id', u.id).order('order_index')
            for (const tp of topics || []) {
              const { data: subs } = await supabase.from('subtopics').select('id, title, order_index, is_published').eq('topic_id', tp.id).order('order_index')
              for (const s of subs || []) allSubs.push({ ...s, topicTitle: tp.title })
            }
          }
        }
      }
      setExamSubtopics(allSubs)
    }
    loadExamPath()
  }, [isExamMode, isFM])

  const lastLevelCode = useRef(null)
  useEffect(() => {
    const isEM = student?.learning_mode === 'exam'
    const code = isFM ? `FM_${student?.class_level}` : student?.class_level
    const cacheKey = isEM ? `exam_${isFM ? 'fm' : 'maths'}` : code
    if (!cacheKey) return
    if (cacheKey === lastLevelCode.current) return
    lastLevelCode.current = cacheKey

    if (isEM) {
      // Exam mode: fetch SS1+SS2+SS3 and merge into one flat level
      const codes = isFM ? ['FM_SS1','FM_SS2','FM_SS3'] : ['SS1','SS2','SS3']
      supabase
        .from('levels')
        .select('*, terms(*, units(*, topics(*, subtopics(*))))')
        .in('code', codes)
        .then(({ data: levels }) => {
          if (!levels?.length) { setCurrentLevel(null); return }
          const merged = { id: 'exam', code: 'EXAM', name: 'Exam Prep',
            terms: levels.flatMap(l => l.terms || []) }
          setCurrentLevel(merged)
        })
    } else {
      if (!code) return
      supabase
        .from('levels')
        .select('*, terms(*, units(*, topics(*, subtopics(*))))')
        .eq('code', code)
        .maybeSingle()
        .then(({ data }) => setCurrentLevel(data || null))
    }
  }, [isFM, student?.learning_mode, student?.class_level])
  const xp        = isFM ? (student?.fm_xp        || 0) : (student?.xp        || 0)
  const monthlyXp = isFM ? (student?.fm_monthly_xp || 0) : (student?.monthly_xp || 0)
  const streak    = student?.streak_days || 0

  const allSubtopics = (currentLevel?.terms || [])
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
    { rank: myClassRank,   label: 'Class',   display: myClassRank >= 0 ? `#${myClassRank + 1}` : '—' },
    { rank: mySchoolRank,  label: 'School',  display: mySchoolRank >= 0 ? `#${mySchoolRank + 1}` : '—' },
    { rank: myOverallRank, label: 'Overall', display: myOverallRank >= 0 ? `#${myOverallRank + 1}` : '—' },
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
              {ModeBtn}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: isBlaze ? 8 : 12, background: isBlaze ? 'rgba(0,0,0,0.06)' : isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: isBlaze ? '1.5px solid #0d0d0d' : `1.5px solid ${isNova ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: M.textSecondary }}>
                <EduIcon id="home" size={16} color="currentColor" />
              </div>
            </button>
            <div style={{ background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.2)' : `${accent}14`, border: isBlaze ? '1.5px solid #0d0d0d' : `1.5px solid ${accent}30`, borderRadius: isBlaze ? 8 : 20, padding: '4px 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
              <EduIcon id="xp" size={12} color={isBlaze ? '#0d0d0d' : accent} />
              <span style={{ fontSize: 12, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: 'Nunito, sans-serif' }}>{xp.toLocaleString()} XP</span>
            </div>
            {ModeBtn}
          </>
        )}
      </div>
    </div>
  )

  // ── Bottom Nav ────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'learn',    icon: 'learn',    label: 'Learn'   },
    { id: 'practice', icon: 'practice', label: 'Practice'},
    { id: 'challenge',icon: 'challenge',label: 'Puzzles' },
    { id: 'rank',     icon: 'shield',   label: 'Ranks'   },
    { id: 'profile',  icon: 'profile',  label: 'Profile' },
  ]


  // ── Side Navigation (tablet/desktop) ────────────────────────────────────
  const SideNav = (
    <div style={{
      width: isDesktop ? 220 : 68,
      flexShrink: 0,
      height: '100vh',
      background: isNova ? 'rgba(15,12,41,0.95)' : M.navBg,
      borderRight: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
      display: 'flex',
      flexDirection: 'column',
      padding: isDesktop ? '24px 12px' : '24px 8px',
      gap: 4,
      overflowY: 'auto',
      position: 'relative',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: isDesktop ? '0 4px 20px' : '0 0 20px', display: 'flex', alignItems: 'center', justifyContent: isDesktop ? 'flex-start' : 'center', overflow: 'hidden', minWidth: 0 }}>
        <MIBLogo size={28} theme={isNova ? 'dark' : 'light'} M={M} style={{ flexShrink: 0 }} />
        {isDesktop && (
          <div style={{ marginLeft: 8, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>MathsInBites</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>Learn · Practice · Win</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      {TABS.map(t => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center',
              gap: isDesktop ? 12 : 0,
              justifyContent: isDesktop ? 'flex-start' : 'center',
              padding: isDesktop ? '10px 14px' : '10px 0',
              borderRadius: isBlaze ? 8 : 12,
              background: isActive
                ? (isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.25)' : `${accent}15`)
                : 'transparent',
              border: isActive && isBlaze ? '1.5px solid #0d0d0d' : 'none',
              cursor: 'pointer',
              width: '100%',
              fontFamily: 'Nunito, sans-serif',
              transition: 'background 0.15s',
            }}>
            <span style={{ lineHeight: 1, flexShrink: 0, color: isActive ? (isBlaze ? '#0d0d0d' : accent) : M.textSecondary }}>
              <TabIcon id={t.id} size={20} color="currentColor" />
            </span>
            {isDesktop && (
              <span style={{
                fontSize: 13, fontWeight: isActive ? 800 : 600,
                color: isActive
                  ? (isBlaze ? '#0d0d0d' : accent)
                  : M.textSecondary,
              }}>{t.label}</span>
            )}
          </button>
        )
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom: mode + profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ModeBtn}
        {ProfileBtn}
      </div>
    </div>
  )

  const BottomNav = activeTab === 'home' ? null : (
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
              <span style={{ color: isActive ? M.navActive : M.navText }}>
                <TabIcon id={t.id} size={isActive ? 20 : 18} color="currentColor" />
              </span>
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

  ;[...(currentLevel?.terms || [])].sort((a, b) => a.term_number - b.term_number).forEach((term, termIdx) => {
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
          pathItems.push({ kind: 'lesson', sub, tAccent, isDone, isCurrent, isLocked, subIdx, topicTitle: topic.title, globalIdx: pathItems.filter(p=>p.kind==='lesson').length })
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
      `Hi ${firstName}! Ready to make today count? Let's learn something great.`,
      `Hey ${firstName}! Every lesson brings you closer to your best. Let's go.`,
      `${firstName}! Maths gets easier one lesson at a time. You've got this.`,
      `Hi ${firstName}! Small steps every day lead to big results. Let's learn.`,
      `Hey ${firstName}! Your future self is counting on today's you. Let's go.`,
      `${firstName}! Champions are made by showing up. You showed up — now let's learn.`,
    ]
    if (doneLessons === 0) return `Welcome to MathsInBites, ${firstName}. Maths made fun, one lesson at a time. Let's begin.`
    if (streak >= 7) return `${firstName}, ${streak} days strong. That's the spirit — keep the momentum going!`
    if (myClassRank === 0) return `${firstName}, you're top of your class. Keep learning and stay on top.`
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

  // ── Mastery Level System ───────────────────────────────────────────────────
  // 12 creative levels inspired by anime, RPG, and academic achievement.
  // XP thresholds are designed to feel achievable: early levels fast,
  // later levels require sustained dedication across an academic term.
  const MASTERY_RANKS = [
    { title: 'Rookie',          minXp: 0,    color: '#94a3b8', icon: 'seeker',   flavor: 'Every master started here.' },
    { title: 'Spark',           minXp: 40,   color: '#60a5fa', icon: 'sparkle',  flavor: 'The fire is beginning to ignite.' },
    { title: 'Seeker',          minXp: 100,  color: '#34d399', icon: 'compass',  flavor: 'Curiosity unlocks everything.' },
    { title: 'Cipher',          minXp: 220,  color: '#a78bfa', icon: 'brain',    flavor: 'Numbers speak to you now.' },
    { title: 'Arithmancer',     minXp: 420,  color: '#f472b6', icon: 'star',     flavor: 'You wield maths like magic.' },
    { title: 'Scholar',         minXp: 700,  color: '#fb923c', icon: 'book',     flavor: 'Knowledge is your superpower.' },
    { title: 'Prodigy',         minXp: 1100, color: '#facc15', icon: 'bolt',     flavor: 'Your peers look up to you.' },
    { title: 'Sage',            minXp: 1600, color: '#2dd4bf', icon: 'infinity', flavor: 'Calm, precise, unstoppable.' },
    { title: 'Apex',            minXp: 2400, color: '#f97316', icon: 'flame',    flavor: 'You operate at another level.' },
    { title: 'Legend',          minXp: 3400, color: '#c084fc', icon: 'crown',    flavor: 'Your name echoes in classrooms.' },
    { title: 'Maths Titan',     minXp: 4800, color: '#e11d48', icon: 'sword',    flavor: 'A force of mathematical nature.' },
    { title: 'Infinity',        minXp: 7000, color: '#fbbf24', icon: 'shield',   flavor: 'Beyond rank. Beyond limits.' },
  ]
  const masteryRank  = MASTERY_RANKS.slice().reverse().find(r => xp >= r.minXp) || MASTERY_RANKS[0]
  const nextRank     = MASTERY_RANKS.find(r => r.minXp > xp)
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((xp - masteryRank.minXp) / (nextRank.minXp - masteryRank.minXp)) * 100))
    : 100

  // ── Rank icon mapping — must be defined before HomeTab uses it ────────────
  const RANK_ICONS = {
    'Rookie':      'seeker',
    'Spark':       'sparkle',
    'Seeker':      'compass',
    'Cipher':      'brain',
    'Arithmancer': 'star',
    'Scholar':     'book',
    'Prodigy':     'bolt',
    'Sage':        'infinity',
    'Apex':        'flame',
    'Legend':      'crown',
    'Maths Titan': 'sword',
    'Infinity':    'shield',
  }

  // ── Rank position computations — must precede HomeTab which uses myPosInRank ─
  const myRankIdx   = MASTERY_RANKS.indexOf(masteryRank)
  const totalInRank = boards.class.filter(e => {
    const eXp = e.xp || 0
    const eRank = MASTERY_RANKS.slice().reverse().find(r => eXp >= r.minXp) || MASTERY_RANKS[0]
    return eRank.title === masteryRank.title
  }).length || 1
  const myPosInRank = boards.class.filter(e => {
    const eXp = e.xp || 0
    const eRank = MASTERY_RANKS.slice().reverse().find(r => eXp >= r.minXp) || MASTERY_RANKS[0]
    return eRank.title === masteryRank.title && (e.xp || 0) > xp
  }).length + 1

  // ── Rotating bubble slides ─────────────────────────────────────────────────
  const [bubbleSlide, setBubbleSlide] = useState(0)
  const [bubbleFade,  setBubbleFade]  = useState(true)
  const bubbleSlides = [
    { type: 'greeting' },
    { type: 'rank'     },
    { type: 'xp'       },
    { type: 'progress' },
  ]
  useEffect(() => {
    const t = setInterval(() => {
      setBubbleFade(false)
      setTimeout(() => {
        setBubbleSlide(s => (s + 1) % bubbleSlides.length)
        setBubbleFade(true)
      }, 280)
    }, 3800)
    return () => clearInterval(t)
  }, [])

  function BubbleContent() {
    const slide = bubbleSlides[bubbleSlide]
    if (slide.type === 'greeting') {
      return (
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Nunito, sans-serif' }}>{M.name} says</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: isNova ? '#F8F7FF' : isBlaze ? '#0d0d0d' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>{mascotGreeting}</div>
        </div>
      )
    }
    if (slide.type === 'rank') {
      return (
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: masteryRank.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Nunito, sans-serif' }}>Your Mastery Rank</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{masteryRank.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: masteryRank.color, fontFamily: 'Nunito, sans-serif' }}>{masteryRank.title}</span>
          </div>
          {nextRank && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>Next: {nextRank.title}</span>
                <span style={{ fontSize: 10, color: accent, fontFamily: 'Nunito, sans-serif', fontWeight: 900 }}>{rankProgress}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: rankProgress + '%', background: 'linear-gradient(90deg,' + masteryRank.color + ',' + (nextRank?.color || accent) + ')', borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', marginTop: 3, fontWeight: 600 }}>{nextRank.minXp - xp} XP to {nextRank.title}</div>
            </div>
          )}
          {!nextRank && <div style={{ fontSize: 12, color: masteryRank.color, fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>You have reached the highest rank!</div>}
        </div>
      )
    }
    if (slide.type === 'xp') {
      return (
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Nunito, sans-serif' }}>Total XP Earned</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: accent, fontFamily: M.headingFont, lineHeight: 1, marginBottom: 2 }}>{xp.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>This month: {monthlyXp.toLocaleString()} XP</div>
        </div>
      )
    }
    if (slide.type === 'progress') {
      return (
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Nunito, sans-serif' }}>Your Progress</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: accent, fontFamily: M.headingFont, lineHeight: 1 }}>{overallPct}%</span>
            <span style={{ fontSize: 12, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>of {totalLessons} lessons done</span>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: overallPct + '%', background: 'linear-gradient(90deg,' + accent + ',' + (M.accent2 || accent) + ')', borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )
    }
    return null
  }

  const HomeTab = (
    <div style={{ height: '100%', overflowY: 'auto', background: isNova ? '#0D0B1E' : '#F5F4F0', position: 'relative' }}>
      {isNova && <NovaStars />}
      <style>{`
        @keyframes hBounce { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-7px)} }
        @keyframes hFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hPulse { 0%,100%{box-shadow:0 0 0 0 var(--pr)} 60%{box-shadow:0 0 0 10px transparent} }
        @keyframes hShimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
        .h-card { transition: transform 0.13s cubic-bezier(0.34,1.2,0.64,1); }
        .h-card:active { transform: scale(0.97); }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 max(80px, calc(60px + env(safe-area-inset-bottom)))' }}>

        {/* ── TOP STRIPE: greeting + mascot ── */}
        <div style={{
          background: isNova
            ? `linear-gradient(160deg, ${accent}25 0%, transparent 60%)`
            : `linear-gradient(160deg, ${accent} 0%, ${M.accent2 || accent}CC 100%)`,
          padding: '28px 22px 36px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position:'absolute', right:-40, top:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:30, bottom:-60, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'flex-end', gap:16, position:'relative', zIndex:1 }}>
            {/* Mascot */}
            <div style={{ flexShrink:0, animation:'hBounce 3.2s ease-in-out infinite', filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.22))' }}>
              <BicPencil pose="happy" size={88} />
            </div>
            {/* Greeting */}
            <div style={{ flex:1, minWidth:0, paddingBottom:6 }}>
              <div style={{ fontSize:13, fontWeight:700, color: isNova ? accent : 'rgba(255,255,255,0.82)', fontFamily:'Nunito, sans-serif', marginBottom:5 }}>
                {isNova ? (firstName ? `Hey ${firstName}` : 'Welcome back') : (firstName ? `Hey ${firstName}` : 'Welcome back')}
              </div>
              <div style={{ fontSize:20, fontWeight:900, color: isNova ? '#F0EFFF' : '#fff', fontFamily: M.headingFont, lineHeight:1.2, marginBottom:8 }}>
                {doneLessons === 0
                  ? 'Ready to begin?'
                  : myClassRank === 0
                  ? 'Top of the class!'
                  : streak >= 7
                  ? `${streak} days strong`
                  : overallPct >= 80
                  ? 'Almost finished!'
                  : nextRank
                  ? `${nextRank.minXp - xp} XP to ${nextRank.title}`
                  : 'Max rank reached!'}
              </div>
              {/* XP + streak pills */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.18)', borderRadius:99, padding:'5px 12px' }}>
                  <EduIcon id="bolt" size={12} color={isNova ? accent : '#fff'} />
                  <span style={{ fontSize:12, fontWeight:900, color: isNova ? accent : '#fff', fontFamily:'Nunito, sans-serif' }}>{xp.toLocaleString()} XP</span>
                </div>
                {streak > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.18)', borderRadius:99, padding:'5px 12px' }}>
                    <EduIcon id="flame" size={12} color={isNova ? '#f97316' : '#fff'} />
                    <span style={{ fontSize:12, fontWeight:900, color: isNova ? '#f97316' : '#fff', fontFamily:'Nunito, sans-serif' }}>{streak}d streak</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RANK BANNER (pulled up, overlaps hero) ── */}
        <div style={{ padding:'0 16px', marginTop:-18, position:'relative', zIndex:10, animation:'hFadeUp 0.35s ease both' }}>
          <button
            onClick={() => setActiveTab('rank')}
            className="h-card"
            style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background: isNova ? '#1A1733' : '#fff', borderRadius:18, boxShadow: isNova ? `0 4px 24px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.12)', border: `1.5px solid ${masteryRank.color}30`, cursor:'pointer', textAlign:'left' }}
          >
            {/* Rank icon */}
            <div style={{ width:46, height:46, borderRadius:14, background:`linear-gradient(145deg,${masteryRank.color}28,${masteryRank.color}0E)`, border:`2px solid ${masteryRank.color}45`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <EduIcon id={RANK_ICONS[masteryRank.title] || 'star'} size={22} color={masteryRank.color} />
            </div>
            {/* Rank info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                <span style={{ fontSize:15, fontWeight:900, color:masteryRank.color, fontFamily:'Nunito, sans-serif' }}>{masteryRank.title}</span>
                {nextRank && <span style={{ fontSize:10, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>{nextRank.minXp - xp} XP to {nextRank.title}</span>}
              </div>
              <div style={{ height:6, background: isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:rankProgress+'%', background:`linear-gradient(90deg,${masteryRank.color},${nextRank?.color||masteryRank.color})`, borderRadius:99, transition:'width 1.2s ease' }} />
              </div>
            </div>
            <EduIcon id="compass" size={14} color={bodyColor} />
          </button>
        </div>

        {/* ── SUBJECT SWITCHER ── */}
        <div style={{ padding:'16px 16px 0', animation:'hFadeUp 0.35s 0.05s ease both' }}>
          <SubjectSwitcher
            student={student}
            nextLesson={nextLesson}
            onSubjectChange={async (subj) => {
              setActiveSubject(subj)
              const { data: fresh } = await supabase
                .from('students')
                .select('xp, monthly_xp, streak_days, fm_xp, fm_monthly_xp, subjects, active_subject')
                .eq('id', student.id).single()
              if (fresh) setStudent(s => ({ ...s, ...fresh }))
              else setStudent(s => ({ ...s, active_subject: subj }))
            }}
            onContinue={() => {
              setActiveTab('learn')
              setTimeout(() => { currentNodeRef.current?.scrollIntoView({ behavior:'smooth', block:'center' }) }, 120)
            }}
          />
        </div>

        {/* ── CONTINUE LEARNING — FOCAL HERO CARD ── */}
        {nextLesson && (
          <div style={{ padding:'12px 16px 0', animation:'hFadeUp 0.35s 0.08s ease both' }}>
            <button
              onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)}
              className="h-card"
              style={{
                width:'100%', cursor:'pointer', textAlign:'left', border:'none',
                background: isNova
                  ? `linear-gradient(140deg,${accent}28,${accent}12)`
                  : `linear-gradient(140deg,${accent},${M.accent2||accent}DD)`,
                borderRadius:22, padding:'22px 22px 20px',
                boxShadow: isNova ? `0 0 0 1.5px ${accent}40, 0 10px 36px ${accent}28` : `0 10px 36px ${accent}50`,
                position:'relative', overflow:'hidden',
              }}
            >
              {/* shimmer sweep */}
              {!isNova && (
                <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:22 }}>
                  <div style={{ position:'absolute', top:0, bottom:0, width:'40%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)', animation:'hShimmer 3.5s ease-in-out infinite' }} />
                </div>
              )}
              <div style={{ position:'absolute', right:-24, top:-24, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />

              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ fontSize:10, fontWeight:900, color: isNova ? accent+'BB' : 'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:1.8, fontFamily:'Nunito, sans-serif', marginBottom:10 }}>
                  Continue Learning
                </div>
                <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:16 }}>
                  {/* Icon */}
                  <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.32)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.28)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <EduIcon id="book" size={26} color="#fff" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:18, fontWeight:900, color: isNova ? '#F0EFFF' : '#fff', fontFamily:M.headingFont, lineHeight:1.2, marginBottom:3 }}>{nextLesson.title}</div>
                    <div style={{ fontSize:11, color: isNova ? accent+'AA' : 'rgba(255,255,255,0.72)', fontFamily:'Nunito, sans-serif', fontWeight:600 }}>{nextLesson.topicTitle || 'Next lesson'}</div>
                  </div>
                </div>
                {/* Progress */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:11, color: isNova ? '#ccc' : 'rgba(255,255,255,0.8)', fontFamily:'Nunito, sans-serif', fontWeight:700 }}>{doneLessons} / {totalLessons} done</span>
                    <span style={{ fontSize:12, fontWeight:900, color:'#fff', fontFamily:'Nunito, sans-serif' }}>{overallPct}%</span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.22)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:overallPct+'%', background: isNova ? accent : 'rgba(255,255,255,0.9)', borderRadius:99, transition:'width 1.1s ease' }} />
                  </div>
                </div>
                {/* CTA pill */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background: isNova ? accent : 'rgba(255,255,255,0.95)', color: isNova ? '#fff' : accent, borderRadius:12, padding:'10px 22px', fontSize:14, fontWeight:900, fontFamily:'Nunito, sans-serif', boxShadow: isNova ? `0 4px 14px ${accent}50` : '0 4px 14px rgba(0,0,0,0.14)' }}>
                  Continue
                  <span style={{ fontSize:16 }}>→</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── SECONDARY GRID ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'12px 16px 0', animation:'hFadeUp 0.35s 0.12s ease both' }}>
          {[
            { id:'practice',  label:'Practice',  desc:'Build speed & accuracy', icon:'pencil',  color:'#3b82f6', tab:'practice'  },
            { id:'challenge', label:'Puzzles',   desc:'Daily brain challenge',  icon:'puzzle',  color:'#f59e0b', tab:'challenge' },
          ].map(card => (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.tab)}
              className="h-card"
              style={{ padding:'18px 16px', background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', border:'none', borderRadius:20, cursor:'pointer', textAlign:'left', boxShadow: isNova ? 'none' : '0 3px 16px rgba(0,0,0,0.07)' }}
            >
              <div style={{ width:42, height:42, borderRadius:13, background:`linear-gradient(145deg,${card.color}22,${card.color}0D)`, border:`1.5px solid ${card.color}28`, boxShadow:`0 3px 10px ${card.color}18, inset 0 1px 0 rgba(255,255,255,0.5)`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                <EduIcon id={card.icon} size={20} color={card.color} />
              </div>
              <div style={{ fontSize:14, fontWeight:900, color: isNova ? '#F0EFFF' : '#1a1a1a', fontFamily:'Nunito, sans-serif', marginBottom:3 }}>{card.label}</div>
              <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, lineHeight:1.45 }}>{card.desc}</div>
            </button>
          ))}
        </div>

        {/* ── SWITCH STYLE + PROFILE SWITCHER ── */}
        <div style={{ padding:'10px 16px 0', animation:'hFadeUp 0.35s 0.18s ease both' }}>
          <button
            onClick={() => setShowModePicker(true)}
            className="h-card"
            style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'transparent', border:`1.5px solid ${isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.09)'}`, borderRadius:16, cursor:'pointer', textAlign:'left' }}
          >
            <div style={{ width:36, height:36, borderRadius:11, background: isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <EduIcon id="switch" size={17} color={bodyColor} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color: isNova?'rgba(255,255,255,0.78)':M.textPrimary, fontFamily:'Nunito, sans-serif', marginBottom:1 }}>Switch Style</div>
              <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>Mascot · theme · learning mode</div>
            </div>
            <EduIcon id="compass" size={13} color={bodyColor} />
          </button>

          {allStudents.length > 1 && (
            <button onClick={() => setShowSwitcher(true)} style={{ width:'100%', marginTop:8, padding:'12px 16px', background:'transparent', border:`1px solid ${accent}22`, borderRadius:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Nunito, sans-serif', color:accent, fontSize:12, fontWeight:800 }}>
              <EduIcon id="users" size={14} color={accent} />
              Switch Profile
            </button>
          )}
        </div>

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

      {/* ── EXAM MODE — completely different experience ── */}
      {isExamMode && (() => {
        const examTotal  = examSubtopics.length || allSubtopics.length
        const examDone   = (examSubtopics.length ? examSubtopics : allSubtopics).filter(s => completedIds.has(s.id)).length
        const examPct    = examTotal > 0 ? Math.round((examDone / examTotal) * 100) : 0
        const readyLabel = examPct < 30 ? 'Just Starting' : examPct < 55 ? 'Building Up' : examPct < 80 ? 'Getting Ready' : 'Exam Ready'
        const readyColor = examPct < 30 ? '#94a3b8' : examPct < 55 ? '#F59E0B' : examPct < 80 ? '#3b82f6' : '#22c55e'

        // Weak areas = topics with lowest completion ratio (at least 1 sub attempted)
        const topicStats = allTopics.map(t => {
          const subs  = t.subtopics || []
          const done  = subs.filter(s => completedIds.has(s.id)).length
          return { title: t.title, total: subs.length, done, pct: subs.length > 0 ? Math.round((done/subs.length)*100) : 0, firstSub: subs[0] }
        }).filter(t => t.total > 0)
        const weakAreas   = topicStats.filter(t => t.done > 0 && t.pct < 70).sort((a,b) => a.pct - b.pct).slice(0, 4)
        const strongAreas = topicStats.filter(t => t.pct >= 80).slice(0, 3)

        const subs = examSubtopics.length ? examSubtopics : allSubtopics
        const nextExamLesson = subs.find(s => !completedIds.has(s.id))

        return (
          <div style={{ overflowY: 'auto', flex: 1, padding: `16px 18px ${isMobile ? 'max(160px, calc(130px + env(safe-area-inset-bottom)))' : '60px'}`, maxWidth: 520, margin: '0 auto', width: '100%' }}>

            {/* Preparation Level — top focal */}
            <div style={{ background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', borderRadius: 22, padding: '20px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>Preparation Level</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: readyColor, fontFamily: M.headingFont, lineHeight: 1 }}>{examPct}%</div>
                </div>
                <div style={{ padding: '6px 14px', background: readyColor + '18', border: `1.5px solid ${readyColor}35`, borderRadius: 99 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: readyColor, fontFamily: 'Nunito, sans-serif' }}>{readyLabel}</span>
                </div>
              </div>
              <div style={{ height: 10, background: 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: examPct + '%', background: `linear-gradient(90deg, ${readyColor}, ${readyColor}CC)`, borderRadius: 99, transition: 'width 1.2s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                {examDone} of {examTotal} topics done · {examTotal - examDone} remaining
              </div>
            </div>

            {/* Practice Questions — primary CTA */}
            <button
              onClick={() => router.push('/learn/practice')}
              style={{ width: '100%', padding: '18px 20px', background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, border: 'none', borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, boxShadow: `0 8px 28px ${accent}40`, textAlign: 'left' }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <EduIcon id="pencil" size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif', marginBottom: 2 }}>Practice Questions</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Past questions · Topic-based · Timed or untimed</div>
              </div>
              <span style={{ color: '#fff', fontSize: 18, opacity: 0.8 }}>→</span>
            </button>

            {/* Jump to next lesson */}
            {nextExamLesson && (
              <button
                onClick={() => router.push(`/learn/lesson/${nextExamLesson.id}`)}
                style={{ width: '100%', padding: '15px 18px', background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', border: `1.5px solid ${accent}22`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, textAlign: 'left', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EduIcon id="book" size={18} color={accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif', marginBottom: 1 }}>Continue Where You Left Off</div>
                  <div style={{ fontSize: 11, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextExamLesson.topicTitle} · {nextExamLesson.title}</div>
                </div>
                <span style={{ color: accent, fontSize: 16 }}>→</span>
              </button>
            )}

            {/* Weak Areas */}
            {weakAreas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <EduIcon id="target" size={14} color="#EF4444" />
                  <span style={{ fontSize: 12, fontWeight: 900, color: M.textPrimary, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif' }}>Weak Areas — Focus Here</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {weakAreas.map(t => (
                    <button
                      key={t.title}
                      onClick={() => t.firstSub && router.push(`/learn/lesson/${t.firstSub.id}`)}
                      style={{ padding: '13px 16px', background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.15)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <EduIcon id="brain" size={16} color="#EF4444" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: t.pct + '%', background: t.pct < 40 ? '#EF4444' : '#F59E0B', borderRadius: 99 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 900, color: t.pct < 40 ? '#EF4444' : '#F59E0B', fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>{t.pct}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Topics — flat scrollable list */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <EduIcon id="scroll" size={14} color={accent} />
                <span style={{ fontSize: 12, fontWeight: 900, color: M.textPrimary, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif' }}>All Topics</span>
                <span style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginLeft: 'auto' }}>Tap any to jump in</span>
              </div>
              <div style={{ background: isNova ? 'rgba(255,255,255,0.05)' : '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {subs.map((sub, i) => {
                  const isDone = completedIds.has(sub.id)
                  const isNext = !isDone && subs.slice(0, i).every(s => completedIds.has(s.id))
                  const showTopicLabel = i === 0 || sub.topicTitle !== subs[i-1]?.topicTitle
                  return (
                    <div key={sub.id}>
                      {showTopicLabel && (
                        <div style={{ padding: '10px 16px 4px', fontSize: 9, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', background: isNova ? 'rgba(255,255,255,0.03)' : `${accent}06`, borderTop: i > 0 ? `1px solid ${isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` : 'none' }}>
                          {sub.topicTitle}
                        </div>
                      )}
                      <div
                        onClick={() => router.push(`/learn/lesson/${sub.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: i < subs.length - 1 ? `1px solid ${isNova ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none', background: isNext ? `${accent}06` : 'transparent' }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isDone ? '#22c55e18' : isNext ? `${accent}14` : 'rgba(0,0,0,0.04)', border: `1.5px solid ${isDone ? '#22c55e' : isNext ? accent : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: isDone ? '#22c55e' : isNext ? accent : bodyColor, flexShrink: 0 }}>
                          {isDone ? '✓' : isNext ? '▶' : String(i+1)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isNext ? 900 : 600, color: isDone ? bodyColor : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</div>
                        </div>
                        {isNext && <span style={{ fontSize: 9, fontWeight: 900, color: accent, background: `${accent}14`, borderRadius: 99, padding: '2px 8px', fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>Next</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

        {!isExamMode && !currentLevel?.terms?.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BicPencil pose="think" size={100} style={{ display: 'inline-block', marginBottom: 18 }} />
            <p style={{ fontWeight: 800, fontSize: 18, color: M.textPrimary, fontFamily: M.headingFont }}>Content coming soon!</p>
            <p style={{ fontSize: 13, marginTop: 6, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>We&apos;re preparing lessons for {student?.class_level}.</p>
          </div>
        )}

        {/* ── LEARNING PATH — centred spine, all nodes centred, labels below ── */}
        <div style={{ maxWidth: 520, margin: '0 auto', padding: `24px 0 ${isMobile ? 'max(170px, calc(140px + env(safe-area-inset-bottom)))' : '80px'}`, position: 'relative' }}>

          {pathItems.map((item, idx) => {

            // ── TERM WORLD BANNER (hidden in exam mode) ──
            if (item.kind === 'term') {
              if (isExamMode) return null
              const { term, termIdx, tAccent, termProg, termDone, termSubs } = item
              const pct   = termSubs.length > 0 ? Math.round((termProg / termSubs.length) * 100) : 0
              const icons = ['I', 'II', 'III', 'IV', 'V']
              return (
                <div key={`term-${term.id}`} style={{ padding: '0 18px', marginBottom: 14, marginTop: termIdx > 0 ? 36 : 0, position: 'relative', zIndex: 2 }}>
                  <div style={{ borderRadius: isBlaze ? 14 : 24, background: isNova ? `linear-gradient(135deg,${tAccent}35,${tAccent}18)` : `linear-gradient(135deg,${tAccent}1A,${tAccent}08)`, border: `2.5px solid ${tAccent}${isNova ? '65' : '45'}`, padding: '18px 20px', position: 'relative', overflow: 'hidden', boxShadow: `0 6px 24px ${tAccent}22` }}>
                    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 72, fontWeight: 900, color: `${tAccent}12`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Nunito, sans-serif' }}>{termIdx + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 48, height: 48, borderRadius: isBlaze ? 12 : 16, flexShrink: 0, background: tAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px ${tAccent}55` }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif' }}>{icons[termIdx % icons.length]}</span>
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
              if (isExamMode) return null
              const { topic, tAccent, doneCount, allDone } = item
              return (
                <div key={`topic-${topic.id}`} ref={el => { topicNodeRefs.current[topic.title] = el }}
                  style={{ padding: '0 16px', marginTop: 32, marginBottom: 18, position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1.5, background: allDone ? `${M.correctColor}45` : `${tAccent}28`, borderRadius: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, maxWidth: '60%' }}>
                      {allDone && <span style={{ fontSize: 12, color: M.correctColor, fontWeight: 900 }}>✓</span>}
                      <span style={{ fontSize: 11, fontWeight: 900, color: allDone ? M.correctColor : isNova ? 'rgba(255,255,255,0.6)' : bodyColor, fontFamily: 'Nunito, sans-serif', letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.45, wordBreak: 'break-word' }}>
                        {topic.title}
                      </span>
                    </div>
                    <div style={{ flex: 1, height: 1.5, background: allDone ? `${M.correctColor}45` : `${tAccent}28`, borderRadius: 1 }} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 5, fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, opacity: 0.65 }}>
                    {allDone ? 'All done' : `${doneCount} of ${topic.subtopics?.length || 0} done`}
                  </div>
                </div>
              )
            }

            // ── LESSON NODE — centred, label below ──
            if (item.kind === 'lesson') {
              const { sub, tAccent, isDone, isCurrent, isLocked, subIdx, globalIdx, topicTitle } = item
              const isSelected = selectedNode?.sub?.id === sub.id
              const nodeSize = isCurrent ? 64 : isDone ? 52 : isLocked ? 38 : 46

              return (
                <div key={`lesson-${sub.id}`} ref={isCurrent ? currentNodeRef : null} style={{
                    position: 'relative', zIndex: 2,
                    padding: '18px 0',
                    paddingLeft:  globalIdx % 4 === 1 ? '18%' : globalIdx % 4 === 3 ? '10%' : '14%',
                    paddingRight: globalIdx % 4 === 1 ? '10%' : globalIdx % 4 === 3 ? '18%' : '14%',
                  }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => !isLocked && setSelectedNode(isSelected ? null : { sub, isCurrent, isDone, tAccent })}
                      style={{
                        width: Math.round(nodeSize * 1.2), height: nodeSize, borderRadius: '40%', flexShrink: 0, position: 'relative',
                        background: isDone ? `linear-gradient(145deg,${M.correctColor},${M.correctColor}99)` : isCurrent ? `linear-gradient(145deg,${accent},${M.accent2 || accent}CC)` : isLocked ? (isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : (isNova ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.07)'),
                        border: isDone ? `3px solid ${M.correctColor}` : isCurrent ? `3px solid ${accent}` : isLocked ? `2px solid ${tAccent}40` : `2.5px solid ${tAccent}55`,
                        boxShadow: isCurrent ? `0 0 0 10px ${accent}16, 0 10px 32px ${accent}48` : isDone ? `0 0 0 6px ${M.correctColor}18, 0 5px 18px ${M.correctColor}32` : isSelected ? `0 0 0 6px ${tAccent}28` : '0 3px 12px rgba(0,0,0,0.11)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isLocked ? 'default' : 'pointer',
                        opacity: isLocked ? 0.55 : 1,
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                      }}>
                      {isCurrent && !isBlaze && (
                        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${accent}28`, animation: 'pulse-glow 2s ease-in-out infinite', pointerEvents: 'none' }} />
                      )}
                      {isDone ? <span style={{ fontSize: nodeSize * 0.32, color: '#fff' }}>✓</span>
                        : isCurrent ? <span style={{ fontSize: nodeSize * 0.36, color: '#fff', marginLeft: 3 }}>▶</span>
                        : subIdx === 0
                          ? <span style={{ fontSize: nodeSize * 0.38, fontFamily: 'monospace', fontWeight: 900, color: isLocked ? `${tAccent}80` : tAccent }}>{getTopicIcon(topicTitle || '')}</span>
                          : isLocked
                            ? <EduIcon id='pencil' size={Math.round(nodeSize * 0.36)} color={`${tAccent}80`} />
                            : <span style={{ fontSize: nodeSize * 0.40, opacity: 0.8 }}>{M.emoji}</span>
                      }
                    </button>
                    {/* Label centered below node */}
                    <div style={{ textAlign: 'center', maxWidth: 140 }}>
                      <div style={{ fontSize: isCurrent ? 13 : 11, fontWeight: isCurrent ? 900 : isDone ? 500 : 700, color: isDone ? bodyColor : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        {sub.title}
                      </div>
                      {isCurrent && <div style={{ fontSize: 10, fontWeight: 800, color: accent, fontFamily: 'Nunito, sans-serif', marginTop: 3 }}>Tap to start →</div>}
                    </div>
                  </div>
                </div>
              )
            }

            // ── TOPIC REVIEW — slanted diamond, side-by-side layout ──
            if (item.kind === 'topic_review') {
              const { topic, tAccent, reviewUnlocked, reviewDone } = item
              return (
                <div key={`review-${topic.id}`} style={{ display: 'flex', justifyContent: 'center', padding: '14px 0', position: 'relative', zIndex: 2 }}>
                  <button
                    onClick={() => reviewUnlocked && router.push(`/learn/practice?topicId=${topic.id}&mode=review`)}
                    style={{
                      background: 'none', border: 'none', cursor: reviewUnlocked ? 'pointer' : 'default',
                      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12,
                      opacity: reviewUnlocked ? 1 : 0.4,
                    }}>
                    {/* Slanted star diamond */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: reviewDone ? 'linear-gradient(135deg,#FFD700,#FF9500)' : reviewUnlocked ? `${tAccent}18` : (isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                      border: `2.5px solid ${reviewDone ? '#FFD700' : reviewUnlocked ? tAccent : (isNova ? 'rgba(255,255,255,0.15)' : '#ddd')}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(12deg)',
                      boxShadow: reviewDone ? '0 0 0 6px rgba(255,210,0,0.18), 0 4px 16px rgba(255,180,0,0.35)' : reviewUnlocked ? `0 0 0 5px ${tAccent}18` : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ transform: 'rotate(-12deg)', fontSize: 20 }}>
                        {reviewDone ? '⭐' : '⭐'}
                      </span>
                    </div>
                    {/* Label beside */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: reviewDone ? '#A06000' : reviewUnlocked ? tAccent : bodyColor, fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>Topic Review</div>
                      <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginTop: 2 }}>{reviewDone ? 'Completed ✓' : reviewUnlocked ? 'Tap to review →' : 'Finish more lessons'}</div>
                    </div>
                  </button>
                </div>
              )
            }

            // ── CHALLENGE BADGE ──
            if (item.kind === 'challenge') {
              return (
                <div key={`challenge-${item.topicsCompletedCount}`} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', position: 'relative', zIndex: 2 }}>
                  <button onClick={() => router.push('/learn/challenge')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 76, height: 76, borderRadius: 24, background: 'linear-gradient(135deg,#FFD700 0%,#FF8C00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 10px rgba(255,180,0,0.12), 0 10px 32px rgba(255,140,0,0.48)', animation: 'float 3s ease-in-out infinite' }}><EduIcon id='trophy' size={34} color='#fff' /></div>
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
          position: 'absolute', bottom: isMobile ? 90 : 24, right: 16, zIndex: 11,
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
          position: 'absolute', bottom: isMobile ? 90 : 24, left: '50%', transform: 'translateX(-50%)',
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
                  {selectedNode.isDone ? 'Completed · +10 XP earned' : selectedNode.isCurrent ? 'Your next lesson' : 'Coming up'}
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
  // Practice greeting rotates daily
  const practiceGreeting = (() => {
    const msgs = [
      'Practice makes perfect. The more you do, the better you get.',
      'Time to sharpen your skills. Every question makes you stronger.',
      'Every question you attempt makes you sharper. Keep going.',
      'The secret to maths is repetition. Practice consistently.',
      'Champions practise even when they do not feel like it. You showed up.',
      'A few focused questions will sharpen your thinking. Let\'s drill.',
    ]
    return msgs[new Date().getDate() % msgs.length]
  })()

  const PracticeTab = (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '20px 18px 120px', maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.4, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>Practice Mode</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: isNova ? '#F0EFFF' : M.textPrimary, fontFamily: M.headingFont, lineHeight: 1.15, marginBottom: 4 }}>Sharpen Your Skills</div>
          <div style={{ fontSize: 13, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{practiceGreeting}</div>
        </div>

        {/* Open Practice CTA */}
        <button
          onClick={() => router.push('/learn/practice')}
          style={{ width: '100%', padding: '20px', background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, boxShadow: `0 10px 32px ${accent}40`, textAlign: 'left' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.35)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <EduIcon id="pencil" size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif', marginBottom: 3 }}>Open Practice</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Questions from your current topics</div>
          </div>
          <span style={{ color: '#fff', fontSize: 20, opacity: 0.8 }}>→</span>
        </button>

        {/* Practice by topic */}
        {allTopics.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: bodyColor, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>Practice by Topic</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allTopics.slice(0, 8).map((topic, i) => {
                const subs     = topic.subtopics || []
                const done     = subs.filter(s => completedIds.has(s.id)).length
                const pct      = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0
                const topicAccents = [accent, '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#f59e0b']
                const ta       = topicAccents[i % topicAccents.length]
                return (
                  <button
                    key={topic.id || topic.title}
                    onClick={() => router.push('/learn/practice')}
                    style={{ padding: '13px 16px', background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', border: `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: ta + '14', border: `1.5px solid ${ta}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <EduIcon id="book" size={16} color={ta} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isNova ? '#F0EFFF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</div>
                      <div style={{ height: 3.5, background: 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: ta, borderRadius: 99 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: ta, fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>{pct}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Done', value: doneLessons, color: '#22c55e', icon: 'star' },
            { label: 'Streak', value: streak + 'd', color: accent, icon: 'flame' },
            { label: 'XP', value: xp.toLocaleString(), color: '#f59e0b', icon: 'bolt' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 12px', background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', borderRadius: 14, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <EduIcon id={s.icon} size={18} color={s.color} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: M.headingFont, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Nunito, sans-serif', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {allTopics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: bodyColor, fontFamily: 'Nunito, sans-serif' }}>
            <EduIcon id="book" size={40} color={accent} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: M.textPrimary, marginBottom: 4 }}>Content coming soon</div>
            <div style={{ fontSize: 12 }}>Topics for {student?.class_level} are on the way</div>
          </div>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // CHALLENGE TAB — Daily Challenge
  const ChallengeTab = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PuzzleMode
        questions={[]}
        topicTitle={nextLesson?.topicTitle || allSubtopics[0]?.topicTitle || 'Maths Puzzle'}
        student={student}
        onComplete={(pts) => setActiveTab('home')}
      />
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // RANK DATA
  const LB_TABS = [
    { id: 'class',   label: student?.class_level || 'My Class', icon: 'class'   },
    { id: 'school',  label: 'My School',                        icon: 'school'  },
    { id: 'overall', label: 'Overall',                          icon: 'overall' },
  ]

  // ══════════════════════════════════════════════════════════════════════════
  // RANK TAB — Journey-based rank progression system
  // Shows: current rank, journey visualization, position in tier, school rank
  // ══════════════════════════════════════════════════════════════════════════

  // ── Rank tab view state ───────────────────────────────────────────────────
  const [rankView, setRankView] = useState('global') // 'global' | 'school'

  // People near me in this rank (2 above + me + up to 5 below)
  const sameRankPeople = (() => {
    const src = rankView === 'school' ? boards.school : boards.class
    const sameRank = src.filter(e => {
      const eR = MASTERY_RANKS.slice().reverse().find(r => (e.xp || 0) >= r.minXp) || MASTERY_RANKS[0]
      return eR.title === masteryRank.title
    }).sort((a,b) => (b.monthly_xp || 0) - (a.monthly_xp || 0))
    const myIdx = sameRank.findIndex(e => e.id === student?.id)
    if (myIdx === -1) return sameRank.slice(0, 7)
    const start = Math.max(0, myIdx - 2)
    const end   = Math.min(sameRank.length, start + 8)
    return sameRank.slice(start, end)
  })()

  const RankTab = (
    <div style={{ height:'100%', overflowY:'auto', background: isNova?'#0D0B1E':'#F5F4F0' }}>
      <style>{`
        @keyframes rFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rBar { from{width:0} }
        @keyframes rPulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>
      <div style={{ maxWidth:480, margin:'0 auto', padding:'0 0 max(90px, calc(70px + env(safe-area-inset-bottom)))' }}>

        {/* ── HERO — gradient header with rank badge ── */}
        <div style={{
          background: isNova
            ? `linear-gradient(160deg,${masteryRank.color}30 0%,transparent 65%)`
            : `linear-gradient(160deg,${masteryRank.color}18 0%,${masteryRank.color}06 100%)`,
          padding:'28px 20px 24px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:160, height:160, borderRadius:'50%', background:`${masteryRank.color}10`, pointerEvents:'none' }} />

          {/* Label */}
          <div style={{ fontSize:10, fontWeight:900, color:masteryRank.color, textTransform:'uppercase', letterSpacing:1.6, fontFamily:'Nunito, sans-serif', marginBottom:16, position:'relative', zIndex:1 }}>
            Your Rank Journey
          </div>

          {/* Rank card */}
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20, position:'relative', zIndex:1, animation:'rFadeUp 0.35s ease both' }}>
            {/* Badge */}
            <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(145deg,${masteryRank.color}30,${masteryRank.color}10)`, border:`2.5px solid ${masteryRank.color}55`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 8px 28px ${masteryRank.color}30` }}>
              <EduIcon id={RANK_ICONS[masteryRank.title]||'star'} size={34} color={masteryRank.color} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:28, fontWeight:900, color:masteryRank.color, fontFamily:M.headingFont, lineHeight:1.05, marginBottom:3 }}>{masteryRank.title}</div>
              <div style={{ fontSize:12, color:bodyColor, fontFamily:'Nunito, sans-serif', fontStyle:'italic', fontWeight:600 }}>{masteryRank.flavor}</div>
            </div>
          </div>

          {/* XP Progress */}
          {nextRank ? (
            <div style={{ position:'relative', zIndex:1, animation:'rFadeUp 0.35s 0.06s ease both' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>{xp.toLocaleString()} XP</span>
                <span style={{ fontSize:12, fontWeight:900, color:masteryRank.color, fontFamily:'Nunito, sans-serif' }}>{nextRank.minXp - xp} to go</span>
              </div>
              <div style={{ height:10, background: isNova?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.09)', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
                <div style={{ height:'100%', width:rankProgress+'%', background:`linear-gradient(90deg,${masteryRank.color},${nextRank.color})`, borderRadius:99, transition:'width 1.2s ease', animation:'rBar 1.2s ease' }} />
              </div>
              <div style={{ fontSize:11, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>
                Next: <span style={{ color:nextRank.color, fontWeight:900 }}>{nextRank.title}</span> at {nextRank.minXp.toLocaleString()} XP
              </div>
            </div>
          ) : (
            <div style={{ padding:'12px 16px', background:`${masteryRank.color}14`, borderRadius:12, textAlign:'center', position:'relative', zIndex:1 }}>
              <span style={{ fontSize:13, fontWeight:900, color:masteryRank.color, fontFamily:'Nunito, sans-serif' }}>Maximum rank — you are a legend</span>
            </div>
          )}

          {/* 2-col stat strip */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16, position:'relative', zIndex:1, animation:'rFadeUp 0.35s 0.1s ease both' }}>
            <div style={{ padding:'12px 14px', background: isNova?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.72)', borderRadius:14, backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:10, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:0.9, fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Position in Rank</div>
              <div style={{ fontSize:22, fontWeight:900, color:masteryRank.color, fontFamily:M.headingFont, lineHeight:1 }}>
                #{myPosInRank} <span style={{ fontSize:12, color:bodyColor, fontWeight:600 }}>of {totalInRank}</span>
              </div>
            </div>
            <div style={{ padding:'12px 14px', background: isNova?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.72)', borderRadius:14, backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:10, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:0.9, fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Monthly XP</div>
              <div style={{ fontSize:22, fontWeight:900, color:accent, fontFamily:M.headingFont, lineHeight:1 }}>{monthlyXp.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* ── JOURNEY TRACK — horizontal scroll ── */}
        <div style={{ padding:'22px 20px 0', animation:'rFadeUp 0.35s 0.14s ease both' }}>
          <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:16 }}>Rank Journey</div>
          <div style={{ overflowX:'auto', paddingBottom:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', minWidth: MASTERY_RANKS.length * 80 + 'px' }}>
              {MASTERY_RANKS.map((rank, idx) => {
                const isCur  = rank.title === masteryRank.title
                const isPast = idx < myRankIdx
                const isFut  = idx > myRankIdx
                return (
                  <div key={rank.title} style={{ display:'flex', flexDirection:'column', alignItems:'center', width:80, flexShrink:0 }}>
                    {/* Track + node row */}
                    <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                      {/* Left line */}
                      <div style={{ flex:1, height:3, background: idx===0?'transparent': isPast||isCur ? rank.color : isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)', borderRadius:1.5 }} />
                      {/* Node */}
                      <div style={{
                        width: isCur?48:36, height:isCur?48:36,
                        borderRadius: isCur?15:11,
                        background: isCur?`linear-gradient(145deg,${rank.color}35,${rank.color}12)` : isPast?`${rank.color}16` : isNova?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',
                        border: isCur?`2.5px solid ${rank.color}` : isPast?`1.5px solid ${rank.color}40` : `1.5px solid ${isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        boxShadow: isCur?`0 4px 18px ${rank.color}40`:'none',
                      }}>
                        {isPast
                          ? <EduIcon id="star" size={13} color={rank.color+'88'} />
                          : <EduIcon id={RANK_ICONS[rank.title]||'star'} size={isCur?22:14} color={isCur?rank.color:bodyColor} />
                        }
                      </div>
                      {/* Right line */}
                      <div style={{ flex:1, height:3, background: idx===MASTERY_RANKS.length-1?'transparent': isPast?MASTERY_RANKS[idx+1]?.color||rank.color : isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)', borderRadius:1.5 }} />
                    </div>
                    {/* Label */}
                    <div style={{ marginTop:9, textAlign:'center', padding:'0 3px' }}>
                      <div style={{ fontSize:isCur?10:9, fontWeight:isCur?900:600, color:isCur?rank.color:isPast?M.textPrimary:bodyColor, fontFamily:'Nunito, sans-serif', lineHeight:1.3, wordBreak:'break-word' }}>
                        {rank.title}
                      </div>
                      {isCur && <div style={{ fontSize:8, fontWeight:900, color:rank.color, fontFamily:'Nunito, sans-serif', marginTop:2, background:rank.color+'18', borderRadius:99, padding:'1px 6px' }}>YOU</div>}
                      {isPast && <div style={{ fontSize:10, color:rank.color, marginTop:1 }}>✓</div>}
                      {isFut  && <div style={{ fontSize:8, color:bodyColor, marginTop:2, opacity:0.5, fontFamily:'Nunito, sans-serif' }}>{rank.minXp>=1000?(rank.minXp/1000).toFixed(rank.minXp%1000===0?0:1)+'k':rank.minXp} XP</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── PEOPLE IN YOUR RANK ── */}
        <div style={{ padding:'22px 20px 0', animation:'rFadeUp 0.35s 0.18s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif' }}>People in Your Rank</div>
              {myPosInRank > 0 && (
                <div style={{ fontSize:10, color:masteryRank.color, fontFamily:'Nunito, sans-serif', fontWeight:700, marginTop:2 }}>
                  You are #{myPosInRank} — keep climbing
                </div>
              )}
            </div>
            {boards.school.length > 0 && (
              <div style={{ display:'flex', background: isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', borderRadius:99, padding:3, gap:2 }}>
                {['global','school'].map(v => (
                  <button key={v} onClick={() => setRankView(v)} style={{ padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer', fontSize:10, fontWeight:800, fontFamily:'Nunito, sans-serif', background:rankView===v?accent:'transparent', color:rankView===v?'#fff':bodyColor, transition:'all 0.15s' }}>
                    {v==='global'?'Class':'School'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {sameRankPeople.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:bodyColor, fontFamily:'Nunito, sans-serif', fontSize:13 }}>
              Complete more lessons to see people around you
            </div>
          ) : (
            <div style={{ background: isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, overflow:'hidden', border:`1px solid ${isNova?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.07)'}` }}>
              {sameRankPeople.map((entry, idx) => {
                const isMe      = entry.id === student?.id
                const eRank     = MASTERY_RANKS.slice().reverse().find(r=>(entry.xp||0)>=r.minXp)||MASTERY_RANKS[0]
                const eXp       = entry.monthly_xp || 0
                const movement  = (entry.xp_today||0)>0 ? '↑' : (entry.xp_dropped||0)>0 ? '↓' : '—'
                const mvColor   = movement==='↑'?'#22c55e':movement==='↓'?'#EF4444':bodyColor
                return (
                  <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:isMe?`${accent}07`:'transparent', borderLeft:`3px solid ${isMe?accent:'transparent'}`, borderBottom:idx<sameRankPeople.length-1?`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}`:'none' }}>
                    {/* Avatar circle */}
                    <div style={{ width:36, height:36, borderRadius:'50%', background:`${eRank.color}20`, border:`1.5px solid ${eRank.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:900, fontSize:14, color:eRank.color, fontFamily:'Nunito, sans-serif' }}>
                      {entry.display_name?.[0]?.toUpperCase()||'?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:isMe?900:700, color:isMe?accent:(isNova?'#F8F7FF':M.textPrimary), fontFamily:'Nunito, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {entry.display_name}{isMe?' (You)':''}
                      </div>
                      <div style={{ fontSize:10, color:eRank.color, fontFamily:'Nunito, sans-serif', fontWeight:700 }}>{eRank.title}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:900, color:accent, fontFamily:'Nunito, sans-serif' }}>{eXp.toLocaleString()}</div>
                      <div style={{ fontSize:12, fontWeight:800, color:mvColor, fontFamily:'Nunito, sans-serif' }}>{movement}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── HOW TO EARN XP ── */}
        <div style={{ margin:'20px 20px 0', padding:'18px', background: isNova?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)', borderRadius:16, border:`1px solid ${isNova?'rgba(255,255,255,0.09)':'rgba(0,0,0,0.07)'}`, animation:'rFadeUp 0.35s 0.22s ease both' }}>
          <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:12 }}>How to earn XP</div>
          {[
            { icon:'book',   label:'Complete a lesson',   pts:'+1–10 XP' },
            { icon:'pencil', label:'Practice questions',  pts:'+3 XP' },
            { icon:'puzzle', label:'Solve a puzzle cell', pts:'+3 XP' },
          ].map((item, i) => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:i<2?`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}`:'none' }}>
              <div style={{ width:30, height:30, borderRadius:9, background:`${accent}10`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <EduIcon id={item.icon} size={14} color={accent} />
              </div>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color: isNova?'#F8F7FF':M.textPrimary, fontFamily:'Nunito, sans-serif' }}>{item.label}</span>
              <span style={{ fontSize:12, fontWeight:900, color:accent, fontFamily:'Nunito, sans-serif' }}>{item.pts}</span>
            </div>
          ))}
        </div>

      </div>
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

      {/* ── Learning Mode Control — top of profile ── */}
      <div style={{ padding: '18px 18px 0', maxWidth: 520, margin: '0 auto 0' }}>
        <div style={{ background: isNova ? 'rgba(255,255,255,0.07)' : '#fff', borderRadius: 18, padding: '18px', marginBottom: 16, boxShadow: '0 3px 14px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>Learning Mode</div>
          {[
            { id: 'school', icon: 'book',    label: 'School Mode',   desc: 'Follow your class curriculum step by step' },
            { id: 'exam',   icon: 'target',  label: 'Exam Prep',     desc: 'Jump to any topic · Focus on weak areas' },
          ].map(m => {
            const isActive = (student?.learning_mode || 'school') === m.id
            return (
              <button
                key={m.id}
                onClick={async () => {
                  await supabase.from('students').update({ learning_mode: m.id }).eq('id', student?.id)
                  setStudent(s => ({ ...s, learning_mode: m.id }))
                }}
                style={{ width: '100%', padding: '13px 16px', background: isActive ? `${accent}0E` : 'transparent', border: `1.5px solid ${isActive ? accent : isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'}`, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: m.id === 'school' ? 8 : 0, textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? `${accent}14` : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EduIcon id={m.icon} size={17} color={isActive ? accent : bodyColor} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: isActive ? accent : (isNova ? '#F0EFFF' : M.textPrimary), fontFamily: 'Nunito, sans-serif', marginBottom: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{m.desc}</div>
                </div>
                {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        {/* Theme / Mascot */}
        <button
          onClick={() => setShowModePicker(true)}
          style={{ width: '100%', padding: '14px 16px', background: isNova ? 'rgba(255,255,255,0.06)' : '#fff', border: `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'left' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <EduIcon id="switch" size={17} color={accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: isNova ? '#F0EFFF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', marginBottom: 1 }}>Theme and Mascot</div>
            <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Currently: {M.name}</div>
          </div>
          <EduIcon id="compass" size={13} color={bodyColor} />
        </button>
      </div>

      {/* ── Hero banner ── */}
      <div style={{ background: heroBg, padding: '28px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        {isRoots && <AnkaraStripe />}
        {!isBlaze && <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />}
        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.22)', border: '3px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif', boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>
              {student?.display_name?.[0]?.toUpperCase() || '?'}
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
              {editOpen ? 'Done' : 'Edit'}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: xp.toLocaleString(), label: 'Total XP',  color: '#FFD700' },
              { v: monthlyXp,           label: 'Monthly XP', color: '#fff' },
              { v: `${streak}`,         label: 'Streak',     color: '#fff' },
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
            style={{ width: '100%', padding: '11px', cursor: 'pointer', background: 'transparent', border: `1.5px solid ${accent}30`, borderRadius: isBlaze ? 8 : 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Nunito, sans-serif', color: accent, fontSize: 13, fontWeight: 800 }}>
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
const RightPanel = isDesktop ? (
    <div style={{
      width: 300,
      flexShrink: 0,
      height: '100vh',
      overflowY: 'auto',
      borderLeft: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
      background: isNova ? 'rgba(15,12,41,0.6)' : (isBlaze ? '#F5F0D0' : M.mapBg),
      padding: '28px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Student card */}
      <div style={{
        background: isNova ? 'rgba(124,58,237,0.15)' : isBlaze ? '#FFD700' : `${accent}10`,
        border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}25`,
        borderRadius: isBlaze ? 10 : 18,
        padding: '16px 18px',
        boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : 'none',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.5)' : accent, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>
          {student?.class_level} · {activeSubject === 'further_maths' ? 'Further Maths' : 'Mathematics'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: isBlaze ? '#0d0d0d' : M.textPrimary, fontFamily: M.headingFont, lineHeight: 1.2, marginBottom: 12 }}>
          {student?.display_name}
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'XP',       value: xp.toLocaleString(), iconId: 'xp',       color: accent },
            { label: 'Streak',   value: `${streak}d`,         iconId: 'streak',   color: '#FF9500' },
            { label: 'Lessons',  value: doneLessons,           iconId: 'lessons',  color: accent },
            { label: 'Progress', value: `${overallPct}%`,      iconId: 'progress', color: accent },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)', borderRadius: isBlaze ? 6 : 12, border: isBlaze ? '1.5px solid rgba(0,0,0,0.15)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: isBlaze ? '#0d0d0d' : s.color }}>
                <TabIcon id={s.iconId} size={17} color="currentColor" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: isBlaze ? '#0d0d0d' : accent, fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: bodyColor, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>Overall Progress</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif' }}>{doneLessons}/{totalLessons}</span>
        </div>
        <div style={{ height: 8, background: isNova ? 'rgba(255,255,255,0.1)' : `${accent}15`, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#22c55e' : `linear-gradient(90deg,${accent},${M.accent2 || accent})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Next lesson */}
      {nextLesson && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>Up Next</div>
          <button
            onClick={() => window.location.href = `/learn/lesson/${nextLesson.id}`}
            style={{
              width: '100%', padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.2)' : `linear-gradient(135deg,${accent},${M.accent2 || accent}DD)`,
              border: isBlaze ? '2px solid #0d0d0d' : 'none',
              borderRadius: isBlaze ? 10 : 16,
              boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 20px ${accent}40`,
              fontFamily: 'Nunito, sans-serif',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: isBlaze ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>▶</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Continue Learning</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextLesson.title}</div>
            </div>
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { iconId: 'practice',    label: 'Practice Questions', tab: 'practice',    color: accent },
            { iconId: 'challenge',   label: 'Daily Challenge',    tab: 'challenge',   color: '#FF9500' },
            { iconId: 'shield',      label: 'Rank Journey',       tab: 'rank',        color: accent    },
          ].map(a => (
            <button key={a.tab} onClick={() => setActiveTab(a.tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', cursor: 'pointer', width: '100%', textAlign: 'left',
                background: isNova ? 'rgba(255,255,255,0.05)' : isBlaze ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.8)',
                border: isBlaze ? '1.5px solid rgba(0,0,0,0.1)' : `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                borderRadius: isBlaze ? 8 : 12,
                fontFamily: 'Nunito, sans-serif',
              }}>
              <span style={{ color: a.color }}><TabIcon id={a.iconId} size={16} color={a.color} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: M.textPrimary }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile switcher if multiple */}
      {allStudents.length > 1 && (
        <button onClick={() => setShowSwitcher(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', cursor: 'pointer', width: '100%',
            background: 'transparent', border: `1.5px solid ${accent}30`,
            borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif',
            color: accent, fontSize: 12, fontWeight: 800,
          }}>
          <TabIcon id="users" size={16} color={accent} /> Switch Profile
        </button>
      )}
    </div>
  ) : null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row', fontFamily: 'Nunito, sans-serif', background: M.mapBg, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sheetUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Mobile: HUD on top. Tablet/Desktop: SideNav on left */}
      {isMobile ? HUD : SideNav}

      {/* Main content area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Tablet/Desktop: compact top bar with just subject pill + mode */}
        {!isMobile && (
          <div style={{
            flexShrink: 0, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
            background: isNova ? 'rgba(15,12,41,0.8)' : M.hudBg,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif' }}>
              {TABS.find(t => t.id === activeTab)?.label || 'Home'}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {['SS1','SS2','SS3'].includes(student?.class_level) && (student?.subjects || []).length > 1 && (
                <button onClick={() => setShowSubjectPicker(true)}
                  style={{ background: `${accent}14`, border: `1.5px solid ${accent}30`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif' }}>{isFM ? 'Further Maths' : 'Maths'}</span>
                  <span style={{ fontSize: 9, color: accent, opacity: 0.7 }}>▾</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeTab === 'home'        && HomeTab}
          {activeTab === 'learn'       && LearnTab}
          {activeTab === 'practice'    && <div style={{ height: '100%', overflowY: 'auto' }}>{PracticeTab}</div>}
          {activeTab === 'challenge'   && <div style={{ height: '100%', overflowY: 'auto' }}>{ChallengeTab}</div>}
          {activeTab === 'rank'        && <div style={{ height: '100%', overflowY: 'auto' }}>{RankTab}</div>}
          {activeTab === 'profile'     && <div style={{ height: '100%', overflowY: 'auto' }}>{ProfileTab}</div>}
        </div>
      </div>

      {/* Desktop: right panel. Mobile: bottom nav */}
      {isMobile ? BottomNav : RightPanel}
      <BottomSheet open={showModePicker} onClose={() => setShowModePicker(false)} M={M}>
        <ModePicker onClose={() => setShowModePicker(false)} />
      </BottomSheet>

      {showSubjectPicker && (
        <>
          <div onClick={() => setShowSubjectPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520, zIndex: 61, background: isNova ? '#1a1040' : M.lessonCard || '#fff', borderRadius: isBlaze ? '14px 14px 0 0' : '24px 24px 0 0', padding: '0 20px 40px', fontFamily: 'Nunito, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: `${accent}35` }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: M.textPrimary, fontFamily: M.headingFont, marginBottom: 6 }}>Switch Subject</div>
            <div style={{ fontSize: 13, color: M.textSecondary, marginBottom: 20 }}>Progress and XP are tracked separately per subject.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(student?.subjects || ['maths']).map(subj => {
                const isActive = activeSubject === subj
                const label    = subj === 'further_maths' ? 'Further Mathematics' : 'Mathematics'
                const subjXp   = subj === 'further_maths' ? (student?.fm_xp || 0) : (student?.xp || 0)
              
  // ── Right Stats Panel (desktop only) ────────────────────────────────────
  
  return (
                  <button key={subj} onClick={async () => {
                    if (!isActive) {
                      await supabase.from('students').update({ active_subject: subj }).eq('id', student.id)
                      setActiveSubject(subj)
                      setStudent(s => ({ ...s, active_subject: subj }))
                    }
                    setShowSubjectPicker(false)
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: isActive ? (isBlaze ? '#FFD700' : `${accent}14`) : (isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'), border: isActive ? (isBlaze ? '2px solid #0d0d0d' : `2px solid ${accent}`) : `1.5px solid ${isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, borderRadius: isBlaze ? 10 : 16, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: isActive ? (isBlaze ? '#0d0d0d' : accent) : M.textPrimary }}>{label}</div>
                      <div style={{ fontSize: 11, color: M.textSecondary, marginTop: 2 }}>{subjXp.toLocaleString()} XP</div>
                    </div>
                    {isActive && <span style={{ fontSize: 16, color: isBlaze ? '#0d0d0d' : accent }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

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