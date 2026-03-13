'use client'

const A = {
  bg:'#09071A', surface:'#12102A', card:'#181535',
  border:'rgba(165,155,255,0.1)', borderHi:'rgba(165,155,255,0.26)',
  chalk:'#F0EDFF', dim:'rgba(220,215,255,0.5)', dim2:'rgba(220,215,255,0.28)',
  accent:'#7C3AED', accentHi:'#9F67FF',
  electric:'#C8F135', gold:'#FFC933', coral:'#FF6B6B', teal:'#00D4C8',
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: color || A.accentHi, fontFamily: "'Fredoka',sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: A.dim2, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: A.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function AnalyticsPage({ topStudents, monthlyTop, genLogs, stats }) {
  const totalXp = topStudents.reduce((s, t) => s + (t.xp || 0), 0)

  return (
    <div style={{ padding: '28px', maxWidth: 1000, fontFamily: 'Nunito, sans-serif' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 24, color: A.chalk, marginBottom: 6 }}>
          📈 Analytics
        </h1>
        <p style={{ color: A.dim, fontSize: 13 }}>Platform overview and engagement stats.</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 28 }}>
        <StatCard label="Total Students"    value={stats.students}          color={A.accentHi} />
        <StatCard label="Lessons Generated" value={stats.lessons}           color={A.gold} />
        <StatCard label="Practice Qs"       value={stats.practiceQuestions} color={A.teal} />
        <StatCard label="Lessons Completed" value={stats.completedLessons}  color={A.electric} />
        <StatCard label="In Progress"       value={stats.inProgress}        color={A.coral} />
        <StatCard label="Total XP Earned"   value={totalXp.toLocaleString()} color={A.gold} sub="all students combined" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* All-time XP leaderboard */}
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${A.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: A.chalk }}>🏆 All-Time XP Top 20</div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {topStudents.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: `1px solid ${A.border}` }}>
                <div style={{ width: 22, textAlign: 'center', fontSize: 13 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: 10, color: A.dim2 }}>#{i+1}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.chalk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display_name}</div>
                  <div style={{ fontSize: 10, color: A.dim2 }}>{s.class_level}{s.school ? ` · ${s.school}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: A.gold }}>{(s.xp||0).toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: A.dim2 }}>🔥 {s.streak_days||0}d</div>
                </div>
              </div>
            ))}
            {topStudents.length === 0 && <div style={{ padding: '32px 18px', color: A.dim, textAlign: 'center' }}>No students yet.</div>}
          </div>
        </div>

        {/* Monthly leaderboard */}
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${A.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: A.chalk }}>📅 This Month's Leaders</div>
            <div style={{ fontSize: 10, color: A.dim, marginTop: 2 }}>Resets 1st of each month</div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {monthlyTop.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: `1px solid ${A.border}` }}>
                <div style={{ width: 22, textAlign: 'center', fontSize: 13 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: 10, color: A.dim2 }}>#{i+1}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.chalk }}>{s.display_name}</div>
                  <div style={{ fontSize: 10, color: A.dim2 }}>{s.class_level}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: A.electric, flexShrink: 0 }}>{(s.monthly_xp||0).toLocaleString()} XP</div>
              </div>
            ))}
            {monthlyTop.length === 0 && <div style={{ padding: '32px 18px', color: A.dim, textAlign: 'center' }}>No XP earned this month yet.</div>}
          </div>
        </div>
      </div>

      {/* Generation activity log */}
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${A.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: A.chalk }}>⚡ Recent Generation Activity</div>
        </div>
        {genLogs.length === 0 && (
          <div style={{ padding: '32px 18px', color: A.dim, textAlign: 'center' }}>No generation activity yet.</div>
        )}
        {genLogs.map((log, i) => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: i < genLogs.length - 1 ? `1px solid ${A.border}` : 'none' }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.chalk }}>
                {log.subtopic?.title || 'Unknown subtopic'}
              </div>
              <div style={{ fontSize: 10, color: A.dim2 }}>
                {log.slide_count || 0} slides · {log.question_count || 0} questions
              </div>
            </div>
            <div style={{ fontSize: 10, color: A.dim2, flexShrink: 0 }}>
              {log.created_at ? new Date(log.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
