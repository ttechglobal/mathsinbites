import { createClient } from '@/lib/supabase/server'
import GeneratePage from '@/components/admin/GeneratePage'

export default async function Generate() {
  const supabase = await createClient()

  // Get all levels with full curriculum
  const { data: levels } = await supabase
    .from('levels')
    .select(`
      *,
      units(
        *,
        topics(
          *,
          subtopics(*)
        )
      )
    `)
    .order('order_index')

  return <GeneratePage levels={levels || []} />
}