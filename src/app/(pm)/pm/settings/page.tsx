'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Company } from '@/types/database'
import { toast } from '@/lib/toast'

type RawMember = { company: Company }

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [showDanger, setShowDanger] = useState(false)
  const [dangerInput, setDangerInput] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingSettings(false); return }
      const { data } = await supabase
        .from('company_members')
        .select('company:companies(*)')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.company) {
        const c = (data as unknown as RawMember).company
        setCompany(c)
        setName(c.name)
        setCountry(c.country ?? '')
        setCurrency(c.currency ?? '')
      }
      setLoadingSettings(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!company) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('companies').update({ name, country, currency }).eq('id', company.id)
    setSaving(false)
    toast.success('Saved', 'Company profile updated')
  }

  const fields: [string, string, (v: string) => void][] = [
    ['Company name', name, setName],
    ['Country', country, setCountry],
    ['Currency code', currency, setCurrency],
  ]

  if (loadingSettings) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }} className="space-y-3">
          <div className="h-6 w-40 rounded-lg animate-pulse" style={{ backgroundColor: '#EEEEEE' }} />
          <div className="h-4 w-56 rounded-lg animate-pulse" style={{ backgroundColor: '#EEEEEE' }} />
          <div className="bg-white rounded-xl p-5 mt-4 animate-pulse" style={{ border: '1px solid #EEEEEE', height: '220px' }} />
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Settings</h1>
          <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>Company account settings</p>
          <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px solid #EEEEEE' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#111111' }}>No company found</p>
            <p className="text-sm mb-4" style={{ color: '#666666' }}>
              Your account is not linked to a company. Complete onboarding to set up your company.
            </p>
            <Link href="/onboarding"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#00236F' }}>
              Go to onboarding
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '24px' }}>Company account settings</p>

        <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#111111' }}>Company profile</p>
          {fields.map(([label, val, setter]) => (
            <div key={label} className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: '#666666' }}>{label}</label>
              <input type="text" value={val} onChange={(e) => setter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ border: '1px solid #EEEEEE', outline: 'none', color: '#111111', backgroundColor: '#F5F6FA' }} />
            </div>
          ))}
          <button type="button" onClick={handleSave} disabled={saving || !company}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#00236F', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E24B4A' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#E24B4A' }}>Danger zone</p>
          <p className="text-xs mb-3" style={{ color: '#666666' }}>Deleting a company account is permanent and cannot be undone.</p>
          {!showDanger ? (
            <button type="button" onClick={() => setShowDanger(true)}
              className="px-4 py-2 text-xs rounded-lg font-medium"
              style={{ border: '1px solid #E24B4A', color: '#E24B4A' }}>
              Delete company account
            </button>
          ) : (
            <div>
              <p className="text-xs mb-2" style={{ color: '#111111' }}>
                Type <strong>{company?.name}</strong> to confirm
              </p>
              <input type="text" value={dangerInput} onChange={(e) => setDangerInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm mb-3"
                style={{ border: '1px solid #E24B4A', outline: 'none', color: '#111111', backgroundColor: '#FFF5F5' }} />
              {dangerInput === company?.name ? (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F6FA' }}>
                  <p className="text-xs" style={{ color: '#666666' }}>
                    To delete your account, email <strong>support@siteflow.rw</strong> with your company name and account email. Our team will process the request within 2 business days.
                  </p>
                </div>
              ) : (
                <button type="button" disabled
                  className="px-4 py-2 text-xs rounded-lg font-medium"
                  style={{ backgroundColor: '#BBBBBB', color: '#FFFFFF' }}>
                  Delete company account
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
