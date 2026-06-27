'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setServerError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError('Incorrect email or password. Please try again.')
      return
    }

    const inviteToken = searchParams.get('invite')
    if (inviteToken) {
      router.push('/invite/' + inviteToken)
    } else {
      const next = searchParams.get('next')
      router.push(next ?? '/redirect')
    }
    router.refresh()
  }

  async function handleGoogleError(message: string | null) {
    if (message) {
      setServerError(message)
    }
  }

  return (
    <div className="w-full">

      <div className="mb-8">
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ color: '#1A2332' }}
        >
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">
          Sign in to your account
        </p>
      </div>

      {serverError && (
        <div
          className="mb-4 px-4 py-3 rounded-lg border text-sm text-red-700"
          style={{ borderColor: '#E24B4A', backgroundColor: '#FFF5F5' }}
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        <GoogleSignInButton
          nextPath={searchParams.get('next') ?? '/onboarding'}
          onError={handleGoogleError}
          className="mb-5"
        />

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: '#EEEEEE' }} />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide text-gray-400">
            <span className="bg-white px-3">or sign in with email</span>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MailIcon />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              className="w-full pl-9 pr-4 py-3 text-sm rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: '#F4F6F8',
                border: errors.email
                  ? '1.5px solid #E24B4A'
                  : '1px solid #CDD6DC',
                color: '#111111',
              }}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.border = '1.5px solid #1565D8'
                }
              }}
              {...register('email', {
                onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                  if (!errors.email) {
                    e.target.style.border = '1px solid #CDD6DC'
                  }
                }
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="mb-2">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <LockIcon />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full pl-9 pr-10 py-3 text-sm rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: '#F4F6F8',
                border: errors.password
                  ? '1.5px solid #E24B4A'
                  : '1px solid #CDD6DC',
                color: '#111111',
              }}
              onFocus={(e) => {
                if (!errors.password) {
                  e.target.style.border = '1.5px solid #1565D8'
                }
              }}
              {...register('password', {
                onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                  if (!errors.password) {
                    e.target.style.border = '1px solid #CDD6DC'
                  }
                }
              })}
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

        <div className="flex justify-end mb-6">
          <Link
            href="/forgot-password"
            className="text-sm font-medium"
            style={{ color: '#1565D8' }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-md text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#1565D8' }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold"
          style={{ color: '#1565D8' }}
        >
          Sign up
        </Link>
      </p>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EEEEEE', borderTopColor: '#1565D8', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#BBBBBB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#BBBBBB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
