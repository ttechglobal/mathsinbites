'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CLASS_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']
const AVATAR_COLORS = ['#7C3AED', '#0d9488', '#f97316', '#8b5cf6', '#e11d48', '#0ea5e9']

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('')
}

export default function ProfileSwitcher({ students = [], activeId, onClose, M, mode }) {
  const supabase  = createClient()
  const isBlaze   = mode === 'blaze'
  const isNova    = mode === 'nova'
  const accent    = M?.accentColor || '#7C3AED'
  const bodyColor = M?.textSecondary || '#666'

  const [view,      setView]      = useState('list')
  const [switching, setSwitching] = useState(null)
  const [newName,   setNewName]   = useState('')
  const [newClass,  setNewClass]  = useState('')
  const [newSchool, setNewSchool] = useState('')
  const [adding,    setAdding]    = useState(false)
  const [addError,  setAddError]  = useState('')

  // ── Switch to a different profile ─────────────────────────────────────────
  async function handleSwitch(studentId) {
    if (studentId === activeId) { onClose(); return }
    setSwitching(studentId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { error } = await supabase
        .from('profiles')
        .update({ active_student_id: studentId })
        .eq('id', user.id)

      if (error) throw error
      window.location.reload()
    } catch (e) {
      console.error('[switcher] switch:', e.message)
      setSwitching(null)
    }
  }

  // ── Add a new student profile ─────────────────────────────────────────────
  async function handleAdd() {
    if (!newName.trim() || !newClass) { setAddError('Name and class are required.'); return }
    setAdding(true); setAddError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Insert new student
      const { data: student, error: insertError } = await supabase
        .from('students')
        .insert({
          profile_id:   user.id,
          display_name: newName.trim(),
          class_level:  newClass,
          school:       newSchool.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Set as active
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ active_student_id: student.id })
        .eq('id', user.id)

      if (updateError) throw updateError

      window.location.reload()
    } catch (e) {
      console.error('[switcher] add:', e.message)
      setAddError(e.message || 'Could not add profile. Try again.')
    }
    setAdding(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 14,
    fontFamily: 'Nunito, sans-serif', fontWeight: 600,
    color: isNova ? '#F8F7FF' : '#1a1a1a',
    background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)',
    border: `1.5px solid ${accent}30`,
    borderRadius: 12, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520, zIndex: 70,
        background: isNova ? '#1A1740' : '#fff',
        borderRadius: isBlaze ? '14px 14px 0 0' : '26px 26px 0 0',
        padding: '0 20px 48px',
        boxShadow: '0 -12px 60px rgba(0,0,0,0.22)',
        border: isBlaze ? '2px solid #0d0d0d' : 'none',
        animation: 'switcherUp 0.3s cubic-bezier(0.34,1.1,0.64,1)',
        fontFamily: 'Nunito, sans-serif',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 10 }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: isNova ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
        </div>
        <div style={{ height: 3, borderRadius: 3, marginBottom: 20, background: `linear-gradient(90deg,${accent},${M?.accent2 || accent})` }} />

        {view === 'list' ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: isNova ? '#F8F7FF' : '#1a1a1a', marginBottom: 4 }}>Switch Profile</div>
              <div style={{ fontSize: 13, color: bodyColor, fontWeight: 500 }}>Each profile has its own lessons, XP, and progress.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {students.map((s, i) => {
                const isActive = s.id === activeId
                const isBusy   = switching === s.id
                const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length]
                return (
                  <button key={s.id} onClick={() => handleSwitch(s.id)} disabled={!!switching}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', width: '100%', textAlign: 'left', cursor: switching ? 'default' : 'pointer', background: isActive ? (isNova ? 'rgba(124,58,237,0.16)' : `${accent}0E`) : (isNova ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'), border: isActive ? `2px solid ${accent}55` : `1.5px solid ${isNova ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: isBlaze ? 10 : 18, transition: 'all 0.15s', opacity: switching && !isBusy ? 0.5 : 1 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', boxShadow: isActive ? `0 4px 14px ${avatarBg}55` : 'none' }}>
                      {isBusy ? '…' : initials(s.display_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: isNova ? '#F8F7FF' : '#1a1a1a', marginBottom: 2 }}>{s.display_name}</div>
                      <div style={{ fontSize: 11, color: bodyColor, fontWeight: 500 }}>{s.class_level}{s.school ? ` · ${s.school}` : ''}</div>
                    </div>
                    {isActive
                      ? <div style={{ fontSize: 10, fontWeight: 900, color: accent, background: `${accent}14`, borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>ACTIVE</div>
                      : <div style={{ fontSize: 18, color: bodyColor, opacity: 0.4, flexShrink: 0 }}>→</div>
                    }
                  </button>
                )
              })}
            </div>

            <button onClick={() => setView('add')}
              style={{ width: '100%', padding: '14px', cursor: 'pointer', background: 'transparent', border: `2px dashed ${accent}40`, borderRadius: isBlaze ? 10 : 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Nunito, sans-serif', color: accent, fontSize: 14, fontWeight: 800, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${accent}08`; e.currentTarget.style.borderStyle = 'solid' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed' }}>
              <span style={{ fontSize: 20 }}>+</span>
              Add another profile
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => { setView('list'); setAddError('') }}
                style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: isNova ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isNova ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: bodyColor, flexShrink: 0 }}>←</button>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: isNova ? '#F8F7FF' : '#1a1a1a' }}>Add New Profile</div>
                <div style={{ fontSize: 12, color: bodyColor, fontWeight: 500, marginTop: 1 }}>Own lessons, XP, and progress — completely separate.</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: bodyColor, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Student Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Amina or Tunde" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: bodyColor, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Class *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CLASS_OPTIONS.map(cls => {
                    const active = newClass === cls
                    return (
                      <button key={cls} onClick={() => setNewClass(cls)}
                        style={{ padding: '10px 4px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, textAlign: 'center', border: active ? `2px solid ${accent}` : `1.5px solid ${accent}25`, background: active ? accent : 'transparent', color: active ? '#fff' : (isNova ? 'rgba(255,255,255,0.7)' : '#444'), transition: 'all 0.15s' }}>
                        {cls}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: bodyColor, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>School (optional)</label>
                <input value={newSchool} onChange={e => setNewSchool(e.target.value)} placeholder="e.g. Greensprings School" style={inputStyle} />
              </div>

              {addError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                  {addError}
                </div>
              )}

              <button onClick={handleAdd} disabled={adding || !newName.trim() || !newClass}
                style={{ padding: '15px', borderRadius: isBlaze ? 10 : 18, cursor: adding || !newName.trim() || !newClass ? 'default' : 'pointer', background: adding || !newName.trim() || !newClass ? `${accent}50` : accent, border: 'none', color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: 'Nunito, sans-serif', boxShadow: adding || !newName.trim() || !newClass ? 'none' : `0 4px 16px ${accent}45`, transition: 'all 0.15s' }}>
                {adding ? 'Creating profile…' : '✓ Create Profile & Switch'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes switcherUp { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }`}</style>
    </>
  )
}