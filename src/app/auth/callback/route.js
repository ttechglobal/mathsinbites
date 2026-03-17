// src/app/auth/callback/route.js
// Handles the OAuth redirect from Google (and any other provider).
// Exchanges the code for a session, then decides where to send the user.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/learn'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this user already has a student profile
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: students } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', user.id)
          .limit(1)

        if (students?.length) {
          // Existing user — go straight to learn
          return NextResponse.redirect(`${origin}${next}`)
        } else {
          // New Google user — needs to complete their profile (pick class)
          return NextResponse.redirect(`${origin}/auth/complete-profile`)
        }
      }
    }
  }

  // Something went wrong — send to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
}