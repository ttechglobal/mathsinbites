import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilePage from '@/components/learn/ProfilePage'

export default async function Profile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('*, profiles!students_profile_id_fkey(*)')
    .eq('profile_id', user.id)
    .single()

  if (!student) redirect('/auth/login')

  return <ProfilePage student={student} />
}