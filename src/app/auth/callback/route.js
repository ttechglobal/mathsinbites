// src/app/auth/callback/route.js
// Handles the OAuth redirect from Google (and any other provider).
// Exchanges the code for a session, then decides where to send the user.
//
// IMPORTANT: In your Supabase dashboard → Authentication → URL Configuration:
//   Site URL:           https://www.mathsinbites.com  (your production domain)
//   Redirect URLs add:  https://www.mathsinbites.com/auth/callback
//                       http://localhost:3000/auth/callback  (for local dev)
//
// In Google Cloud Console → OAuth credentials → Authorised redirect URIs:
//   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/learn'

  // Use the request origin so it always redirects to wherever the app is running
  // (works on localhost AND on the deployed production URL automatically)
  const redirectBase = origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if this user already has a student profile
        const { data: students } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', user.id)
          .limit(1)

        if (students?.length) {
          return NextResponse.redirect(`${redirectBase}${next}`)
        } else {
          return NextResponse.redirect(`${redirectBase}/auth/complete-profile`)
        }
      }
    }
  }

  return NextResponse.redirect(`${redirectBase}/auth/login?error=oauth_failed`)
}