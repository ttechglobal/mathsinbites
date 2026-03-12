'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (loginError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push('/learn')
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white">
          Maths<span className="text-[#00E676]">InBites</span>
        </h1>
        <p className="text-[#8899AA] text-sm mt-1">Welcome back 👋</p>
      </div>

      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 space-y-4">
        <h2 className="text-white font-bold text-xl">Log in to your account</h2>

        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:border-[#00E676] transition-colors"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:border-[#00E676] transition-colors"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#00E676] text-black font-bold py-3 rounded-xl hover:bg-[#00C853] transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In →'}
        </button>

        <p className="text-[#8899AA] text-sm text-center">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-[#00E676] hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}