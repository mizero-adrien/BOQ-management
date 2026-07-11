'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import { RoleBadge, ActiveSuspendedBadge, ProjectStatusBadge } from '@/components/admin/StatusBadge'

type Tab = 'profile' | 'projects' | 'activity' | 'audit'

interface UserDetail {
  id: string
  full_name: string
  email: string
  role: string
  is_suspended: boolean
  suspended_at: string | null
  suspension_reason: string | null
  created_at: string
  last_sign_in_at: string | null
}

interface ProjectMembership {
  project_id: string
  project_name: string
  project_status: string
  role: string
  assigned_at: string
}

interface ReportRow {
  id: string
  report_date: string
  project_name: string
  workers_count: number
  progress_pct: number
  issues: string | null
}

interface AuditRow {
  id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
  admin_name: string
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ROLE_OPTIONS = ['pm', 'engineer', 'foreman', 'qs', 'storekeeper', 'owner', 'procurement', 'pending']

const ACTION_LABELS: Record<string, string> = {
  grant_admin_access: 'Granted admin access',
  revoke_admin_access: 'Revoked admin access',
  suspend_user: 'Suspended user',
  unsuspend_user: 'Unsuspended user',
  delete_user: 'Deleted user',
  change_role: 'Changed role',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const { isSuperAdmin } = useAdminRole()

  const [tab, setTab] = useState<Tab>('profile')
  const [user, setUser] = useState<UserDetail | null>(null)
  const [projects, setProjects] = useState<ProjectMembership[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [roleEdit, setRoleEdit] = useState(false)
  const [roleValue, setRoleValue] = useState('')
  const [suspendForm, setSuspendForm] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { void loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()

    const { data: usersData } = await supabase.rpc('get_admin_users', { p_search: null, p_role: null, p_status: 'all', p_limit: 1000, p_offset: 0 })
    const match = ((usersData as { users: UserDetail[] } | null)?.users ?? []).find((u) => u.id === userId)
    if (match) { setUser(match); setNameInput(match.full_name); setRoleValue(match.role) }

    const { data: pm } = await supabase
      .from('project_members')
      .select('project_id, role, assigned_at, projects(name, status)')
      .eq('user_id', userId)
    setProjects(((pm ?? []) as unknown as { project_id: string; role: string; assigned_at: string; projects: { name: string; status: string } | null }[])
      .map((p) => ({ project_id: p.project_id, project_name: p.projects?.name ?? '—', project_status: p.projects?.status ?? '—', role: p.role, assigned_at: p.assigned_at })))

    const { data: dr } = await supabase
      .from('daily_reports')
      .select('id, report_date, workers_count, progress_pct, issues, projects(name)')
      .eq('engineer_id', userId)
      .order('report_date', { ascending: false })
      .limit(20)
    setReports(((dr ?? []) as unknown as { id: string; report_date: string; workers_count: number; progress_pct: number; issues: string | null; projects: { name: string } | null }[])
      .map((r) => ({ id: r.id, report_date: r.report_date, workers_count: r.workers_count, progress_pct: r.progress_pct, issues: r.issues, project_name: r.projects?.name ?? '—' })))

    const { data: al } = await supabase
      .from('admin_audit_log')
      .select('id, action, details, created_at, profiles!admin_audit_log_admin_id_fkey(full_name)')
      .eq('target_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setAudit(((al ?? []) as unknown as { id: string; action: string; details: Record<string, unknown> | null; created_at: string; profiles: { full_name: string } | null }[])
      .map((a) => ({ id: a.id, action: a.action, details: a.details, created_at: a.created_at, admin_name: a.profiles?.full_name ?? 'Unknown' })))

    setLoading(false)
  }

  async function saveName() {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: nameInput }).eq('id', userId)
    if (error) { toast.error('Could not update name', error.message); return }
    toast.success('Name updated')
    setEditingName(false)
    void loadAll()
  }

  async function saveRole() {
    const supabase = createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('update_user_role', { target_user_id: userId, new_role: roleValue })
    if (error) { toast.error('Could not change role', error.message); return }
    await supabase.from('admin_audit_log').insert({ admin_id: caller?.id, action: 'change_role', target_type: 'user', target_id: userId, details: { new_role: roleValue } })
    toast.success('Role updated')
    setRoleEdit(false)
    void loadAll()
  }

  async function sendPasswordReset() {
    if (!user) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/send-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ email: user.email }),
    })
    if (!res.ok) { toast.error('Could not send password reset'); return }
    toast.success('Password reset link sent')
  }

  async function suspend() {
    if (!suspendReason.trim()) return
    const supabase = createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('suspend_user', { target_user_id: userId, reason: suspendReason, suspended_by_id: caller?.id })
    if (error) { toast.error('Could not suspend', error.message); return }
    toast.success('User suspended')
    setSuspendForm(false); setSuspendReason('')
    void loadAll()
  }

  async function unsuspend() {
    const supabase = createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('unsuspend_user', { target_user_id: userId, unsuspended_by_id: caller?.id })
    if (error) { toast.error('Could not unsuspend', error.message); return }
    toast.success('User unsuspended')
    void loadAll()
  }

  async function confirmDeleteUser() {
    setDeleting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ userId }),
    })
    setDeleting(false)
    if (!res.ok) { const body = await res.json().catch(() => ({})); toast.error('Could not delete user', body.error); return }
    toast.success('User deleted')
    router.push('/admin/users')
  }

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</div>
  if (!user) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>User not found</div>

  return (
    <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <Link href="/admin/users" style={{ fontSize: '13px', color: '#5C7080', marginBottom: '16px', display: 'inline-block' }}>&larr; Back to users</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#778EDE', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
          {initials(user.full_name)}
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1A2332' }}>{user.full_name}</h1>
          <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '6px' }}>{user.email}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <RoleBadge role={user.role} />
            <ActiveSuspendedBadge isSuspended={user.is_suspended} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button type="button" onClick={() => setRoleEdit(!roleEdit)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>Change role</button>
        <button type="button" onClick={sendPasswordReset} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>Send password reset</button>
        {user.is_suspended ? (
          <button type="button" onClick={unsuspend} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #5DCAA5', backgroundColor: 'transparent', fontSize: '13px', fontWeight: 600, color: '#0F6E56' }}>Unsuspend</button>
        ) : (
          <button type="button" onClick={() => setSuspendForm(!suspendForm)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #DC2626', backgroundColor: 'transparent', fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>Suspend</button>
        )}
        {isSuperAdmin && (
          <button type="button" onClick={() => setDeleteConfirm(true)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Delete</button>
        )}
      </div>

      {roleEdit && (
        <div style={{ backgroundColor: '#F4F6F8', borderRadius: '8px', padding: '14px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={roleValue} onChange={(e) => setRoleValue(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8' }}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="button" onClick={saveRole} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Confirm</button>
        </div>
      )}
      {suspendForm && (
        <div style={{ backgroundColor: '#FFF5F5', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
          <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={2} placeholder="Reason for suspension" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', marginBottom: '8px' }} />
          <button type="button" disabled={!suspendReason.trim()} onClick={suspend} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Confirm suspend</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #DDE3E8', marginBottom: '24px' }}>
        {(['profile', 'projects', 'activity', 'audit'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: tab === t ? '#DC2626' : '#5C7080', borderBottom: tab === t ? '2px solid #DC2626' : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <p style={{ fontSize: '11px', color: '#8FA3B3' }}>Full name</p>
            {isSuperAdmin && !editingName && <button type="button" onClick={() => setEditingName(true)} style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>Edit</button>}
          </div>
          {editingName ? (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8', flex: 1 }} />
              <button type="button" onClick={saveName} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Save</button>
            </div>
          ) : <p style={{ fontSize: '13px', color: '#1A2332', marginBottom: '14px' }}>{user.full_name}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', fontSize: '13px' }}>
            <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Email</p><p style={{ color: '#1A2332' }}>{user.email}</p></div>
            <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Member since</p><p style={{ color: '#1A2332' }}>{formatDate(user.created_at)}</p></div>
            <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Last login</p><p style={{ color: '#1A2332' }}>{formatDate(user.last_sign_in_at)}</p></div>
            {user.is_suspended && (
              <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Suspension reason</p><p style={{ color: '#DC2626' }}>{user.suspension_reason}</p></div>
            )}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Project', 'Role', 'Assigned', 'Status'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#8FA3B3' }}>No project assignments</td></tr>
              ) : projects.map((p) => (
                <tr key={p.project_id} style={{ borderBottom: '1px solid #EEEEEE', cursor: 'pointer' }} onClick={() => router.push(`/admin/projects/${p.project_id}`)}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{p.project_name}</td>
                  <td style={{ padding: '14px 16px' }}><RoleBadge role={p.role} /></td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{formatDate(p.assigned_at)}</td>
                  <td style={{ padding: '14px 16px' }}><ProjectStatusBadge status={p.project_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'activity' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Date', 'Project', 'Workers', 'Progress', 'Issues'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#8FA3B3' }}>No reports submitted</td></tr>
              ) : reports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{formatDate(r.report_date)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{r.project_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{r.workers_count}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{r.progress_pct}%</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: r.issues ? '#DC2626' : '#8FA3B3' }}>{r.issues ? 'Flagged' : 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Admin', 'Action', 'Date'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {audit.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#8FA3B3' }}>No admin actions recorded</td></tr>
              ) : audit.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{a.admin_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{ACTION_LABELS[a.action] ?? a.action}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Delete user"
        body={`This will permanently delete the account for ${user.email}. This cannot be undone.`}
        confirmText={user.email}
        loading={deleting}
      />
    </div>
  )
}
