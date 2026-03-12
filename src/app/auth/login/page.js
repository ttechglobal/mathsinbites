'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BiteMarkIcon } from '@/components/BiteMarkIcon'

// Floating math symbols background
const SYMBOLS = ['x²', '∑', 'π', '√', '∫', 'θ', '∞', '±', 'Δ', 'α', '÷', 'β']

function FloatingSym({ sym, style }) {
  return (
    <div style={{
      position: 'absolute',
      fontFamily: "'Courier New', monospace",
      fontSize: 18,
      color: 'rgba(165,180,252,0.12)',
      userSelect: 'none',
      pointerEvents: 'none',
      animation: `floatSym ${6 + Math.random() * 6}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 4}s`,
      ...style,
    }}>{sym}</div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Wrong email or password. Try again!'
        : err.message)
      setLoading(false)
    } else {
      router.push('/learn')
    }
  }

  const symPositions = [
    { top: '8%',  left: '6%'  }, { top: '15%', right: '8%'  },
    { top: '32%', left: '3%'  }, { top: '28%', right: '12%' },
    { top: '55%', left: '8%'  }, { top: '48%', right: '5%'  },
    { top: '72%', left: '4%'  }, { top: '68%', right: '9%'  },
    { top: '85%', left: '12%' }, { top: '88%', right: '6%'  },
    { top: '42%', left: '15%' }, { top: '22%', left: '20%'  },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes floatSym {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          33%       { transform: translateY(-14px) rotate(5deg); opacity: 1; }
          66%       { transform: translateY(8px) rotate(-3deg); opacity: 0.4; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1); }
          50%       { box-shadow: 0 0 50px rgba(124,58,237,0.5), 0 0 100px rgba(124,58,237,0.2); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }

        .auth-input {
          width: 100%;
          background: rgba(165,180,252,0.06);
          border: 1.5px solid rgba(165,180,252,0.2);
          border-radius: 12px;
          padding: 13px 16px;
          font-family: 'Nunito', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #F8F7FF;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .auth-input::placeholder { color: rgba(165,180,252,0.4); font-weight: 600; }
        .auth-input:focus {
          border-color: rgba(165,180,252,0.6);
          background: rgba(165,180,252,0.1);
        }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #1E1B4B inset !important;
          -webkit-text-fill-color: #F8F7FF !important;
        }
        .primary-btn {
          width: 100%;
          background: linear-gradient(135deg, #7C3AED, #4C1D95);
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fredoka One', cursive;
          font-size: 17px;
          color: #F8F7FF;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.5);
        }
        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(124,58,237,0.7);
        }
        .primary-btn:active { transform: translateY(0); }
        .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .link-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 13px;
          color: #A5B4FC; text-decoration: none;
          transition: color 0.15s;
        }
        .link-btn:hover { color: #F8F7FF; }
        .show-pass-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(165,180,252,0.5); font-size: 13px; font-family: 'Nunito', sans-serif;
          font-weight: 700; transition: color 0.15s;
        }
        .show-pass-btn:hover { color: rgba(165,180,252,0.9); }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0F0C29 0%, #1a1040 40%, #2D1B69 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Nunito, sans-serif',
        position: 'relative', overflow: 'hidden',
        padding: '20px 16px',
      }}>

        {/* Floating symbols */}
        {symPositions.map((pos, i) => (
          <FloatingSym key={i} sym={SYMBOLS[i % SYMBOLS.length]} style={pos} />
        ))}

        {/* Ambient glow blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(103,232,249,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 380,
          background: 'rgba(30,27,75,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(165,180,252,0.15)',
          borderRadius: 24,
          padding: '36px 28px 32px',
          animation: 'fadeSlideUp 0.5s ease forwards',
          boxShadow: '0 0 40px rgba(124,58,237,0.2), 0 20px 60px rgba(0,0,0,0.5)',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28, animation: 'logoFloat 4s ease-in-out infinite' }}>
            <BiteMarkIcon size={52} animate />
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 0, justifyContent: 'center' }}>
                <span style={{ color: '#F8F7FF' }}>Maths</span>
                <span style={{ color: '#F59E0B', fontSize: 18, fontWeight: 800, margin: '0 1px' }}>In</span>
                <span style={{ color: '#F8F7FF' }}>Bites</span>
              </div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 9, letterSpacing: 2.5, color: 'rgba(165,180,252,0.6)', textTransform: 'uppercase', marginTop: 2 }}>
                Learn · Level Up · Win
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: '#F8F7FF', marginBottom: 4 }}>
              Welcome back! 👋
            </div>
            <div style={{ fontSize: 13, color: 'rgba(165,180,252,0.7)', fontWeight: 600 }}>
              Your maths streak is waiting for you
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(165,180,252,0.7)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                Email
              </label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@school.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(165,180,252,0.7)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 60 }}
                />
                <button type="button" className="show-pass-btn" onClick={() => setShowPass(v => !v)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(255,107,107,0.12)',
                border: '1.5px solid rgba(255,107,107,0.35)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, color: '#FF6B6B', fontWeight: 700, lineHeight: 1.5,
                animation: 'fadeSlideUp 0.25s ease',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Signing in…' : '⚡ Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(165,180,252,0.12)' }} />
            <div style={{ fontSize: 11, color: 'rgba(165,180,252,0.4)', fontWeight: 700 }}>OR</div>
            <div style={{ flex: 1, height: 1, background: 'rgba(165,180,252,0.12)' }} />
          </div>

          {/* Sign up link */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(165,180,252,0.6)', fontWeight: 600 }}>
              New to MathsInBites?{' '}
            </span>
            <Link href="/auth/signup" className="link-btn">
              Create account →
            </Link>
          </div>
        </div>

        {/* Footer tagline */}
        <div style={{
          position: 'absolute', bottom: 16, left: 0, right: 0,
          textAlign: 'center',
          fontSize: 11, color: 'rgba(165,180,252,0.3)', fontWeight: 600, letterSpacing: 1,
        }}>
          🇳🇬 Built for Nigerian students · JSS1 – SS3
        </div>
      </div>
    </>
  )
}