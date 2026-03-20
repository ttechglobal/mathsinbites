// src/components/guest/GuestLessonPlayer.js
// Wraps the full LessonPlayer with guest localStorage progress tracking.
// After lesson 2: soft modal → "Sign up to save progress"
// If they dismiss and try lesson 3: hard gate → "Sign up to continue"

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getGuest, completeGuestLesson, GUEST_LESSON_LIMIT } from '@/lib/guestStorage'
import { BicPencil } from '@/components/BiteMarkIcon'

const LessonPlayer = dynamic(() => import('@/components/learn/LessonPlayer'), { ssr: false })

const C = {
  bg: '#09071A', card: '#12102A', accent: '#7C3AED', electric: '#C8F135',
  chalk: '#F0EDFF', dim: 'rgba(220,215,255,0.55)', border: 'rgba(165,155,255,0.14)',
}

// Fake guest student object for LessonPlayer
function makeGuestStudent(guest) {
  return {
    id:             'guest',
    profile_id:     'guest',
    display_name:   'Guest',
    class_level:    guest.class_level,
    active_subject: guest.active_subject,
    xp:             guest.xp,
    monthly_xp:     guest.xp,
    streak_days:    0,
    subjects:       [guest.active_subject],
  }
}

export default function GuestLessonPlayer({ lesson, subtopic, nextSubtopicId }) {
  const router = useRouter()
  const [guest,       setGuest]       = useState(null)
  const [showSoft,    setShowSoft]    = useState(false)  // soft prompt after lesson 2
  const [showHard,    setShowHard]    = useState(false)  // hard gate at lesson 3

  useEffect(() => {
    const g = getGuest()
    // Hard gate: already used all free lessons
    if (g && g.count >= GUEST_LESSON_LIMIT) {
      setShowHard(true)
    }
    setGuest(g)
  }, [])

  // Called by LessonPlayer when lesson completes
  function handleLessonComplete(earnedXp = 0) {
    const { count } = completeGuestLesson(subtopic.id, earnedXp)
    setGuest(getGuest())

    if (count >= GUEST_LESSON_LIMIT) {
      // Show soft prompt after hitting limit
      setShowSoft(true)
    } else if (nextSubtopicId) {
      router.push(`/guest/lesson/${nextSubtopicId}`)
    } else {
      router.push('/guest')
    }
  }

  if (!guest && !showHard) {
    return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⚡</div>
    </div>
  }

  return (
    <>
      {/* Hard gate */}
      {showHard && (
        <HardGate xp={guest?.xp || 0} count={guest?.count || 0} />
      )}

      {/* Soft prompt */}
      {showSoft && (
        <SoftPrompt
          xp={guest?.xp || 0}
          onContinue={() => {
            setShowSoft(false)
            if (nextSubtopicId) router.push(`/guest/lesson/${nextSubtopicId}`)
            else setShowHard(true)
          }}
          onSignUp={() => router.push(`/auth/signup?from=guest`)}
        />
      )}

      {/* Lesson player */}
      {!showHard && !showSoft && lesson && (
        <LessonPlayer
          lesson={lesson}
          subtopic={subtopic}
          student={makeGuestStudent(guest)}
          nextSubtopicId={null}  // We handle navigation ourselves
          isGuest={true}
          onGuestComplete={handleLessonComplete}
        />
      )}

      {/* No lesson yet */}
      {!showHard && !showSoft && !lesson && (
        <NoLesson onBack={() => router.push('/guest')} />
      )}
    </>
  )
}

function SoftPrompt({ xp, onContinue, onSignUp }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: '32px 24px', maxWidth: 380, width: '100%', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ animation: 'slideUp 0.3s ease', marginBottom: 20 }}>
          <BicPencil pose="celebrate" size={90} style={{ display: 'inline-block' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.chalk, marginBottom: 8 }}>You're doing great! 🎉</div>
        <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.7, marginBottom: 20 }}>
          You've earned <strong style={{ color: C.electric }}>{xp} XP</strong> so far.<br/>
          Sign up free to save your progress — it takes 30 seconds.
        </div>
        <div style={{ background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(200,241,53,0.8)', fontWeight: 700 }}>If you don't sign up, your progress will be lost when you close the browser.</div>
        </div>
        <button onClick={onSignUp} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: C.electric, color: '#0C0820', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
          Save my progress — it's free →
        </button>
        <button onClick={onContinue} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.dim, fontFamily: 'Nunito, sans-serif', opacity: 0.7 }}>
          Continue without saving
        </button>
      </div>
    </div>
  )
}

function HardGate({ xp, count }) {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: '36px 28px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ marginBottom: 20, animation: 'slideUp 0.3s ease' }}>
          <BicPencil pose="think" size={90} style={{ display: 'inline-block' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.chalk, marginBottom: 8 }}>You've used your 2 free lessons</div>
        <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.7, marginBottom: 8 }}>
          You've already earned <strong style={{ color: C.electric }}>{xp} XP</strong>.<br/>
          Create a free account to keep learning and save everything.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
          {['Unlimited lessons', 'Save your progress', 'Track XP & streak', 'Free forever'].map(f => (
            <span key={f} style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: 'rgba(200,241,53,0.1)', color: C.electric }}>{f}</span>
          ))}
        </div>
        <button onClick={() => router.push('/auth/signup?from=guest')} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: C.electric, color: '#0C0820', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
          Create free account →
        </button>
        <button onClick={() => router.push('/auth/login')} style={{ width: '100%', padding: '13px', borderRadius: 14, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>
          Already have an account? Sign in
        </button>
        <div style={{ fontSize: 11, color: 'rgba(165,155,255,0.4)' }}>No credit card required · Free forever</div>
      </div>
    </div>
  )
}

function NoLesson({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
      <div>
        <BicPencil pose="think" size={80} style={{ display: 'inline-block', marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 900, color: '#F0EDFF', marginBottom: 8 }}>Lesson coming soon</div>
        <div style={{ fontSize: 13, color: 'rgba(220,215,255,0.55)', marginBottom: 24 }}>This lesson hasn't been generated yet.</div>
        <button onClick={onBack} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>← Try another lesson</button>
      </div>
    </div>
  )
}