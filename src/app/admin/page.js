'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const A = {
  bg:      '#09071A', surface: '#12102A', card: '#181535', cardHi: '#1E1A40',
  border:  'rgba(165,155,255,0.1)', borderHi: 'rgba(165,155,255,0.26)',
  chalk:   '#F0EDFF', dim: 'rgba(220,215,255,0.5)', dim2: 'rgba(220,215,255,0.28)',
  accent:  '#7C3AED', accentHi: '#9F67FF',
  electric:'#C8F135', gold: '#FFC933', coral: '#FF6B6B', teal: '#00D4C8', cyan: '#67E8F9',
}

function StatCard({ icon, label, value, badge, badgeColor }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background: hov ? A.cardHi : A.card,
      border: `1.5px solid ${hov ? A.borderHi : A.border}`,
      borderRadius: 16, padding: '20px 22px',
      transition: 'all 0.18s', cursor: 'default',
      transform: hov ? 'translateY(-3px)' : 'none',
      boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.2)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        {badge && (
          <span style={{
            fontSize:10, fontWeight:800,
            background:`${badgeColor||A.electric}14`,
            border:`1px solid ${badgeColor||A.electric}30`,
            color: badgeColor||A.electric,
            borderRadius:99, padding:'3px 10px', letterSpacing:'.3px',
          }}>{badge}</span>
        )}
      </div>
      <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:36, color:A.chalk, lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:800, color:A.dim, letterSpacing:'.4px' }}>{label}</div>
    </div>
  )
}

function QuickCard({ href, icon, title, desc, color }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={href} style={{ textDecoration:'none' }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
        background: hov ? A.cardHi : A.card,
        border: `1.5px solid ${hov ? color+'55' : A.border}`,
        borderRadius: 14, padding:'20px', height:'100%',
        transition:'all 0.18s', cursor:'pointer',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 8px 28px rgba(0,0,0,0.35), 0 0 24px ${color}18` : '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ width:40, height:40, borderRadius:10, background:`${color}14`, border:`1.5px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:14 }}>{icon}</div>
        <div style={{ fontSize:14, fontWeight:900, color:A.chalk, marginBottom:6 }}>{title}</div>
        <div style={{ fontSize:12, color:A.dim, lineHeight:1.65, fontWeight:700 }}>{desc}</div>
        <div style={{ marginTop:14, fontSize:12, fontWeight:800, color:color, display:'flex', alignItems:'center', gap:4 }}>
          Open <span style={{ transition:'transform 0.15s', transform: hov ? 'translateX(3px)' : 'none', display:'inline-block' }}>→</span>
        </div>
      </div>
    </Link>
  )
}

export default function AdminPage() {
  const supabase = createClient()
  const [stats,   setStats]   = useState({ students:0, lessons:0, slides:0, questions:0 })
  const [logs,    setLogs]    = useState([])
  const [flagged, setFlagged] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: students },
        { count: lessons  },
        { count: slides   },
        { count: questions},
        { count: flags    },
        { data:  recentLogs },
      ] = await Promise.all([
        supabase.from('students').select('*', { count:'exact', head:true }),
        supabase.from('lessons').select('*',  { count:'exact', head:true }),
        supabase.from('slides').select('*',   { count:'exact', head:true }),
        supabase.from('questions').select('*',{ count:'exact', head:true }),
        supabase.from('flagged_questions').select('*',{ count:'exact', head:true }).eq('status','open'),
        supabase.from('generation_logs').select('*').order('created_at',{ ascending:false }).limit(8),
      ])
      setStats({ students:students||0, lessons:lessons||0, slides:slides||0, questions:questions||0 })
      setFlagged(flags||0)
      setLogs(recentLogs||[])
      setLoading(false)
    }
    load()
  }, [])

  const QUICK = [
    { href:'/admin/generate',   icon:'⚡', title:'Generate lesson',   desc:'Create AI-powered content for any subtopic in the curriculum', color:A.gold    },
    { href:'/admin/curriculum', icon:'📚', title:'Manage curriculum', desc:'Add or edit levels, terms, units, topics and subtopics',       color:A.cyan    },
    { href:'/admin/students',   icon:'👥', title:'View students',     desc:'Browse accounts, progress, XP data and class breakdowns',      color:A.teal    },
    { href:'/admin/analytics',  icon:'📈', title:'Analytics',         desc:'Completion rates, popular topics, daily active users',         color:'#A3E635' },
    { href:'/admin/flags',      icon:'🚩', title:'Review flagged',    desc:'Questions flagged by students — needs manual review',          color:A.coral   },
  ]

  return (
    <div style={{ padding:'28px 28px', display:'flex', flexDirection:'column', gap:28, maxWidth:1300, margin:'0 auto' }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:600, fontSize:26, color:A.chalk, lineHeight:1 }}>Admin Overview</h1>
        <div style={{ fontSize:12, color:A.dim2, fontWeight:700, marginTop:4 }}>
          {new Date().toLocaleDateString('en-NG',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <section>
        <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Platform Stats</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
          <StatCard icon="👥" label="Total students"    value={loading ? '—' : stats.students.toLocaleString()} badge="active"                                         badgeColor={A.electric} />
          <StatCard icon="📖" label="Lessons generated" value={loading ? '—' : stats.lessons.toLocaleString()}  badge={`${stats.slides} slides`}                      badgeColor={A.cyan}     />
          <StatCard icon="🎯" label="Questions created"  value={loading ? '—' : stats.questions.toLocaleString()} badge="MCQ"                                          badgeColor={A.gold}     />
          <StatCard icon="🚩" label="Flagged items"     value={loading ? '—' : flagged}                          badge={flagged>0 ? 'needs review' : 'all clear'}      badgeColor={flagged>0 ? A.coral : A.electric} />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
          {QUICK.map(q => <QuickCard key={q.href} {...q} />)}
        </div>
      </section>

      {/* Recent logs */}
      <section style={{ paddingBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'2px', textTransform:'uppercase' }}>Recent Generations</div>
          <Link href="/admin/generate" style={{ fontSize:12, fontWeight:800, color:A.accentHi, textDecoration:'none' }}>View all →</Link>
        </div>
        <div style={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:16, overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:'28px', textAlign:'center', color:A.dim2, fontSize:13, fontWeight:700 }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={{ padding:'36px', textAlign:'center' }}>
              <div style={{ fontSize:13, color:A.dim2, fontWeight:700, marginBottom:10 }}>No lessons generated yet.</div>
              <Link href="/admin/generate" style={{ fontSize:13, fontWeight:800, color:A.accentHi, textDecoration:'none' }}>Generate your first lesson →</Link>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${A.border}` }}>
                  {['Subtopic','Slides','Questions','Date','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:900, color:A.dim2, letterSpacing:'1.5px', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}
                    onMouseEnter={e=>e.currentTarget.style.background=A.cardHi}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{ borderBottom: i<logs.length-1 ? `1px solid ${A.border}` : 'none', transition:'background 0.12s' }}
                  >
                    <td style={{ padding:'11px 16px', fontSize:13, fontWeight:800, color:A.chalk }}>{log.subtopic_title || log.subtopic_id?.slice(0,8)+'…'}</td>
                    <td style={{ padding:'11px 16px', fontSize:13, color:A.dim, fontWeight:700 }}>{log.slide_count ?? '—'}</td>
                    <td style={{ padding:'11px 16px', fontSize:13, color:A.dim, fontWeight:700 }}>{log.question_count ?? '—'}</td>
                    <td style={{ padding:'11px 16px', fontSize:12, color:A.dim2, fontWeight:700 }}>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString('en-NG',{ day:'numeric', month:'short' }) : '—'}
                    </td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ background:`${A.electric}12`, border:`1px solid ${A.electric}28`, borderRadius:99, padding:'3px 10px', fontSize:10, fontWeight:800, color:A.electric }}>Done</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}