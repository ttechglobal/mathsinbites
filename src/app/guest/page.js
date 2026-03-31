// src/app/guest/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setGuestSetup } from '@/lib/guestStorage'
import { BicPencil } from '@/components/BiteMarkIcon'

const C = {
  bg: '#09071A', card: '#12102A', accent: '#7C3AED', electric: '#C8F135',
  chalk: '#F0EDFF', dim: 'rgba(220,215,255,0.55)', border: 'rgba(165,155,255,0.14)',
  dimBorder: 'rgba(165,155,255,0.08)',
}

const CLASS_GROUPS = [
  { label: 'Junior Secondary', levels: ['JSS1','JSS2','JSS3'] },
  { label: 'Senior Secondary', levels: ['SS1','SS2','SS3'] },
]

const EXAMS = [
  { id: 'waec', label: 'WAEC', desc: 'West African Examinations Council', available: true },
  { id: 'neco', label: 'NECO', desc: 'National Examinations Council',     available: false },
  { id: 'jamb', label: 'JAMB', desc: 'Joint Admissions & Matriculation',  available: false },
  { id: 'bece', label: 'BECE', desc: 'Basic Education Certificate Exam',  available: false },
]

export default function GuestPage() {
  const router = useRouter()

  // Step flow:
  // 1 = mode picker (School or Exam)
  // 2a = class picker (school mode)
  // 2b = exam picker (exam mode)
  // 3 = subject picker (both modes, SS only or exam mode)
  // 4 = loading / go

  const [step,       setStep]       = useState(1)
  const [mode,       setMode]       = useState('')      // 'school' | 'exam'
  const [classLevel, setClassLevel] = useState('')
  const [exam,       setExam]       = useState('')      // 'waec' etc.
  const [subject,    setSubject]    = useState('maths')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const isSS = ['SS1','SS2','SS3'].includes(classLevel)
  const isExamMode = mode === 'exam'

  async function handleStart() {
    setLoading(true)
    setError('')

    // For exam mode: treat as SS3 Maths (WAEC covers SS1-SS3)
    const effectiveClass = isExamMode ? 'SS3' : classLevel
    setGuestSetup(effectiveClass, subject)

    try {
      const params = new URLSearchParams({
        class:   effectiveClass,
        subject: subject,
        ...(isExamMode ? { exam: exam, examMode: 'true' } : {}),
      })
      const res  = await fetch(`/api/guest/first-lesson?${params}`)
      const data = await res.json()

      if (!res.ok || !data.subtopicId) {
        setError(data.error || 'No lessons found. Check back soon!')
        setLoading(false)
        return
      }
      router.push(`/guest/lesson/${data.subtopicId}`)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function goNext() {
    setError('')
    if (step === 1) {
      if (mode === 'school') setStep(2)
      else if (mode === 'exam') setStep('2b')
    } else if (step === 2) {
      if (isSS) setStep(3)
      else handleStart()
    } else if (step === '2b') {
      setStep(3)
    } else if (step === 3) {
      handleStart()
    }
  }

  const canNext = (step === 1 && mode) ||
    (step === 2 && classLevel) ||
    (step === '2b' && exam) ||
    (step === 3)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .g-opt { padding: 16px; border-radius: 14px; cursor: pointer; border: 1.5px solid ${C.border}; background: transparent; text-align: left; font-family: Nunito, sans-serif; transition: all 0.15s; width: 100%; }
        .g-opt:hover { border-color: rgba(165,155,255,0.4); }
        .g-opt.sel { background: rgba(124,58,237,0.18); border-color: #7C3AED; }
        .g-opt.disabled { opacity: 0.35; cursor: not-allowed; }
        .g-lv { padding: 12px 16px; border-radius: 12px; cursor: pointer; border: 1.5px solid ${C.border}; background: transparent; color: ${C.dim}; font-size: 14px; font-weight: 800; font-family: Nunito, sans-serif; transition: all 0.15s; }
        .g-lv:hover { border-color: rgba(165,155,255,0.4); color: ${C.chalk}; }
        .g-lv.sel { background: rgba(124,58,237,0.18); border-color: #7C3AED; color: ${C.chalk}; }
        .g-btn { width: 100%; padding: 14px; border-radius: 14px; border: none; font-size: 15px; font-weight: 900; font-family: Nunito, sans-serif; transition: all 0.15s; }
      `}</style>

      <div style={{ marginBottom: 20, animation: 'slideUp 0.4s ease' }}>
        <BicPencil pose="celebrate" size={72} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: '26px 22px', animation: 'slideUp 0.4s ease 0.08s both' }}>

        {/* ── Step 1: Mode picker ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 21, fontWeight: 900, color: C.chalk, marginBottom: 4 }}>Welcome to MathsInBites</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 22 }}>How would you like to use the app?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className={`g-opt${mode === 'school' ? ' sel' : ''}`} onClick={() => setMode('school')}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>📚</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.chalk, marginBottom: 2 }}>Learning for School</div>
                    <div style={{ fontSize: 11, color: C.dim }}>Follow your class curriculum term by term</div>
                  </div>
                  {mode === 'school' && <span style={{ marginLeft: 'auto', color: C.electric, fontSize: 18 }}>✓</span>}
                </div>
              </button>
              <button className={`g-opt${mode === 'exam' ? ' sel' : ''}`} onClick={() => setMode('exam')}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>🎯</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.chalk, marginBottom: 2 }}>Preparing for an Exam</div>
                    <div style={{ fontSize: 11, color: C.dim }}>Study all topics from the beginning — WAEC, NECO, JAMB</div>
                  </div>
                  {mode === 'exam' && <span style={{ marginLeft: 'auto', color: C.electric, fontSize: 18 }}>✓</span>}
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── Step 2a: Class picker (school mode) ── */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.chalk, marginBottom: 4 }}>What class are you in?</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>We'll load the right lessons for you.</div>
            {CLASS_GROUPS.map(g => (
              <div key={g.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{g.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {g.levels.map(l => (
                    <button key={l} className={`g-lv${classLevel === l ? ' sel' : ''}`} onClick={() => { setClassLevel(l); setError('') }}>{l}</button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Step 2b: Exam picker ── */}
        {step === '2b' && (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.chalk, marginBottom: 4 }}>Which exam are you preparing for?</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>We'll organise all topics for that exam from start to finish.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EXAMS.map(e => (
                <button key={e.id}
                  className={`g-opt${exam === e.id ? ' sel' : ''}${!e.available ? ' disabled' : ''}`}
                  onClick={() => e.available && setExam(e.id)}
                  disabled={!e.available}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: C.chalk }}>{e.label}</span>
                        {!e.available && <span style={{ fontSize: 9, fontWeight: 800, color: C.accent, background: 'rgba(124,58,237,0.2)', borderRadius: 20, padding: '1px 8px' }}>Coming Soon</span>}
                      </div>
                      <div style={{ fontSize: 11, color: C.dim }}>{e.desc}</div>
                    </div>
                    {exam === e.id && <span style={{ color: C.electric, fontSize: 18 }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 3: Subject picker ── */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.chalk, marginBottom: 4 }}>
              {isExamMode ? `${EXAMS.find(e=>e.id===exam)?.label} — Choose your subject` : 'Choose your subject'}
            </div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>
              {isExamMode ? 'We\'ll cover all topics from SS1 to SS3 in order.' : 'SS students can also study Further Mathematics.'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { val: 'maths',         label: 'Mathematics',         desc: 'Core maths — WAEC, NECO & JAMB', icon: '📐' },
                { val: 'further_maths', label: 'Further Mathematics', desc: 'Vectors, sequences, calculus & more', icon: '📊' },
              ].map(s => (
                <button key={s.val} className={`g-opt${subject === s.val ? ' sel' : ''}`} onClick={() => setSubject(s.val)}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.chalk, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{s.desc}</div>
                    </div>
                    {subject === s.val && <span style={{ color: C.electric, fontSize: 18 }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            {isExamMode && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'rgba(200,241,53,0.8)', fontWeight: 700, lineHeight: 1.6 }}>
                  📌 You'll see all topics from SS1 through SS3 in one continuous path — no term divisions. Start anywhere.
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div style={{ marginTop: 14, fontSize: 12, color: '#FF6B6B', fontWeight: 700, textAlign: 'center', background: 'rgba(255,107,107,0.08)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {step !== 1 && (
            <button onClick={() => {
              setError('')
              if (step === 2 || step === '2b') setStep(1)
              else if (step === 3) setStep(mode === 'exam' ? '2b' : 2)
            }}
              style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
              ← Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canNext || loading}
            style={{ flex: step === 1 ? 1 : 2, padding: '13px', borderRadius: 12, border: 'none', background: canNext ? C.electric : 'rgba(200,241,53,0.18)', color: canNext ? '#0C0820' : 'rgba(200,241,53,0.35)', fontSize: 14, fontWeight: 900, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Finding lessons…' : step === 3 || (step === 2 && !isSS) ? 'Start Learning →' : 'Continue →'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, color: C.dim, animation: 'slideUp 0.4s ease 0.15s both' }}>
        Already have an account?{' '}
        <a href="/auth/login" style={{ color: C.electric, fontWeight: 800, textDecoration: 'none' }}>Sign in →</a>
      </div>
    </div>
  )
}