import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/learn')

  return (
    <div className="min-h-screen bg-[#0D1117] flex">

      {/* Sidebar */}
      <aside className="w-64 bg-[#161B22] border-r border-white/10 min-h-screen p-4 fixed left-0 top-0">
        <h1 className="text-xl font-black text-white mb-1">
          Maths<span className="text-[#00E676]">InBites</span>
        </h1>
        <p className="text-[#8899AA] text-xs mb-8">Admin Panel</p>

        <nav className="space-y-1">
          {[
            { href: '/admin', label: '📊 Dashboard' },
            { href: '/admin/curriculum', label: '📚 Curriculum' },
            { href: '/admin/generate', label: '⚡ Generate Lessons' },
            { href: '/admin/questions', label: '❓ Questions' },
            { href: '/admin/flagged', label: '🚩 Flagged Items' },
            { href: '/admin/analytics', label: '📈 Analytics' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-xl text-sm text-[#8899AA] hover:text-white hover:bg-white/5 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}