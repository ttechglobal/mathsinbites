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

// Google SVG logo — inline so no extra dependency
function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [googleLoad,  setGoogleLoad]  = useState(false)
  const [error,       setError]       = useState('')
  const [showPass,    setShowPass]    = useState(false)

  async function handleLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Wrong email or password. Try again!' : err.message)
      setLoading(false)
    } else { router.push('/learn') }
  }

  async function handleGoogleLogin() {
    setGoogleLoad(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (err) { setError(err.message); setGoogleLoad(false) }
    // On success, browser redirects to Google — no further action needed here
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
          width:100%; background:#C8F135; color:#0C0820;
          border:none; border-radius:12px; padding:14px;
          font-family:'Nunito',sans-serif; font-size:16px; font-weight:900;
          cursor:pointer; transition:all 0.18s;
          box-shadow:0 4px 24px rgba(200,241,53,0.3);
        }
        .lg-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(200,241,53,0.45); }
        .lg-btn:disabled { opacity:.55; cursor:not-allowed; }
        .google-btn {
          width:100%; background:#fff; color:#1a1a1a;
          border:1.5px solid rgba(0,0,0,0.12); border-radius:12px; padding:13px 16px;
          font-family:'Nunito',sans-serif; font-size:15px; font-weight:800;
          cursor:pointer; transition:all 0.18s;
          display:flex; align-items:center; justify-content:center; gap:10px;
          box-shadow:0 2px 12px rgba(0,0,0,0.15);
        }
        .google-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.2); background:#f8f8f8; }
        .google-btn:disabled { opacity:.55; cursor:not-allowed; }
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
          <div style={{ position:'absolute', top:'20%', left:'15%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,241,53,0.09) 0%,transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'18%', right:'8%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 65%)', pointerEvents:'none' }} />
          {symPos.map((pos, i) => (
            <div key={i} style={{ position:'absolute', ...pos, fontSize: 18+(i%3)*8, fontFamily:"'Courier New',monospace", color:`rgba(200,241,53,${0.04+(i%4)*0.018})`, animation:`floatSym ${6+i*0.9}s ease-in-out ${i*0.7}s infinite`, userSelect:'none', pointerEvents:'none' }}>{SYMBOLS[i]}</div>
          ))}
          <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:340 }}>
            <div style={{ marginBottom:36 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:32, fontWeight:900, color:C.chalk, letterSpacing:'-0.3px' }}>
                Maths<span style={{ color:C.electric }}>In</span>Bites
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:C.dim2, letterSpacing:'2.5px', textTransform:'uppercase', marginTop:4 }}>
                Learn · Level Up · Win
              </div>
            </div>
            <div style={{ animation:'floatMascot 4s ease-in-out infinite', filter:'drop-shadow(0 24px 48px rgba(200,241,53,0.12)) drop-shadow(0 0 60px rgba(124,58,237,0.22))', marginBottom:28 }}>
              <KolaNova size={150} pose="idle" />
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
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:26, fontWeight:900, color:C.chalk, lineHeight:1.1, marginBottom:6 }}>
                Welcome back! 👋
              </div>
              <div style={{ fontSize:13, color:C.dim, fontWeight:700 }}>
                Sign in to continue your maths journey
              </div>
            </div>

            {/* ── Google button — primary CTA ── */}
            <button className="google-btn" onClick={handleGoogleLogin} disabled={googleLoad || loading}>
              <GoogleLogo size={20} />
              {googleLoad ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.1)' }} />
              <div style={{ fontSize:10, color:C.dim2, fontWeight:800, letterSpacing:1 }}>OR SIGN IN WITH EMAIL</div>
              <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.1)' }} />
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
                  <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, fontWeight:800, color:C.dim2, fontFamily:'Nunito,sans-serif' }}>
                    {showPass?'Hide':'Show'}
                  </button>
                </div>
                <input className="lg-input" type={showPass?'text':'password'} placeholder="Enter your password"
                  value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ background:'rgba(255,107,107,0.1)', border:'1.5px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'10px 14px', fontSize:12, color:C.coral, fontWeight:700 }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className="lg-btn" disabled={loading || googleLoad} style={{ marginTop:4 }}>
                {loading ? 'Signing in…' : '⚡ Sign In'}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(165,155,255,0.1)' }} />
            </div>

            <div style={{ textAlign:'center', marginTop:16 }}>
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