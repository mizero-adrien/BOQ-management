'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setServerError('Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="w-full text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 mx-auto"
          style={{ backgroundColor: '#00236F' }}
        >
          <MailSentIcon />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Check your email
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          We sent a password reset link to your email address. Check your inbox and follow the instructions.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold"
          style={{ color: '#00236F' }}
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">

      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 mb-6"
        >
          <BackArrowIcon />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Reset password
        </h1>
        <p className="text-sm text-gray-500">
          Enter your email and we will send you a reset link.
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
        <div className="mb-6">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-800 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
            style={{
              backgroundColor: '#F5F6FA',
              border: errors.email
                ? '1.5px solid #E24B4A'
                : '1px solid #EEEEEE',
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#00236F' }}
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

    </div>
  )
}

function MailSentIcon() {
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
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
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
