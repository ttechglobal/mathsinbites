'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import KolaNova from '@/components/mascots/KolaNova'

const SYMBOLS = ['x²','∑','π','√','∫','θ','∞','±','Δ','α']

const C = {
  ink:    '#0C0820', deep: '#110D2E', panel: '#1A1545',
  chalk:  '#F0EDFF', electric: '#C8F135', gold: '#FFC933',
  lav:    '#A599FF', dim: 'rgba(220,215,255,0.55)', dim2: 'rgba(220,215,255,0.3)',
  border: 'rgba(165,155,255,0.14)', coral: '#FF6B6B',
}

export default function LoginPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Wrong email or password. Try again!' : err.message)
      setLoading(false)
    } else { router.push('/learn') }
  }

  const symPos = [
    { top:'7%',  left:'5%'  }, { top:'18%', right:'7%'  },
    { top:'34%', left:'3%'  }, { top:'30%', right:'14%' },
    { top:'54%', left:'7%'  }, { top:'49%', right:'4%'  },
    { top:'70%', left:'3%'  }, { top:'66%', right:'10%' },
    { top:'84%', left:'11%' }, { top:'88%', right:'5%'  },
  ]

  return (
    <>
      <style>{`
        @keyframes floatSym    { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.6} 40%{transform:translateY(-14px) rotate(6deg);opacity:1} 70%{transform:translateY(6px) rotate(-3deg);opacity:.4} }
        @keyframes floatMascot { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(1.5deg)} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow   { 0%,100%{box-shadow:0 0 40px rgba(124,58,237,0.25),0 0 80px rgba(124,58,237,0.08)} 50%{box-shadow:0 0 60px rgba(124,58,237,0.4),0 0 120px rgba(124,58,237,0.15)} }

        .lg-input {
          width:100%; background:rgba(165,155,255,0.06);
          border:1.5px solid rgba(165,155,255,0.16); border-radius:12px;
          padding:12px 16px; font-family:'Nunito',sans-serif;
          font-size:14px; font-weight:700; color:#F0EDFF;
          outline:none; transition:border-color 0.2s,background 0.2s; box-sizing:border-box;
        }
        .lg-input::placeholder { color:rgba(165,155,255,0.35); font-weight:600; }
        .lg-input:focus { border-color:rgba(200,241,53,0.5); background:rgba(200,241,53,0.04); }
        .lg-input:-webkit-autofill,.lg-input:-webkit-autofill:focus {
          -webkit-box-shadow:0 0 0 1000px #1A1545 inset !important;
          -webkit-text-fill-color:#F0EDFF !important;
        }
        .lg-btn {
          width:100%; background:${C.electric}; color:${C.ink};
          border:none; border-radius:12px; padding:14px;
          font-family:'Fredoka One',sans-serif; font-size:17px; font-weight:600;
          cursor:pointer; transition:all 0.18s;
          box-shadow:0 4px 24px rgba(200,241,53,0.3);
        }
        .lg-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(200,241,53,0.45); }
        .lg-btn:disabled { opacity:.55; cursor:not-allowed; }

        /* Mobile override — stack vertically */
        @media (max-width: 767px) {
          .login-left { display: none !important; }
          .login-right { padding: 32px 24px !important; }
          .login-card { max-width: 100% !important; padding: 28px 22px !important; }
        }
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', width:'100%', fontFamily:'Nunito,sans-serif' }}>

        {/* ── LEFT — mascot panel (desktop only) ── */}
        <div className="login-left" style={{
          width:'45%', flexShrink:0,
          background:`linear-gradient(160deg, ${C.ink} 0%, #1A0A4A 55%, #0D1F1E 100%)`,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'56px 48px', position:'relative', overflow:'hidden',
        }}>
          {/* ambient glows */}
          <div style={{ position:'absolute', top:'20%', left:'15%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,241,53,0.09) 0%,transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'18%', right:'8%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 65%)', pointerEvents:'none' }} />
          {/* float syms */}
          {symPos.map((pos, i) => (
            <div key={i} style={{
              position:'absolute', ...pos,
              fontSize: 18 + (i%3)*8, fontFamily:"'Courier New',monospace",
              color:`rgba(200,241,53,${0.04+(i%4)*0.018})`,
              animation:`floatSym ${6+i*0.9}s ease-in-out ${i*0.7}s infinite`,
              userSelect:'none', pointerEvents:'none',
            }}>{SYMBOLS[i]}</div>
          ))}

          <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:340 }}>
            <div style={{ marginBottom:36 }}>
              <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:32, color:C.chalk, letterSpacing:'-0.3px' }}>
                Maths<span style={{ color:C.electric }}>In</span>Bites
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:C.dim2, letterSpacing:'2.5px', textTransform:'uppercase', marginTop:4 }}>
                Learn · Level Up · Win
              </div>
            </div>

            <div style={{ animation:'floatMascot 4s ease-in-out infinite', filter:'drop-shadow(0 24px 48px rgba(200,241,53,0.12)) drop-shadow(0 0 60px rgba(124,58,237,0.22))', marginBottom:28 }}>
              <KolaNova size={150} pose="idle" />
            </div>

            <div style={{
              background:'rgba(26,21,69,0.9)', border:`1.5px solid ${C.border}`,
              borderRadius:'18px 18px 18px 4px',
              padding:'16px 20px', maxWidth:280, margin:'0 auto 36px',
              backdropFilter:'blur(12px)',
            }}>
              <div style={{ fontSize:11, fontWeight:900, color:C.electric, marginBottom:5, letterSpacing:'.5px' }}>KolaNova ✏️</div>
              <p style={{ fontSize:13, fontWeight:700, color:C.dim, lineHeight:1.65, margin:0 }}>
                Your streak is waiting — let&apos;s pick up right where you left off! 🔥
              </p>
            </div>

            {/* Stats strip */}
            <div style={{ display:'flex', gap:20, justifyContent:'center' }}>
              {[['10K+','Students'],['500+','Lessons'],['🇳🇬','Nigerian']].map(([n,l],i) => (
                <div key={i} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:18, color:C.electric }}>{n}</div>
                  <div style={{ fontSize:10, fontWeight:800, color:C.dim2, marginTop:1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — form panel ── */}
        <div className="login-right" style={{
          flex:1,
          background:`linear-gradient(180deg, ${C.deep} 0%, ${C.ink} 100%)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'40px 32px', position:'relative', overflow:'hidden',
        }}>
          {/* bg radial */}
          <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 65%)', pointerEvents:'none' }} />

          <div className="login-card" style={{
            width:'100%', maxWidth:400,
            background:'rgba(26,21,69,0.75)', backdropFilter:'blur(24px)',
            border:`1.5px solid ${C.border}`,
            borderRadius:24, padding:'40px 36px',
            animation:'fadeUp 0.45s ease forwards',
            boxShadow:'0 0 0 1px rgba(165,155,255,0.06), 0 24px 64px rgba(0,0,0,0.5)',
            position:'relative', zIndex:2,
          }}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div style={{ fontFamily:"'Fredoka One',sans-serif", fontSize:26, color:C.chalk, lineHeight:1.1, marginBottom:6 }}>
                Welcome back! 👋
              </div>
              <div style={{ fontSize:13, color:C.dim, fontWeight:700 }}>
                Sign in to continue your maths journey
              </div>
            </div>

            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:6 }}>Email</label>
                <input className="lg-input" type="email" placeholder="you@school.com"
                  value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" />
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={{ fontSize:10, fontWeight:900, color:C.dim2, letterSpacing:'1.2px', textTransform:'uppercase' }}>Password</label>
                  <button type="button" onClick={()=>setShowPass(v=>!v)} style={{
                    background:'none', border:'none', cursor:'pointer',
                    fontSize:11, fontWeight:800, color:C.dim2, fontFamily:'Nunito,sans-serif',
                  }}>{showPass?'Hide':'Show'}</button>
                </div>
                <input className="lg-input" type={showPass?'text':'password'} placeholder="Enter your password"
                  value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700 }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className="lg-btn" disabled={loading} style={{ marginTop:4 }}>
                {loading ? 'Signing in…' : '⚡ Sign In'}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'24px 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.1)' }} />
              <div style={{ fontSize:10, color:C.dim2, fontWeight:800, letterSpacing:1 }}>OR</div>
              <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.1)' }} />
            </div>

            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:13, color:C.dim2, fontWeight:700 }}>New to MathsInBites? </span>
              <Link href="/auth/signup" style={{ fontSize:13, fontWeight:900, color:C.lav, textDecoration:'none' }}>
                Create account →
              </Link>
            </div>
          </div>

          <div style={{ position:'absolute', bottom:16, left:0, right:0, textAlign:'center', fontSize:10, color:'rgba(165,155,255,0.25)', fontWeight:700, letterSpacing:1 }}>
            🇳🇬 Built for Nigerian students · JSS1 – SS3
          </div>
        </div>
      </div>
    </>
  )
}