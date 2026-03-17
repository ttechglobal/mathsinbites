'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import KolaNova from '@/components/mascots/KolaNova'

// Class levels — Primary 4 through SS3 as requested
const CLASS_LEVELS = [
  { group: 'Primary',          levels: ['Primary4','Primary5','Primary6'] },
  { group: 'Junior Secondary', levels: ['JSS1','JSS2','JSS3'] },
  { group: 'Senior Secondary', levels: ['SS1','SS2','SS3'] },
]

const C = {
  ink:'#0C0820', deep:'#110D2E', panel:'#1A1545', panelHi:'#211C52',
  chalk:'#F0EDFF', electric:'#C8F135', gold:'#FFC933',
  lav:'#A599FF', dim:'rgba(220,215,255,0.55)', dim2:'rgba(220,215,255,0.3)',
  border:'rgba(165,155,255,0.14)', borderHi:'rgba(165,155,255,0.35)', coral:'#FF6B6B',
}

// Inline Google SVG — no external deps
function GoogleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()

  // Step 1 = role, Step 2 = auth method / credentials, Step 3 = student details
  const [step,        setStep]        = useState(1)
  const [accountType, setAccountType] = useState('')    // 'student' | 'parent'
  const [formData,    setFormData]    = useState({
    fullName: '', email: '', password: '', classLevel: '', childName: '', childClass: '',
  })
  const [loading,     setLoading]     = useState(false)
  const [googleLoad,  setGoogleLoad]  = useState(false)
  const [error,       setError]       = useState('')
  const [showPass,    setShowPass]    = useState(false)

  function handleChange(e) { setFormData(p => ({ ...p, [e.target.name]: e.target.value })) }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogleSignup() {
    setGoogleLoad(true); setError('')
    // Store role so the callback + complete-profile pages can use it
    localStorage.setItem('mib_pending_role', accountType)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    })
    if (err) { setError(err.message); setGoogleLoad(false) }
  }

  // ── Email signup ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.fullName } },
      })
      if (signUpErr) throw signUpErr
      const userId = data.user.id

      // Save role on the profile
      await supabase.from('profiles').update({ role: accountType }).eq('id', userId)

      const studentName  = accountType === 'student' ? formData.fullName  : formData.childName
      const studentClass = accountType === 'student' ? formData.classLevel : formData.childClass

      const { data: student, error: insertErr } = await supabase
        .from('students')
        .insert({ profile_id: userId, display_name: studentName, class_level: studentClass })
        .select().single()
      if (insertErr) throw insertErr

      await supabase.from('profiles').update({ active_student_id: student.id }).eq('id', userId)

      // Mark as new user so the welcome screen shows
      localStorage.setItem('mib_new_user', '1')
      router.push('/learn')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const childLabel = accountType === 'parent' ? "child's" : 'your'

  const TIPS = [
    'Pick the learning mode that matches your energy — 6 unique mascot personalities!',
    'Continue with Google to get started in seconds — no password needed!',
    "We'll load the exact NERDC curriculum for your class level.",
  ]

  return (
    <>
      <style>{`
        @keyframes floatMascot { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(1.5deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes floatSym { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }

        .su-input {
          width:100%; background:rgba(165,155,255,0.06);
          border:1.5px solid rgba(165,155,255,0.16); border-radius:12px;
          padding:12px 16px; font-family:'Nunito',sans-serif;
          font-size:14px; font-weight:700; color:#F0EDFF;
          outline:none; transition:border-color 0.2s,background 0.2s; box-sizing:border-box;
        }
        .su-input::placeholder { color:rgba(165,155,255,0.35); font-weight:600; }
        .su-input:focus { border-color:rgba(200,241,53,0.5); background:rgba(200,241,53,0.04); }
        .su-input:-webkit-autofill,.su-input:-webkit-autofill:focus {
          -webkit-box-shadow:0 0 0 1000px #1A1545 inset !important;
          -webkit-text-fill-color:#F0EDFF !important;
        }
        .su-btn-primary {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; background:#C8F135; color:#0C0820;
          border:none; border-radius:12px; padding:13px 20px;
          font-family:'Nunito',sans-serif; font-size:15px; font-weight:900;
          cursor:pointer; transition:all 0.18s; box-shadow:0 4px 24px rgba(200,241,53,0.3);
        }
        .su-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(200,241,53,0.45); }
        .su-btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
        .su-btn-ghost {
          display:flex; align-items:center; justify-content:center;
          background:rgba(165,155,255,0.07); border:1.5px solid rgba(165,155,255,0.18);
          border-radius:12px; padding:12px 20px;
          font-family:'Nunito',sans-serif; font-size:14px; font-weight:800;
          color:rgba(220,215,255,0.7); cursor:pointer; transition:all 0.18s;
        }
        .su-btn-ghost:hover { border-color:rgba(165,155,255,0.35); color:#F0EDFF; background:rgba(165,155,255,0.12); }
        .google-btn {
          width:100%; background:#fff; color:#1a1a1a;
          border:1.5px solid rgba(0,0,0,0.1); border-radius:12px; padding:13px 16px;
          font-family:'Nunito',sans-serif; font-size:15px; font-weight:800;
          cursor:pointer; transition:all 0.18s;
          display:flex; align-items:center; justify-content:center; gap:10px;
          box-shadow:0 2px 14px rgba(0,0,0,0.18);
        }
        .google-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 22px rgba(0,0,0,0.24); background:#f8f8f8; }
        .google-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .level-btn {
          padding:9px 6px; border-radius:10px;
          border:1.5px solid rgba(165,155,255,0.16); background:rgba(165,155,255,0.05);
          font-family:'Nunito',sans-serif; font-size:12px; font-weight:800;
          color:rgba(220,215,255,0.6); cursor:pointer; transition:all 0.15s; text-align:center;
        }
        .level-btn:hover { border-color:rgba(200,241,53,0.4); color:#F0EDFF; }
        .level-btn.selected { background:rgba(200,241,53,0.15); border-color:rgba(200,241,53,0.6); color:#C8F135; box-shadow:0 0 14px rgba(200,241,53,0.15); }
        .type-card {
          width:100%; padding:20px; border:1.5px solid rgba(165,155,255,0.14);
          background:rgba(165,155,255,0.04); border-radius:16px; cursor:pointer;
          text-align:left; transition:all 0.18s;
        }
        .type-card:hover { border-color:rgba(200,241,53,0.4); background:rgba(200,241,53,0.05); transform:translateY(-2px); }
        .type-card.selected { border-color:rgba(200,241,53,0.7); background:rgba(200,241,53,0.08); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(165,155,255,0.2); border-radius:4px; }
        @media (max-width:767px) {
          .su-left-panel { display:none !important; }
          .su-right-panel { padding:28px 20px !important; background:linear-gradient(160deg,#0C0820 0%,#110D2E 100%) !important; }
          .su-form-wrap { padding:0 !important; }
        }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', width:'100%', fontFamily:'Nunito,sans-serif' }}>

        {/* ── LEFT PANEL ── */}
        <div className="su-left-panel" style={{ width:'42%', flexShrink:0, background:`linear-gradient(160deg,${C.ink} 0%,#1A0A4A 50%,#0D1F1E 100%)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'15%', left:'10%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,241,53,0.08) 0%,transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'20%', right:'5%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 65%)', pointerEvents:'none' }} />
          {['π','∑','∫','x²','∞','√','Δ','θ'].map((s,i) => (
            <div key={i} style={{ position:'absolute', top:`${10+i*11}%`, left:i%2===0?`${5+i*3}%`:undefined, right:i%2!==0?`${8+i*2}%`:undefined, fontSize:28+(i%3)*10, fontFamily:"'Courier New',monospace", color:`rgba(200,241,53,${0.04+(i%3)*0.02})`, animation:`floatSym ${7+i*1.3}s ease-in-out ${i*0.8}s infinite`, pointerEvents:'none', userSelect:'none' }}>{s}</div>
          ))}
          <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
            <div style={{ marginBottom:32 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:24, fontWeight:900, color:C.chalk, letterSpacing:'-0.3px', marginBottom:4 }}>
                Maths<span style={{ color:C.electric }}>In</span>Bites
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:C.dim2, letterSpacing:'2px', textTransform:'uppercase' }}>Learn · Level Up · Win</div>
            </div>
            <div style={{ animation:'floatMascot 3.8s ease-in-out infinite', filter:'drop-shadow(0 20px 40px rgba(200,241,53,0.12)) drop-shadow(0 0 60px rgba(124,58,237,0.2))', marginBottom:24 }}>
              <KolaNova size={130} pose="idle" />
            </div>
            <div style={{ background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:'18px 18px 18px 4px', padding:'14px 18px', maxWidth:260, margin:'0 auto 32px', boxShadow:'0 8px 28px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize:11, fontWeight:900, color:C.electric, marginBottom:4, letterSpacing:'.5px' }}>KolaNova ✏️</div>
              <p style={{ fontSize:12.5, fontWeight:700, color:C.dim, lineHeight:1.6, margin:0 }}>{TIPS[step-1] || TIPS[0]}</p>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ width:s===step?24:8, height:8, borderRadius:4, background:s===step?C.electric:s<step?`${C.electric}55`:'rgba(165,155,255,0.18)', transition:'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="su-right-panel" style={{ flex:1, background:C.deep, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px', overflowY:'auto' }}>
          <div className="su-form-wrap" style={{ width:'100%', maxWidth:420, animation:'fadeUp 0.4s ease forwards' }}>

            {/* Step tracker */}
            <div style={{ display:'flex', gap:6, marginBottom:32 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:s<step?C.electric:s===step?'rgba(200,241,53,0.15)':'rgba(165,155,255,0.08)', border:s<=step?`1.5px solid ${C.electric}`:'1.5px solid rgba(165,155,255,0.2)', color:s<step?C.ink:s===step?C.electric:C.dim2 }}>
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && <div style={{ flex:1, height:2, borderRadius:1, background:s<step?C.electric:'rgba(165,155,255,0.1)', transition:'background 0.3s' }} />}
                </div>
              ))}
            </div>

            {/* ══ STEP 1 — Who are you? ══ */}
            {step === 1 && (
              <div style={{ animation:'slideIn 0.3s ease' }}>
                <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:26, fontWeight:900, color:C.chalk, marginBottom:6, lineHeight:1.1 }}>
                  Welcome! 👋<br />Who are you?
                </h2>
                <p style={{ fontSize:13, color:C.dim, fontWeight:700, marginBottom:28 }}>Choose your account type to get started</p>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { type:'student', emoji:'🎓', title:"I'm a Student", desc:'I want to learn maths and track my own progress' },
                    { type:'parent',  emoji:'👨‍👩‍👧', title:"I'm a Parent / Guardian", desc:'I want to set up an account for my child' },
                  ].map(opt => (
                    <button key={opt.type} className={`type-card${accountType === opt.type ? ' selected' : ''}`}
                      onClick={() => { setAccountType(opt.type); setStep(2) }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>{opt.emoji}</div>
                      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:17, fontWeight:900, color:C.chalk, marginBottom:4 }}>{opt.title}</div>
                      <div style={{ fontSize:13, color:C.dim, fontWeight:700, lineHeight:1.5 }}>{opt.desc}</div>
                      <div style={{ marginTop:10, fontSize:12, fontWeight:800, color:C.electric }}>Choose this →</div>
                    </button>
                  ))}
                </div>

                <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:C.dim2, fontWeight:700 }}>
                  Already have an account?{' '}
                  <Link href="/auth/login" style={{ color:C.lav, fontWeight:900, textDecoration:'none' }}>Log in →</Link>
                </p>
              </div>
            )}

            {/* ══ STEP 2 — Sign up method ══ */}
            {step === 2 && (
              <div style={{ animation:'slideIn 0.3s ease' }}>
                <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:24, fontWeight:900, color:C.chalk, marginBottom:6, lineHeight:1.1 }}>
                  {accountType === 'student' ? '🎓 Create your account' : '👨‍👩‍👧 Create parent account'}
                </h2>
                <p style={{ fontSize:13, color:C.dim, fontWeight:700, marginBottom:24 }}>
                  {accountType === 'student' ? 'Your personal student account' : 'Your account as the account holder'}
                </p>

                {/* ── Google — fast path ── */}
                <button className="google-btn" onClick={handleGoogleSignup} disabled={googleLoad}>
                  <GoogleLogo size={20} />
                  {googleLoad ? 'Redirecting to Google…' : 'Continue with Google'}
                </button>

                {/* OR divider */}
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0' }}>
                  <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.12)' }} />
                  <span style={{ fontSize:10, color:C.dim2, fontWeight:800, letterSpacing:1 }}>OR SIGN UP WITH EMAIL</span>
                  <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.12)' }} />
                </div>

                {/* ── Email fields ── */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { name:'fullName', type:'text',     label:'Your Full Name',  placeholder: accountType === 'student' ? 'Your full name' : 'Parent / guardian name' },
                    { name:'email',    type:'email',    label:'Email Address',   placeholder:'you@email.com' },
                    { name:'password', type:showPass?'text':'password', label:'Password', placeholder:'Min 8 characters', isPass:true },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:6 }}>{f.label}</label>
                      <div style={{ position:'relative' }}>
                        <input className="su-input" name={f.name} type={f.type} placeholder={f.placeholder}
                          value={formData[f.name]} onChange={handleChange}
                          style={f.isPass ? { paddingRight:60 } : {}} />
                        {f.isPass && (
                          <button type="button" onClick={() => setShowPass(v=>!v)}
                            style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:800, color:C.dim2, fontFamily:'Nunito,sans-serif' }}>
                            {showPass ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {error && (
                    <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    <button className="su-btn-ghost" style={{ flex:1 }} onClick={() => { setStep(1); setError('') }}>← Back</button>
                    <button className="su-btn-primary" style={{ flex:2 }} onClick={() => {
                      if (!formData.fullName.trim() || !formData.email.trim() || formData.password.length < 8)
                        return setError('Please fill all fields. Password must be at least 8 characters.')
                      setError(''); setStep(3)
                    }}>
                      Continue →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Student details ══ */}
            {step === 3 && (
              <div style={{ animation:'slideIn 0.3s ease' }}>
                <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:24, fontWeight:900, color:C.chalk, marginBottom:6, lineHeight:1.1 }}>
                  {accountType === 'student' ? '📚 What class are you in?' : "👶 Your child's details"}
                </h2>
                <p style={{ fontSize:13, color:C.dim, fontWeight:700, marginBottom:22 }}>
                  {accountType === 'student' ? "We'll load the right NERDC lessons for you" : "We'll set up your child's learning profile"}
                </p>

                {/* Child name — for parent, or student's own name already set */}
                {accountType === 'parent' && (
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:6 }}>
                      Child&apos;s Name
                    </label>
                    <input className="su-input" name="childName" placeholder="Child's full name"
                      value={formData.childName} onChange={handleChange} />
                  </div>
                )}

                {/* Class picker — Primary 4 → SS3 */}
                <div style={{ marginBottom:18 }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:10 }}>
                    {accountType === 'student' ? 'Your Class' : "Child's Class"}
                  </label>
                  <div style={{ maxHeight:240, overflowY:'auto', paddingRight:4 }}>
                    {CLASS_LEVELS.map(group => (
                      <div key={group.group} style={{ marginBottom:14 }}>
                        <div style={{ fontSize:9, fontWeight:900, color:C.dim2, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>{group.group}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                          {group.levels.map(level => {
                            const key = accountType === 'student' ? 'classLevel' : 'childClass'
                            const sel = formData[key] === level
                            return (
                              <button key={level} className={`level-btn${sel?' selected':''}`}
                                onClick={() => setFormData(p => ({ ...p, [key]: level }))}>
                                {level}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700, marginBottom:12 }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display:'flex', gap:10 }}>
                  <button className="su-btn-ghost" style={{ flex:1 }} onClick={() => { setStep(2); setError('') }}>← Back</button>
                  <button className="su-btn-primary" style={{ flex:2 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Creating account…' : '🚀 Start Learning'}
                  </button>
                </div>

                <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:C.dim2, fontWeight:700 }}>
                  🇳🇬 Built for Nigerian students · Primary – SS3
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}