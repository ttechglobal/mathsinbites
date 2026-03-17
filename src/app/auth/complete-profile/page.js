// src/app/auth/complete-profile/page.js
// Shown to new Google users after OAuth.
// Reads the role they chose on the signup page (stored in localStorage).
// Collects: student/child name + class level → creates student row → /learn

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import KolaNova from '@/components/mascots/KolaNova'

// Primary 4 → SS3 as requested
const CLASS_LEVELS = [
  { group: 'Primary',          levels: ['Primary4','Primary5','Primary6'] },
  { group: 'Junior Secondary', levels: ['JSS1','JSS2','JSS3'] },
  { group: 'Senior Secondary', levels: ['SS1','SS2','SS3'] },
]

const C = {
  ink:'#0C0820', deep:'#110D2E', panel:'#1A1545',
  chalk:'#F0EDFF', electric:'#C8F135',
  lav:'#A599FF', dim:'rgba(220,215,255,0.55)', dim2:'rgba(220,215,255,0.3)',
  border:'rgba(165,155,255,0.14)', coral:'#FF6B6B',
}

export default function CompleteProfilePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [accountType, setAccountType] = useState('')   // read from localStorage
  const [userEmail,   setUserEmail]   = useState('')
  const [googleName,  setGoogleName]  = useState('')   // pre-filled from Google
  const [name,        setName]        = useState('')   // student / child name
  const [classLvl,    setClassLvl]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    // Read role saved before Google redirect
    const role = localStorage.getItem('mib_pending_role') || 'student'
    setAccountType(role)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUserEmail(user.email || '')
      const gName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setGoogleName(gName)
      // For students, pre-fill their own name from Google
      if (role === 'student') setName(gName)
      // For parents, leave child name blank (parent's name ≠ child's name)
    })
  }, [])

  async function handleSubmit() {
    if (!name.trim() || !classLvl) { setError('Please fill in the name and choose a class.'); return }
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Save role on profile
      await supabase.from('profiles').update({ role: accountType }).eq('id', user.id)

      // Insert student row
      const { data: student, error: insertErr } = await supabase
        .from('students')
        .insert({ profile_id: user.id, display_name: name.trim(), class_level: classLvl })
        .select().single()
      if (insertErr) throw insertErr

      // Set as active student
      await supabase.from('profiles').update({ active_student_id: student.id }).eq('id', user.id)

      // Clean up + mark new user for welcome screen
      localStorage.removeItem('mib_pending_role')
      localStorage.setItem('mib_new_user', '1')
      router.push('/learn')
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const isParent   = accountType === 'parent'
  const nameLabel  = isParent ? "Child's Name" : 'Your Name'
  const classLabel = isParent ? "Child's Class" : 'Your Class'
  const namePlaceholder = isParent ? "What's your child's name?" : "What should we call you?"

  const inputStyle = {
    width:'100%', background:'rgba(165,155,255,0.06)', border:`1.5px solid ${C.border}`,
    borderRadius:12, padding:'12px 16px', fontFamily:'Nunito,sans-serif',
    fontSize:14, fontWeight:700, color:C.chalk, outline:'none', boxSizing:'border-box',
    transition:'border-color 0.2s',
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatMascot { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(1.5deg)} }
        .cp-input { ${Object.entries(inputStyle).map(([k,v])=>`${k.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}`).join(';')} }
        .cp-input::placeholder { color:rgba(165,155,255,0.35); }
        .cp-input:focus { border-color:rgba(200,241,53,0.5); background:rgba(200,241,53,0.04); }
        .level-btn { padding:9px 6px; border-radius:10px; border:1.5px solid rgba(165,155,255,0.16); background:rgba(165,155,255,0.05); font-family:'Nunito',sans-serif; font-size:12px; font-weight:800; color:rgba(220,215,255,0.6); cursor:pointer; transition:all 0.15s; text-align:center; }
        .level-btn:hover { border-color:rgba(200,241,53,0.4); color:#F0EDFF; }
        .level-btn.selected { background:rgba(200,241,53,0.15); border-color:rgba(200,241,53,0.6); color:#C8F135; box-shadow:0 0 14px rgba(200,241,53,0.15); }
      `}</style>

      <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${C.deep} 0%,${C.ink} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', fontFamily:'Nunito,sans-serif' }}>
        <div style={{ width:'100%', maxWidth:440, animation:'fadeUp 0.4s ease forwards' }}>

          {/* Mascot */}
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ animation:'floatMascot 4s ease-in-out infinite', display:'inline-block', filter:'drop-shadow(0 12px 28px rgba(200,241,53,0.15))' }}>
              <KolaNova size={100} pose="idle" />
            </div>
          </div>

          <div style={{ background:'rgba(26,21,69,0.85)', backdropFilter:'blur(24px)', border:`1.5px solid ${C.border}`, borderRadius:24, padding:'32px 28px', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.chalk, marginBottom:6 }}>
                Almost there! 🎓
              </div>
              <div style={{ fontSize:13, color:C.dim, fontWeight:600, lineHeight:1.5 }}>
                {isParent ? "Tell us about your child so we can personalise their learning." : "Just a couple of details to set up your profile."}
                {userEmail && <><br /><span style={{ color:C.lav, fontSize:12 }}>{userEmail}</span></>}
              </div>
            </div>

            {/* If parent, show note that Google name ≠ child */}
            {isParent && googleName && (
              <div style={{ background:'rgba(200,241,53,0.07)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:12, color:C.dim, fontWeight:600 }}>
                👤 Signed in as <strong style={{ color:C.electric }}>{googleName}</strong> — now enter your child's details below.
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Name field */}
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:6 }}>{nameLabel}</label>
                <input className="cp-input" value={name} onChange={e => setName(e.target.value)} placeholder={namePlaceholder} style={inputStyle} />
              </div>

              {/* Class picker */}
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:10 }}>{classLabel}</label>
                <div style={{ maxHeight:200, overflowY:'auto', paddingRight:4 }}>
                  {CLASS_LEVELS.map(group => (
                    <div key={group.group} style={{ marginBottom:12 }}>
                      <div style={{ fontSize:9, fontWeight:900, color:C.dim2, textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>{group.group}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                        {group.levels.map(lvl => (
                          <button key={lvl} className={`level-btn${classLvl===lvl?' selected':''}`} onClick={() => setClassLvl(lvl)}>{lvl}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !name.trim() || !classLvl}
                style={{ width:'100%', padding:'14px', borderRadius:12, cursor:loading||!name.trim()||!classLvl?'not-allowed':'pointer', background:loading||!name.trim()||!classLvl?'rgba(200,241,53,0.3)':'#C8F135', border:'none', fontFamily:'Nunito,sans-serif', fontSize:16, fontWeight:900, color:'#0C0820', boxShadow:loading||!name.trim()||!classLvl?'none':'0 4px 20px rgba(200,241,53,0.35)', transition:'all 0.15s', marginTop:4 }}>
                {loading ? 'Setting up your account…' : '▶ Start Learning'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}