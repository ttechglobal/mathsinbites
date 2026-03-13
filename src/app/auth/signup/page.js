'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import KolaNova from '@/components/mascots/KolaNova'
import { BiteMarkIcon } from '@/components/BiteMarkIcon'

const CLASS_LEVELS = [
  { group: 'Primary',          levels: ['Primary1','Primary2','Primary3','Primary4','Primary5','Primary6'] },
  { group: 'Junior Secondary', levels: ['JSS1','JSS2','JSS3'] },
  { group: 'Senior Secondary', levels: ['SS1','SS2','SS3'] },
]

const C = {
  ink:      '#0C0820',
  deep:     '#110D2E',
  panel:    '#1A1545',
  panelHi:  '#211C52',
  chalk:    '#F0EDFF',
  electric: '#C8F135',
  gold:     '#FFC933',
  lav:      '#A599FF',
  dim:      'rgba(220,215,255,0.55)',
  dim2:     'rgba(220,215,255,0.3)',
  border:   'rgba(165,155,255,0.14)',
  borderHi: 'rgba(165,155,255,0.35)',
  coral:    '#FF6B6B',
  teal:     '#00D4C8',
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState('')
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', classLevel: '', childName: '', childClass: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  function handleChange(e) { setFormData({ ...formData, [e.target.name]: e.target.value }) }

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.fullName } }
      })
      if (signUpError) throw signUpError
      const userId = data.user.id
      await supabase.from('profiles').update({ role: accountType }).eq('id', userId)
      if (accountType === 'student') {
        await supabase.from('students').insert({ profile_id: userId, display_name: formData.fullName, class_level: formData.classLevel })
      }
      if (accountType === 'parent') {
        await supabase.from('students').insert({ profile_id: userId, display_name: formData.childName, class_level: formData.childClass, parent_id: userId })
      }
      router.push('/learn')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const MASCOT_TIPS = [
    'Pick the learning mode that matches your energy — 6 unique mascot personalities!',
    'Track your streak daily — even 5 minutes a day compounds fast.',
    "Every wrong answer shows you the full worked solution. Mistakes = free tutoring!",
    'Monthly leaderboard resets mean anyone can reach #1. Your turn is coming.',
    '500+ NERDC-aligned lessons covering Primary to SS3.',
  ]
  const tip = MASCOT_TIPS[step - 1] || MASCOT_TIPS[0]

  return (
    <>
      <style>{`
        @keyframes floatMascot { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(1.5deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes floatSym { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }

        .su-input {
          width: 100%;
          background: rgba(165,155,255,0.06);
          border: 1.5px solid rgba(165,155,255,0.16);
          border-radius: 12px;
          padding: 12px 16px;
          font-family: 'Nunito', sans-serif;
          font-size: 14px; font-weight: 700;
          color: #F0EDFF;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .su-input::placeholder { color: rgba(165,155,255,0.35); font-weight: 600; }
        .su-input:focus { border-color: rgba(200,241,53,0.5); background: rgba(200,241,53,0.04); }
        .su-input:-webkit-autofill,
        .su-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #1A1545 inset !important;
          -webkit-text-fill-color: #F0EDFF !important;
        }

        .su-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%;
          background: ${C.electric}; color: ${C.ink};
          border: none; border-radius: 12px;
          padding: 13px 20px;
          font-family: 'Fredoka One', sans-serif; font-size: 16px; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
          box-shadow: 0 4px 24px rgba(200,241,53,0.3);
          box-sizing: border-box;
        }
        .su-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(200,241,53,0.45); }
        .su-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .su-btn-ghost {
          display: flex; align-items: center; justify-content: center;
          background: rgba(165,155,255,0.07);
          border: 1.5px solid rgba(165,155,255,0.18);
          border-radius: 12px; padding: 12px 20px;
          font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800;
          color: rgba(220,215,255,0.7); cursor: pointer;
          transition: all 0.18s; box-sizing: border-box;
        }
        .su-btn-ghost:hover { border-color: rgba(165,155,255,0.35); color: #F0EDFF; background: rgba(165,155,255,0.12); }

        .level-btn {
          padding: 9px 6px; border-radius: 10px;
          border: 1.5px solid rgba(165,155,255,0.16);
          background: rgba(165,155,255,0.05);
          font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 800;
          color: rgba(220,215,255,0.6); cursor: pointer; transition: all 0.15s;
          text-align: center;
        }
        .level-btn:hover { border-color: rgba(200,241,53,0.4); color: #F0EDFF; }
        .level-btn.selected {
          background: rgba(200,241,53,0.15); border-color: rgba(200,241,53,0.6);
          color: ${C.electric};
          box-shadow: 0 0 14px rgba(200,241,53,0.15);
        }

        .type-card {
          width: 100%; padding: 20px;
          border: 1.5px solid rgba(165,155,255,0.14);
          background: rgba(165,155,255,0.04);
          border-radius: 16px; cursor: pointer; text-align: left;
          transition: all 0.18s;
        }
        .type-card:hover {
          border-color: rgba(200,241,53,0.4);
          background: rgba(200,241,53,0.05);
          transform: translateY(-2px);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(165,155,255,0.2); border-radius: 4px; }

        /* ── MOBILE ── */
        @media (max-width: 767px) {
          .su-left-panel { display: none !important; }
          .su-right-panel { padding: 28px 20px !important; background: linear-gradient(160deg,#0C0820 0%,#110D2E 100%) !important; }
          .su-form-wrap   { padding: 0 !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: 'Nunito, sans-serif' }}>

        {/* ── LEFT PANEL — mascot & branding ── */}
        <div className="su-left-panel" style={{
          width: '42%', flexShrink: 0,
          background: `linear-gradient(160deg, ${C.ink} 0%, #1A0A4A 50%, #0D1F1E 100%)`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* ambient orbs */}
          <div style={{ position:'absolute', top:'15%', left:'10%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,241,53,0.08) 0%,transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'20%', right:'5%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 65%)', pointerEvents:'none' }} />
          {/* float symbols */}
          {['π','∑','∫','x²','∞','√','Δ','θ'].map((s,i) => (
            <div key={i} style={{
              position:'absolute',
              top: `${10 + i*11}%`, left: i%2===0 ? `${5+i*3}%` : undefined, right: i%2!==0 ? `${8+i*2}%` : undefined,
              fontSize: 28 + (i%3)*10, fontFamily:"'Courier New',monospace",
              color:`rgba(200,241,53,${0.04 + (i%3)*0.02})`,
              animation:`floatSym ${7+i*1.3}s ease-in-out ${i*0.8}s infinite`,
              pointerEvents:'none', userSelect:'none',
            }}>{s}</div>
          ))}

          <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
            {/* Logo */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:4 }}>
                <BiteMarkIcon size={30} />
                <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:22, color:C.chalk, letterSpacing:'-0.3px' }}>
                  Maths<span style={{ color:C.electric }}>In</span>Bites
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:C.dim2, letterSpacing:'2px', textTransform:'uppercase', textAlign:'center' }}>
                Learn · Level Up · Win
              </div>
            </div>

            {/* Mascot */}
            <div style={{ animation:'floatMascot 3.8s ease-in-out infinite', filter:'drop-shadow(0 20px 40px rgba(200,241,53,0.12)) drop-shadow(0 0 60px rgba(124,58,237,0.2))', marginBottom:24 }}>
              <KolaNova size={130} pose="idle" />
            </div>

            {/* Speech bubble */}
            <div style={{
              background: C.panel, border:`1.5px solid ${C.border}`,
              borderRadius:'18px 18px 18px 4px',
              padding:'14px 18px', maxWidth:260, margin:'0 auto 32px',
              boxShadow:'0 8px 28px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontSize:11, fontWeight:900, color:C.electric, marginBottom:4, letterSpacing:'.5px' }}>KolaNova ✏️</div>
              <p style={{ fontSize:12.5, fontWeight:700, color:C.dim, lineHeight:1.6, margin:0 }}>{tip}</p>
            </div>

            {/* Step dots */}
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {[1,2,3].map(s => (
                <div key={s} style={{
                  width: s === step ? 24 : 8, height:8, borderRadius:4,
                  background: s === step ? C.electric : s < step ? `${C.electric}55` : 'rgba(165,155,255,0.18)',
                  transition:'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — form ── */}
        <div className="su-right-panel" style={{
          flex:1,
          background: C.deep,
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'40px 32px',
          overflowY:'auto',
        }}>
          <div className="su-form-wrap" style={{ width:'100%', maxWidth:420, animation:'fadeUp 0.4s ease forwards' }}>

            {/* Step tracker */}
            <div style={{ display:'flex', gap:6, marginBottom:32 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                  <div style={{
                    width:24, height:24, borderRadius:'50%', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:900,
                    background: s < step ? C.electric : s === step ? 'rgba(200,241,53,0.15)' : 'rgba(165,155,255,0.08)',
                    border: s <= step ? `1.5px solid ${C.electric}` : `1.5px solid rgba(165,155,255,0.2)`,
                    color: s < step ? C.ink : s === step ? C.electric : C.dim2,
                  }}>
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && <div style={{ flex:1, height:2, borderRadius:1, background: s < step ? C.electric : 'rgba(165,155,255,0.1)', transition:'background 0.3s' }} />}
                </div>
              ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <div style={{ animation:'slideIn 0.3s ease' }}>
                <h2 style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:26, color:C.chalk, marginBottom:6, lineHeight:1.1 }}>
                  Welcome! 👋<br />Who are you?
                </h2>
                <p style={{ fontSize:13, color:C.dim, fontWeight:700, marginBottom:28 }}>Choose your account type to get started</p>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { type:'student', emoji:'🎓', title:"I'm a Student", desc:'I want to learn maths and track my own progress' },
                    { type:'parent',  emoji:'👨‍👩‍👧', title:"I'm a Parent",  desc:'I want to set up an account for my child' },
                  ].map(opt => (
                    <button key={opt.type} className="type-card" onClick={() => { setAccountType(opt.type); setStep(2) }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>{opt.emoji}</div>
                      <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:17, color:C.chalk, marginBottom:4 }}>{opt.title}</div>
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

            {/* STEP 2 */}
            {step === 2 && (
              <div style={{ animation:'slideIn 0.3s ease' }}>
                <h2 style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:26, color:C.chalk, marginBottom:6, lineHeight:1.1 }}>
                  {accountType === 'student' ? '🎓 Your details' : '👨‍👩‍👧 Parent account'}
                </h2>
                <p style={{ fontSize:13, color:C.dim, fontWeight:700, marginBottom:28 }}>
                  {accountType === 'student' ? 'This creates your personal student account' : "Your details as the account holder"}
                </p>

                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {[
                    { name:'fullName', type:'text', placeholder: accountType === 'student' ? 'Your full name' : 'Your full name (parent)', label:'Full Name' },
                    { name:'email',    type:'email',    placeholder:'Email address', label:'Email' },
                    { name:'password', type: showPass ? 'text' : 'password', placeholder:'Create a password (min 8 chars)', label:'Password', isPass:true },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:6 }}>{f.label}</label>
                      <div style={{ position:'relative' }}>
                        <input className="su-input" name={f.name} type={f.type} placeholder={f.placeholder}
                          value={formData[f.name]} onChange={handleChange}
                          style={f.isPass ? { paddingRight:60 } : {}}
                        />
                        {f.isPass && (
                          <button type="button" onClick={() => setShowPass(v=>!v)} style={{
                            position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                            background:'none', border:'none', cursor:'pointer',
                            fontSize:12, fontWeight:800, color:C.dim2, fontFamily:'Nunito,sans-serif',
                          }}>{showPass ? 'Hide' : 'Show'}</button>
                        )}
                      </div>
                    </div>
                  ))}

                  {error && <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700 }}>⚠️ {error}</div>}

                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    <button className="su-btn-ghost" style={{ flex:1 }} onClick={() => setStep(1)}>← Back</button>
                    <button className="su-btn-primary" style={{ flex:2 }} onClick={() => {
                      if (!formData.fullName || !formData.email || !formData.password) return setError('Please fill all fields')
                      setError(''); setStep(3)
                    }}>Continue →</button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div style={{ animation:'slideIn 0.3s ease' }}>
                <h2 style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:26, color:C.chalk, marginBottom:6, lineHeight:1.1 }}>
                  {accountType === 'student' ? '📚 What class are you in?' : "👶 Your child's details"}
                </h2>
                <p style={{ fontSize:13, color:C.dim, fontWeight:700, marginBottom:22 }}>
                  {accountType === 'student' ? "We'll load the right NERDC lessons for you" : "We'll set up your child's learning profile"}
                </p>

                {accountType === 'parent' && (
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:6 }}>Child's Name</label>
                    <input className="su-input" name="childName" placeholder="Child's full name"
                      value={formData.childName} onChange={handleChange} />
                  </div>
                )}

                <div style={{ maxHeight:260, overflowY:'auto', paddingRight:4 }}>
                  {CLASS_LEVELS.map(group => (
                    <div key={group.group} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>{group.group}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                        {group.levels.map(level => {
                          const sel = accountType === 'student' ? formData.classLevel === level : formData.childClass === level
                          return (
                            <button key={level} className={`level-btn${sel ? ' selected' : ''}`}
                              onClick={() => setFormData({ ...formData, [accountType === 'student' ? 'classLevel' : 'childClass']: level })}>
                              {level}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {error && <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700, marginTop:12 }}>⚠️ {error}</div>}

                <div style={{ display:'flex', gap:10, marginTop:18 }}>
                  <button className="su-btn-ghost" style={{ flex:1 }} onClick={() => setStep(2)}>← Back</button>
                  <button className="su-btn-primary" style={{ flex:2 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Creating account…' : '🚀 Start Learning'}
                  </button>
                </div>

                <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:C.dim2, fontWeight:700 }}>
                  🇳🇬 Built for Nigerian students · JSS1 – SS3
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}