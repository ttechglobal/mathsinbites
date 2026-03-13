import { createClient } from '@/lib/supabase/server'
import FlagsPage from '@/components/admin/FlagsPage'

export default async function AdminFlags() {
  const supabase = await createClient()

  const { data: flags } = await supabase
    .from('flagged_questions')
    .select(`*,
      question:questions(id, question_text, difficulty, lesson:lessons(subtopic:subtopics(title))),
      student:students(display_name, class_level)`)
    .order('created_at', { ascending: false })

  return <FlagsPage flags={flags || []} />
}
