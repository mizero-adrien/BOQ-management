'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import { ProjectStatusBadge, RoleBadge } from '@/components/admin/StatusBadge'

type Tab = 'overview' | 'projects' | 'team' | 'settings'

interface CompanyInfo {
  id: string
  name: string
  country: string
  currency: string
  is_suspended: boolean
  suspended_at: string | null
  suspension_reason: string | null
  created_at: string
}

interface ProjectRow {
  id: string
  name: string
  location: string
  status: string
  overall_progress: number
}

interface TeamRow {
  user_id: string
  full_name: string
  email: string
  role: string
  joined_at: string
}

interface ReportRow {
  id: string
  report_date: string
  workers_count: number
  progress_pct: number
  project_name: string
  engineer_name: string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ROLE_OPTIONS = ['pm', 'engineer', 'foreman', 'qs', 'storekeeper', 'owner', 'procurement']

export default function AdminCompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const { isSuperAdmin } = useAdminRole()

  const [tab, setTab] = useState<Tab>('overview')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [stats, setStats] = useState({ totalProjects: 0, activeProjects: 0, teamMembers: 0, totalBoqValue: 0 })
  const [recentReports, setRecentReports] = useState<ReportRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [team, setTeam] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editCurrency, setEditCurrency] = useState('')
  const [saving, setSaving] = useState(false)

  const [suspendReason, setSuspendReason] = useState('')
  const [showSuspendForm, setShowSuspendForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [roleEditUserId, setRoleEditUserId] = useState<string | null>(null)
  const [roleEditValue, setRoleEditValue] = useState('')

  useEffect(() => { void loadAll() }, [companyId])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()

    const { data: co } = await supabase.from('companies').select('*').eq('id', companyId).single()
    if (co) {
      setCompany(co as CompanyInfo)
      setEditName(co.name); setEditCountry(co.country); setEditCurrency(co.currency)
    }

    const { data: projs } = await supabase.from('projects').select('id, name, location, status, overall_progress').eq('company_id', companyId)
    setProjects((projs ?? []) as ProjectRow[])

    const { data: members } = await supabase
      .from('company_members')
      .select('user_id, role, joined_at, profiles(full_name)')
      .eq('company_id', companyId)
      .order('joined_at', { ascending: true })

    const teamRows: TeamRow[] = ((members ?? []) as unknown as { user_id: string; role: string; joined_at: string; profiles: { full_name: string } | null }[])
      .map((m) => ({ user_id: m.user_id, full_name: m.profiles?.full_name ?? 'Unknown', email: '', role: m.role, joined_at: m.joined_at }))
    setTeam(teamRows)

    const projectIds = (projs ?? []).map((p) => p.id)
    if (projectIds.length > 0) {
      const { data: boqData } = await supabase
        .from('boq_items')
        .select('budgeted_total, boq_sections!inner(project_id)')
        .in('boq_sections.project_id', projectIds)
      const totalBoqValue = (boqData ?? []).reduce((sum, item) => sum + Number(item.budgeted_total ?? 0), 0)

      const { data: reports } = await supabase
        .from('daily_reports')
        .select('id, report_date, workers_count, progress_pct, projects(name), profiles(full_name)')
        .in('project_id', projectIds)
        .order('report_date', { ascending: false })
        .limit(5)

      const reportRows: ReportRow[] = ((reports ?? []) as unknown as { id: string; report_date: string; workers_count: number; progress_pct: number; projects: { name: string } | null; profiles: { full_name: string } | null }[])
        .map((r) => ({ id: r.id, report_date: r.report_date, workers_count: r.workers_count, progress_pct: r.progress_pct, project_name: r.projects?.name ?? '—', engineer_name: r.profiles?.full_name ?? '—' }))
      setRecentReports(reportRows)

      setStats({
        totalProjects: projectIds.length,
        activeProjects: (projs ?? []).filter((p) => p.status === 'active').length,
        teamMembers: teamRows.length,
        totalBoqValue,
      })
    } else {
      setStats({ totalProjects: 0, activeProjects: 0, teamMembers: teamRows.length, totalBoqValue: 0 })
    }

    setLoading(false)
  }

  async function saveEdit() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('companies').update({ name: editName, country: editCountry, currency: editCurrency }).eq('id', companyId)
    setSaving(false)
    if (error) { toast.error('Could not save changes', error.message); return }
    toast.success('Company updated')
    setEditing(false)
    void loadAll()
  }

  async function suspend() {
    if (!suspendReason.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('suspend_company', { target_company_id: companyId, reason: suspendReason, suspended_by_id: user?.id })
    if (error) { toast.error('Could not suspend', error.message); return }
    toast.success('Company suspended')
    setShowSuspendForm(false); setSuspendReason('')
    void loadAll()
  }

  async function unsuspend() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('unsuspend_company', { target_company_id: companyId, unsuspended_by_id: user?.id })
    if (error) { toast.error('Could not unsuspend', error.message); return }
    toast.success('Company unsuspended')
    void loadAll()
  }

  async function changeRole(userId: string) {
    if (!roleEditValue) return
    const supabase = createClient()
    const { error } = await supabase.from('company_members').update({ role: roleEditValue }).eq('company_id', companyId).eq('user_id', userId)
    if (error) { toast.error('Could not change role', error.message); return }
    toast.success('Role updated')
    setRoleEditUserId(null)
    void loadAll()
  }

  async function removeMember(userId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('company_members').delete().eq('company_id', companyId).eq('user_id', userId)
    if (error) { toast.error('Could not remove member', error.message); return }
    toast.success('Removed from company')
    void loadAll()
  }

  async function confirmDeleteCompany() {
    setDeleting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-company', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ companyId }),
    })
    setDeleting(false)
    if (!res.ok) { const body = await res.json().catch(() => ({})); toast.error('Could not delete company', body.error); return }
    toast.success('Company deleted')
    router.push('/admin/companies')
  }

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</div>
  if (!company) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Company not found</div>

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/admin/companies" style={{ fontSize: '13px', color: '#5C7080', marginBottom: '16px', display: 'inline-block' }}>&larr; Back to companies</Link>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>{company.name}</h1>
        <p style={{ fontSize: '13px', color: '#5C7080' }}>{company.country} &middot; {company.currency}</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #DDE3E8', marginBottom: '24px' }}>
        {(['overview', 'projects', 'team', ...(isSuperAdmin ? ['settings'] as Tab[] : [])] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '10px 16px', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize',
              border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
              color: tab === t ? '#DC2626' : '#5C7080',
              borderBottom: tab === t ? '2px solid #DC2626' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332' }}>Company info</p>
              {isSuperAdmin && !editing && (
                <button type="button" onClick={() => setEditing(true)} style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', border: '1px solid #DC2626', borderRadius: '6px', padding: '5px 10px', backgroundColor: 'transparent' }}>Edit</button>
              )}
            </div>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="Country" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <input value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} placeholder="Currency" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" disabled={saving} onClick={saveEdit} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" onClick={() => setEditing(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Name</p><p style={{ color: '#1A2332' }}>{company.name}</p></div>
                <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Country</p><p style={{ color: '#1A2332' }}>{company.country}</p></div>
                <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Currency</p><p style={{ color: '#1A2332' }}>{company.currency}</p></div>
                <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Created</p><p style={{ color: '#1A2332' }}>{formatDate(company.created_at)}</p></div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              ['Total projects', stats.totalProjects],
              ['Active projects', stats.activeProjects],
              ['Team members', stats.teamMembers],
              ['Total BOQ value', `${company.currency} ${stats.totalBoqValue.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label as string} style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '11px', color: '#5C7080', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A2332' }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '12px' }}>Recent activity</p>
            {recentReports.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8FA3B3' }}>No reports submitted yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentReports.map((r) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #EEEEEE' }}>
                    <span style={{ color: '#1A2332' }}>{r.engineer_name} &middot; {r.project_name}</span>
                    <span style={{ color: '#8FA3B3' }}>{r.workers_count} workers, {r.progress_pct}% &middot; {formatDate(r.report_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '8px' }}>Status</p>
            <p style={{ fontSize: '13px', marginBottom: '10px' }}>
              Current status: <strong style={{ color: company.is_suspended ? '#DC2626' : '#5DCAA5' }}>{company.is_suspended ? 'Suspended' : 'Active'}</strong>
            </p>
            {company.is_suspended && (
              <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '10px' }}>
                <p>Reason: {company.suspension_reason}</p>
                <p>Suspended on: {formatDate(company.suspended_at)}</p>
              </div>
            )}
            {isSuperAdmin && (
              company.is_suspended ? (
                <button type="button" onClick={unsuspend} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #5DCAA5', backgroundColor: 'transparent', fontSize: '12px', fontWeight: 600, color: '#0F6E56' }}>Unsuspend company</button>
              ) : showSuspendForm ? (
                <div>
                  <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={2} placeholder="Reason" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={suspend} disabled={!suspendReason.trim()} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Confirm suspend</button>
                    <button type="button" onClick={() => setShowSuspendForm(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSuspendForm(true)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #DC2626', backgroundColor: 'transparent', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Suspend company</button>
              )
            )}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Project', 'Location', 'Status', 'Progress'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#8FA3B3' }}>No projects</td></tr>
              ) : projects.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #EEEEEE', cursor: 'pointer' }} onClick={() => router.push(`/admin/projects/${p.id}`)}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{p.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{p.location}</td>
                  <td style={{ padding: '14px 16px' }}><ProjectStatusBadge status={p.status} /></td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{p.overall_progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'team' && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Name', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#8FA3B3' }}>No team members</td></tr>
              ) : team.map((m) => (
                <tr key={m.user_id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{m.full_name}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {roleEditUserId === m.user_id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={roleEditValue} onChange={(e) => setRoleEditValue(e.target.value)} style={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #DDE3E8', padding: '4px' }}>
                          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button type="button" onClick={() => changeRole(m.user_id)} style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>Save</button>
                      </div>
                    ) : <RoleBadge role={m.role} />}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{formatDate(m.joined_at)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => { setRoleEditUserId(m.user_id); setRoleEditValue(m.role) }} style={{ fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Change role</button>
                      {isSuperAdmin && <button type="button" onClick={() => removeMember(m.user_id)} style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Remove</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && isSuperAdmin && (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DC2626', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>Danger zone</p>
          <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '14px' }}>Deleting a company is permanent and removes all its projects, BOQ, reports, and team data.</p>
          <button type="button" onClick={() => setDeleteConfirm(true)} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Delete company</button>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={confirmDeleteCompany}
        title="Delete company"
        body={`This will permanently delete ${company.name} and ALL associated data including projects, BOQ, reports, team members, and messages. This cannot be undone.`}
        confirmText={company.name}
        loading={deleting}
      />
    </div>
  )
}
