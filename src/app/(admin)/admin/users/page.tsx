'use client'

export const dynamic = 'force-dynamic'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import AdminSearchInput from '@/components/admin/AdminSearchInput'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import { RoleBadge, ActiveSuspendedBadge } from '@/components/admin/StatusBadge'

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  is_suspended: boolean
  suspended_at: string | null
  suspension_reason: string | null
  created_at: string
  last_sign_in_at: string | null
  company_name: string | null
  projects_count: number
}

const ROLE_FILTER_OPTIONS = [
  ['', 'All roles'], ['pm', 'PM'], ['engineer', 'Engineer'], ['foreman', 'Foreman'], ['qs', 'QS'],
  ['storekeeper', 'Storekeeper'], ['procurement', 'Procurement'], ['owner', 'Owner'],
  ['pending', 'Pending'], ['admin', 'Admin'], ['super_admin', 'Super Admin'],
]

const AVATAR_COLORS: Record<string, string> = {
  pm: '#1565D8', engineer: '#5DCAA5', admin: '#DC2626', super_admin: '#DC2626',
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

function relativeTime(iso: string | null) {
  if (!iso) return 'Never'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 50

export default function AdminUsersPage() {
  const { isSuperAdmin } = useAdminRole()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const [roleEditId, setRoleEditId] = useState<string | null>(null)
  const [roleEditValue, setRoleEditValue] = useState('')
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { void fetchUsers() }, [search, roleFilter, statusFilter, page])

  async function fetchUsers() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_admin_users', {
      p_search: search || null,
      p_role: roleFilter || null,
      p_status: statusFilter,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    })
    if (!error && data) {
      setUsers((data as { users: AdminUser[]; total: number }).users ?? [])
      setTotal((data as { users: AdminUser[]; total: number }).total ?? 0)
    }
    setLoading(false)
  }

  async function confirmRoleChange(userId: string) {
    if (!roleEditValue) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('update_user_role', { target_user_id: userId, new_role: roleEditValue })
    if (error) { toast.error('Could not change role', error.message); return }
    await supabase.from('admin_audit_log').insert({ admin_id: user?.id, action: 'change_role', target_type: 'user', target_id: userId, details: { new_role: roleEditValue } })
    toast.success('Role updated')
    setRoleEditId(null)
    void fetchUsers()
  }

  async function confirmSuspend(userId: string) {
    if (!suspendReason.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('suspend_user', { target_user_id: userId, reason: suspendReason, suspended_by_id: user?.id })
    if (error) { toast.error('Could not suspend user', error.message); return }
    toast.success('User suspended')
    setSuspendId(null); setSuspendReason('')
    void fetchUsers()
  }

  async function unsuspend(userId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('unsuspend_user', { target_user_id: userId, unsuspended_by_id: user?.id })
    if (error) { toast.error('Could not unsuspend user', error.message); return }
    toast.success('User unsuspended')
    void fetchUsers()
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ userId: deleteConfirm.id }),
    })
    setDeleting(false)
    if (!res.ok) { const body = await res.json().catch(() => ({})); toast.error('Could not delete user', body.error); return }
    toast.success('User deleted')
    setDeleteConfirm(null)
    void fetchUsers()
  }

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Users</h1>
          <p style={{ fontSize: '14px', color: '#5C7080' }}>{total} users on the platform</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AdminSearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search by name or email" />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }} style={{ padding: '9px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', color: '#1A2332' }}>
            {ROLE_FILTER_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }} style={{ padding: '9px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', color: '#1A2332' }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['User', 'Email', 'Role', 'Company', 'Projects', 'Last login', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>No users found</td></tr>
              ) : users.map((u) => (
                <Fragment key={u.id}>
                  <tr style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: AVATAR_COLORS[u.role] ?? '#778EDE', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                          {initials(u.full_name)}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{u.full_name}</p>
                          <p style={{ fontSize: '11px', color: '#8FA3B3', textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: u.company_name ? '#1A2332' : '#8FA3B3' }}>{u.company_name ?? 'No company'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{u.projects_count}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8FA3B3' }}>{relativeTime(u.last_sign_in_at)}</td>
                    <td style={{ padding: '14px 16px' }}><ActiveSuspendedBadge isSuspended={u.is_suspended} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/admin/users/${u.id}`} title="View" style={{ padding: '6px', borderRadius: '6px', border: '1px solid #DDE3E8' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C7080" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>
                        </Link>
                        <button type="button" title="Change role" onClick={() => { setRoleEditId(roleEditId === u.id ? null : u.id); setRoleEditValue(u.role) }} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: 'transparent' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C7080" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </button>
                        <button type="button" title={u.is_suspended ? 'Unsuspend' : 'Suspend'} onClick={() => u.is_suspended ? unsuspend(u.id) : setSuspendId(suspendId === u.id ? null : u.id)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: 'transparent' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={u.is_suspended ? '#5DCAA5' : '#DC2626'} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </button>
                        {isSuperAdmin && (
                          <button type="button" title="Delete" onClick={() => setDeleteConfirm({ id: u.id, email: u.email })} style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {roleEditId === u.id && (
                    <tr key={`${u.id}-role`}>
                      <td colSpan={8} style={{ padding: '12px 16px', backgroundColor: '#F4F6F8' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select value={roleEditValue} onChange={(e) => setRoleEditValue(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8' }}>
                            {ROLE_FILTER_OPTIONS.filter(([v]) => v).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <button type="button" onClick={() => confirmRoleChange(u.id)} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Confirm</button>
                          <button type="button" onClick={() => setRoleEditId(null)} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {suspendId === u.id && (
                    <tr key={`${u.id}-suspend`}>
                      <td colSpan={8} style={{ padding: '12px 16px', backgroundColor: '#FFF5F5' }}>
                        <p style={{ fontSize: '12px', color: '#5C7080', marginBottom: '6px' }}>Reason for suspending {u.full_name}</p>
                        <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={2} style={{ width: '100%', maxWidth: '400px', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', marginBottom: '8px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" disabled={!suspendReason.trim()} onClick={() => confirmSuspend(u.id)} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Confirm suspend</button>
                          <button type="button" onClick={() => { setSuspendId(null); setSuspendReason('') }} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: '#5C7080' }}>
        <p>Showing {from} to {to} of {total} users</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: page === 0 ? '#8FA3B3' : '#1A2332', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <button type="button" disabled={to >= total} onClick={() => setPage((p) => p + 1)} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: to >= total ? '#8FA3B3' : '#1A2332', cursor: to >= total ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete user"
        body={`This will permanently delete the account for ${deleteConfirm?.email ?? 'this user'}. This cannot be undone.`}
        confirmText={deleteConfirm?.email ?? ''}
        loading={deleting}
      />
    </div>
  )
}
