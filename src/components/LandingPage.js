'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const BLUE   = '#4361EE'
const CORAL  = '#F94144'
const YELLOW = '#F9C74F'
const MINT   = '#43AA8B'
const PURPLE = '#7B2FBE'
const ORANGE = '#ff751f'   // logo "in" accent

// ─── Content ───────────────────────────────────────────────────────────────────
const NAV_LINKS = ['Home', 'How It Works', 'Features', 'Exam Prep']

const FEATURES = [
  { title: 'Bite-Sized Lessons',       desc: 'Every concept broken into small, clear steps — one idea at a time so nothing gets skipped.',                                               bg: YELLOW, text: '#1A1A2E' },
  { title: 'Visual Learning',           desc: 'Diagrams, illustrations, and worked examples that make abstract concepts finally click.',                                                 bg: PURPLE, text: '#ffffff' },
  { title: 'AI-Personalised Practice', desc: 'Adapts to how you learn — starting easy, building to medium, then pushing you to hard. Every student grows at their own pace.',            bg: MINT,   text: '#ffffff' },
  { title: 'Exam Preparation',         desc: 'Practice past questions for WAEC, JAMB, and BECE topic by topic — and walk in ready.',                                                    bg: CORAL,  text: '#ffffff' },
]

const STEPS = [
  { num: '01', title: 'Pick a Topic',      desc: 'Choose any concept from your class curriculum — JSS1 all the way to SS3.' },
  { num: '02', title: 'Learn in Bites',    desc: 'Step-by-step lessons with visuals, relatable examples, and highlighted key concepts.' },
  { num: '03', title: 'Practice and Grow', desc: 'Adapts to where you struggle — easy to medium to hard — so you actually improve.' },
]

const TOPICS = [
  { topic: 'Introduction to Algebra', level: 'SS1',  difficulty: 'Medium', color: BLUE   },
  { topic: 'Fractions & Decimals',    level: 'JSS2', difficulty: 'Easy',   color: MINT   },
  { topic: 'Quadratic Equations',     level: 'SS2',  difficulty: 'Hard',   color: CORAL  },
  { topic: 'Number Bases',            level: 'JSS1', difficulty: 'Easy',   color: YELLOW },
]

const TESTIMONIALS = [
  { quote: "I finally understand quadratic equations. I used to just memorise the steps — now I actually get it.",  name: 'Chukwuemeka A.', detail: 'SS3 Student, Lagos'  },
  { quote: "MathsinBites made fractions so easy. The examples are things I see every day — it just makes sense.",   name: 'Aisha M.',       detail: 'JSS2 Student, Abuja' },
  { quote: "I scored 87 in my maths test after two weeks on this app. Best thing I found before WAEC.",             name: 'Tobi F.',        detail: 'SS2 Student, Ibadan' },
]

const DIFF = {
  Easy:   { bg: '#e6f9f0', text: MINT      },
  Medium: { bg: '#fff8e1', text: '#f59e0b' },
  Hard:   { bg: '#ffe8e8', text: CORAL     },
}

// ─── Logo wordmark ─────────────────────────────────────────────────────────────
// "Maths" blue · "in" orange (#ff751f) · "Bites" blue
// Used in both Navbar and Footer — single source of truth
function Logo({ size = 22 }) {
  return (
    <span style={{
      fontFamily:    "'Baloo 2', sans-serif",
      fontWeight:    900,
      fontSize:      size,
      letterSpacing: '-0.02em',
      lineHeight:    1,
    }}>
      <span style={{ color: BLUE }}>Maths</span>
      <span style={{ color: ORANGE }}>in</span>
      <span style={{ color: BLUE }}>Bites</span>
    </span>
  )
}

// ─── Section layout wrapper ────────────────────────────────────────────────────
function Section({ children, bg, id, style = {} }) {
  return (
    <section id={id} style={{
      background:    bg,
      paddingTop:    'clamp(80px,10vh,120px)',
      paddingBottom: 'clamp(80px,10vh,120px)',
      position:      'relative',
      ...style,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(24px,5vw,80px)' }}>
        {children}
      </div>
    </section>
  )
}

// ─── Section heading ───────────────────────────────────────────────────────────
function H2({ children, center, style = {} }) {
  return (
    <h2 style={{
      fontFamily:    "'Baloo 2', sans-serif",
      fontSize:      'clamp(1.8rem,3.5vw,2.6rem)',
      fontWeight:    800,
      letterSpacing: '-0.02em',
      lineHeight:    1.15,
      marginBottom:  48,
      textAlign:     center ? 'center' : undefined,
      ...style,
    }}>
      {children}
    </h2>
  )
}

// ─── Floating math symbols ─────────────────────────────────────────────────────
function FloatingSymbols() {
  const syms = [
    { char: '∑', top: '15%', left: '5%',  size: 32, anim: 'float0 3.2s ease-in-out infinite', color: BLUE   },
    { char: '÷', top: '60%', left: '2%',  size: 28, anim: 'float1 3.8s ease-in-out infinite', color: CORAL  },
    { char: 'π', top: '25%', right: '8%', size: 36, anim: 'float2 4.2s ease-in-out infinite', color: MINT   },
    { char: '²', top: '70%', right: '5%', size: 30, anim: 'float3 3.6s ease-in-out infinite', color: YELLOW },
    { char: '+', top: '45%', left: '8%',  size: 40, anim: 'float1 4s ease-in-out infinite',   color: PURPLE },
    { char: '=', top: '80%', left: '15%', size: 26, anim: 'float0 3.5s ease-in-out infinite', color: BLUE   },
  ]
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {syms.map((s, i) => (
        <span key={i} style={{
          position: 'absolute', top: s.top, left: s.left, right: s.right,
          fontSize: s.size, color: s.color, opacity: 0.15,
          animation: s.anim, fontFamily: "'Baloo 2',sans-serif",
          fontWeight: 800, userSelect: 'none',
        }}>{s.char}</span>
      ))}
    </div>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ isDark, toggleDark }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const bg      = isDark ? 'rgba(13,13,26,.95)' : 'rgba(248,249,255,.95)'
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.65)' : '#475569'

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px,5vw,60px)',
        background: bg,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow:    scrolled ? '0 2px 20px rgba(0,0,0,.1)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(67,97,238,.08)' : 'none',
        transition:   'box-shadow .3s, border-color .3s, background .3s',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size={22} />
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="lp-nav-desktop">
          {NAV_LINKS.map(l => (
            <a key={l}
              href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              className="nav-tab"
              style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14, color: dimCol, textDecoration: 'none', padding: '6px 12px', borderRadius: 10 }}>
              {l}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            style={{
              width: 44, height: 24, borderRadius: 999,
              background: isDark ? BLUE : '#e2e8f0',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background .3s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: isDark ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left .3s', display: 'block',
            }} />
          </button>

          {/* CTA */}
          <Link href="/guest" className="opt-btn lp-nav-cta" style={{
            background: BLUE, color: '#fff',
            fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 14,
            padding: '8px 20px', borderRadius: 50, textDecoration: 'none',
            boxShadow: '0 4px 0 rgba(0,0,0,.15)', whiteSpace: 'nowrap',
          }}>
            Start Learning Free
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            className="lp-hamburger"
            style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: 'block', width: 22, height: 2.5, background: textCol, borderRadius: 2, transition: '.3s' }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 199,
          background: isDark ? '#161627' : '#fff',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : '#e2e8f0'}`,
          padding: '16px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          animation: 'slideUp 0.2s ease',
        }}>
          {NAV_LINKS.map(l => (
            <a key={l}
              href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 15, color: textCol, textDecoration: 'none', padding: '10px 8px', borderRadius: 10 }}>
              {l}
            </a>
          ))}
          <Link href="/guest" onClick={() => setMenuOpen(false)}
            style={{ background: BLUE, color: '#fff', fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 12, textDecoration: 'none', textAlign: 'center', marginTop: 8 }}>
            Start Learning Free
          </Link>
        </div>
      )}

      {/* Responsive rules */}
      <style>{`
        @media (max-width: 768px) {
          .lp-nav-desktop { display: none !important; }
          .lp-nav-cta     { display: none !important; }
          .lp-hamburger   { display: flex !important; }
        }
        @media (max-width: 600px) { .lp-hero-grid { flex-direction: column !important; } }
      `}</style>
    </>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ isDark }) {
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.7)' : '#475569'

  return (
    <header style={{
      minHeight: 680, maxHeight: 820,
      paddingTop: 'clamp(100px,14vh,140px)', paddingBottom: 'clamp(60px,8vh,96px)',
      position: 'relative', overflow: 'hidden',
      background: isDark ? '#0D0D1A' : '#F8F9FF',
    }}>
      <FloatingSymbols />
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: '0 clamp(24px,5vw,80px)',
        position: 'relative', zIndex: 1,
      }}>
        <div className="lp-hero-grid" style={{ display: 'flex', alignItems: 'center', gap: 60 }}>

          {/* Copy */}
          <div style={{ flex: '1 1 480px', minWidth: 0 }}>
            <h1 style={{
              fontFamily:    "'Baloo 2',sans-serif",
              fontSize:      'clamp(2.4rem,5vw,4rem)',
              fontWeight:    800,
              lineHeight:    1.1,
              letterSpacing: '-0.02em',
              color:         textCol,
              marginBottom:  20,
            }}>
              Learning Maths<br />
              Doesn&apos;t Have to<br />
              Be{' '}
              <span style={{ position: 'relative', display: 'inline-block', color: CORAL }}>
                Boring.
                <span style={{
                  position: 'absolute', left: 0, right: 0, bottom: -4,
                  height: 7, background: YELLOW, borderRadius: 4, opacity: .75,
                }} />
              </span>
            </h1>

            <p style={{
              fontFamily:   "'Nunito',sans-serif",
              fontSize:     18, lineHeight: 1.8,
              color:        dimCol,
              marginBottom: 32, maxWidth: 520,
            }}>
              MathsinBites breaks every concept into bite-sized lessons — step by step,
              with visuals and relatable examples. Practice adapts from easy to hard,
              so you learn at your own pace and actually understand — not just memorise.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/guest" className="opt-btn" style={{
                background: BLUE, color: '#fff',
                fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 17,
                padding: '14px 36px', borderRadius: 50, textDecoration: 'none',
                boxShadow: '0 6px 0 rgba(0,0,0,.18)',
              }}>Start Learning Free</Link>

              {/* /demo is a public route — no auth middleware */}
              <Link href="/demo" className="opt-btn" style={{
                background: 'transparent', color: BLUE,
                fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 17,
                padding: '14px 36px', borderRadius: 50, textDecoration: 'none',
                border: `2px solid ${BLUE}`,
                boxShadow: '0 4px 0 rgba(67,97,238,.2)',
              }}>See How It Works</Link>
            </div>
          </div>

          {/* Mascot — 📁 public/mascots/halima-waving.png */}
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/mascots/halima-waving.png"
              alt="Halima waving"
              width={600}
              height={500}
              onError={(e) => { e.target.style.display = 'none' }}
              style={{
                animation:  'bob 2.8s ease-in-out infinite',
                objectFit:  'contain',
                flexShrink: 0,
                maxWidth:   '100%',
                filter:     'drop-shadow(0px 20px 40px rgba(0,0,0,0.15))',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Feature blob cards ────────────────────────────────────────────────────────
function FeatureBlobCards({ isDark }) {
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  return (
    <Section id="features" bg={isDark ? '#111128' : '#fff'}>
      <H2 center style={{ color: textCol }}>Everything You Need to Actually Get Maths.</H2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
        gap: 28,
      }}>
        {FEATURES.map((f, i) => (
          <div key={f.title} className="card-hover" style={{
            borderRadius: 24, padding: '36px 32px',
            background:   f.bg, color: f.text,
            animation:    `slideUp 0.25s ease ${i * 0.1}s both`,
            position:     'relative', overflow: 'hidden',
          }}>
            <div aria-hidden style={{
              position: 'absolute', top: -40, right: -40,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,.12)',
            }} />
            <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 12, marginTop: 0 }}>{f.title}</h3>
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, lineHeight: 1.8, margin: '0 0 20px' }}>{f.desc}</p>
            <a href="#how-it-works" style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, color: f.text, opacity: .8, textDecoration: 'none' }}>
              Read More →
            </a>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks({ isDark }) {
  const bg      = isDark ? '#0D0D1A' : '#F8F9FF'
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.65)' : '#475569'

  return (
    <Section id="how-it-works" bg={bg}>
      <H2 center style={{ color: textCol }}>Learning Maths, The Fun Way.</H2>
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', maxWidth: 320, textAlign: 'center', padding: '0 16px' }}>
              <div aria-hidden style={{
                position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                fontFamily: "'Bangers',sans-serif", fontSize: 120, fontWeight: 400,
                color: BLUE, opacity: .07, lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              }}>{s.num}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: '50%',
                background: BLUE, color: '#fff',
                fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 16,
                marginBottom: 20, position: 'relative', zIndex: 1,
                boxShadow: '0 4px 12px rgba(67,97,238,.35)',
              }}>{i + 1}</div>
              <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 22, fontWeight: 800, color: textCol, marginBottom: 12, marginTop: 0 }}>{s.title}</h3>
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, lineHeight: 1.8, color: dimCol, margin: 0 }}>{s.desc}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div aria-hidden style={{
                width: 48, height: 0, flexShrink: 0, alignSelf: 'flex-start', marginTop: 60,
                borderTop: `2px dashed ${BLUE}30`,
              }} className="lp-step-connector" />
            )}
          </div>
        ))}
      </div>
      <style>{`.lp-step-connector{} @media(max-width:700px){.lp-step-connector{display:none!important}}`}</style>
    </Section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutSection({ isDark }) {
  const bg      = isDark ? '#111128' : '#fff'
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.65)' : '#475569'
  const bullets = [
    { col: BLUE,   text: 'Visual explanations for every concept' },
    { col: MINT,   text: 'Practice adapts — easy to medium to hard' },
    { col: YELLOW, text: 'Progress that builds real confidence over time' },
  ]
  return (
    <Section bg={bg}>
      <div style={{ display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Mascot — 📁 public/mascots/halima-focused.png */}
        <div style={{ flex: '0 0 auto' }}>
          <img
            src="/mascots/halima-waving.png"
            alt="Halima focused"
            width={320}
            height={360}
            onError={(e) => { e.target.style.display = 'none' }}
            style={{
              animation:  'bob 2.8s ease-in-out infinite',
              objectFit:  'contain',
              flexShrink: 0,
              maxWidth:   '100%',
              filter:     'drop-shadow(0px 20px 40px rgba(0,0,0,0.15))',
            }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', color: textCol, marginBottom: 20, marginTop: 0 }}>
            Students Learn.<br />Not Just Cram.
          </h2>
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 16, lineHeight: 1.8, color: dimCol, marginBottom: 32, marginTop: 0 }}>
            MathsinBites builds real understanding from the ground up. Each lesson connects to the next —
            and practice adapts to your performance so you always improve at just the right pace.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
            {bullets.map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: b.col, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 15, color: textCol }}>{b.text}</span>
              </div>
            ))}
          </div>
          <Link href="/guest" className="opt-btn" style={{
            display: 'inline-flex', alignItems: 'center',
            background: BLUE, color: '#fff',
            fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 16,
            padding: '13px 32px', borderRadius: 50, textDecoration: 'none',
            boxShadow: '0 5px 0 rgba(0,0,0,.16)',
          }}>Start Learning Free →</Link>
        </div>
      </div>
    </Section>
  )
}

// ─── Topic cards ───────────────────────────────────────────────────────────────
function TopicCards({ isDark }) {
  const bg      = isDark ? '#0D0D1A' : '#F8F9FF'
  const cardBg  = isDark ? '#161627' : '#fff'
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.5)' : '#64748b'
  const borderC = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'

  return (
    <Section id="topics" bg={bg}>
      <H2 center style={{ color: textCol }}>Explore Topics by Class Level.</H2>
      <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 17, lineHeight: 1.8, color: dimCol, textAlign: 'center', marginTop: -28, marginBottom: 48 }}>
        From JSS1 to SS3 — every topic, every class, all in one place.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }} className="lp-topic-grid">
        {TOPICS.map(t => {
          const diff = DIFF[t.difficulty]
          return (
            <div key={t.topic} className="card-hover" style={{
              background:   cardBg,
              borderRadius: 20,
              border:       `1.5px solid ${borderC}`,
              overflow:     'hidden',
              boxShadow:    isDark ? '0 2px 12px rgba(0,0,0,.35)' : '0 2px 12px rgba(0,0,0,.06)',
            }}>
              <div style={{ height: 8, background: t.color }} />
              <div style={{ padding: '24px 24px 20px' }}>
                <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 17, fontWeight: 800, color: textCol, marginBottom: 12, marginTop: 0 }}>{t.topic}</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 999, background: isDark ? 'rgba(255,255,255,.1)' : '#f1f5f9', color: dimCol }}>{t.level}</span>
                  <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 999, background: diff.bg, color: diff.text }}>{t.difficulty}</span>
                </div>
                <Link href="/demo" style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, color: t.color, textDecoration: 'none' }}>
                  Start Lesson →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ─── Exam prep ─────────────────────────────────────────────────────────────────
function ExamPrepSection() {
  return (
    <section id="exam-prep" style={{ background: BLUE }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(64px,8vh,100px) clamp(24px,5vw,80px)' }}>
        <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Text */}
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 20, marginTop: 0 }}>
              WAEC. JAMB. BECE.<br />We&apos;ve Got You Covered.
            </h2>
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 17, lineHeight: 1.8, color: 'rgba(255,255,255,.9)', marginBottom: 36, marginTop: 0 }}>
              Activate Exam Mode and practice past questions topic by topic.
              See exactly where you&apos;re strong and where to focus.
              Walk into your exam confident and ready.
            </p>
            <Link href="/guest" className="opt-btn" style={{
              display: 'inline-flex', alignItems: 'center',
              background: YELLOW, color: '#1A1A2E',
              fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 17,
              padding: '14px 36px', borderRadius: 50, textDecoration: 'none',
              boxShadow: '0 5px 0 rgba(0,0,0,.18)',
            }}>Activate Exam Mode</Link>
          </div>

          {/* Mascot — 📁 public/mascots/halima-thumbsup.png */}
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/mascots/halima-waving.png"
              alt="Halima waving"
              width={300}
              height={340}
              onError={(e) => { e.target.style.display = 'none' }}
              style={{
                animation:  'bob 2.8s ease-in-out infinite',
                objectFit:  'contain',
                flexShrink: 0,
                maxWidth:   '100%',
                filter:     'drop-shadow(0px 20px 40px rgba(0,0,0,0.2))',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials({ isDark }) {
  const bg      = isDark ? '#111128' : '#fff'
  const cardBg  = isDark ? '#1A1A2E' : '#fff'
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.5)' : '#94a3b8'
  const borderC = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'

  return (
    <Section bg={bg}>
      <H2 center style={{ color: textCol }}>Students Who Actually Get It Now.</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 28 }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="card-hover" style={{
            background: cardBg, borderRadius: 20, padding: '32px',
            border: `1.5px solid ${borderC}`,
            boxShadow: isDark ? '0 2px 16px rgba(0,0,0,.35)' : '0 4px 24px rgba(0,0,0,.06)',
          }}>
            <div style={{ color: YELLOW, fontSize: 18, marginBottom: 16, letterSpacing: 2 }}>★★★★★</div>
            <blockquote style={{ fontFamily: "'Nunito',sans-serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.8, color: isDark ? 'rgba(240,240,255,.85)' : '#334155', marginBottom: 20, margin: '0 0 20px' }}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 16, color: textCol }}>{t.name}</div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: dimCol, marginTop: 2 }}>{t.detail}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA({ isDark }) {
  const bg      = isDark ? '#0D0D1A' : '#F8F9FF'
  const textCol = isDark ? '#F0F0FF' : '#1A1A2E'
  const dimCol  = isDark ? 'rgba(240,240,255,.6)' : '#64748b'
  return (
    <Section bg={bg} style={{ textAlign: 'center' }}>
      {/* Mascot — 📁 public/mascots/halima-celebrating.png */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <img
          src="/mascots/halima-celebrating.png"
          alt="Halima celebrating"
          width={300}
          height={340}
          onError={(e) => { e.target.style.display = 'none' }}
          style={{
            animation:  'bob 2.8s ease-in-out infinite',
            objectFit:  'contain',
            flexShrink: 0,
            maxWidth:   '100%',
            filter:     'drop-shadow(0px 20px 40px rgba(0,0,0,0.15))',
          }}
        />
      </div>
      <H2 center style={{ color: textCol, marginBottom: 16 }}>Your Best Maths Results Start Here.</H2>
      <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, lineHeight: 1.8, color: dimCol, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
        Join thousands of Nigerian students learning smarter — one bite at a time.
      </p>
      <Link href="/guest" className="opt-btn" style={{
        display: 'inline-flex', alignItems: 'center',
        background: BLUE, color: '#fff',
        fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 18,
        padding: '18px 48px', borderRadius: 50, textDecoration: 'none',
        boxShadow: '0 6px 0 rgba(0,0,0,.18)',
      }}>Start Learning Free — It&apos;s 100% Free</Link>
      <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: dimCol, marginTop: 16 }}>
        No credit card · No sign-up fee · Just learning
      </div>
    </Section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer({ isDark }) {
  const bg     = isDark ? '#0D0D1A' : '#1A1A2E'
  const dimCol = 'rgba(255,255,255,.6)'

  const cols = [
    { heading: 'Quick Links', links: [['Home', '/'], ['Features', '#features'], ['How It Works', '#how-it-works'], ['Exam Prep', '#exam-prep'], ['Contact', '/contact']] },
    { heading: 'Support',     links: [['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['FAQ', '/faq']] },
  ]

  return (
    <footer style={{ background: bg, paddingTop: 64, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(24px,5vw,80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 48, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <Logo size={22} />
            </div>
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 14, color: dimCol, lineHeight: 1.75, marginBottom: 20, maxWidth: 240, marginTop: 0 }}>
              Learning maths, one bite at a time.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['𝕏', 'in', 'yt', 'ig'].map(s => (
                <div key={s} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}>{s}</div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading}>
              <h4 style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16, marginTop: 0 }}>{col.heading}</h4>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} style={{ display: 'block', fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 14, color: dimCol, textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 14, color: dimCol, margin: 0 }}>© 2026 MathsinBites · Built for Nigerian students</p>
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: 'rgba(255,255,255,.35)', margin: 0 }}>🇳🇬 Made in Nigeria</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [isDark, setIsDark] = useState(false)

  return (
    <div style={{
      background: isDark ? '#0D0D1A' : '#F8F9FF',
      color:      isDark ? '#F0F0FF' : '#1A1A2E',
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      <Navbar isDark={isDark} toggleDark={() => setIsDark(d => !d)} />

      {/* Spacer for fixed navbar */}
      <div style={{ height: 64 }} aria-hidden />

      <HeroSection      isDark={isDark} />
      <FeatureBlobCards isDark={isDark} />
      <HowItWorks       isDark={isDark} />
      <AboutSection     isDark={isDark} />
      <TopicCards       isDark={isDark} />
      <ExamPrepSection />
      <Testimonials     isDark={isDark} />
      <FinalCTA         isDark={isDark} />
      <Footer           isDark={isDark} />
    </div>
  )
}