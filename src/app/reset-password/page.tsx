'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const resetSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ResetFormData = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  async function onSubmit(data: ResetFormData) {
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 mx-auto"
            style={{ backgroundColor: '#00236F' }}
          >
            <CheckIcon />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Password updated
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Your password has been reset successfully. Redirecting you to sign in...
          </p>
          <Link
            href="/login"
            className="text-sm font-semibold"
            style={{ color: '#00236F' }}
          >
            Back to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 mb-6"
          >
            <BackArrowIcon />
            Back to sign in
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Set new password
          </h1>
          <p className="text-sm text-gray-500">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg border text-sm text-red-700"
              style={{ borderColor: '#E24B4A', backgroundColor: '#FFF5F5' }}
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-800 mb-1.5"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full px-4 pr-10 py-3 text-sm rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: '#F5F6FA',
                  border: errors.password
                    ? '1.5px solid #E24B4A'
                    : '1px solid #EEEEEE',
                  color: '#111111',
                }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-800 mb-1.5"
            >
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                className="w-full px-4 pr-10 py-3 text-sm rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: '#F5F6FA',
                  border: errors.confirmPassword
                    ? '1.5px solid #E24B4A'
                    : '1px solid #EEEEEE',
                  color: '#111111',
                }}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !sessionReady}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#00236F' }}
          >
            {isSubmitting ? 'Updating...' : 'Reset password'}
          </button>

          {!sessionReady && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Verifying your reset link...
            </p>
          )}
        </form>
      </div>
    </main>
  )
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function BackArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}
