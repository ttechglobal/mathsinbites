// src/hooks/useSessionTracker.js
// Sends a lightweight "ping" to session_events every 60s while student is active.
// Used in LearnDashboard — invisible to students, visible in admin analytics.
// Stops pinging when tab is hidden (document.hidden) to measure real active time.

'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const PING_INTERVAL_MS = 60_000   // 1 minute

export function useSessionTracker(studentId) {
  const timerRef    = useRef(null)
  const supabase    = createClient()
  const studentRef  = useRef(studentId)

  useEffect(() => { studentRef.current = studentId }, [studentId])

  useEffect(() => {
    if (!studentId) return

    async function ping() {
      // Don't ping if tab is hidden — only count real active time
      if (document.hidden) return
      try {
        await supabase.from('session_events').insert({
          student_id: studentRef.current,
          event_type: 'ping',
        })
      } catch (_) {
        // Silently ignore — never break the app over analytics
      }
    }

    // Send an immediate start ping
    ping()

    // Then ping every minute
    timerRef.current = setInterval(ping, PING_INTERVAL_MS)

    return () => {
      clearInterval(timerRef.current)
    }
  }, [studentId])
}