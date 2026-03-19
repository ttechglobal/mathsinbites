import { createClient } from '@/lib/supabase/server'

// ── School name keyword extractor ─────────────────────────────────────────
// Strips generic words and returns the most distinctive keyword from a
// school name. Examples:
//   "Lekki British International School" → "Lekki"
//   "Joint Schools"                      → "Joint"
//   "Greensprings School"                → "Greensprings"
//   "Our Lady of Apostles"               → "Lady"   (stops at first specific)
const STOP_WORDS = new Set([
  'international', 'school', 'schools', 'college', 'academy', 'institute',
  'secondary', 'grammar', 'primary', 'high', 'junior', 'senior', 'model',
  'community', 'federal', 'government', 'state', 'public', 'private',
  'nigeria', 'nigerian', 'lagos', 'abuja', 'kano', 'ibadan', 'enugu',
  'the', 'of', 'and', 'for', 'in', 'at', 'by', 'a', 'an',
  'comprehensive', 'vocational', 'technical', 'science', 'arts',
  'mixed', 'boys', 'girls', 'unity', 'standard', 'foundation',
])

function extractSchoolKeyword(name) {
  if (!name?.trim()) return null
  const words = name.trim().split(/\s+/)
  // Find the first word that isn't a stop word and is ≥ 4 chars
  const keyword = words.find(w => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()))
  // Fall back to the longest word if nothing passes
  if (!keyword) {
    return words.reduce((a, b) => a.length >= b.length ? a : b, '')
  }
  return keyword
}

export async function GET(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type        = searchParams.get('type') || 'class'
  const class_level = searchParams.get('class_level')
  const school      = searchParams.get('school')
  const subject     = searchParams.get('subject') || 'maths'

  const isFM = subject === 'further_maths'

  // Select only the columns that definitely exist for the active subject
  // This avoids errors if FM columns haven't been migrated yet
  const selectCols = isFM
    ? 'id, display_name, class_level, school, fm_xp, fm_monthly_xp'
    : 'id, display_name, class_level, school, xp, monthly_xp'

  let query = supabase
    .from('students')
    .select(selectCols)
    .order(isFM ? 'fm_monthly_xp' : 'monthly_xp', { ascending: false })
    .limit(50)

  // For FM: only show students who have earned FM XP (i.e. enrolled + active)
  // This stops non-FM students showing up with 0 XP on the FM leaderboard
  if (isFM) query = query.gt('fm_xp', 0)

  if (type === 'class' && class_level) {
    query = query.eq('class_level', class_level)
  } else if (type === 'school' && school) {
    // Fuzzy school match: extract the most distinctive keyword and use ilike.
    // This groups e.g. "Lekki British International School" with "Lekki British"
    // because both contain the keyword "Lekki".
    const keyword = extractSchoolKeyword(school)
    if (keyword && keyword.length >= 3) {
      query = query.ilike('school', `%${keyword}%`)
    } else {
      // Last resort: exact match
      query = query.eq('school', school)
    }
  }
  // type === 'overall' — no filter

  const { data, error } = await query

  if (error) {
    console.error('[leaderboard] query error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Normalise field names so callers always get xp / monthly_xp
  // regardless of which subject was queried
  const normalised = (data || []).map(row => ({
    id:           row.id,
    display_name: row.display_name,
    class_level:  row.class_level,
    school:       row.school,
    xp:           row.xp         || row.fm_xp         || 0,
    monthly_xp:   row.monthly_xp || row.fm_monthly_xp || 0,
  }))

  return Response.json(normalised)
}