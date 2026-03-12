'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CLASS_LEVELS = [
  { group: 'Primary', levels: ['Primary1','Primary2','Primary3','Primary4','Primary5','Primary6'] },
  { group: 'Junior Secondary', levels: ['JSS1','JSS2','JSS3'] },
  { group: 'Senior Secondary', levels: ['SS1','SS2','SS3'] },
]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    classLevel: '',
    childName: '',
    childClass: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } }
      })
      if (signUpError) throw signUpError

      const userId = data.user.id

      await supabase
        .from('profiles')
        .update({ role: accountType })
        .eq('id', userId)

      if (accountType === 'student') {
        await supabase.from('students').insert({
          profile_id: userId,
          display_name: formData.fullName,
          class_level: formData.classLevel,
        })
      }

      if (accountType === 'parent') {
        await supabase.from('students').insert({
          profile_id: userId,
          display_name: formData.childName,
          class_level: formData.childClass,
          parent_id: userId,
        })
      }

      router.push('/learn')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white">
          Maths<span className="text-[#00E676]">InBites</span>
        </h1>
        <p className="text-[#8899AA] text-sm mt-1">Learn maths. One bite at a time.</p>
      </div>

      <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-[#00E676]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* STEP 1 — Choose account type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-white font-bold text-xl mb-1">Welcome! Who are you?</h2>
              <p className="text-[#8899AA] text-sm">Choose your account type to get started</p>
            </div>

            <button
              onClick={() => { setAccountType('student'); setStep(2) }}
              className="w-full p-5 rounded-2xl border border-white/10 hover:border-[#00E676]/50 hover:bg-[#00E676]/5 transition-all group text-left"
            >
              <div className="text-4xl mb-3">🎓</div>
              <div className="text-white font-bold text-lg group-hover:text-[#00E676] transition-colors">
                I'm a Student
              </div>
              <div className="text-[#8899AA] text-sm mt-1">
                I want to learn maths and track my own progress
              </div>
            </button>

            <button
              onClick={() => { setAccountType('parent'); setStep(2) }}
              className="w-full p-5 rounded-2xl border border-white/10 hover:border-[#00E676]/50 hover:bg-[#00E676]/5 transition-all group text-left"
            >
              <div className="text-4xl mb-3">👨‍👩‍👧</div>
              <div className="text-white font-bold text-lg group-hover:text-[#00E676] transition-colors">
                I'm a Parent
              </div>
              <div className="text-[#8899AA] text-sm mt-1">
                I want to set up accounts for my child or children
              </div>
            </button>

            <p className="text-[#8899AA] text-sm text-center pt-2">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#00E676] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}

        {/* STEP 2 — Account details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-white font-bold text-xl">
                {accountType === 'student' ? '🎓 Create your account' : '👨‍👩‍👧 Create parent account'}
              </h2>
              <p className="text-[#8899AA] text-sm mt-1">
                {accountType === 'student'
                  ? 'Fill in your details below'
                  : 'Your details as the parent'}
              </p>
            </div>

            <input
              name="fullName"
              placeholder={accountType === 'student' ? 'Your full name' : 'Your full name (parent)'}
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:border-[#00E676] transition-colors"
            />
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
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:border-[#00E676] transition-colors"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/10 text-white font-semibold py-3 rounded-xl hover:border-white/20 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!formData.fullName || !formData.email || !formData.password)
                    return setError('Please fill all fields')
                  setError('')
                  setStep(3)
                }}
                className="flex-[2] bg-[#00E676] text-black font-bold py-3 rounded-xl hover:bg-[#00C853] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Class selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-white font-bold text-xl">
                {accountType === 'student' ? 'What class are you in?' : "Your child's details"}
              </h2>
              <p className="text-[#8899AA] text-sm mt-1">
                {accountType === 'student'
                  ? 'We use this to show you the right lessons'
                  : "We'll set up your child's learning profile"}
              </p>
            </div>

            {accountType === 'parent' && (
              <input
                name="childName"
                placeholder="Child's full name"
                value={formData.childName}
                onChange={handleChange}
                className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:border-[#00E676] transition-colors"
              />
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {CLASS_LEVELS.map(group => (
                <div key={group.group}>
                  <p className="text-[#8899AA] text-xs font-semibold uppercase tracking-wider mb-2">
                    {group.group}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.levels.map(level => {
                      const selected = accountType === 'student'
                        ? formData.classLevel === level
                        : formData.childClass === level
                      return (
                        <button
                          key={level}
                          onClick={() => {
                            if (accountType === 'student') {
                              setFormData({ ...formData, classLevel: level })
                            } else {
                              setFormData({ ...formData, childClass: level })
                            }
                          }}
                          className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            selected
                              ? 'bg-[#00E676] text-black'
                              : 'bg-[#0D1117] border border-white/10 text-[#8899AA] hover:border-white/20'
                          }`}
                        >
                          {level}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-white/10 text-white font-semibold py-3 rounded-xl hover:border-white/20 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-[#00E676] text-black font-bold py-3 rounded-xl hover:bg-[#00C853] transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Start Learning 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}