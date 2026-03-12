import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LearnLayout({ children }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {children}
    </div>
  )
}