'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMode } from '@/lib/ModeContext'
import { BicPencil, MIBLogo } from '@/components/BiteMarkIcon'
import ModePicker from '@/components/ModePicker'
import BottomSheet from '@/components/BottomSheet'

function AnkaraStripe() {
  return (
    <div style={{
      height: 4,
      background: 'repeating-linear-gradient(90deg,#C0392B 0,#C0392B 8px,#E6B800 8px,#E6B800 16px,#1A1F6B 16px,#1A1F6B 24px,#2D6A4F 24px,#2D6A4F 32px)',
      animation: 'ankaraScroll 6s linear infinite',
    }} />
  )
}

export default function ProfilePage({ student, progress }) {
  const router = useRouter()
  const supabase = createClient()
  const { M, mode } = useMode()
  const [showModePicker, setShowModePicker] = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [displayName,   setDisplayName]   = useState(student?.display_name || '')
  const [activeSubject, setActiveSubject] = useState(student?.active_subject || 'maths')
  const [switching,     setSwitching]     = useState(false)

  const isNova = mode === 'nova'
  const isBlaze = mode === 'blaze'
  const isSpark = mode === 'spark'
  const isRoots = mode === 'roots'

  const headWeight = isBlaze ? 900 : 800
  const bodyWeight = isBlaze ? 700 : 600

  const completedIds = new Set(progress?.filter(p => p.status === 'completed').map(p => p.subtopic_id) || [])
  const xp = student?.xp || 0
  const streak = student?.streak_days || 0
  const monthlyXp = student?.monthly_xp || 0

  async function saveDisplayName() {
    if (!displayName.trim()) return
    setLoading(true)
    await supabase.from('students').update({ display_name: displayName.trim() }).eq('id', student.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const heroBg = isNova ? 'linear-gradient(160deg,#1E1B4B,#0F0C29)'
    : isSpark ? 'linear-gradient(160deg,#FF8C42,#FFD93D)'
    : isRoots ? 'linear-gradient(160deg,#C0392B,#8B1A1A)'
    : isBlaze ? 'linear-gradient(160deg,#E63946,#1D3557)'
    : `linear-gradient(160deg,${M.accentColor},${M.accent2 || M.accentColor})`

  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 14, fontWeight: 600,
    fontFamily: M.font, color: M.textPrimary,
    background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    border: isBlaze ? '2px solid #0d0d0d' : `1.5px solid ${M.navBorder}`,
    borderRadius: isBlaze ? 8 : 12, outline: 'none',
    boxSizing: 'border-box',
    boxShadow: isBlaze ? 'inset 1px 1px 0 rgba(0,0,0,0.05)' : 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: M.mapBg, fontFamily: M.font, paddingBottom: 40 }}>
      {/* Back + logo bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: M.hudBg, backdropFilter: 'blur(10px)',
        borderBottom: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {isRoots && <AnkaraStripe />}
        <button onClick={() => router.back()} style={{
          width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
          background: isNova ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          border: isBlaze ? '2px solid #0d0d0d' : `1px solid ${M.navBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: M.textSecondary, boxShadow: isBlaze ? '2px 2px 0 #0d0d0d' : 'none',
        }}>←</button>
        <div style={{ flex: 1, fontFamily: M.headingFont, fontSize: 16, fontWeight: headWeight, color: M.textPrimary }}>
          My Profile
        </div>
        <MIBLogo size={28} theme={isNova ? 'dark' : 'light'} M={M} />
      </div>

      {/* Hero */}
      <div style={{ background: heroBg, padding: '28px 20px 24px' }}>
        {isRoots && <AnkaraStripe />}
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', fontSize: 42,
            border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)', flexShrink: 0,
          }}>
            {student?.display_name?.[0]?.toUpperCase() || '🧑🏾'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: headWeight, color: '#fff', fontFamily: M.headingFont, marginBottom: 3 }}>
              {student?.display_name || 'Student'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              {student?.class_level} · {student?.school || 'JSS Student'}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { v: xp, label: 'Total XP', color: '#FFD700' },
                { v: monthlyXp, label: 'This Month', color: '#FFF' },
                { v: `${streak}🔥`, label: 'Streak', color: '#FFF' },
                { v: completedIds.size, label: 'Done', color: '#FFF' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: M.headingFont }}>{s.v}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Display name editor */}
        <div style={{
          background: M.cardBg, border: M.cardBorder,
          borderRadius: M.cardRadius, padding: '18px 16px',
          boxShadow: M.cardShadow,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: M.headingFont, marginBottom: 12 }}>
            Display Name
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveDisplayName()}
              style={inputStyle}
              placeholder="Your display name"
            />
            <button
              onClick={saveDisplayName}
              disabled={loading}
              style={{
                ...M.primaryBtn,
                padding: '0 16px', flexShrink: 0, fontSize: 12,
                opacity: loading ? 0.7 : 1,
              }}>
              {saved ? '✓ Saved!' : loading ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Account info */}
        <div style={{
          background: M.cardBg, border: M.cardBorder,
          borderRadius: M.cardRadius, boxShadow: M.cardShadow, overflow: 'hidden',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: M.headingFont, padding: '16px 16px 8px' }}>
            Account Info
          </div>
          {[
            { label: 'Class', value: student?.class_level || '—' },
            { label: 'School', value: student?.school || '—' },
            { label: 'Account type', value: student?.account_type || 'Student' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '12px 16px',
              borderTop: `1px solid ${isNova ? 'rgba(255,255,255,0.06)' : '#f2f2f2'}`,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: M.textSecondary, flex: 1 }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Mode picker */}
        <button onClick={() => setShowModePicker(true)} style={{
          background: isBlaze ? '#FFD700'
            : isNova ? 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(76,29,149,0.1))'
            : `${M.accentColor}0C`,
          border: isBlaze ? '2px solid #0d0d0d'
            : isNova ? '1px solid rgba(124,58,237,0.3)'
            : `1.5px solid ${M.accentColor}30`,
          borderRadius: isBlaze ? 10 : 16,
          padding: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: isBlaze ? '3px 3px 0 #0d0d0d' : M.cardShadow,
          fontFamily: M.font, textAlign: 'left',
          width: '100%',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: isBlaze ? '#fff' : `${M.accentColor}18`,
            border: `1.5px solid ${M.accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>{M.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: headWeight, color: isBlaze ? '#0d0d0d' : M.textPrimary, fontFamily: M.headingFont, marginBottom: 2 }}>
              {M.name} Mode
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: isBlaze ? '#444' : M.textSecondary, lineHeight: 1.4 }}>
              Tap to change your learning style
            </div>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 800,
            color: isBlaze ? '#0d0d0d' : M.accentColor,
            background: `${M.accentColor}18`, borderRadius: 20, padding: '3px 10px',
            fontFamily: M.headingFont, flexShrink: 0,
          }}>ACTIVE</div>
        </button>

        {/* About mascot */}
        <div style={{
          background: M.cardBg, border: M.cardBorder,
          borderRadius: M.cardRadius, padding: '16px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: M.cardShadow,
        }}>
          <BicPencil pose="idle" size={60} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: headWeight, color: M.textPrimary, fontFamily: M.headingFont, marginBottom: 4 }}>
              {M.welcomeTitle}
            </div>
            <div style={{ fontSize: 12, fontWeight: bodyWeight, color: M.textSecondary, lineHeight: 1.5 }}>
              {M.hookPhrase}
            </div>
          </div>
        </div>

        {/* Subject switcher */}
        {(['SS1','SS2','SS3'].includes(student?.class_level)) && (
          <div style={{
            background: M.cardBg, border: M.cardBorder,
            borderRadius: M.cardRadius, boxShadow: M.cardShadow, overflow: 'hidden',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: M.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: M.headingFont, padding: '16px 16px 8px' }}>
              Subjects
            </div>
            {['maths', 'further_maths'].map(subj => {
              const enrolled = (student?.subjects || ['maths']).includes(subj)
              const isActive = activeSubject === subj
              const label    = subj === 'maths' ? 'Mathematics' : 'Further Mathematics'
              const subjXp   = subj === 'maths' ? (student?.xp || 0) : (student?.fm_xp || 0)
              return (
                <div key={subj} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${isNova ? 'rgba(255,255,255,0.06)' : '#f2f2f2'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: M.textPrimary, fontFamily: M.font }}>{label}</div>
                    <div style={{ fontSize: 11, color: M.textSecondary, fontFamily: M.font, marginTop: 2 }}>
                      {enrolled ? `${subjXp.toLocaleString()} XP` : 'Not enrolled'}
                    </div>
                  </div>
                  {isActive ? (
                    <span style={{ fontSize: 10, fontWeight: 800, color: M.accentColor, background: `${M.accentColor}14`, borderRadius: 20, padding: '3px 10px', fontFamily: M.font }}>Active</span>
                  ) : enrolled ? (
                    <button
                      disabled={switching}
                      onClick={async () => {
                        setSwitching(true)
                        await supabase.from('students').update({ active_subject: subj }).eq('id', student.id)
                        setActiveSubject(subj)
                        setSwitching(false)
                      }}
                      style={{ fontSize: 11, fontWeight: 800, color: M.textSecondary, background: isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: `1px solid ${M.navBorder}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: M.font }}>
                      {switching ? '...' : 'Switch'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: M.textSecondary, fontFamily: M.font }}>Not enrolled</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '14px', cursor: 'pointer',
          background: 'transparent',
          border: isBlaze ? '2px solid #ef4444' : '1.5px solid #fecaca',
          borderRadius: isBlaze ? 8 : 12, fontFamily: M.headingFont,
          fontSize: 13, fontWeight: 800, color: '#ef4444',
          boxShadow: isBlaze ? '2px 2px 0 #ef4444' : 'none',
        }}>
          Sign Out
        </button>
      </div>

      <BottomSheet open={showModePicker} onClose={() => setShowModePicker(false)} M={M}>
        <ModePicker onClose={() => setShowModePicker(false)} />
      </BottomSheet>
    </div>
  )
}