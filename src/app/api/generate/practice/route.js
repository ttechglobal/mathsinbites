import { createClient } from '@/lib/supabase/server'
import { generatePracticeQuestions } from '@/lib/deepseek/generate'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { topicId, count } = await request.json()

    const { data: topic } = await supabase
      .from('topics')
      .select(`*, units(*, levels(*))`)
      .eq('id', topicId)
      .single()

    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    const classLevel = topic.units?.levels?.name || 'JSS1'
    const generated = await generatePracticeQuestions(topic, classLevel, count || 10)

    for (const q of generated) {
      await supabase.from('questions').insert({
        source_type: 'practice_mode',
        source_id: topicId,
        class_level: classLevel,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
        difficulty: q.difficulty,
        is_active: true,
      })
    }

    return NextResponse.json({ success: true, count: generated.length })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}