'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDemoProject } from '@/lib/utils/createDemoProject'

interface Props {
  companyId: string
  onLoaded: (projectId: string) => void
}

export default function DemoProjectBanner({ companyId, onLoaded }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLoad() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired. Please refresh.')
      setLoading(false)
      return
    }

    const { projectId, error: rpcError } = await createDemoProject(user.id, companyId)

    if (rpcError || !projectId) {
      setError(rpcError ?? 'Could not load demo project. Try again.')
      setLoading(false)
      return
    }

    await supabase.auth.updateUser({ data: { has_company: true, role: 'pm' } })
    await supabase.auth.refreshSession()

    onLoaded(projectId)
  }

  return (
    <div
      className="rounded-xl p-3 mb-5"
      style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8' }}
    >
      <p className="font-semibold mb-0.5" style={{ color: '#00236F', fontSize: '13px' }}>
        Want to explore with real data?
      </p>
      <p className="mb-2.5" style={{ color: '#00236F', fontSize: '12px' }}>
        Load the Musanze Refurbishment project — a real construction BOQ with 6 sections and 40 line items already filled in.
      </p>
      {error && (
        <p className="mb-2 text-xs" style={{ color: '#E24B4A' }}>{error}</p>
      )}
      <button
        type="button"
        onClick={handleLoad}
        disabled={loading}
        className="font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60"
        style={{ border: '1px solid #00236F', color: '#00236F', fontSize: '12px' }}
      >
        {loading ? 'Loading demo data...' : 'Load demo project'}
      </button>
    </div>
  )
}
