// src/app/guest/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setGuestSetup } from '@/lib/guestStorage'
import { BicPencil } from '@/components/BiteMarkIcon'

const CLASS_GROUPS = [
  { label: 'Junior Secondary', levels: ['JSS1','JSS2','JSS3'] },
  { label: 'Senior Secondary', levels: ['SS1','SS2','SS3']   },
]

const C = {
  bg: '#09071A', card: '#12102A', accent: '#7C3AED', electric: '#C8F135',
  chalk: '#F0EDFF', dim: 'rgba(220,215,255,0.55)', border: 'rgba(165,155,255,0.14)',
}

export default function GuestPage() {
  const router = useRouter()
  const [step,       setStep]       = useState(1)
  const [classLevel, setClassLevel] = useState('')
  const [subject,    setSubject]    = useState('maths')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const isSS = ['SS1','SS2','SS3'].includes(classLevel)

  async function handleStart() {
    if (!classLevel) return
    setLoading(true)
    setError('')

    try {
      setGuestSetup(classLevel, subject)

      // Call server-side API — bypasses RLS, uses service role
      const res = await fetch(
        `/api/guest/first-lesson?class=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}`
      )
      const data = await res.json()

      if (!res.ok || !data.subtopicId) {
        setError(data.error || 'No lessons found. Please check back soon!')
        setLoading(false)
        return
      }

      router.push(`/guest/lesson/${data.subtopicId}`)
    } catch (e) {
      console.error('[guest]', e)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .gl { padding: 12px 16px; border-radius: 12px; cursor: pointer; border: 1.5px solid rgba(165,155,255,0.14); background: transparent; color: rgba(220,215,255,0.55); font-size: 14px; font-weight: 800; font-family: Nunito, sans-serif; transition: all 0.15s; }
        .gl:hover { border-color: rgba(165,155,255,0.4); color: #F0EDFF; }
        .gl.sel { background: rgba(124,58,237,0.18); border-color: #7C3AED; color: #F0EDFF; }
        .gs { padding: 16px; border-radius: 14px; cursor: pointer; border: 1.5px solid rgba(165,155,255,0.14); background: transparent; text-align: left; font-family: Nunito, sans-serif; transition: all 0.15s; width: 100%; }
        .gs:hover { border-color: rgba(165,155,255,0.4); }
        .gs.sel { background: rgba(124,58,237,0.18); border-color: #7C3AED; }
      `}</style>

      <div style={{ marginBottom: 24, animation: 'slideUp 0.4s ease' }}>
        <BicPencil pose="celebrate" size={80} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: '28px 24px', animation: 'slideUp 0.4s ease 0.1s both' }}>

        {step === 1 && (
          <>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.chalk, marginBottom: 6 }}>What class are you in?</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>We'll load the right lessons — no account needed yet.</div>
            {CLASS_GROUPS.map(g => (
              <div key={g.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{g.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {g.levels.map(l => (
                    <button key={l} className={`gl${classLevel === l ? ' sel' : ''}`} onClick={() => { setClassLevel(l); setError('') }}>{l}</button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => isSS ? setStep(2) : handleStart()}
              disabled={!classLevel || loading}
              style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 14, border: 'none', background: classLevel ? C.electric : 'rgba(200,241,53,0.2)', color: classLevel ? '#0C0820' : 'rgba(200,241,53,0.4)', fontSize: 15, fontWeight: 900, cursor: classLevel ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Finding your lessons…' : 'Start Learning →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.chalk, marginBottom: 6 }}>Choose your subject</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>SS students can also take Further Mathematics.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { val: 'maths',         label: 'Mathematics',         desc: 'Core maths — WAEC, NECO & JAMB', icon: '📐' },
                { val: 'further_maths', label: 'Further Mathematics', desc: 'Vectors, sequences, calculus & more', icon: '📊' },
              ].map(s => (
                <button key={s.val} className={`gs${subject === s.val ? ' sel' : ''}`} onClick={() => setSubject(s.val)}>
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
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setStep(1); setError('') }} style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>← Back</button>
              <button onClick={handleStart} disabled={loading} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: C.electric, color: '#0C0820', fontSize: 14, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Finding lessons…' : 'Start Learning →'}
              </button>
            </div>
          </>
        )}

        {error && (
          <div style={{ marginTop: 14, fontSize: 12, color: '#FF6B6B', fontWeight: 700, textAlign: 'center', background: 'rgba(255,107,107,0.08)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: C.dim, animation: 'slideUp 0.4s ease 0.2s both' }}>
        Already have an account?{' '}
        <a href="/auth/login" style={{ color: C.electric, fontWeight: 800, textDecoration: 'none' }}>Sign in →</a>
      </div>
    </div>
  )
}