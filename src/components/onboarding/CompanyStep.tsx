'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { countries as countriesMap } from 'countries-list'

type CountryEntry = { code: string; name: string; currency: string }

const ALL_COUNTRIES: CountryEntry[] = Object.entries(countriesMap)
  .map(([code, c]) => ({ code, name: c.name, currency: c.currency[0] ?? 'USD' }))
  .sort((a, b) => a.name.localeCompare(b.name))

const ALL_CURRENCIES: string[] = [
  ...new Set(Object.values(countriesMap).flatMap((c) => c.currency)),
].sort()

const FIELD_STYLE = {
  backgroundColor: '#F5F6FA',
  border: '1px solid #EEEEEE',
  color: '#111111',
}

interface CompanyStepProps {
  onComplete: (companyId: string) => void
}

async function ensureProfileExists(userId: string, fullName: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName, role: 'pm' }, { onConflict: 'id' })
  if (error) {
    console.error('Profile upsert error:', error.message)
    return false
  }
  return true
}

export default function CompanyStep({ onComplete }: CompanyStepProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('RW')
  const [currency, setCurrency] = useState('RWF')
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const countryName = useMemo(
    () => ALL_COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode,
    [countryCode]
  )

  function handleCountryChange(code: string) {
    setCountryCode(code)
    const entry = ALL_COUNTRIES.find((c) => c.code === code)
    if (entry) setCurrency(entry.currency)
  }

  async function handleSkip() {
    setSkipping(true)
    setError(null)
    const supabase = createClient()

    // Refresh session first — new signups sometimes have an uninitialized token
    const { data: refreshData } = await supabase.auth.refreshSession()
    if (!refreshData.session) {
      setError('Your session has expired. Please sign in again.')
      setSkipping(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { onboarding_skipped: true, role: 'pm' },
    })

    if (updateError) {
      console.error('Skip failed:', updateError.message)
      setError('Could not save your preference. Please try again.')
      setSkipping(false)
      return
    }

    router.push('/redirect')
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired. Please sign in again.')
      setSubmitting(false)
      return
    }

    const fullName = (user.user_metadata?.full_name as string | undefined) ?? 'New User'

    // Ensure profile row exists before the RPC tries to insert into company_members
    const profileReady = await ensureProfileExists(user.id, fullName)
    if (!profileReady) {
      setError('Could not set up your account. Please refresh and try again.')
      setSubmitting(false)
      return
    }

    // security definer RPC — bypasses RLS, handles company + company_members atomically
    const { data: company, error: companyErr } = await supabase.rpc(
      'create_company_with_member',
      { p_name: name.trim(), p_country: countryName, p_currency: currency }
    )

    if (companyErr || !company) {
      console.error('Company creation error:', companyErr?.message)
      setError('Could not create company. Please try again.')
      setSubmitting(false)
      return
    }

    await supabase.auth.updateUser({
      data: { role: 'pm', has_company: true, company_id: company.id },
    })

    setSubmitting(false)
    onComplete(company.id as string)
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #EEEEEE' }}>
      <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '22px' }}>
        Set up your company
      </h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>
        This takes less than 2 minutes
      </p>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <Field label="Company name">
          <input
            type="text"
            placeholder="e.g. Kigali Build Co"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 text-sm rounded-lg outline-none"
            style={FIELD_STYLE}
          />
        </Field>
        <Field label="Country">
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-lg outline-none"
            style={FIELD_STYLE}
          >
            {ALL_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-lg outline-none"
            style={FIELD_STYLE}
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          disabled={submitting || skipping}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-60"
          style={{ backgroundColor: '#00236F' }}
        >
          {submitting ? 'Creating...' : 'Next'}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitting || skipping}
          className="w-full py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ color: '#888888' }}
        >
          {skipping ? 'Skipping...' : 'Skip for now, set up company later'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
