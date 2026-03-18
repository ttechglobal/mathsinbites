'use client'

import Link from 'next/link'
import { useState } from 'react'
import KolaNova    from '@/components/mascots/KolaNova'
import TayoSteady  from '@/components/mascots/TayoSteady'
import ChinweRoots from '@/components/mascots/ChinweRoots'
import ZapBlaze    from '@/components/mascots/ZapBlaze'
import HalimaShine from '@/components/mascots/HalimaShine'
import { BiteMarkIcon } from '@/components/BiteMarkIcon'

// ─── palette ──────────────────────────────────────────────────────────────────
const C = {
  ink:      '#0C0820',
  deep:     '#110D2E',
  panel:    '#1A1545',
  chalk:    '#F0EDFF',
  electric: '#C8F135',
  gold:     '#FFC933',
  coral:    '#FF5C5C',
  orange:   '#FF8A00',
  teal:     '#00D4C8',
  lav:      '#A599FF',
  dim:      'rgba(220,215,255,0.55)',
  dim2:     'rgba(220,215,255,0.3)',
  border:   'rgba(165,155,255,0.12)',
  paper:    '#FAFAF7',
  paper2:   '#F3F1FF',
}

// ─── mode configs for the mascot showcase ─────────────────────────────────────
const MODES_SHOWCASE = [
  {
    id: 'normal',
    label: 'TayoSteady',
    sub: 'Normal Mode',
    emoji: '📗',
    mascot: TayoSteady,
    accent: '#0d9488',
    bg: 'rgba(13,148,136,0.08)',
    border: 'rgba(13,148,136,0.25)',
    quote: "Maths is not hard — it just needs patience. Let's take it one step at a time. You've got this! 📗",
  },
  {
    id: 'nova',
    label: 'KolaNova',
    sub: 'Nova Mode',
    emoji: '🌌',
    mascot: KolaNova,
    accent: '#7C3AED',
    bg: 'rgba(124,58,237,0.14)',
    border: 'rgba(124,58,237,0.25)',
    quote: '"The universe is written in the language of mathematics. Master it — and you\'ll understand everything 🌌"',
  },
  {
    id: 'roots',
    label: 'ChinweRoots',
    sub: 'Roots Mode',
    emoji: '🇳🇬',
    mascot: ChinweRoots,
    accent: '#C0392B',
    bg: 'rgba(192,57,43,0.06)',
    border: 'rgba(212,160,23,0.3)',
    quote: '"Our ancestors built the Pyramids using mathematics. Maths is your heritage — own it with pride 🇳🇬"',
  },
  {
    id: 'blaze',
    label: 'ZapBlaze',
    sub: 'Blaze Mode',
    emoji: '💥',
    mascot: ZapBlaze,
    accent: '#E63946',
    bg: 'rgba(230,57,70,0.06)',
    border: 'rgba(230,57,70,0.28)',
    quote: '"BOOM! Wrong answers don\'t exist — only warm-up shots before the PERFECT one! 💥"',
  },
  {
    id: 'halima',
    label: 'HalimaShine',
    sub: 'Northern Mode',
    emoji: '📚',
    mascot: HalimaShine,
    accent: '#C46428',
    bg: 'rgba(196,100,40,0.06)',
    border: 'rgba(196,100,40,0.28)',
    quote: '"I love maths because every problem has an answer — you just have to find it! Let\'s go! 📚⭐"',
  },
]

// ─── tiny reusable pieces ──────────────────────────────────────────────────────
function SectionTag({ children, color = C.electric }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${color}14`, border: `1.5px solid ${color}33`,
      borderRadius: 99, padding: '4px 14px',
      fontSize: 10, fontWeight: 900, color, letterSpacing: '.7px',
      textTransform: 'uppercase', marginBottom: 14,
    }}>{children}</div>
  )
}

function FloatingSymbols({ dark = true }) {
  const syms = [
    { s: 'π',  top: '8%',  left: '3%',  sz: 52, op: 0.06, dur: 8 },
    { s: 'Σ',  top: '22%', left: '18%', sz: 30, op: 0.05, dur: 10, delay: '.6s' },
    { s: '∫',  top: '52%', left: '4%',  sz: 44, op: 0.05, dur: 11, delay: '1.4s' },
    { s: '∞',  top: '72%', left: '14%', sz: 28, op: 0.05, dur: 9,  delay: '2s' },
    { s: 'x²', top: '14%', right: '12%',sz: 36, op: 0.06, dur: 7,  delay: '.9s' },
    { s: 'θ',  top: '38%', right: '6%', sz: 50, op: 0.04, dur: 12, delay: '1.8s' },
    { s: '√',  top: '64%', right: '18%',sz: 32, op: 0.05, dur: 9,  delay: '.3s' },
    { s: 'Δ',  top: '82%', right: '8%', sz: 40, op: 0.04, dur: 8,  delay: '2.5s' },
    { s: '±',  top: '28%', right: '35%',sz: 26, op: 0.05, dur: 10, delay: '1.2s' },
  ]
  const col = dark ? 'rgba(200,241,53,' : 'rgba(92,46,221,'
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {syms.map((sym, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: sym.top, left: sym.left, right: sym.right,
          fontSize: sym.sz,
          color: `${col}${sym.op})`,
          fontFamily: "'Courier New',monospace",
          fontWeight: 700,
          animation: `floatSym ${sym.dur}s ease-in-out ${sym.delay || '0s'} infinite`,
          userSelect: 'none',
          lineHeight: 1,
        }}>{sym.s}</span>
      ))}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeMode, setActiveMode] = useState('nova')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const active = MODES_SHOWCASE.find(m => m.id === activeMode)
  const ActiveMascot = active.mascot

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', background: C.deep, color: C.chalk, overflowX: 'hidden' }}>

      {/* ─── keyframes ─── */}
      <style>{`
        @keyframes floatMascot {
          0%,100% { transform: translateY(0) rotate(-1.2deg); }
          50%      { transform: translateY(-14px) rotate(1.5deg); }
        }
        @keyframes floatSym {
          0%,100% { transform: translateY(0) rotate(0deg);  opacity: var(--sym-op, 0.06); }
          50%      { transform: translateY(-18px) rotate(7deg); opacity: calc(var(--sym-op, 0.06) * 2); }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%,100% { transform: scale(1);    opacity: .4; }
          50%      { transform: scale(1.07); opacity: .8; }
        }
        @keyframes bubble-pop {
          0%   { opacity:0; transform: scale(.82) translateY(6px); }
          68%  { transform: scale(1.04); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes mode-switch {
          from { opacity:0; transform: scale(.88) translateY(10px); }
          to   { opacity:1; transform: scale(1)   translateY(0); }
        }
        .mode-anim { animation: mode-switch .3s ease forwards; }
        .mascot-float { animation: floatMascot 4s ease-in-out infinite; }
        .mascot-float:hover { animation-play-state: paused; }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 768px) {
          .lp-nav-links   { display: none !important; }
          .lp-nav-login   { display: none !important; }
          .lp-nav-cta     { font-size: 13px !important; padding: 8px 16px !important; }
          .lp-hero-grid   { grid-template-columns: 1fr !important; padding: 88px 5% 48px !important; gap: 0 !important; }
          .lp-hero-mascot { margin-top: 28px !important; }
          .lp-hero-mascot-stage { width: 200px !important; height: 220px !important; }
          .lp-hero-chips-float { display: none !important; }
          .lp-hero-rings { display: none !important; }
          .lp-hero-h1     { font-size: 34px !important; }
          .lp-hero-btns   { flex-direction: column !important; }
          .lp-hero-btns a { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          .lp-hero-chips  { flex-wrap: wrap !important; gap: 6px !important; }
          .lp-why-grid    { grid-template-columns: 1fr !important; }
          .lp-how-grid    { grid-template-columns: 1fr 1fr !important; }
          .lp-mascot-tabs { grid-template-columns: repeat(3, 1fr) !important; }
          .lp-mascot-card { padding: 22px 16px !important; }
          .lp-testi-grid  { grid-template-columns: 1fr !important; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .lp-footer-brand{ grid-column: 1 / -1 !important; }
          .lp-cta-btns    { flex-direction: column !important; align-items: center !important; }
          .lp-cta-btns a  { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          .lp-section     { padding: 60px 5% !important; }
        }
        @media (max-width: 480px) {
          .lp-how-grid   { grid-template-columns: 1fr !important; }
          .lp-mascot-tabs{ grid-template-columns: repeat(3, 1fr) !important; }
          .lp-footer-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════ NAV ═══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
        height: 64, padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(17,13,46,.92)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <BiteMarkIcon size={32} />
          <span style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 19, color: C.chalk }}>
            Maths<span style={{ color: C.electric }}>In</span>Bites
          </span>
        </Link>

        {/* desktop links */}
        <div style={{ display: 'flex', gap: 2 }} className="lp-nav-links">
          {['Why it works', 'How it works', 'Mascots'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} style={{
              color: C.dim, textDecoration: 'none', fontWeight: 800, fontSize: 13,
              padding: '7px 13px', borderRadius: 10,
            }}>{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/auth/login" className="lp-nav-login" style={{
            color: C.lav, fontWeight: 800, fontSize: 13, textDecoration: 'none',
            padding: '8px 16px', borderRadius: 11,
            border: '1.5px solid rgba(165,155,255,.2)',
          }}>Log in</Link>
          <Link href="/auth/signup" className="lp-nav-cta" style={{
            background: C.electric, color: C.ink,
            fontFamily: "'Fredoka One', sans-serif", fontSize: 14,
            padding: '9px 22px', borderRadius: 11, textDecoration: 'none',
            boxShadow: '0 0 28px rgba(200,241,53,.28)',
          }}>Start free ⚡</Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ HERO ═══ */}
      <header className="lp-hero-grid" style={{
        minHeight: '100vh', paddingTop: 100, paddingBottom: 72,
        padding: '100px 6% 72px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', gap: 32,
        background: C.ink, position: 'relative', overflow: 'hidden',
      }}>
        <FloatingSymbols dark />

        {/* radial glow */}
        <div style={{
          position: 'absolute', right: -140, top: '50%', transform: 'translateY(-50%)',
          width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle,rgba(200,241,53,.07) 0%,rgba(124,58,237,.1) 40%,transparent 70%)',
        }} />

        {/* copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(200,241,53,.1)', border: '1.5px solid rgba(200,241,53,.25)',
            borderRadius: 99, padding: '5px 16px',
            fontSize: 11, fontWeight: 900, color: C.electric, letterSpacing: '.6px',
            textTransform: 'uppercase', marginBottom: 22,
          }}>🇳🇬 &nbsp;Indigenous · Relatable · Made for Nigerian students</div>

          <h1 className="lp-hero-h1" style={{
            fontFamily: "'Fredoka One', sans-serif",
            fontSize: 'clamp(36px,5.5vw,66px)', lineHeight: 1.07,
            color: C.chalk, marginBottom: 20, letterSpacing: '-.5px',
          }}>
            Maths results<br />
            that make<br />
            <span style={{ color: C.gold }}>Mama proud.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px,1.65vw,18px)', color: C.dim,
            lineHeight: 1.8, maxWidth: 500, marginBottom: 34, fontWeight: 700,
          }}>
            5 focused minutes a day. Real NERDC curriculum. Mascots that cheer, tease,
            and absolutely refuse to let your child give up.
          </p>

          <div className="lp-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            <Link href="/auth/signup" style={{
              background: C.electric, color: C.ink,
              fontFamily: "'Fredoka One', sans-serif", fontSize: 17,
              padding: '15px 36px', borderRadius: 14, textDecoration: 'none',
              boxShadow: '0 6px 32px rgba(200,241,53,.3)',
            }}>🚀 Start for free</Link>
            <a href="#how-it-works" style={{
              background: 'transparent', color: C.chalk,
              fontWeight: 800, fontSize: 15,
              padding: '14px 24px', borderRadius: 14, textDecoration: 'none',
              border: '1.5px solid rgba(165,155,255,.3)',
            }}>See how it works ↓</a>
          </div>

          <div className="lp-hero-chips" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['NERDC aligned', '5-min lessons', 'Free to start', '🇳🇬 Made in Nigeria'].map(t => (
              <div key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,.04)', border: `1px solid ${C.border}`,
                borderRadius: 99, padding: '5px 14px',
                fontSize: 11, fontWeight: 800, color: C.dim,
              }}>
                {!t.startsWith('🇳🇬') && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.electric }} />}
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* mascot stage — KolaNova as hero */}
        <div className="lp-hero-mascot" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 320, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* pulsing rings — hidden on mobile */}
            <div className="lp-hero-rings" style={{ position: 'contents' }}>
            {[220, 180].map((sz, i) => (
              <div key={i} style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                width: sz, height: sz, borderRadius: '50%',
                border: `${i === 0 ? 2 : 1.5}px solid rgba(200,241,53,${i === 0 ? '.14' : '.07'})`,
                animation: `pulse-ring 3s ease-in-out ${i * .8}s infinite`,
              }} />
            ))}
            </div>

            {/* speech bubble */}
            <div style={{
              position: 'absolute', top: 16, right: -10,
              background: C.panel, border: `2px solid ${C.lav}`,
              borderRadius: '18px 18px 18px 5px',
              padding: '10px 14px', maxWidth: 186, zIndex: 5,
              animation: 'bubble-pop .6s cubic-bezier(.34,1.56,.64,1) .9s both',
              boxShadow: '0 8px 28px rgba(0,0,0,.4)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.chalk, lineHeight: 1.5, margin: 0 }}>
                <span style={{ color: C.electric }}>Hi! I&apos;m KolaNova ✏️</span><br />
                Maths made fun, in bites. Let&apos;s go! 🚀
              </p>
            </div>

            {/* floating stat chips — hidden on mobile */}
            <div className="lp-hero-chips-float" style={{ position: 'contents' }}>
            {[
              { label: 'Day streak 🔥', val: '7 days', col: C.orange, style: { top: 28, left: -30 } },
              { label: 'Class rank 🏆', val: '#3',     col: C.electric, style: { bottom: 108, right: -40 } },
              { label: 'XP earned ⚡',  val: '+10 XP', col: C.lav,      style: { bottom: 36, left: -26 } },
            ].map((chip, i) => (
              <div key={i} style={{
                position: 'absolute', ...chip.style,
                background: C.panel, border: `1.5px solid ${C.border}`,
                borderRadius: 14, padding: '7px 13px', zIndex: 5,
                boxShadow: '0 8px 28px rgba(0,0,0,.4)',
                animation: `bubble-pop .55s cubic-bezier(.34,1.56,.64,1) ${.5 + i * .25}s both`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: C.dim2, textTransform: 'uppercase', letterSpacing: '.7px' }}>{chip.label}</div>
                <div style={{ fontFamily: 'Fredoka One One, sans-serif', fontSize: 16, color: chip.col }}>{chip.val}</div>
              </div>
            ))}
            </div>

            {/* hero mascot */}
            <div className="mascot-float" style={{
              position: 'absolute', bottom: 45,
              filter: 'drop-shadow(0 24px 44px rgba(124,58,237,.35)) drop-shadow(0 0 36px rgba(200,241,53,.1))',
              zIndex: 3,
            }}>
              <KolaNova size={160} pose="idle" />
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fredoka One One, sans-serif', fontSize: 14, color: C.electric }}>KolaNova ✏️</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.dim2 }}>Official MathsInBites mascot</div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ TICKER ═══ */}
      <div style={{ overflow: 'hidden', padding: '11px 0', background: '#C8F135', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: 'ticker 32s linear infinite' }}>
          {[...Array(2)].map((_, r) => (
            ['🇳🇬 Proudly Nigerian-built', 'NERDC-aligned curriculum', '5-minute daily lessons', 'JSS1 – SS3 covered', 'Relatable. Fun. Effective.', 'Learn maths in bites', '6 unique mascot modes', 'Free to start today'].map((t, i) => (
              <span key={`${r}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 900, color: 'rgba(12,8,32,0.65)', letterSpacing: 0.3 }}>
                {t} <span style={{ color: 'rgba(12,8,32,0.3)', fontSize: 14 }}>✦</span>
              </span>
            ))
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ WHY IT WORKS ═══ */}
      <section id="why-it-works" className="lp-section" style={{ padding: '92px 6%', background: C.deep, position: 'relative', overflow: 'hidden' }}>
        <FloatingSymbols dark />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <SectionTag>Why it works</SectionTag>
          <h2 style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 'clamp(28px,4vw,46px)', lineHeight: 1.12, marginBottom: 14 }}>
            Your child isn't bad at maths.<br />They've just been <span style={{ color: C.electric }}>bored.</span>
          </h2>
          <p style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: C.dim, lineHeight: 1.8, fontWeight: 700, maxWidth: 560, margin: '0 auto' }}>
            Nigerian students don't fail maths because they lack ability — they fail because lessons are too long,
            too abstract, and too easy to abandon.
          </p>
        </div>
        <div className="lp-why-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18,
          marginTop: 52, position: 'relative', zIndex: 2,
        }}>
          {[
            { ico: '🎯', col: C.electric, title: 'One idea. Every lesson.', desc: 'Hook, clear explanation, worked example, then 5 sharp questions. Done in 5 minutes. No rabbit holes.' },
            { ico: '🏆', col: C.gold,     title: 'Competition beats lectures', desc: 'Seeing a classmate at #1 is the most powerful motivator alive. Monthly resets mean anyone can reach the top.' },
            { ico: '💡', col: C.coral,    title: 'Mistakes become teachers', desc: 'Every wrong answer reveals the full worked solution. So every mistake becomes a free teaching moment.' },
            { ico: '📱', col: C.lav,      title: 'In sync with school', desc: 'Every lesson maps to the NERDC curriculum for your child\'s exact class and term. Always on topic.' },
            { ico: '⚡', col: C.teal,     title: 'XP that feels earned', desc: '10 XP per lesson. Streak bonuses. Rare badges that take real effort. The app becomes the reward itself.' },
            { ico: '🤔', col: C.orange,   title: 'Hints, not giveaways', desc: 'Stuck? Your mascot nudges you toward the method — never the answer. The struggle is where learning sticks.' },
          ].map((card, i) => (
            <div key={i} style={{
              background: C.panel, border: `1.5px solid ${C.border}`,
              borderRadius: 22, padding: '28px 22px',
              borderTop: `4px solid ${card.col}`,
              transition: 'transform .2s, border-color .2s',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 13,
                background: `${card.col}18`, border: `1.5px solid ${card.col}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 14,
              }}>{card.ico}</div>
              <div style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 16, color: C.chalk, marginBottom: 8 }}>{card.title}</div>
              <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.75, fontWeight: 700, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="lp-section" style={{ padding: '92px 6%', background: C.paper, position: 'relative', overflow: 'hidden' }}>
        <FloatingSymbols dark={false} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <SectionTag color="#5C2EDD">How it works</SectionTag>
          <h2 style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 'clamp(28px,4vw,44px)', color: C.ink, lineHeight: 1.12, marginBottom: 14 }}>
            From sign-up to top of class in <span style={{ background: C.gold, color: C.ink, padding: '1px 10px 4px', borderRadius: 8, display: 'inline-block', transform: 'rotate(-1.2deg)' }}>4 simple steps</span>
          </h2>
          <p style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: 'rgba(12,8,32,.55)', lineHeight: 1.8, fontWeight: 700, maxWidth: 540, margin: '0 auto' }}>
            No setup. No tutorials. Create an account and you're learning in under 2 minutes.
          </p>
        </div>
        <div className="lp-how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 52, position: 'relative', zIndex: 2 }}>
          {[
            { n: '1', t: 'Sign up free', d: 'Create your account, choose your class. Your full NERDC curriculum loads instantly.' },
            { n: '2', t: 'Pick your vibe', d: '6 unique modes, each with its own mascot personality. Switch any time.' },
            { n: '3', t: 'Learn in 5 mins', d: 'One concept. One worked example. Five questions. Finished before boredom arrives.' },
            { n: '4', t: 'Rise up the ranks', d: 'Collect XP, build your streak, climb the national leaderboard toward #1.' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', border: '1.5px solid rgba(12,8,32,.1)',
              borderRadius: 22, padding: '26px 18px', textAlign: 'center',
              boxShadow: '0 4px 24px rgba(12,8,32,.06)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
                background: 'linear-gradient(135deg,#7C3AED,#4C1D95)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Fredoka One', sans-serif", fontSize: 21,
                boxShadow: '0 6px 20px rgba(92,46,221,.35)',
              }}>{s.n}</div>
              <div style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 15, color: C.ink, marginBottom: 8 }}>{s.t}</div>
              <p style={{ fontSize: 12.5, color: 'rgba(12,8,32,.55)', lineHeight: 1.7, fontWeight: 700, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ MASCOTS SHOWCASE ═══ */}
      <section id="mascots" className="lp-section" style={{ padding: '92px 6%', background: C.paper2, position: 'relative', overflow: 'hidden' }}>
        <FloatingSymbols dark={false} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <SectionTag color={C.orange}>Meet Your Mascots</SectionTag>
          <h2 style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 'clamp(28px,4vw,44px)', color: C.ink, lineHeight: 1.12, marginBottom: 14 }}>
            Your mascot. Your vibe.<br /><span style={{ color: '#5C2EDD' }}>Your rules.</span>
          </h2>
          <p style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: 'rgba(12,8,32,.55)', lineHeight: 1.8, fontWeight: 700, maxWidth: 540, margin: '0 auto' }}>
            Every student learns differently. Pick the mascot that matches your energy — they'll guide you through every lesson in their own unique voice.
          </p>
        </div>

        {/* mode tabs */}
        <div className="lp-mascot-tabs" style={{
          display: 'grid', gridTemplateColumns: `repeat(${MODES_SHOWCASE.length},1fr)`,
          gap: 8, maxWidth: 640, margin: '40px auto 20px',
          position: 'relative', zIndex: 2,
        }}>
          {MODES_SHOWCASE.map(m => (
            <button key={m.id} onClick={() => setActiveMode(m.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '12px 6px', borderRadius: 16, cursor: 'pointer',
              border: activeMode === m.id ? `1.5px solid ${m.accent}55` : '1.5px solid rgba(12,8,32,.1)',
              background: activeMode === m.id ? `${m.accent}0D` : '#fff',
              boxShadow: activeMode === m.id ? `0 3px 0 ${m.accent}33` : '0 3px 0 rgba(12,8,32,.1)',
              transition: 'all .2s',
            }}>
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <span style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 10, color: C.ink }}>{m.label.replace(/[A-Z]/g, c => ' ' + c).trim().split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* active mode panel */}
        <div key={activeMode} className="mode-anim lp-mascot-card" style={{
          maxWidth: 580, margin: '0 auto',
          background: '#fff', borderRadius: 26, padding: '32px 28px',
          border: `1.5px solid ${active.border}`,
          boxShadow: `0 4px 0 ${active.accent}22`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{
            fontFamily: "'Fredoka One', sans-serif", fontSize: 13,
            padding: '4px 16px', borderRadius: 99,
            background: `${active.accent}12`, border: `1.5px solid ${active.accent}33`,
            color: active.accent,
          }}>{active.emoji} {active.label} · {active.sub}</div>

          <div className="mascot-float">
            <ActiveMascot size={120} pose="idle" />
          </div>

          <p style={{
            background: C.paper2, border: `1.5px solid rgba(12,8,32,.1)`,
            borderRadius: '16px 16px 16px 5px',
            padding: '13px 18px', maxWidth: 420, textAlign: 'center',
            fontSize: 13.5, fontWeight: 800, color: C.ink, lineHeight: 1.65, margin: 0,
            fontStyle: 'italic',
          }}>{active.quote}</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, position: 'relative', zIndex: 2 }}>
          <Link href="/auth/signup" style={{
            background: C.electric, color: C.ink,
            fontFamily: "'Fredoka One', sans-serif", fontSize: 16,
            padding: '14px 36px', borderRadius: 14, textDecoration: 'none',
            boxShadow: '0 6px 28px rgba(200,241,53,.3)',
            display: 'inline-block',
          }}>Pick your mascot &amp; start free →</Link>
        </div>
      </section>



      {/* ═══════════════════════════════════════════ CTA ═══ */}
      <section className="lp-section" style={{
        padding: '100px 6%', textAlign: 'center', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg,#0C0820 0%,#1A0A4A 50%,#0D1F1E 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%,rgba(200,241,53,.07) 0%,transparent 60%)',
        }} />
        <FloatingSymbols dark />

        <div className="mascot-float" style={{ display: 'inline-block', marginBottom: 24, position: 'relative', zIndex: 2 }}>
          <KolaNova size={96} pose="idle" />
        </div>

        <h2 style={{
          fontFamily: "'Fredoka One', sans-serif",
          fontSize: 'clamp(28px,5vw,52px)', color: C.chalk,
          marginBottom: 16, position: 'relative', zIndex: 2, lineHeight: 1.1,
        }}>
          The maths story changes <span style={{ color: C.electric }}>right now.</span>
        </h2>
        <p style={{
          fontSize: 'clamp(15px,1.8vw,18px)', color: C.dim,
          maxWidth: 500, margin: '0 auto 36px', fontWeight: 700, lineHeight: 1.8,
          position: 'relative', zIndex: 2,
        }}>
          No expensive tutors. No confusing textbooks. Just 5 focused minutes a day
          and a mascot that refuses to let your child give up.
        </p>
        <div className="lp-cta-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <Link href="/auth/signup" style={{
            background: C.electric, color: C.ink,
            fontFamily: "'Fredoka One', sans-serif", fontSize: 19,
            padding: '17px 46px', borderRadius: 16, textDecoration: 'none',
            boxShadow: '0 6px 40px rgba(200,241,53,.35)',
          }}>🚀 Create your free account</Link>
          <Link href="/auth/login" style={{
            background: 'rgba(255,255,255,.07)', color: C.chalk,
            fontWeight: 800, fontSize: 15,
            padding: '15px 28px', borderRadius: 16, textDecoration: 'none',
            border: '1.5px solid rgba(165,153,255,.25)',
          }}>Already have an account →</Link>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: C.dim2, fontWeight: 700, position: 'relative', zIndex: 2 }}>
          Free to start &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; 🇳🇬 Made in Nigeria, for Nigeria
        </div>
      </section>

      {/* ═══════════════════════════════════════════ FOOTER ═══ */}
      <footer style={{ background: C.ink, padding: '48px 6% 28px', borderTop: `1px solid ${C.border}` }}>
        <div className="lp-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 36 }}>
          <div className="lp-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <BiteMarkIcon size={26} />
              <span style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 18, color: C.chalk }}>
                Maths<span style={{ color: C.electric }}>In</span>Bites
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.dim2, fontWeight: 700, lineHeight: 1.75, maxWidth: 240 }}>
              Nigeria's bite-sized maths learning platform. Built for JSS1 to SS3.
            </p>
          </div>
          {[
            { h: 'Learn',   links: [['Dashboard', '/learn'], ['Sign up free', '/auth/signup']] },
            { h: 'Company', links: [['About us', '/about'], ['Contact', '/contact']] },
            { h: 'Legal',   links: [['Privacy', '/privacy'], ['Terms', '/terms']] },
          ].map(col => (
            <div key={col.h}>
              <h4 style={{ fontSize: 10, fontWeight: 900, color: C.dim2, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</h4>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} style={{ display: 'block', fontSize: 13, color: C.dim, textDecoration: 'none', fontWeight: 700, marginBottom: 9 }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 22, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: C.dim2, fontWeight: 700 }}>© 2025 MathsInBites. All rights reserved.</p>
          <div style={{ fontSize: 12, color: C.dim2, fontWeight: 700 }}>🇳🇬 Proudly built in Nigeria · Serving all 36 states</div>
        </div>
      </footer>
    </div>
  )
}