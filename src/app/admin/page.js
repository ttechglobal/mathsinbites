import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get counts for overview
  const [
    { count: studentsCount },
    { count: topicsCount },
    { count: lessonsCount },
    { count: flaggedCount },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('flagged_questions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { label: 'Total Students', value: studentsCount || 0, icon: '🎓', color: 'text-[#00E676]' },
    { label: 'Topics', value: topicsCount || 0, icon: '📚', color: 'text-blue-400' },
    { label: 'Lessons Generated', value: lessonsCount || 0, icon: '⚡', color: 'text-yellow-400' },
    { label: 'Flagged Items', value: flaggedCount || 0, icon: '🚩', color: 'text-red-400' },
  ]

  return (
    <div>
      <h2 className="text-white text-2xl font-bold mb-1">Dashboard</h2>
      <p className="text-[#8899AA] text-sm mb-8">Welcome back, Admin 👋</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-[#161B22] border border-white/10 rounded-2xl p-5">
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-[#8899AA] text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="text-white font-bold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/admin/curriculum', title: 'Upload Curriculum', desc: 'Add topics and subtopics for a class level', icon: '📤' },
          { href: '/admin/generate', title: 'Generate Lessons', desc: 'Use AI to generate bite-sized lessons', icon: '🤖' },
          { href: '/admin/flagged', title: 'Review Flagged', desc: `${flaggedCount || 0} items need your attention`, icon: '🚩' },
        ].map(action => (
          <a
            key={action.href}
            href={action.href}
            className="bg-[#161B22] border border-white/10 rounded-2xl p-5 hover:border-[#00E676]/30 transition-colors group"
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <div className="text-white font-semibold mb-1 group-hover:text-[#00E676] transition-colors">
              {action.title}
            </div>
            <div className="text-[#8899AA] text-sm">{action.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}