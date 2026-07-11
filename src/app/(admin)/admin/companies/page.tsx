'use client'

export const dynamic = 'force-dynamic'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import AdminSearchInput from '@/components/admin/AdminSearchInput'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import Spinner from '@/components/shared/Spinner'

interface AdminCompany {
  id: string
  company_name: string
  country: string
  currency: string
  is_suspended: boolean
  suspended_at: string | null
  suspension_reason: string | null
  created_at: string
  owner_name: string | null
  owner_email: string | null
  projects_count: number
  active_projects_count: number
  users_count: number
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminCompaniesPage() {
  const { isSuperAdmin } = useAdminRole()
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [suspendRowId, setSuspendRowId] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspending, setSuspending] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { void fetchCompanies() }, [])

  async function fetchCompanies() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_admin_companies')
    if (!error) setCompanies((data ?? []) as AdminCompany[])
    setLoading(false)
  }

  const filtered = companies.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.owner_email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function confirmSuspend(companyId: string) {
    if (!suspendReason.trim()) return
    setSuspending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('suspend_company', {
      target_company_id: companyId,
      reason: suspendReason,
      suspended_by_id: user?.id,
    })
    setSuspending(false)
    if (error) { toast.error('Could not suspend company', error.message); return }
    toast.success('Company suspended')
    setSuspendRowId(null)
    setSuspendReason('')
    void fetchCompanies()
  }

  async function unsuspend(companyId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('unsuspend_company', { target_company_id: companyId, unsuspended_by_id: user?.id })
    if (error) { toast.error('Could not unsuspend company', error.message); return }
    toast.success('Company unsuspended')
    void fetchCompanies()
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-company', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ companyId: deleteConfirm.id }),
    })
    setDeleting(false)
    if (!res.ok) { const body = await res.json().catch(() => ({})); toast.error('Could not delete company', body.error); return }
    toast.success('Company deleted')
    setCompanies((prev) => prev.filter((c) => c.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Companies</h1>
          <p style={{ fontSize: '14px', color: '#5C7080' }}>{companies.length} companies registered on the platform</p>
        </div>
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name or owner email" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Company', 'Owner', 'Country', 'Projects', 'Users', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>No companies found</td></tr>
              ) : filtered.map((c) => (
                <Fragment key={c.id}>
                  <tr style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                          {initials(c.company_name)}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{c.company_name}</p>
                          <p style={{ fontSize: '12px', color: '#8FA3B3' }}>{c.country}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', color: '#1A2332' }}>{c.owner_name ?? 'Unknown'}</p>
                      <p style={{ fontSize: '12px', color: '#8FA3B3' }}>{c.owner_email ?? '—'}</p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{c.country}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{c.projects_count}</span>
                      <p style={{ fontSize: '11px', color: '#8FA3B3' }}>{c.active_projects_count} active</p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{c.users_count}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{formatDate(c.created_at)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/admin/companies/${c.id}`} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DDE3E8', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>View</Link>
                        {isSuperAdmin && (
                          c.is_suspended ? (
                            <button type="button" onClick={() => unsuspend(c.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #5DCAA5', backgroundColor: 'transparent', fontSize: '12px', fontWeight: 600, color: '#0F6E56' }}>Unsuspend</button>
                          ) : (
                            <button type="button" onClick={() => setSuspendRowId(suspendRowId === c.id ? null : c.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DC2626', backgroundColor: 'transparent', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Suspend</button>
                          )
                        )}
                        {isSuperAdmin && (
                          <button type="button" onClick={() => setDeleteConfirm({ id: c.id, name: c.company_name })} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {suspendRowId === c.id && (
                    <tr key={`${c.id}-suspend`}>
                      <td colSpan={7} style={{ padding: '12px 16px', backgroundColor: '#FFF5F5' }}>
                        <p style={{ fontSize: '12px', color: '#5C7080', marginBottom: '6px' }}>Reason for suspending {c.company_name}</p>
                        <textarea
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', marginBottom: '8px', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" disabled={suspending || !suspendReason.trim()} onClick={() => confirmSuspend(c.id)} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {suspending && <Spinner size={12} />}
                            Confirm suspend
                          </button>
                          <button type="button" onClick={() => { setSuspendRowId(null); setSuspendReason('') }} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#8FA3B3', padding: '24px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8FA3B3', padding: '24px' }}>No companies found</p>
        ) : filtered.map((c) => (
          <div key={c.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332' }}>{c.company_name}</p>
            <p style={{ fontSize: '12px', color: '#8FA3B3', marginBottom: '10px' }}>{c.owner_name ?? 'Unknown owner'}</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5C7080', marginBottom: '10px' }}>
              <span>{c.projects_count} projects</span>
              <span>{c.users_count} users</span>
              <span>{formatDate(c.created_at)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/admin/companies/${c.id}`} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', border: '1px solid #DDE3E8', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>View</Link>
              {isSuperAdmin && (
                <button type="button" onClick={() => setDeleteConfirm({ id: c.id, name: c.company_name })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete company"
        body={`This will permanently delete ${deleteConfirm?.name ?? 'this company'} and ALL associated data including projects, BOQ, reports, team members, and messages. This cannot be undone.`}
        confirmText={deleteConfirm?.name ?? ''}
        loading={deleting}
      />
    </div>
  )
}
