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

// ── Design tokens ─────────────────────────────────────────────────────────────
// Fonts: Sora for headings/numbers, Nunito for UI text
// All MIB-specific CSS vars defined once in <style> tag on root render

// ── Educational SVG icon system ─────────────────────────────────────────────
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
  useSessionTracker(student?.id)
  const [progressData,    setProgressData]    = useState(progress)
  const [boards,          setBoards]          = useState({ class: [], school: [], overall: [] })
  const [leaderboardType,  setLeaderboardType]  = useState('class')
  const [practiceAttempts, setPracticeAttempts] = useState([])
  const [boardsLoaded,    setBoardsLoaded]    = useState(false)
  const [rankFaceIdx,     setRankFaceIdx]     = useState(0)
  const [rankVisible,     setRankVisible]     = useState(true)
  const searchParams = useSearchParams()
  const [activeTab,       setActiveTab]       = useState(() => {
    const t = searchParams?.get('tab')
    return ['home','learn','practice','challenge','rank','leaderboard','profile'].includes(t) ? t : 'home'
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
  const [editExamType,    setEditExamType]    = useState(initialStudent?.exam_type || 'WAEC')
  const [editExamSubject, setEditExamSubject] = useState(initialStudent?.exam_subject || 'maths')
  const [editMode,        setEditMode]        = useState(initialStudent?.learning_mode || 'school')
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

      if (initialStudent?.id) {
        try {
          const { data: attempts } = await supabase
            .from('practice_attempts')
            .select('question_id, is_correct')
            .eq('student_id', initialStudent.id)
          setPracticeAttempts(attempts || [])
        } catch(e) { console.error('[practice_attempts]', e.message) }
      }
    }
    fetchAll()
  }, [student?.id, student?.class_level, student?.school, activeSubject])

  useEffect(() => {
    const timer = setInterval(() => {
      setRankVisible(false)
      setTimeout(() => { setRankFaceIdx(i => (i + 1) % 3); setRankVisible(true) }, 500)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const windowWidth  = useWindowWidth()
  const isDesktop    = windowWidth >= 1024
  const isTablet     = windowWidth >= 768 && windowWidth < 1024
  const isMobile     = windowWidth < 768

  const completedIds = new Set(progressData.filter(p => p.status === 'completed').map(p => p.subtopic_id))
  const isFM      = activeSubject === 'further_maths'
  const isExamMode = student?.learning_mode === 'exam'

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
      const examType = student?.exam_type || 'WAEC'
      const subj = isFM ? 'further_maths' : 'maths'
      const examCode = `EXAM_${examType}_${subj === 'further_maths' ? 'Further_Mathematics' : 'Mathematics'}`
      supabase
        .from('levels')
        .select('*, terms(*, units(*, topics(*, subtopics(*))))')
        .eq('code', examCode)
        .maybeSingle()
        .then(({ data: examLevel }) => {
          if (examLevel) {
            setCurrentLevel(examLevel)
          } else {
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
          }
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

  const leaderboard   = boards[leaderboardType] || []
  const myClassRank   = boards.class.findIndex(e => e.id === student?.id)
  const mySchoolRank  = boards.school.findIndex(e => e.id === student?.id)
  const myOverallRank = boards.overall.findIndex(e => e.id === student?.id)
  const myRank        = leaderboard.findIndex(e => e.id === student?.id)
  const myRankDisplay = myRank >= 0 ? `#${myRank + 1}` : '—'
  const nextUp        = myRank > 0 ? leaderboard[myRank - 1] : null
  const xpToNextRank  = nextUp ? Math.max(0, (nextUp.monthly_xp || 0) - monthlyXp) : 0

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
    const updates = { display_name: editName.trim(), school: editSchool.trim(), class_level: editClass, learning_mode: editMode, exam_type: editMode === 'exam' ? editExamType : student?.exam_type, exam_subject: editMode === 'exam' ? editExamSubject : student?.exam_subject }
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

  // ── HUD (mobile top bar) ──────────────────────────────────────────────────
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

  // ── TABS config ────────────────────────────────────────────────────────────
  const TABS = isExamMode ? [
    { id: 'learn',       icon: 'learn',       label: 'Learn'       },
    { id: 'practice',    icon: 'practice',    label: 'Practice'    },
    { id: 'leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
    { id: 'profile',     icon: 'profile',     label: 'Profile'     },
  ] : [
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
      <div style={{ padding: isDesktop ? '0 4px 20px' : '0 0 20px', display: 'flex', alignItems: 'center', justifyContent: isDesktop ? 'flex-start' : 'center', overflow: 'hidden', minWidth: 0 }}>
        <MIBLogo size={28} theme={isNova ? 'dark' : 'light'} M={M} style={{ flexShrink: 0 }} />
        {isDesktop && (
          <div style={{ marginLeft: 8, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: M.textPrimary, fontFamily: 'Nunito, sans-serif', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>MathsInBites</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 }}>Learn · Practice · Win</div>
          </div>
        )}
      </div>

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
                color: isActive ? (isBlaze ? '#0d0d0d' : accent) : M.textSecondary,
              }}>{t.label}</span>
            )}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />
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
  const currentNodeRef  = useRef(null)
  const [currentNodeDir, setCurrentNodeDir]  = useState(null)

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

  // ── Greeting helpers ────────────────────────────────────────────────────
  const firstName = student?.display_name?.split(' ')[0] || 'there'

  // ── Topic readiness system (Exam Mode) ────────────────────────────────
  const readinessLevel = (pct) => {
    if (pct === null || pct === undefined) return { label: 'Not Started', color: '#94a3b8', pct: 0 }
    if (pct <= 30)  return { label: 'Needs Work',  color: '#EF4444', pct }
    if (pct <= 60)  return { label: 'Improving',   color: '#F59E0B', pct }
    if (pct <= 80)  return { label: 'Good',        color: '#3b82f6', pct }
    return             { label: 'Exam Ready',   color: '#22c55e', pct }
  }

  const topicReadiness = (() => {
    if (!practiceAttempts.length || !allTopics.length) return {}
    const total   = practiceAttempts.length
    const correct = practiceAttempts.filter(a => a.is_correct).length
    const overallPctPractice = total > 0 ? Math.round((correct / total) * 100) : null
    const result = {}
    allTopics.forEach(t => { result[t.title] = overallPctPractice })
    return result
  })()

  const overallReadinessPct = (() => {
    const total   = practiceAttempts.length
    const correct = practiceAttempts.filter(a => a.is_correct).length
    return total > 0 ? Math.round((correct / total) * 100) : null
  })()

  // ── Mastery Level System ───────────────────────────────────────────────
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

  const RANK_ICONS = {
    'Rookie': 'seeker', 'Spark': 'sparkle', 'Seeker': 'compass', 'Cipher': 'brain',
    'Arithmancer': 'star', 'Scholar': 'book', 'Prodigy': 'bolt', 'Sage': 'infinity',
    'Apex': 'flame', 'Legend': 'crown', 'Maths Titan': 'sword', 'Infinity': 'shield',
  }

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

  // ══════════════════════════════════════════════════════════════════════════
  // HOME TAB — redesigned
  // ══════════════════════════════════════════════════════════════════════════
  const HomeTab = (
    <div style={{ height:'100%', overflowY:'auto', background: isNova?'#0D0B1E': isBlaze?'#FFFBEA':'#F6F5F2' }}>
      {isNova && <NovaStars />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=Nunito:wght@500;600;700;800;900&display=swap');
        @keyframes mibBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes mibFadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mibShimmer { 0%{transform:translateX(-140%)} 100%{transform:translateX(140%)} }
        @keyframes mibPulse   { 0%,100%{box-shadow:0 0 0 0 ${accent}40} 60%{box-shadow:0 0 0 8px transparent} }
        .mib-press:active { transform:scale(0.96) !important; transition:transform 0.1s !important; }
        .mib-press { transition:transform 0.18s cubic-bezier(0.34,1.4,0.64,1); }
      `}</style>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 16px 0' }}>

        {/* ── TOP BAR ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, animation:'mibFadeUp 0.25s ease both' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color: isNova?'#F0EFFF':M.textPrimary, fontFamily:'Sora, sans-serif', letterSpacing:-0.5, lineHeight:1 }}>
              Hey, {firstName} 👋
            </div>
            <div style={{ fontSize:11, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, marginTop:2 }}>
              {isExamMode ? `${student?.exam_type||'WAEC'} Prep Mode` : `${student?.class_level||''} · School Mode`}
            </div>
          </div>
          <button onClick={() => setShowModePicker(true)} style={{ width:36, height:36, borderRadius:11, background: isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)', border:`1px solid ${isNova?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <EduIcon id="switch" size={17} color={bodyColor} />
          </button>
          <button onClick={() => setActiveTab('profile')} style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(145deg,${accent},${M.accent2||accent}CC)`, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:`0 4px 14px ${accent}50`, fontSize:14, fontWeight:900, color:'#fff', fontFamily:'Sora, sans-serif' }}>
            {firstName?.[0]?.toUpperCase()||'?'}
          </button>
        </div>

        {/* ── STAT CHIPS ROW ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14, animation:'mibFadeUp 0.25s 0.05s ease both' }}>
          {[
            { label:'XP',      value: xp >= 1000 ? (xp/1000).toFixed(1)+'k' : xp,  color:'#f59e0b', icon:'bolt'  },
            { label:'Streak',  value: `${streak}d`,                                   color:'#ef4444', icon:'flame' },
            { label:'Lessons', value: doneLessons,                                     color:'#22c55e', icon:'book'  },
            { label:'Rank',    value: myClassRank >= 0 ? `#${myClassRank+1}` : '—',  color: accent,   icon:'trophy'},
          ].map(chip => (
            <div key={chip.label} style={{
              background: isNova?'rgba(255,255,255,0.07)':'#fff',
              border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}`,
              borderRadius:14, padding:'10px 6px', textAlign:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <EduIcon id={chip.icon} size={14} color={chip.color} style={{ margin:'0 auto 4px' }} />
              <div style={{ fontSize:15, fontWeight:900, color:chip.color, fontFamily:'Sora, sans-serif', lineHeight:1 }}>{chip.value}</div>
              <div style={{ fontSize:8, fontWeight:700, color:bodyColor, textTransform:'uppercase', letterSpacing:0.5, fontFamily:'Nunito, sans-serif', marginTop:3 }}>{chip.label}</div>
            </div>
          ))}
        </div>

        {/* ── HERO BANNER ── */}
        <div style={{ borderRadius:22, overflow:'hidden', position:'relative', isolation:'isolate', marginBottom:14,
          background: isNova ? `linear-gradient(140deg,${accent}28,${accent}10)` : isBlaze ? 'linear-gradient(140deg,#FFD700,#FFB800)' : `linear-gradient(140deg,${accent},${M.accent2||accent}CC)`,
          boxShadow: isNova ? `0 0 0 1px ${accent}30, 0 10px 36px ${accent}22` : isBlaze ? '4px 4px 0 #0d0d0d' : `0 12px 40px ${accent}40`,
          animation:'mibFadeUp 0.3s 0.08s ease both',
        }}>
          {!isNova && !isBlaze && (
            <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
              <div style={{ position:'absolute', top:0, bottom:0, width:'45%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent)', animation:'mibShimmer 5s ease-in-out infinite' }} />
            </div>
          )}
          <div style={{ position:'absolute', right:-22, top:-22, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.1)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:18, bottom:-28, width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'flex-end', position:'relative', zIndex:1 }}>
            <div style={{ flexShrink:0, paddingLeft:14, alignSelf:'flex-end', animation:'mibBounce 3.5s ease-in-out infinite' }}>
              <BicPencil pose="happy" size={100} />
            </div>
            <div style={{ flex:1, minWidth:0, padding:'20px 16px 18px 8px' }}>
              <div style={{ fontSize:10, fontWeight:800, color: isNova?`${accent}BB`:isBlaze?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.75)', fontFamily:'Nunito, sans-serif', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                {isExamMode ? `${student?.exam_type||'WAEC'} Prep` : `${masteryRank.title} Rank`}
              </div>
              <div style={{ fontSize:15, fontWeight:800, color: isNova?'#F0EFFF':isBlaze?'#1a1a1a':'#fff', fontFamily:'Nunito, sans-serif', lineHeight:1.5 }}>
                {isExamMode
                  ? (overallReadinessPct !== null
                      ? `You're ${overallReadinessPct}% ready for ${student?.exam_type||'WAEC'}. Keep pushing!`
                      : 'Start practising to build your exam readiness.')
                  : doneLessons === 0
                  ? 'Your maths adventure starts now. Every lesson counts!'
                  : myClassRank === 0
                  ? 'Top of your class! Keep that momentum.'
                  : streak >= 7
                  ? `${streak} days in a row — unstoppable.`
                  : nextRank
                  ? `${nextRank.minXp - xp} XP to ${nextRank.title}. So close!`
                  : 'All lessons done. A true Maths legend!'}
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTINUE LEARNING ── */}
        <div style={{ marginBottom:14, animation:'mibFadeUp 0.3s 0.12s ease both' }}>
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

        {/* ── JOURNEY / QUICK ACCESS ── */}
        <div style={{ animation:'mibFadeUp 0.3s 0.16s ease both' }}>
          {isExamMode ? (
            /* Exam mode: readiness progress card */
            <div style={{ background: isNova?'rgba(255,255,255,0.07)':'#fff', borderRadius:20, padding:'18px', boxShadow:'0 2px 14px rgba(0,0,0,0.07)', border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}`, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Exam Readiness</div>
                  <div style={{ fontSize:26, fontWeight:900, color: overallReadinessPct !== null ? readinessLevel(overallReadinessPct).color : accent, fontFamily:'Sora, sans-serif', lineHeight:1 }}>
                    {overallReadinessPct !== null ? `${overallReadinessPct}%` : '—'}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', marginBottom:4 }}>Rank</div>
                  <div style={{ fontSize:20, fontWeight:900, color:accent, fontFamily:'Sora, sans-serif', opacity:rankVisible?1:0, transition:'opacity 0.4s' }}>{activeFace.display}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>{activeFace.label}</div>
                </div>
              </div>
              <div style={{ height:6, background: isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)', borderRadius:99, overflow:'hidden', marginBottom:14 }}>
                <div style={{ height:'100%', width:`${overallReadinessPct||0}%`, background: overallReadinessPct !== null ? readinessLevel(overallReadinessPct).color : accent, borderRadius:99, transition:'width 1.4s ease' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { tab:'practice', icon:'pencil', label:'Practice', desc:'Topic drills', color:'#3b82f6' },
                  { tab:'learn',    icon:'book',   label:'Learn',    desc:'Lesson topics', color:accent   },
                ].map(card => (
                  <button key={card.tab} onClick={() => setActiveTab(card.tab)} className="mib-press" style={{ padding:'13px 12px', background: isNova?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.02)', border:`1.5px solid ${card.color}22`, borderRadius:14, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:`${card.color}16`, border:`1px solid ${card.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <EduIcon id={card.icon} size={16} color={card.color} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:800, color: isNova?'#F0EFFF':M.textPrimary, fontFamily:'Nunito, sans-serif' }}>{card.label}</div>
                      <div style={{ fontSize:9, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>{card.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* School mode: quick access grid */
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:10 }}>Quick Access</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { tab:'practice',  icon:'pencil', color:'#3b82f6', label:'Practice',  desc:'Sharpen your skills' },
                  { tab:'challenge', icon:'puzzle',  color:'#f59e0b', label:'Puzzles',   desc:'Daily brain boost'  },
                  { tab:'rank',      icon:'shield',  color:'#a855f7', label:'My Ranks',  desc:'Your rank journey'  },
                  { tab:'learn',     icon:'book',    color:accent,    label:'Lessons',   desc:'Continue learning'  },
                ].map(card => (
                  <button key={card.tab} onClick={() => setActiveTab(card.tab)} className="mib-press"
                    style={{ padding:'14px 12px', background: isNova?'rgba(255,255,255,0.07)':'#fff', border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}`, borderRadius:18, cursor:'pointer', textAlign:'left', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(145deg,${card.color}20,${card.color}0A)`, border:`1.5px solid ${card.color}28`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10, boxShadow:`0 3px 10px ${card.color}18` }}>
                      <EduIcon id={card.icon} size={18} color={card.color} />
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color: isNova?'#F0EFFF':'#1a1a1a', fontFamily:'Nunito, sans-serif', marginBottom:2 }}>{card.label}</div>
                    <div style={{ fontSize:9, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>{card.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MASTERY RANK CHIP (school mode) ── */}
        {!isExamMode && (
          <div style={{ marginBottom:14, padding:'14px 16px', background: isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:16, display:'flex', alignItems:'center', gap:12, border:`1px solid ${masteryRank.color}22`, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', animation:'mibFadeUp 0.3s 0.2s ease both' }}>
            <div style={{ width:42, height:42, borderRadius:12, background:`${masteryRank.color}18`, border:`1.5px solid ${masteryRank.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <EduIcon id={RANK_ICONS[masteryRank.title]||'star'} size={20} color={masteryRank.color} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:900, color:masteryRank.color, fontFamily:'Sora, sans-serif' }}>{masteryRank.title}</div>
              <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, fontStyle:'italic', marginTop:1 }}>{masteryRank.flavor}</div>
            </div>
            {nextRank && (
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:9, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, marginBottom:3 }}>Next rank</div>
                <div style={{ fontSize:11, fontWeight:900, color:nextRank.color, fontFamily:'Nunito, sans-serif' }}>{nextRank.minXp - xp} XP</div>
              </div>
            )}
          </div>
        )}

        {/* ── Profile Switcher (multi-profile) ── */}
        {allStudents.length > 1 && (
          <div style={{ marginBottom:14, animation:'mibFadeUp 0.3s 0.22s ease both' }}>
            <button onClick={() => setShowSwitcher(true)} style={{ width:'100%', padding:'11px 16px', background:'transparent', border:`1.5px solid ${accent}22`, borderRadius:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Nunito, sans-serif', color:accent, fontSize:12, fontWeight:800 }}>
              <EduIcon id="users" size={14} color={accent} /> Switch Profile
            </button>
          </div>
        )}

        <div style={{ height:'max(80px,calc(60px + env(safe-area-inset-bottom)))' }} />
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // EXAM LEARN TAB — redesigned
  // ══════════════════════════════════════════════════════════════════════════
  const examTopics = (() => {
    if (!isExamMode) return []
    return allTopics.map(t => {
      const subs  = t.subtopics || []
      const done  = subs.filter(s => completedIds.has(s.id)).length
      const pct   = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0
      const ready = readinessLevel(topicReadiness[t.title] ?? (pct > 0 ? pct : null))
      const firstNotDone = subs.find(s => !completedIds.has(s.id))
      return { ...t, done, pct, ready, firstNotDone, total: subs.length }
    }).filter(t => t.total > 0)
  })()

  const [topicSearch, setTopicSearch] = useState('')
  const filteredExamTopics = topicSearch.trim()
    ? examTopics.filter(t => t.title.toLowerCase().includes(topicSearch.toLowerCase()))
    : examTopics

  const ExamLearnTab = (() => {
    const rPct = overallReadinessPct !== null ? overallReadinessPct
      : examTopics.length > 0 ? Math.round(examTopics.reduce((a,t)=>a+t.pct,0)/examTopics.length) : 0
    const rdy = readinessLevel(rPct)

    const STEPS = [
      { label: 'Beginner', min: 0  },
      { label: 'Building', min: 20 },
      { label: 'Getting There', min: 45 },
      { label: 'Nearly Ready', min: 70 },
      { label: 'Exam Ready', min: 90 },
    ]
    const currentStep = [...STEPS].reverse().find(s => rPct >= s.min) || STEPS[0]
    const nextStep    = STEPS[STEPS.indexOf(currentStep) + 1]
    const withinStepPct = nextStep
      ? Math.round(((rPct - currentStep.min) / (nextStep.min - currentStep.min)) * 100)
      : 100

    return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background: isNova?'#0D0B1E':'#F6F5F2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=Nunito:wght@500;600;700;800;900&display=swap');
        @keyframes elIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes elPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        .el-btn:active { transform:scale(0.975); }
        .el-btn { transition:transform 0.12s cubic-bezier(0.34,1.2,0.64,1); }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{ flexShrink:0, background: isNova?'rgba(13,11,30,0.97)':'rgba(246,245,242,0.97)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)'}`, position:'sticky', top:0, zIndex:20 }}>
        <div style={{ height:4, background: isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${rPct}%`, background:rdy.color, transition:'width 1.4s ease' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:900, color: isNova?'#F0EFFF':M.textPrimary, fontFamily:'Sora, sans-serif' }}>
              {student?.exam_type?.toUpperCase()||'WAEC'} Prep
            </div>
            <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, marginTop:1 }}>
              {rPct >= 90 ? 'Exam ready — keep your momentum!' : rPct >= 70 ? 'Nearly ready — push through remaining topics' : rPct >= 45 ? 'Getting there — practise daily' : 'Start your first lesson to begin'}
            </div>
          </div>
          <div style={{ padding:'5px 12px', background:`${rdy.color}18`, border:`1.5px solid ${rdy.color}30`, borderRadius:99 }}>
            <span style={{ fontSize:12, fontWeight:900, color:rdy.color, fontFamily:'Sora, sans-serif' }}>{rPct}%</span>
          </div>
        </div>
      </div>

      {/* ── SCROLL BODY ── */}
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:520, margin:'0 auto', padding:`20px 16px ${isMobile?'max(160px,calc(130px + env(safe-area-inset-bottom)))':'64px'}` }}>

          {/* Journey Tracker Card */}
          <div style={{ background: isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:20, padding:'18px 20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}`, animation:'elIn 0.3s ease both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:9, fontWeight:800, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:4 }}>Journey to {student?.exam_type||'WAEC'}</div>
                <div style={{ fontSize:22, fontWeight:900, color:rdy.color, fontFamily:'Sora, sans-serif', lineHeight:1 }}>{currentStep.label}</div>
              </div>
              {nextStep && (
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Next milestone</div>
                  <div style={{ fontSize:12, fontWeight:900, color:M.textPrimary, fontFamily:'Nunito, sans-serif' }}>{nextStep.label}</div>
                </div>
              )}
            </div>

            {/* Step dots */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
              {STEPS.map((step, i) => {
                const reached  = rPct >= step.min
                const isCur    = step.label === currentStep.label
                const lineNext = i < STEPS.length - 1
                const nextReach = i < STEPS.length - 1 && rPct >= STEPS[i+1].min
                return (
                  <div key={step.label} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : '0 0 auto' }}>
                    <div style={{ width:isCur?16:10, height:isCur?16:10, borderRadius:'50%', flexShrink:0, background:reached?rdy.color:isNova?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)', border:`2px solid ${reached?rdy.color:isNova?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.13)'}`, boxShadow:isCur?`0 0 0 4px ${rdy.color}28`:'none', animation:isCur?'elPulse 2s ease-in-out infinite':'none', transition:'all 0.6s' }} />
                    {lineNext && (
                      <div style={{ flex:1, height:3, background:isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', borderRadius:99, overflow:'hidden', margin:'0 2px' }}>
                        <div style={{ height:'100%', width:nextReach?'100%':isCur?withinStepPct+'%':'0%', background:rdy.color, borderRadius:99, transition:'width 1.2s ease' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              {STEPS.map(step => (
                <div key={step.label} style={{ fontSize:8, fontWeight:step.label===currentStep.label?900:600, color:step.label===currentStep.label?rdy.color:bodyColor, fontFamily:'Nunito, sans-serif', textAlign:'center', maxWidth:52 }}>{step.label}</div>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, paddingTop:14, borderTop:`1px solid ${isNova?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'}` }}>
              {[
                { label:'Topics Done', value:`${examTopics.filter(t=>t.pct===100).length}/${examTopics.length}`, color:rdy.color },
                { label:'Exam Ready',  value:`${rPct}%`,                                                          color:rdy.color },
                { label:'Practised',   value:`${practiceAttempts.length}q`,                                       color:'#3b82f6' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center', padding:'9px 4px', background:isNova?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)', borderRadius:10 }}>
                  <div style={{ fontSize:16, fontWeight:900, color:s.color, fontFamily:'Sora, sans-serif', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:8, fontWeight:700, color:bodyColor, textTransform:'uppercase', letterSpacing:0.5, fontFamily:'Nunito, sans-serif', marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Learning */}
          {nextLesson ? (
            <button onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)} className="el-btn"
              style={{ width:'100%', border:'none', cursor:'pointer', textAlign:'left', marginBottom:16, padding:0, borderRadius:18, overflow:'hidden', background:`linear-gradient(135deg,${accent},${M.accent2||accent}E8)`, boxShadow:`0 8px 28px ${accent}40`, animation:'elIn 0.3s 0.05s ease both' }}>
              <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <EduIcon id="book" size={22} color="#fff" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:1.8, fontFamily:'Nunito, sans-serif', marginBottom:6 }}>Continue Learning</div>
                  <div style={{ fontSize:16, fontWeight:900, color:'#fff', fontFamily:'Sora, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nextLesson.topicTitle||nextLesson.title}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:'Nunito, sans-serif', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nextLesson.title}</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.22)', borderRadius:12, padding:'8px 14px', flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:'#fff', fontFamily:'Nunito, sans-serif' }}>Go →</span>
                </div>
              </div>
            </button>
          ) : examTopics.length > 0 ? (
            <div style={{ marginBottom:16, padding:'16px 18px', background:'rgba(34,197,94,0.08)', border:'1.5px solid rgba(34,197,94,0.22)', borderRadius:16, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:'rgba(34,197,94,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <EduIcon id="star" size={18} color="#22c55e" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:900, color:'#22c55e', fontFamily:'Nunito, sans-serif' }}>All lessons complete!</div>
                <div style={{ fontSize:11, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>Focus on practice to stay sharp.</div>
              </div>
            </div>
          ) : null}

          {/* Topics list */}
          <div style={{ animation:'elIn 0.3s 0.09s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:900, color:M.textPrimary, textTransform:'uppercase', letterSpacing:1, fontFamily:'Nunito, sans-serif' }}>All Topics</div>
              <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>{examTopics.length} topics</div>
            </div>

            {/* Jump dropdown */}
            <div style={{ position:'relative', marginBottom:12 }}>
              <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <EduIcon id="compass" size={14} color={bodyColor} />
              </div>
              <select value="" onChange={e => { const topic = examTopics.find(t => t.title === e.target.value); if (topic?.firstNotDone) router.push(`/learn/lesson/${topic.firstNotDone.id}`) }}
                style={{ width:'100%', padding:'11px 16px 11px 38px', background:isNova?'rgba(255,255,255,0.08)':'#fff', border:`1.5px solid ${isNova?'rgba(255,255,255,0.11)':'rgba(0,0,0,0.09)'}`, borderRadius:13, fontSize:13, fontFamily:'Nunito, sans-serif', color:isNova?'#F0EFFF':M.textPrimary, outline:'none', cursor:'pointer', appearance:'none', WebkitAppearance:'none', boxSizing:'border-box', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                <option value="" disabled>Jump to a topic…</option>
                {examTopics.map(t => (<option key={t.id||t.title} value={t.title}>{t.title} — {t.pct}%</option>))}
              </select>
              <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:bodyColor }}>▾</div>
            </div>

            {filteredExamTopics.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ width:56, height:56, borderRadius:18, background:isNova?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <EduIcon id="book" size={26} color={bodyColor} />
                </div>
                <div style={{ fontSize:14, fontWeight:800, color:M.textPrimary, fontFamily:'Nunito, sans-serif', marginBottom:5 }}>No topics yet</div>
                <div style={{ fontSize:12, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>Topics appear once exam curriculum is uploaded in Admin.</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filteredExamTopics.map((topic, i) => {
                  const rdy = topic.ready
                  const icon = getTopicIcon(topic.title)
                  return (
                    <button key={topic.id||topic.title} onClick={() => topic.firstNotDone && router.push(`/learn/lesson/${topic.firstNotDone.id}`)} className="el-btn"
                      style={{ padding:'13px 16px', background:isNova?'rgba(255,255,255,0.055)':'#fff', border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.055)'}`, borderRadius:16, cursor:topic.firstNotDone?'pointer':'default', textAlign:'left', display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 6px rgba(0,0,0,0.04)', animation:`elIn 0.22s ${Math.min(i*0.025,0.22)}s ease both` }}>
                      {/* Icon box */}
                      <div style={{ width:46, height:46, borderRadius:13, background:`${rdy.color}14`, border:`1.5px solid ${rdy.color}28`, boxShadow:`0 3px 10px ${rdy.color}14,inset 0 1px 0 rgba(255,255,255,0.4)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'monospace', fontSize:13, fontWeight:900, color:rdy.color }}>
                        {icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:isNova?'#F0EFFF':M.textPrimary, fontFamily:'Nunito, sans-serif', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{topic.title}</div>
                        <div style={{ height:4, background:isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${topic.pct}%`, background:rdy.color, borderRadius:99, transition:'width 0.8s ease' }} />
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                        <div style={{ padding:'3px 9px', background:`${rdy.color}16`, border:`1px solid ${rdy.color}25`, borderRadius:99 }}>
                          <span style={{ fontSize:9, fontWeight:900, color:rdy.color, fontFamily:'Nunito, sans-serif' }}>{rdy.label}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:800, color:isNova?'rgba(255,255,255,0.5)':M.textSecondary, fontFamily:'Sora, sans-serif' }}>{topic.pct}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    )
  })()

  // ── SCHOOL LEARN TAB — unchanged logic, minor style polish ────────────────
  const SchoolLearnTab = (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      background: isNova ? '#0F0C29' : M.mapBg || '#F4F5FA',
    }}>
      {isNova && <NovaStars />}
      <div ref={pathScrollRef} onScroll={handlePathScrollFull}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>

        {!currentLevel?.terms?.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BicPencil pose="think" size={100} style={{ display: 'inline-block', marginBottom: 18 }} />
            <p style={{ fontWeight: 800, fontSize: 18, color: M.textPrimary, fontFamily: M.headingFont }}>Content coming soon!</p>
            <p style={{ fontSize: 13, marginTop: 6, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', fontWeight: 500 }}>We&apos;re preparing lessons for {student?.class_level}.</p>
          </div>
        )}

        <div style={{ maxWidth: 520, margin: '0 auto', padding: `24px 0 ${isMobile ? 'max(170px, calc(140px + env(safe-area-inset-bottom)))' : '80px'}`, position: 'relative' }}>
          {pathItems.map((item, idx) => {

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

            if (item.kind === 'lesson') {
              const { sub, tAccent, isDone, isCurrent, isLocked, subIdx, globalIdx, topicTitle } = item
              const isSelected = selectedNode?.sub?.id === sub.id
              const nodeSize = isCurrent ? 64 : isDone ? 52 : isLocked ? 38 : 46
              return (
                <div key={`lesson-${sub.id}`} ref={isCurrent ? currentNodeRef : null} style={{
                    position: 'relative', zIndex: 2, padding: '18px 0',
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
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: reviewDone ? 'linear-gradient(135deg,#FFD700,#FF9500)' : reviewUnlocked ? `${tAccent}18` : (isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                      border: `2.5px solid ${reviewDone ? '#FFD700' : reviewUnlocked ? tAccent : (isNova ? 'rgba(255,255,255,0.15)' : '#ddd')}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(12deg)',
                      boxShadow: reviewDone ? '0 0 0 6px rgba(255,210,0,0.18), 0 4px 16px rgba(255,180,0,0.35)' : reviewUnlocked ? `0 0 0 5px ${tAccent}18` : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ transform: 'rotate(-12deg)', fontSize: 20 }}>⭐</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: reviewDone ? '#A06000' : reviewUnlocked ? tAccent : bodyColor, fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>Topic Review</div>
                      <div style={{ fontSize: 10, color: bodyColor, fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginTop: 2 }}>{reviewDone ? 'Completed ✓' : reviewUnlocked ? 'Tap to review →' : 'Finish more lessons'}</div>
                    </div>
                  </button>
                </div>
              )
            }

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

      {/* STICKY TOPIC BANNER */}
      {stickyTopic && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ background: isNova ? 'rgba(10,8,32,0.96)' : isBlaze ? '#FFD700' : `${M.hudBg || '#fff'}F5`, backdropFilter: 'blur(20px)', borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : `${accent}20`}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: isBlaze ? 'none' : '0 4px 20px rgba(0,0,0,0.12)' }}>
            {(() => {
              const termEntry = (level?.terms || []).find(t => (t.units || []).some(u => (u.topics || []).some(tp => tp.title === stickyTopic)))
              const termIdx = termEntry ? (level?.terms || []).indexOf(termEntry) : 0
              const tAcc = termAccents[termIdx % termAccents.length]
              return (
                <>
                  <div style={{ flexShrink: 0, background: tAcc, borderRadius: isBlaze ? 6 : 10, padding: '4px 10px', fontSize: 9, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 1, boxShadow: `0 3px 10px ${tAcc}55` }}>
                    {termEntry ? termEntry.name.split(' ').slice(0, 2).join(' ') : 'Term'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: isBlaze ? '#0d0d0d' : isNova ? '#F8F7FF' : M.textPrimary, fontFamily: 'Nunito, sans-serif', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stickyTopic}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* JUMP-TO-CURRENT */}
      {nextLesson && (
        <div style={{ position: 'absolute', bottom: isMobile ? 90 : 24, right: 16, zIndex: 11, opacity: currentNodeDir ? 1 : 0, transform: currentNodeDir ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(8px)', pointerEvents: currentNodeDir ? 'auto' : 'none', transition: 'opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.34,1.1,0.64,1)' }}>
          <button onClick={jumpToCurrent} style={{ width: 46, height: 46, borderRadius: '50%', cursor: 'pointer', background: isBlaze ? '#FFD700' : accent, border: isBlaze ? '2px solid #0d0d0d' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 20px ${accent}65`, color: isBlaze ? '#0d0d0d' : '#fff' }}>
            {currentNodeDir === 'up' ? '↑' : '↓'}
          </button>
        </div>
      )}

      {/* Lesson detail sheet */}
      {selectedNode && (
        <>
          <div onClick={() => setSelectedNode(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 30, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520, zIndex: 31, background: isNova ? '#1a1040' : '#fff', borderRadius: isBlaze ? '14px 14px 0 0' : '24px 24px 0 0', padding: '20px 20px 40px', boxShadow: '0 -12px 40px rgba(0,0,0,0.2)', animation: 'sheetUp 0.28s cubic-bezier(0.34,1.1,0.64,1)', fontFamily: 'Nunito, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 18 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: isNova ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} />
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

  const LearnTab = isExamMode ? ExamLearnTab : SchoolLearnTab

  // ══════════════════════════════════════════════════════════════════════════
  // PRACTICE TAB — redesigned
  // ══════════════════════════════════════════════════════════════════════════
  const [practiceTimer, setPracticeTimer] = useState(false)
  const [practiceType,  setPracticeType]  = useState('mcq')

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
    <div style={{ height:'100%', overflowY:'auto', background: isNova?'#0D0B1E':'#F6F5F2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=Nunito:wght@500;600;700;800;900&display=swap');
        @keyframes ptIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pt-btn:active { transform:scale(0.97); }
        .pt-btn { transition:transform 0.12s cubic-bezier(0.34,1.2,0.64,1); }
      `}</style>

      <div style={{ maxWidth:520, margin:'0 auto', padding:`20px 16px ${isMobile?'max(160px,calc(130px + env(safe-area-inset-bottom)))':'60px'}` }}>

        {/* Header */}
        <div style={{ marginBottom:20, animation:'ptIn 0.3s ease both' }}>
          <div style={{ fontSize:10, fontWeight:800, color:bodyColor, textTransform:'uppercase', letterSpacing:1.4, fontFamily:'Nunito, sans-serif', marginBottom:5 }}>
            {isExamMode ? (student?.exam_type?.toUpperCase()||'WAEC')+' Preparation' : 'Sharpen Your Skills'}
          </div>
          <div style={{ fontSize:26, fontWeight:900, color:isNova?'#F0EFFF':M.textPrimary, fontFamily:'Sora, sans-serif', lineHeight:1.1, marginBottom:6 }}>Practice</div>
          <div style={{ fontSize:12, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, fontStyle:'italic' }}>{practiceGreeting}</div>
        </div>

        {/* Exam mode: readiness strip */}
        {isExamMode && (() => {
          const rPct = overallReadinessPct
          const rdy  = rPct !== null ? readinessLevel(rPct) : null
          return rPct !== null ? (
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:16, marginBottom:20, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}`, animation:'ptIn 0.3s 0.04s ease both' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', marginBottom:6 }}>
                  You are {rPct}% ready for {student?.exam_type||'WAEC'}
                </div>
                <div style={{ height:5, background:isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${rPct}%`, background:rdy.color, borderRadius:99, transition:'width 1.2s ease' }} />
                </div>
              </div>
              <div style={{ padding:'5px 13px', background:`${rdy.color}16`, border:`1.5px solid ${rdy.color}28`, borderRadius:99, flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:900, color:rdy.color, fontFamily:'Nunito, sans-serif' }}>{rdy.label}</span>
              </div>
            </div>
          ) : null
        })()}

        {/* Practice by Topic */}
        <div style={{ marginBottom:20, animation:'ptIn 0.3s 0.06s ease both' }}>
          <div style={{ fontSize:11, fontWeight:900, color:M.textPrimary, textTransform:'uppercase', letterSpacing:1, fontFamily:'Nunito, sans-serif', marginBottom:12 }}>Practice by Topic</div>

          {(isExamMode ? examTopics : allTopics).length === 0 ? (
            <div style={{ padding:'24px', background:isNova?'rgba(255,255,255,0.05)':'#fff', borderRadius:16, textAlign:'center', border:`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}` }}>
              <div style={{ fontSize:13, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>No topics available yet.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(isExamMode ? examTopics : allTopics).map((topic, i) => {
                const tPct = isExamMode
                  ? topic.pct
                  : (() => { const s=topic.subtopics||[]; return s.length>0?Math.round(s.filter(sb=>completedIds.has(sb.id)).length/s.length*100):0 })()
                const tRdy = isExamMode ? topic.ready : readinessLevel(tPct > 0 ? tPct : null)

                let analyticsMsg = 'Take a quiz to check your level'
                let analyticsColor = bodyColor
                if (tPct >= 80)      { analyticsMsg = `${tPct}% — Strong`;         analyticsColor = '#22c55e' }
                else if (tPct >= 40) { analyticsMsg = `${tPct}% — Needs practice`; analyticsColor = '#d97706' }
                else if (tPct > 0)   { analyticsMsg = `${tPct}% — Practice more`;  analyticsColor = '#ef4444' }

                const dest = isExamMode
                  ? `/learn/past-questions?topic=${encodeURIComponent(topic.title)}`
                  : '/learn/practice'
                const topicIcon = getTopicIcon(topic.title)

                return (
                  <button key={topic.id||topic.title} onClick={() => router.push(dest)} className="pt-btn"
                    style={{ padding:'14px 16px', background:isNova?'rgba(255,255,255,0.06)':'#fff', border:`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.055)'}`, borderRadius:16, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 8px rgba(0,0,0,0.045)', animation:`ptIn 0.2s ${Math.min(i*0.025,0.2)}s ease both` }}>
                    {/* Icon box */}
                    <div style={{ width:46, height:46, borderRadius:13, background:`${tRdy.color}14`, border:`1.5px solid ${tRdy.color}25`, boxShadow:`0 3px 10px ${tRdy.color}12,inset 0 1px 0 rgba(255,255,255,0.42)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'monospace', fontSize:12, fontWeight:900, color:tRdy.color }}>
                      {topicIcon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:isNova?'#F0EFFF':M.textPrimary, fontFamily:'Nunito, sans-serif', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{topic.title}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ height:4, flex:1, background:isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${tPct}%`, background:tRdy.color, borderRadius:99, transition:'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize:10, fontWeight:800, color:tRdy.color, fontFamily:'Sora, sans-serif', flexShrink:0 }}>{tPct}%</span>
                      </div>
                      <div style={{ fontSize:10, fontWeight:700, color:analyticsColor, fontFamily:'Nunito, sans-serif', marginTop:4 }}>{analyticsMsg}</div>
                    </div>
                    <EduIcon id="compass" size={12} color={bodyColor} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Mock Test (exam mode) */}
        {isExamMode && (
          <div style={{ marginBottom:20, animation:'ptIn 0.3s 0.1s ease both' }}>
            <div style={{ fontSize:11, fontWeight:900, color:M.textPrimary, textTransform:'uppercase', letterSpacing:1, fontFamily:'Nunito, sans-serif', marginBottom:12 }}>Mock Test</div>
            <button onClick={() => router.push('/learn/mock-test')} className="pt-btn"
              style={{ width:'100%', padding:'20px', border:'none', borderRadius:18, cursor:'pointer', textAlign:'left', background:`linear-gradient(140deg,#4f46e5,#7c3aed)`, boxShadow:'0 8px 28px rgba(79,70,229,0.40)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
              <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative', zIndex:1 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.28)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <EduIcon id="shield" size={25} color="#fff" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'#fff', fontFamily:'Sora, sans-serif', marginBottom:3 }}>Mock Test</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.78)', fontFamily:'Nunito, sans-serif', fontWeight:600 }}>Full timed exam · All topics · Real {student?.exam_type||'WAEC'} format</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.22)', borderRadius:12, padding:'9px 16px', flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:'#fff', fontFamily:'Nunito, sans-serif' }}>Start →</span>
                </div>
              </div>
            </button>
            <div style={{ marginTop:8, fontSize:11, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, textAlign:'center' }}>
              Select exam year, then choose question type and timing inside the test
            </div>
          </div>
        )}

        {/* School mode stats + CTA */}
        {!isExamMode && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20, animation:'ptIn 0.3s 0.1s ease both' }}>
              {[
                { label:'Done',   value:doneLessons,        color:'#22c55e', icon:'star'  },
                { label:'Streak', value:`${streak}d`,        color:accent,    icon:'flame' },
                { label:'XP',     value:xp.toLocaleString(), color:'#f59e0b', icon:'bolt'  },
              ].map(s => (
                <div key={s.label} style={{ padding:'16px 10px', background:isNova?'rgba(255,255,255,0.07)':'#fff', borderRadius:16, textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.055)'}` }}>
                  <EduIcon id={s.icon} size={18} color={s.color} style={{ margin:'0 auto 8px' }} />
                  <div style={{ fontSize:20, fontWeight:900, color:s.color, fontFamily:'Sora, sans-serif', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:bodyColor, textTransform:'uppercase', letterSpacing:0.8, fontFamily:'Nunito, sans-serif', marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/learn/practice')} className="pt-btn"
              style={{ width:'100%', padding:'18px 20px', background:`linear-gradient(135deg,${accent},${M.accent2||accent}CC)`, border:'none', borderRadius:18, cursor:'pointer', display:'flex', alignItems:'center', gap:14, marginBottom:20, boxShadow:`0 8px 26px ${accent}40`, textAlign:'left', animation:'ptIn 0.3s 0.14s ease both' }}>
              <div style={{ width:48, height:48, borderRadius:15, background:'rgba(255,255,255,0.22)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <EduIcon id="pencil" size={23} color="#fff" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:900, color:'#fff', fontFamily:'Sora, sans-serif', marginBottom:3 }}>Open Practice</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', fontFamily:'Nunito, sans-serif', fontWeight:600 }}>Questions from your {student?.class_level||'class'} topics</div>
              </div>
              <span style={{ fontSize:20, color:'rgba(255,255,255,0.8)', fontWeight:900 }}>→</span>
            </button>
          </>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // CHALLENGE TAB — unchanged
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
  // LEADERBOARD TAB — unchanged (exam mode only)
  const LeaderboardTab = (
    <div style={{ height:'100%', overflowY:'auto', background: isNova?'#0D0B1E':'#F2F1EE' }}>
      <style>{`@keyframes lbFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ background: isNova?`linear-gradient(160deg,${accent}28,transparent)`:`linear-gradient(160deg,${accent},${accent}CC)`, padding:'28px 20px 22px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-24, top:-24, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
        <div style={{ fontSize:10, fontWeight:700, color:isNova?accent+'CC':'rgba(255,255,255,0.75)', fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Exam Leaderboard</div>
        <div style={{ fontSize:26, fontWeight:900, color:isNova?'#F0EFFF':'#fff', fontFamily:'Sora, sans-serif', lineHeight:1.1, marginBottom:6 }}>
          {student?.exam_type?.toUpperCase()||'WAEC'} Rankings
        </div>
        {(() => {
          const lb = boards[leaderboardType] || []
          const myPos = lb.findIndex(e => e.id === student?.id)
          return myPos >= 0 ? (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.22)', borderRadius:99, padding:'5px 14px' }}>
              <span style={{ fontSize:12, fontWeight:900, color:'#fff', fontFamily:'Nunito, sans-serif' }}>
                You are #{myPos+1} · {monthlyXp} XP this month
              </span>
            </div>
          ) : null
        })()}
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:`16px 16px ${isMobile?'max(160px,calc(130px + env(safe-area-inset-bottom)))':'60px'}` }}>
        <div style={{ display:'flex', background:isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)', borderRadius:14, padding:4, gap:4, marginBottom:18, animation:'lbFade 0.3s ease both' }}>
          {[{id:'class',label:student?.class_level||'My Class'},{id:'school',label:'School'},{id:'overall',label:'Overall'}].map(t => (
            <button key={t.id} onClick={() => setLeaderboardType(t.id)} style={{ flex:1, padding:'9px 6px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'Nunito, sans-serif', fontSize:11, fontWeight:800, transition:'all 0.15s', background:leaderboardType===t.id?accent:'transparent', color:leaderboardType===t.id?'#fff':bodyColor, boxShadow:leaderboardType===t.id?`0 3px 10px ${accent}40`:'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {!boardsLoaded ? (
          <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:`1px solid ${isNova?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'}` }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.08)', flexShrink:0 }} />
                <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(0,0,0,0.07)', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ width:'55%', height:12, borderRadius:6, background:'rgba(0,0,0,0.07)', marginBottom:6 }} />
                  <div style={{ width:'35%', height:9, borderRadius:5, background:'rgba(0,0,0,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (boards[leaderboardType]||[]).length === 0 ? (
          <div style={{ textAlign:'center', padding:'52px 20px', animation:'lbFade 0.3s ease both' }}>
            <div style={{ width:64, height:64, borderRadius:20, background:`${accent}14`, border:`2px solid ${accent}25`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <EduIcon id="trophy" size={30} color={accent} />
            </div>
            <div style={{ fontWeight:900, fontSize:16, color:M.textPrimary, fontFamily:'Nunito, sans-serif', marginBottom:6 }}>No rankings yet</div>
            <div style={{ fontSize:13, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>Complete lessons and practice to appear here!</div>
          </div>
        ) : (
          <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 3px 16px rgba(0,0,0,0.07)', animation:'lbFade 0.3s 0.05s ease both' }}>
            {(boards[leaderboardType]||[]).map((entry, idx) => {
              const isMe = entry.id === student?.id
              const eXp  = entry.monthly_xp || 0
              const medals = [
                { bg:'linear-gradient(145deg,#FFD700,#FFA500)', text:'#7A5800', shadow:'rgba(255,165,0,0.5)' },
                { bg:'linear-gradient(145deg,#E0E0E0,#A0A0A0)', text:'#555',    shadow:'rgba(160,160,160,0.4)' },
                { bg:'linear-gradient(145deg,#CD7F32,#A0522D)', text:'#fff',    shadow:'rgba(160,82,45,0.4)'  },
              ]
              return (
                <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:isMe?(isNova?`${accent}14`:`${accent}08`):'transparent', borderLeft:`3px solid ${isMe?accent:'transparent'}`, borderBottom:`1px solid ${isNova?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'}` }}>
                  <div style={{ width:30, flexShrink:0, display:'flex', justifyContent:'center' }}>
                    {idx < 3 ? (
                      <div style={{ width:28, height:28, borderRadius:'50%', background:medals[idx].bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:medals[idx].text, boxShadow:`0 3px 8px ${medals[idx].shadow}` }}>{idx+1}</div>
                    ) : (
                      <span style={{ fontSize:12, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>#{idx+1}</span>
                    )}
                  </div>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(145deg,${accent}28,${accent}14)`, border:`1.5px solid ${accent}35`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:accent, flexShrink:0, boxShadow:`0 2px 8px ${accent}20` }}>
                    {entry.display_name?.[0]?.toUpperCase()||'?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:isMe?900:700, fontSize:13, color:isMe?accent:(isNova?'#F8F7FF':M.textPrimary), fontFamily:'Nunito, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
                      {entry.display_name}
                      {isMe && <span style={{ fontSize:9, fontWeight:900, color:accent, background:`${accent}18`, borderRadius:20, padding:'1px 6px', flexShrink:0 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:500 }}>{entry.class_level}{entry.school?` · ${entry.school}`:''}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:900, color:isMe?accent:M.textPrimary, fontFamily:'Sora, sans-serif', fontSize:15 }}>{eXp.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:500 }}>XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ textAlign:'center', marginTop:14, fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>
          Rankings reset on the 1st of each month
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // RANK TAB — redesigned
  // ══════════════════════════════════════════════════════════════════════════
  const LB_TABS = [
    { id: 'class',   label: student?.class_level || 'My Class' },
    { id: 'school',  label: 'My School' },
    { id: 'overall', label: 'Overall'   },
  ]

  const [rankView, setRankView] = useState('global')

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
    <div style={{ height:'100%', overflowY:'auto', background:isNova?'#0D0B1E':'#F6F5F2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=Nunito:wght@500;600;700;800;900&display=swap');
        @keyframes rFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rBar    { from{width:0} }
        @keyframes rPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.06)} }
      `}</style>
      <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:'max(90px, calc(70px + env(safe-area-inset-bottom)))' }}>

        {/* Hero banner */}
        <div style={{ background:isNova?`linear-gradient(160deg,${masteryRank.color}30 0%,transparent 65%)`:`linear-gradient(160deg,${masteryRank.color}18 0%,${masteryRank.color}06 100%)`, padding:'28px 20px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:160, height:160, borderRadius:'50%', background:`${masteryRank.color}10`, pointerEvents:'none' }} />
          <div style={{ fontSize:10, fontWeight:900, color:masteryRank.color, textTransform:'uppercase', letterSpacing:1.6, fontFamily:'Nunito, sans-serif', marginBottom:16, position:'relative', zIndex:1 }}>Your Rank Journey</div>

          {/* Rank card */}
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20, position:'relative', zIndex:1, animation:'rFadeUp 0.35s ease both' }}>
            <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(145deg,${masteryRank.color}30,${masteryRank.color}10)`, border:`2.5px solid ${masteryRank.color}55`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 8px 28px ${masteryRank.color}30` }}>
              <EduIcon id={RANK_ICONS[masteryRank.title]||'star'} size={34} color={masteryRank.color} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:28, fontWeight:900, color:masteryRank.color, fontFamily:'Sora, sans-serif', lineHeight:1.05, marginBottom:3 }}>{masteryRank.title}</div>
              <div style={{ fontSize:12, color:bodyColor, fontFamily:'Nunito, sans-serif', fontStyle:'italic', fontWeight:600 }}>{masteryRank.flavor}</div>
            </div>
          </div>

          {/* XP Progress */}
          {nextRank ? (
            <div style={{ position:'relative', zIndex:1, animation:'rFadeUp 0.35s 0.06s ease both' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif' }}>{xp.toLocaleString()} XP</span>
                <span style={{ fontSize:12, fontWeight:900, color:masteryRank.color, fontFamily:'Nunito, sans-serif' }}>{nextRank.minXp - xp} XP to go</span>
              </div>
              <div style={{ height:10, background:isNova?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.09)', borderRadius:99, overflow:'hidden', marginBottom:6 }}>
                <div style={{ height:'100%', width:`${rankProgress}%`, background:`linear-gradient(90deg,${masteryRank.color},${nextRank.color})`, borderRadius:99, transition:'width 1.2s ease', animation:'rBar 1.2s ease' }} />
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
            <div style={{ padding:'12px 14px', background:isNova?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.72)', borderRadius:14, backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:10, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:0.9, fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Position in Rank</div>
              <div style={{ fontSize:22, fontWeight:900, color:masteryRank.color, fontFamily:'Sora, sans-serif', lineHeight:1 }}>
                #{myPosInRank} <span style={{ fontSize:12, color:bodyColor, fontWeight:600 }}>of {totalInRank}</span>
              </div>
            </div>
            <div style={{ padding:'12px 14px', background:isNova?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.72)', borderRadius:14, backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:10, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:0.9, fontFamily:'Nunito, sans-serif', marginBottom:3 }}>Monthly XP</div>
              <div style={{ fontSize:22, fontWeight:900, color:accent, fontFamily:'Sora, sans-serif', lineHeight:1 }}>{monthlyXp.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Rank Journey horizontal track */}
        <div style={{ padding:'22px 20px 0', animation:'rFadeUp 0.35s 0.14s ease both' }}>
          <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:16 }}>Rank Journey</div>
          <div style={{ overflowX:'auto', paddingBottom:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', minWidth:`${MASTERY_RANKS.length * 80}px` }}>
              {MASTERY_RANKS.map((rank, idx) => {
                const isCur  = rank.title === masteryRank.title
                const isPast = idx < myRankIdx
                const isFut  = idx > myRankIdx
                return (
                  <div key={rank.title} style={{ display:'flex', flexDirection:'column', alignItems:'center', width:80, flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                      <div style={{ flex:1, height:3, background:idx===0?'transparent':isPast||isCur?rank.color:isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)', borderRadius:1.5 }} />
                      <div style={{
                        width:isCur?48:36, height:isCur?48:36, borderRadius:isCur?15:11, flexShrink:0,
                        background:isCur?`linear-gradient(145deg,${rank.color}35,${rank.color}12)`:isPast?`${rank.color}16`:isNova?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',
                        border:isCur?`2.5px solid ${rank.color}`:isPast?`1.5px solid ${rank.color}40`:`1.5px solid ${isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:isCur?`0 4px 18px ${rank.color}40`:'none',
                        animation:isCur?'rPulse 2.5s ease-in-out infinite':'none',
                      }}>
                        {isPast ? <EduIcon id="star" size={13} color={rank.color+'88'} />
                          : <EduIcon id={RANK_ICONS[rank.title]||'star'} size={isCur?22:14} color={isCur?rank.color:bodyColor} />}
                      </div>
                      <div style={{ flex:1, height:3, background:idx===MASTERY_RANKS.length-1?'transparent':isPast?MASTERY_RANKS[idx+1]?.color||rank.color:isNova?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)', borderRadius:1.5 }} />
                    </div>
                    <div style={{ marginTop:9, textAlign:'center', padding:'0 3px' }}>
                      <div style={{ fontSize:isCur?10:9, fontWeight:isCur?900:600, color:isCur?rank.color:isPast?M.textPrimary:bodyColor, fontFamily:'Nunito, sans-serif', lineHeight:1.3, wordBreak:'break-word' }}>
                        {rank.title}
                      </div>
                      {isCur && <div style={{ fontSize:8, fontWeight:900, color:rank.color, fontFamily:'Nunito, sans-serif', marginTop:2, background:`${rank.color}18`, borderRadius:99, padding:'1px 6px' }}>YOU</div>}
                      {isPast && <div style={{ fontSize:10, color:rank.color, marginTop:1 }}>✓</div>}
                      {isFut  && <div style={{ fontSize:8, color:bodyColor, marginTop:2, opacity:0.5, fontFamily:'Nunito, sans-serif' }}>{rank.minXp>=1000?(rank.minXp/1000).toFixed(rank.minXp%1000===0?0:1)+'k':rank.minXp} XP</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* People in Your Rank */}
        <div style={{ padding:'22px 20px 0', animation:'rFadeUp 0.35s 0.18s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif' }}>People in Your Rank</div>
              {myPosInRank > 0 && (
                <div style={{ fontSize:10, color:masteryRank.color, fontFamily:'Nunito, sans-serif', fontWeight:700, marginTop:2 }}>You are #{myPosInRank} — keep climbing</div>
              )}
            </div>
            {boards.school.length > 0 && (
              <div style={{ display:'flex', background:isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', borderRadius:99, padding:3, gap:2 }}>
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
            <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, overflow:'hidden', border:`1px solid ${isNova?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.07)'}` }}>
              {sameRankPeople.map((entry, idx) => {
                const isMe  = entry.id === student?.id
                const eRank = MASTERY_RANKS.slice().reverse().find(r=>(entry.xp||0)>=r.minXp)||MASTERY_RANKS[0]
                const eXp   = entry.monthly_xp || 0
                const movement = (entry.xp_today||0)>0 ? '↑' : (entry.xp_dropped||0)>0 ? '↓' : '—'
                const mvColor  = movement==='↑'?'#22c55e':movement==='↓'?'#EF4444':bodyColor
                return (
                  <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:isMe?`${accent}07`:'transparent', borderLeft:`3px solid ${isMe?accent:'transparent'}`, borderBottom:idx<sameRankPeople.length-1?`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}`:'none' }}>
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
                      <div style={{ fontSize:13, fontWeight:900, color:accent, fontFamily:'Sora, sans-serif' }}>{eXp.toLocaleString()}</div>
                      <div style={{ fontSize:12, fontWeight:800, color:mvColor, fontFamily:'Nunito, sans-serif' }}>{movement}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* How to earn XP */}
        <div style={{ margin:'20px 20px 0', padding:'18px', background:isNova?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)', borderRadius:16, border:`1px solid ${isNova?'rgba(255,255,255,0.09)':'rgba(0,0,0,0.07)'}`, animation:'rFadeUp 0.35s 0.22s ease both' }}>
          <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:12 }}>How to earn XP</div>
          {[
            { icon:'book',   label:'Complete a lesson',   pts:'+1–10 XP' },
            { icon:'pencil', label:'Practice questions',  pts:'+3 XP'    },
            { icon:'puzzle', label:'Solve a puzzle cell', pts:'+3 XP'    },
          ].map((item, i) => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:i<2?`1px solid ${isNova?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'}`:'none' }}>
              <div style={{ width:30, height:30, borderRadius:9, background:`${accent}10`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <EduIcon id={item.icon} size={14} color={accent} />
              </div>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:isNova?'#F8F7FF':M.textPrimary, fontFamily:'Nunito, sans-serif' }}>{item.label}</span>
              <span style={{ fontSize:12, fontWeight:900, color:accent, fontFamily:'Sora, sans-serif' }}>{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE TAB — redesigned
  // ══════════════════════════════════════════════════════════════════════════
  const heroBg = isNova   ? 'linear-gradient(160deg,#1E1B4B,#0F0C29)'
    : isRoots  ? 'linear-gradient(160deg,#C0392B,#8B1A1A)'
    : isBlaze  ? 'linear-gradient(160deg,#E63946,#1D3557)'
    : `linear-gradient(160deg,${accent},${M.accent2 || accent})`

  const PROFILE_AVATAR_COLORS = ['#7C3AED', '#0d9488', '#f97316', '#8b5cf6', '#e11d48', '#0ea5e9']

  // Badge definitions
  const BADGES = [
    { label:'7-Day Streak',  icon:'flame',  color:'#ef4444', earned: streak >= 7          },
    { label:'First Lesson',  icon:'book',   color:'#22c55e', earned: doneLessons >= 1      },
    { label:'Top 5 Class',   icon:'trophy', color:'#f59e0b', earned: myClassRank >= 0 && myClassRank < 5 },
    { label:'100 Questions', icon:'pencil', color:'#3b82f6', earned: practiceAttempts.length >= 100 },
    { label:'20 Lessons',    icon:'star',   color:'#a855f7', earned: doneLessons >= 20      },
  ]

  const ProfileTab = (
    <div style={{ minHeight:'100%', background:isNova?'#0D0B1E':'#F6F5F2', paddingBottom:120, fontFamily:'Nunito, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=Nunito:wght@500;600;700;800;900&display=swap');
        @keyframes pfSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pfBarIn { from{width:0} }
      `}</style>

      {/* ── HERO BANNER ── */}
      <div style={{ background:heroBg, padding:'28px 20px 28px', position:'relative', overflow:'hidden' }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ position:'absolute', right:-36, top:-36, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
        <div style={{ maxWidth:520, margin:'0 auto', position:'relative', zIndex:1 }}>
          {/* Avatar + name row */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', flexShrink:0, background:'rgba(255,255,255,0.22)', border:'3px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:900, color:'#fff', fontFamily:'Sora, sans-serif', boxShadow:'0 6px 22px rgba(0,0,0,0.18)' }}>
              {student?.display_name?.[0]?.toUpperCase()||'?'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff', fontFamily:'Sora, sans-serif', lineHeight:1.1, marginBottom:3 }}>{student?.display_name||'Student'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontFamily:'Nunito, sans-serif', fontWeight:500 }}>
                {isExamMode ? `${student?.exam_type||'WAEC'} Exam Prep` : `${student?.class_level||''}${student?.school ? ` · ${student.school}` : ''}`}
              </div>
              <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.18)', borderRadius:99, padding:'3px 10px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:isExamMode?'#C8F135':'#60a5fa' }} />
                <span style={{ fontSize:10, fontWeight:800, color:'#fff', fontFamily:'Nunito, sans-serif' }}>{isExamMode ? 'Exam Mode' : 'School Mode'}</span>
              </div>
            </div>
            <button onClick={() => setEditOpen(v => !v)} style={{ flexShrink:0, padding:'7px 16px', borderRadius:20, cursor:'pointer', fontFamily:'Nunito, sans-serif', fontSize:12, fontWeight:800, color:editOpen?accent:'#fff', background:editOpen?'#fff':'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', transition:'all 0.2s' }}>
              {editOpen ? 'Done' : 'Edit'}
            </button>
          </div>
          {/* Stats chips */}
          <div style={{ display:'flex', gap:8 }}>
            {[
              { v:xp.toLocaleString(), label:'Total XP',  c:'#FFD700' },
              { v:monthlyXp,           label:'Monthly',    c:'#fff'    },
              { v:`${streak}d`,        label:'Streak',     c:'#fff'    },
              { v:completedIds.size,   label:'Lessons',    c:'#fff'    },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, textAlign:'center', padding:'10px 4px', background:'rgba(255,255,255,0.12)', border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:13 }}>
                <div style={{ fontSize:16, fontWeight:900, color:s.c, fontFamily:'Sora, sans-serif', lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:0.5, fontFamily:'Nunito, sans-serif', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Edit Profile (collapsed by default) */}
        {editOpen && (
          <div style={{ background:isNova?'rgba(255,255,255,0.07)':'#fff', border:`1.5px solid ${accent}28`, borderRadius:18, padding:'18px', boxShadow:`0 4px 20px ${accent}14`, animation:'pfSlide 0.22s ease' }}>
            <div style={{ fontSize:11, fontWeight:900, color:accent, textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Nunito, sans-serif', marginBottom:16 }}>Edit Profile</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', display:'block', marginBottom:5 }}>Display Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', display:'block', marginBottom:8 }}>Learning Mode</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { id:'school', label:'School Mode', desc:'Class curriculum, guided path' },
                    { id:'exam',   label:'Exam Prep',   desc:'Topic-based, practice-heavy'  },
                  ].map(m => (
                    <button key={m.id} onClick={() => setEditMode(m.id)} style={{ padding:'12px 10px', borderRadius:13, border:`2px solid ${editMode===m.id?accent:'rgba(0,0,0,0.09)'}`, background:editMode===m.id?`${accent}0E`:'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:editMode===m.id?accent:'rgba(0,0,0,0.2)', marginBottom:7, transition:'all 0.15s' }} />
                      <div style={{ fontSize:12, fontWeight:900, color:editMode===m.id?accent:(isNova?'#F0EFFF':M.textPrimary), fontFamily:'Nunito, sans-serif', marginBottom:2 }}>{m.label}</div>
                      <div style={{ fontSize:9, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600, lineHeight:1.4 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {editMode === 'exam' && (
                <div style={{ background:`${accent}06`, border:`1px solid ${accent}18`, borderRadius:13, padding:'14px', display:'flex', flexDirection:'column', gap:10, animation:'pfSlide 0.2s ease' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:accent, textTransform:'uppercase', letterSpacing:1, fontFamily:'Nunito, sans-serif' }}>Exam Details</div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', display:'block', marginBottom:5 }}>Target Exam</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {['WAEC','BECE','JAMB','NECO'].map(e => (
                        <button key={e} onClick={() => setEditExamType(e)} style={{ padding:'8px 16px', borderRadius:10, border:`2px solid ${editExamType===e?accent:'rgba(0,0,0,0.1)'}`, background:editExamType===e?accent:'transparent', color:editExamType===e?'#fff':M.textPrimary, fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:'Nunito, sans-serif', transition:'all 0.15s' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', display:'block', marginBottom:5 }}>Subject</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {['maths','further_maths'].map(s => (
                        <button key={s} onClick={() => setEditExamSubject(s)} style={{ padding:'8px 16px', borderRadius:10, border:`2px solid ${editExamSubject===s?accent:'rgba(0,0,0,0.1)'}`, background:editExamSubject===s?accent:'transparent', color:editExamSubject===s?'#fff':M.textPrimary, fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:'Nunito, sans-serif', transition:'all 0.15s' }}>
                          {s === 'maths' ? 'Mathematics' : 'Further Maths'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {editMode === 'school' && (
                <div style={{ animation:'pfSlide 0.2s ease' }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', display:'block', marginBottom:5 }}>Class Level</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                      {CLASS_OPTIONS.map(cl => (
                        <button key={cl} onClick={() => setEditClass(cl)} style={{ padding:'9px 4px', borderRadius:10, cursor:'pointer', fontFamily:'Nunito, sans-serif', fontSize:12, fontWeight:800, border:editClass===cl?`2px solid ${accent}`:`1.5px solid ${accent}25`, background:editClass===cl?accent:'transparent', color:editClass===cl?'#fff':(isNova?'rgba(255,255,255,0.7)':M.textSecondary), transition:'all 0.15s' }}>
                          {cl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop:10 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:bodyColor, fontFamily:'Nunito, sans-serif', display:'block', marginBottom:5 }}>School</label>
                    <input value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="Your school name" style={inputStyle} />
                  </div>
                </div>
              )}
              <button onClick={() => { saveProfile(); setEditOpen(false) }} disabled={saving}
                style={{ ...M.primaryBtn, width:'100%', marginTop:4, opacity:saving?0.7:1, fontSize:14 }}>
                {saving ? 'Saving…' : saveMsg ? `✓ ${saveMsg}` : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Mastery Rank card */}
        <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, padding:'18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1.5px solid ${masteryRank.color}22` }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${masteryRank.color}18`, border:`1.5px solid ${masteryRank.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <EduIcon id={RANK_ICONS[masteryRank.title]||'star'} size={24} color={masteryRank.color} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:900, color:masteryRank.color, fontFamily:'Sora, sans-serif', lineHeight:1.1 }}>{masteryRank.title}</div>
              <div style={{ fontSize:11, color:bodyColor, fontFamily:'Nunito, sans-serif', fontStyle:'italic', fontWeight:600, marginTop:2 }}>{masteryRank.flavor}</div>
            </div>
          </div>
          {nextRank && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>{xp.toLocaleString()} XP</span>
                <span style={{ fontSize:11, fontWeight:900, color:nextRank.color, fontFamily:'Nunito, sans-serif' }}>{nextRank.title} · {nextRank.minXp - xp} to go</span>
              </div>
              <div style={{ height:8, background:isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.07)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${rankProgress}%`, background:`linear-gradient(90deg,${masteryRank.color},${nextRank.color})`, borderRadius:99, transition:'width 1.2s ease', animation:'pfBarIn 1.2s ease' }} />
              </div>
            </>
          )}
        </div>

        {/* Achievement badges */}
        <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, padding:'18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}` }}>
          <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.1, fontFamily:'Nunito, sans-serif', marginBottom:14 }}>Achievements</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {BADGES.map((badge, i) => (
              <div key={badge.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:badge.earned?1:0.35 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:badge.earned?`linear-gradient(145deg,${badge.color}25,${badge.color}12)`:'rgba(0,0,0,0.05)', border:`2px solid ${badge.earned?badge.color+'45':'rgba(0,0,0,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:badge.earned?`0 4px 14px ${badge.color}28`:'none', transition:'all 0.3s' }}>
                  <EduIcon id={badge.icon} size={20} color={badge.earned?badge.color:'rgba(0,0,0,0.25)'} />
                </div>
                <div style={{ fontSize:8, fontWeight:700, color:badge.earned?M.textPrimary:bodyColor, fontFamily:'Nunito, sans-serif', textAlign:'center', lineHeight:1.3 }}>{badge.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active profile card */}
        <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}` }}>
          <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.1, fontFamily:'Nunito, sans-serif', marginBottom:12 }}>Active Profile</div>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:isNova?'rgba(255,255,255,0.06)':`${accent}07`, border:`1.5px solid ${accent}28`, borderRadius:14 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:`${accent}20`, border:`1.5px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:accent, flexShrink:0 }}>
              {student?.display_name?.[0]?.toUpperCase()||'?'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:isNova?'#F0EFFF':M.textPrimary, fontFamily:'Nunito, sans-serif' }}>{student?.display_name}</div>
              <div style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', marginTop:2 }}>
                {isExamMode ? `${student?.exam_type||'WAEC'} · Exam Prep` : `${student?.class_level||''} · School Mode`}
              </div>
            </div>
            <span style={{ fontSize:9, fontWeight:900, color:accent, background:`${accent}16`, borderRadius:99, padding:'2px 8px', fontFamily:'Nunito, sans-serif' }}>ACTIVE</span>
          </div>
        </div>

        {/* Other profiles */}
        {allStudents.length > 1 && (
          <div style={{ background:isNova?'rgba(255,255,255,0.06)':'#fff', borderRadius:18, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${isNova?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:900, color:bodyColor, textTransform:'uppercase', letterSpacing:1.1, fontFamily:'Nunito, sans-serif' }}>Profiles</div>
              <span style={{ fontSize:10, color:bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:600 }}>{allStudents.length} total</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              {allStudents.map((s, i) => {
                const isActive = s.id === student?.id
                const avatarColor = PROFILE_AVATAR_COLORS[i % PROFILE_AVATAR_COLORS.length]
                return (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 13px', borderRadius:13, background:isActive?(isNova?'rgba(124,58,237,0.12)':`${accent}08`):(isNova?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)'), border:`1.5px solid ${isActive?accent+'35':(isNova?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)')}` }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff' }}>
                      {s.display_name?.[0]?.toUpperCase()||'?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:isNova?'#F8F7FF':M.textPrimary, fontFamily:'Nunito, sans-serif', display:'flex', alignItems:'center', gap:5 }}>
                        {s.display_name}
                        {isActive && <span style={{ fontSize:8, fontWeight:900, color:accent, background:`${accent}18`, borderRadius:20, padding:'2px 6px' }}>YOU</span>}
                      </div>
                      <div style={{ fontSize:10, color:bodyColor, fontWeight:500, marginTop:1 }}>{s.class_level}{s.school?` · ${s.school}`:''}</div>
                    </div>
                    {!isActive && (
                      <button onClick={() => setShowSwitcher(true)} style={{ fontSize:11, fontWeight:800, color:accent, background:`${accent}12`, border:`1px solid ${accent}28`, borderRadius:99, padding:'5px 12px', cursor:'pointer', fontFamily:'Nunito, sans-serif', flexShrink:0 }}>Switch</button>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowSwitcher(true)} style={{ width:'100%', padding:'11px', cursor:'pointer', background:'transparent', border:`1.5px solid ${accent}28`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'Nunito, sans-serif', color:accent, fontSize:13, fontWeight:800 }}>
              <span style={{ fontSize:18 }}>+</span> Add another profile
            </button>
          </div>
        )}

        {/* Theme / Mascot */}
        <button onClick={() => setShowModePicker(true)} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', borderRadius:18, cursor:'pointer', textAlign:'left', width:'100%', background:isNova?'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(76,29,149,0.12))':isBlaze?'linear-gradient(135deg,#FFD700,#FFA500)':`linear-gradient(135deg,${accent}18,${accent}09)`, border:isNova?'1px solid rgba(124,58,237,0.35)':isBlaze?'2px solid #0d0d0d':`1.5px solid ${accent}28`, boxShadow:isBlaze?'3px 3px 0 #0d0d0d':'none', fontFamily:'Nunito, sans-serif' }}>
          <div style={{ width:50, height:50, borderRadius:'50%', flexShrink:0, background:isNova?'rgba(124,58,237,0.2)':isBlaze?'#fff':`${accent}14`, border:`2px solid ${accent}35`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:isBlaze?'2px 2px 0 #0d0d0d':'none' }}>{M.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:isBlaze?'#0d0d0d':isNova?'#F0EFFF':M.textPrimary, fontFamily:'Nunito, sans-serif', marginBottom:2 }}>{M.name}</div>
            <div style={{ fontSize:11, color:isBlaze?'#555':bodyColor, fontFamily:'Nunito, sans-serif', fontWeight:500 }}>{M.tagline||'Tap to change learning style'}</div>
          </div>
          <div style={{ fontSize:10, fontWeight:800, color:isBlaze?'#0d0d0d':'#fff', background:isBlaze?'#0d0d0d':isNova?'#7C3AED':accent, borderRadius:99, padding:'4px 12px', fontFamily:'Nunito, sans-serif', flexShrink:0 }}>Change</div>
        </button>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{ width:'100%', padding:'13px', cursor:'pointer', background:'transparent', border:'1.5px solid rgba(239,68,68,0.25)', borderRadius:12, fontFamily:'Nunito, sans-serif', fontSize:13, fontWeight:800, color:'#ef4444' }}>
          Sign Out
        </button>

      </div>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )

  // ── Right Stats Panel (desktop only) ────────────────────────────────────
  const RightPanel = isDesktop ? (
    <div style={{
      width: 300, flexShrink: 0, height: '100vh', overflowY: 'auto',
      borderLeft: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
      background: isNova ? 'rgba(15,12,41,0.6)' : (isBlaze ? '#F5F0D0' : M.mapBg),
      padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div style={{ background: isNova ? 'rgba(124,58,237,0.15)' : isBlaze ? '#FFD700' : `${accent}10`, border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${accent}25`, borderRadius: isBlaze ? 10 : 18, padding: '16px 18px', boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : 'none' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.5)' : accent, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Nunito, sans-serif', marginBottom: 6 }}>
          {student?.class_level} · {activeSubject === 'further_maths' ? 'Further Maths' : 'Mathematics'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: isBlaze ? '#0d0d0d' : M.textPrimary, fontFamily: M.headingFont, lineHeight: 1.2, marginBottom: 12 }}>
          {student?.display_name}
        </div>
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

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>Overall Progress</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: accent, fontFamily: 'Nunito, sans-serif' }}>{doneLessons}/{totalLessons}</span>
        </div>
        <div style={{ height: 8, background: isNova ? 'rgba(255,255,255,0.1)' : `${accent}15`, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#22c55e' : `linear-gradient(90deg,${accent},${M.accent2 || accent})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {nextLesson && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>Up Next</div>
          <button onClick={() => window.location.href = `/learn/lesson/${nextLesson.id}`}
            style={{ width: '100%', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', background: isBlaze ? '#FFD700' : isNova ? 'rgba(124,58,237,0.2)' : `linear-gradient(135deg,${accent},${M.accent2 || accent}DD)`, border: isBlaze ? '2px solid #0d0d0d' : 'none', borderRadius: isBlaze ? 10 : 16, boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : `0 6px 20px ${accent}40`, fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: isBlaze ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>▶</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: isBlaze ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Continue Learning</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isBlaze ? '#0d0d0d' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextLesson.title}</div>
            </div>
          </button>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { iconId: 'practice',  label: 'Practice Questions', tab: 'practice',  color: accent    },
            { iconId: 'challenge', label: 'Daily Challenge',    tab: 'challenge', color: '#FF9500' },
            { iconId: 'shield',    label: 'Rank Journey',       tab: 'rank',      color: accent    },
          ].map(a => (
            <button key={a.tab} onClick={() => setActiveTab(a.tab)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', width: '100%', textAlign: 'left', background: isNova ? 'rgba(255,255,255,0.05)' : isBlaze ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.8)', border: isBlaze ? '1.5px solid rgba(0,0,0,0.1)' : `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif' }}>
              <span style={{ color: a.color }}><TabIcon id={a.iconId} size={16} color={a.color} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: M.textPrimary }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {allStudents.length > 1 && (
        <button onClick={() => setShowSwitcher(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', width: '100%', background: 'transparent', border: `1.5px solid ${accent}30`, borderRadius: isBlaze ? 8 : 12, fontFamily: 'Nunito, sans-serif', color: accent, fontSize: 12, fontWeight: 800 }}>
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
        @keyframes ankaraScroll { from{background-position:0 0} to{background-position:128px 0} }
        @keyframes twinkle { 0%,100%{opacity:0.15} 50%{opacity:0.5} }
        @keyframes pulse-glow { 0%,100%{opacity:0.4} 50%{opacity:0.15} }
      `}</style>

      {isMobile ? HUD : SideNav}

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {!isMobile && (
          <div style={{ flexShrink: 0, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`, background: isNova ? 'rgba(15,12,41,0.8)' : M.hudBg }}>
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
          {activeTab === 'challenge'   && !isExamMode && <div style={{ height: '100%', overflowY: 'auto' }}>{ChallengeTab}</div>}
          {activeTab === 'rank'        && !isExamMode && <div style={{ height: '100%', overflowY: 'auto' }}>{RankTab}</div>}
          {activeTab === 'leaderboard' && isExamMode  && <div style={{ height: '100%', overflowY: 'auto' }}>{LeaderboardTab}</div>}
          {activeTab === 'profile'     && <div style={{ height: '100%', overflowY: 'auto' }}>{ProfileTab}</div>}
        </div>
      </div>

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