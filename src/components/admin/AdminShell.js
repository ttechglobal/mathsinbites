'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BiteMarkIcon } from '@/components/BiteMarkIcon'

const A = {
  bg:       '#09071A',
  sidebar:  '#0E0C22',
  surface:  '#12102A',
  card:     '#181535',
  border:   'rgba(165,155,255,0.1)',
  borderHi: 'rgba(165,155,255,0.28)',
  chalk:    '#F0EDFF',
  dim:      'rgba(220,215,255,0.5)',
  dim2:     'rgba(220,215,255,0.28)',
  accent:   '#7C3AED',
  accentHi: '#9F67FF',
  electric: '#C8F135',
  gold:     '#FFC933',
  coral:    '#FF6B6B',
  teal:     '#00D4C8',
  cyan:     '#67E8F9',
}

const NAV = [
  { href:'/admin',            icon:'▣',  emoji:'📊', label:'Overview',   color: A.electric },
  { href:'/admin/curriculum', icon:'≡',  emoji:'📚', label:'Curriculum', color: A.cyan    },
  { href:'/admin/generate',   icon:'⚡', emoji:'⚡', label:'Generate',   color: A.gold    },
  { href:'/admin/lessons',    icon:'📘', emoji:'📘', label:'Lessons',    color:'#A599FF'  },
  { href:'/admin/practice',   icon:'✏️', emoji:'✏️', label:'Practice',   color:'#C8F135'  },
  { href:'/admin/students',   icon:'◉',  emoji:'👥', label:'Students',   color: A.teal    },
  { href:'/admin/analytics',  icon:'↗',  emoji:'📈', label:'Analytics',  color:'#A3E635'  },
  { href:'/admin/flags',      icon:'⚑',  emoji:'🚩', label:'Flagged',    color: A.coral   },
  { href:'/admin/daily-challenge', icon:'⚡', emoji:'⚡', label:'Daily Q',      color: A.gold    },
  { href:'/admin/past-questions',  icon:'📋', emoji:'📋', label:'Past Questions', color: A.coral   },
]

export default function AdminShell({ children }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        .adm-nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 12px; border-radius: 11px;
          font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 800;
          color: ${A.dim}; text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          border: 1.5px solid transparent;
          white-space: nowrap; overflow: hidden;
          cursor: pointer; background: none;
          width: 100%;
        }
        .adm-nav-link:hover { background: rgba(165,155,255,0.07); color: ${A.chalk}; }
        .adm-nav-link.active {
          background: rgba(124,58,237,0.14);
          border-color: rgba(124,58,237,0.3);
          color: ${A.chalk};
        }

        .adm-topbar-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 9px;
          font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 800;
          text-decoration: none; cursor: pointer; transition: all 0.15s;
          border: 1.5px solid rgba(165,155,255,0.18);
          background: rgba(165,155,255,0.06); color: ${A.dim};
        }
        .adm-topbar-btn:hover { border-color: rgba(165,155,255,0.35); color: ${A.chalk}; background: rgba(165,155,255,0.1); }
        .adm-topbar-btn.primary {
          background: linear-gradient(135deg,${A.accent},#4C1D95);
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
        }
        .adm-topbar-btn.primary:hover { box-shadow: 0 6px 24px rgba(124,58,237,0.5); transform: translateY(-1px); }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(165,155,255,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(165,155,255,0.3); }

        @keyframes adm-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ display:'flex', height:'100vh', background:A.bg, fontFamily:'Nunito,sans-serif', color:A.chalk, overflow:'hidden' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: collapsed ? 64 : 220,
          flexShrink: 0,
          background: A.sidebar,
          borderRight: `1px solid ${A.border}`,
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          zIndex: 10,
        }}>

          {/* Logo */}
          <div style={{
            padding: collapsed ? '18px 0' : '18px 16px',
            borderBottom: `1px solid ${A.border}`,
            display: 'flex', alignItems: 'center',
            gap: 10, flexShrink: 0, minHeight: 64,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{ flexShrink: 0 }}>
              <BiteMarkIcon size={26} />
            </div>
            {!collapsed && (
              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:15, whiteSpace:'nowrap', color:A.chalk }}>
                  Maths<span style={{ color:A.gold }}>In</span>Bites
                </div>
                <div style={{ fontSize:9, fontWeight:800, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase' }}>Admin Panel</div>
              </div>
            )}
            <button onClick={() => setCollapsed(v=>!v)} style={{
              marginLeft: collapsed ? 0 : 'auto',
              background: 'none', border: 'none', cursor: 'pointer',
              color: A.dim2, fontSize: 11, padding: 4, flexShrink: 0,
              lineHeight: 1, borderRadius: 6,
              transition: 'color 0.15s',
            }} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? '▶' : '◀'}
            </button>
          </div>

          {/* Section label */}
          {!collapsed && (
            <div style={{ padding:'14px 16px 4px', fontSize:9, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase' }}>
              Navigation
            </div>
          )}

          {/* Nav links */}
          <nav style={{ padding:'8px 8px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
            {NAV.map(item => {
              const isActive = mounted && (item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}
                  className={`adm-nav-link${isActive ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                  <span style={{
                    fontSize: 15, flexShrink: 0,
                    filter: isActive ? `drop-shadow(0 0 6px ${item.color}88)` : 'none',
                    transition: 'filter 0.2s',
                  }}>{item.emoji}</span>
                  {!collapsed && (
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
                  )}
                  {!collapsed && isActive && (
                    <div style={{ width:6, height:6, borderRadius:'50%', background:item.color, flexShrink:0 }} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Divider */}
          <div style={{ margin:'0 8px', height:1, background:A.border }} />

          {/* Bottom links */}
          <div style={{ padding:'8px 8px 16px', display:'flex', flexDirection:'column', gap:2 }}>
            <Link href="/learn" className="adm-nav-link" title={collapsed ? 'Back to app' : undefined}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <span style={{ fontSize:15, flexShrink:0 }}>🔙</span>
              {!collapsed && <span>Back to app</span>}
            </Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* Topbar */}
          <header style={{
            height: 58, flexShrink: 0,
            padding: '0 24px',
            borderBottom: `1px solid ${A.border}`,
            background: A.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:11, fontWeight:800, color:A.dim2 }}>Admin</div>
              <div style={{ fontSize:11, color:A.dim2 }}>›</div>
              <div style={{ fontSize:13, fontWeight:900, color:A.chalk }}>
                {NAV.find(n => mounted && (n.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(n.href)))?.label || 'Overview'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Link href="/admin/generate" className="adm-topbar-btn primary">
                ⚡ Generate lesson
              </Link>
              <Link href="/admin/curriculum" className="adm-topbar-btn">
                📚 Curriculum
              </Link>
              <div style={{ width:1, height:22, background:A.border }} />
              <div style={{ fontSize:11, fontWeight:800, color:A.dim2, whiteSpace:'nowrap' }}>
                {new Date().toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex:1, overflowY:'auto', background:A.bg }}>
            <div style={{ animation:'adm-fade 0.3s ease forwards' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}