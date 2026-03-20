// ── Guest session storage ─────────────────────────────────────────────────────
// All guest state lives in localStorage. On signup, migrate() transfers it to DB.

const KEY = {
  class:     'mib_guest_class',
  subject:   'mib_guest_subject',
  completed: 'mib_guest_completed',   // JSON array of subtopic IDs
  xp:        'mib_guest_xp',
  count:     'mib_guest_count',        // lessons completed counter
}

export const GUEST_LESSON_LIMIT = 2

export function getGuest() {
  if (typeof window === 'undefined') return null
  return {
    class_level:    localStorage.getItem(KEY.class)     || '',
    active_subject: localStorage.getItem(KEY.subject)   || 'maths',
    completed:      JSON.parse(localStorage.getItem(KEY.completed) || '[]'),
    xp:             parseInt(localStorage.getItem(KEY.xp)    || '0', 10),
    count:          parseInt(localStorage.getItem(KEY.count) || '0', 10),
  }
}

export function setGuestSetup(classLevel, subject) {
  localStorage.setItem(KEY.class,   classLevel)
  localStorage.setItem(KEY.subject, subject)
}

export function completeGuestLesson(subtopicId, earnedXp) {
  const completed = JSON.parse(localStorage.getItem(KEY.completed) || '[]')
  if (!completed.includes(subtopicId)) {
    completed.push(subtopicId)
    localStorage.setItem(KEY.completed, JSON.stringify(completed))
  }
  const xp    = parseInt(localStorage.getItem(KEY.xp)    || '0', 10) + earnedXp
  const count = parseInt(localStorage.getItem(KEY.count) || '0', 10) + 1
  localStorage.setItem(KEY.xp,    String(xp))
  localStorage.setItem(KEY.count, String(count))
  return { xp, count }
}

export function clearGuest() {
  Object.values(KEY).forEach(k => localStorage.removeItem(k))
}

export function hasGuestData() {
  return !!(localStorage.getItem(KEY.class) && localStorage.getItem(KEY.count))
}