'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GoogleSignInButtonProps {
  nextPath?: string
  className?: string
  onError?: (message: string | null) => void
}

export default function GoogleSignInButton({
  nextPath = '/onboarding',
  className = '',
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    onError?.(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      onError?.(error.message)
      setLoading(false)
      return
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${className}`}
      style={{
        borderColor: '#DADCE0',
        backgroundColor: '#FFFFFF',
        color: '#111111',
      }}
    >
      <GoogleIcon />
      {loading ? 'Connecting to Google...' : 'Continue with Google'}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.8-5.3l-6.4-5.2C29.5 35.2 26.9 36 24 36c-5.4 0-10-3.4-11.7-8.1l-6.5 5C8.6 39.7 15.7 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-2.9 5-5.9 6.5l6.4 5.2C34.7 38.4 40 33.1 40 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  )
}