'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

const signupSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirm_password: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type SignupFormData = z.infer<typeof signupSchema>

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setServerError('We couldn\'t sign you up with Google. Please try again, or create an account with your email and password.')
    }
  }, [searchParams])

  async function onSubmit(data: SignupFormData) {
    setServerError(null)

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    const inviteToken = searchParams.get('invite')
    if (inviteToken) {
      router.push('/invite/' + inviteToken)
    } else {
      router.push('/onboarding')
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
          Create your account
        </h1>
        <p className="text-sm text-gray-500">
          Join your construction team
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
            <span className="bg-white px-3">or sign up with email</span>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="full_name"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
            style={{
              backgroundColor: '#F4F6F8',
              border: errors.full_name
                ? '1.5px solid #E24B4A'
                : '1px solid #CDD6DC',
              color: '#111111',
            }}
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
            style={{
              backgroundColor: '#F4F6F8',
              border: errors.email
                ? '1.5px solid #E24B4A'
                : '1px solid #CDD6DC',
              color: '#111111',
            }}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full px-4 pr-10 py-3 text-sm rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: '#F4F6F8',
                border: errors.password
                  ? '1.5px solid #E24B4A'
                  : '1px solid #CDD6DC',
                color: '#111111',
              }}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
            htmlFor="confirm_password"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full px-4 pr-10 py-3 text-sm rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: '#F4F6F8',
                border: errors.confirm_password
                  ? '1.5px solid #E24B4A'
                  : '1px solid #CDD6DC',
                color: '#111111',
              }}
              {...register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-md text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#1565D8' }}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold"
          style={{ color: '#1565D8' }}
        >
          Sign in
        </Link>
      </p>

    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #EEEEEE', borderTopColor: '#1565D8', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}
