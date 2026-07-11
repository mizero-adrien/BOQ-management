'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import { ProjectStatusBadge } from '@/components/admin/StatusBadge'

type Tab = 'overview' | 'boq' | 'team' | 'reports' | 'settings'

interface ProjectDetail {
  id: string
  name: string
  location: string
  client_name: string
  status: string
  start_date: string
  expected_end_date: string
  overall_progress: number
  plan_image_url: string | null
  share_token: string
  company_id: string
  companies: { name: string } | null
  profiles: { full_name: string } | null
}

interface BOQSection {
  id: string
  title: string
  items: BOQItemRow[]
}

interface BOQItemRow {
  id: string
  description: string
  unit: string
  quantity: number
  unit_rate: number
  budgeted_total: number
  used_total: number
}

interface TeamMember {
  user_id: string
  full_name: string
  role: string
  assigned_at: string
}

interface ReportRow {
  id: string
  report_date: string
  workers_count: number
  progress_pct: number
  notes: string | null
  issues: string | null
  engineer_name: string
}

interface UserOption {
  id: string
  full_name: string
  email: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ROLE_OPTIONS = ['pm', 'engineer', 'foreman', 'qs', 'storekeeper', 'owner', 'procurement']

export default function AdminProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { isSuperAdmin } = useAdminRole()

  const [tab, setTab] = useState<Tab>('overview')
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [sections, setSections] = useState<BOQSection[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [stats, setStats] = useState({ totalReports: 0, reportsThisWeek: 0, openIssues: 0, workersToday: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', location: '', client_name: '', start_date: '', expected_end_date: '', status: 'active' })
  const [saving, setSaving] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [addMemberSearch, setAddMemberSearch] = useState('')
  const [addMemberResults, setAddMemberResults] = useState<UserOption[]>([])
  const [addMemberRole, setAddMemberRole] = useState('engineer')
  const [showAddMember, setShowAddMember] = useState(false)

  useEffect(() => { void loadAll() }, [projectId])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()

    const { data: proj } = await supabase
      .from('projects')
      .select('*, companies(name), profiles!projects_pm_id_fkey(full_name)')
      .eq('id', projectId)
      .single()
    if (proj) {
      setProject(proj as unknown as ProjectDetail)
      setEditForm({
        name: proj.name, location: proj.location, client_name: proj.client_name,
        start_date: proj.start_date, expected_end_date: proj.expected_end_date, status: proj.status,
      })
    }

    const { data: secs } = await supabase.from('boq_sections').select('id, title, order_index').eq('project_id', projectId).order('order_index')
    const { data: items } = await supabase.from('boq_items').select('id, section_id, description, unit, quantity, unit_rate, budgeted_total, used_total').in('section_id', (secs ?? []).map((s) => s.id))
    setSections((secs ?? []).map((s) => ({
      id: s.id, title: s.title,
      items: (items ?? []).filter((i) => i.section_id === s.id) as unknown as BOQItemRow[],
    })))

    const { data: members } = await supabase.from('project_members').select('user_id, role, assigned_at, profiles(full_name)').eq('project_id', projectId)
    setTeam(((members ?? []) as unknown as { user_id: string; role: string; assigned_at: string; profiles: { full_name: string } | null }[])
      .map((m) => ({ user_id: m.user_id, role: m.role, assigned_at: m.assigned_at, full_name: m.profiles?.full_name ?? 'Unknown' })))

    const { data: dr } = await supabase.from('daily_reports').select('id, report_date, workers_count, progress_pct, notes, issues, profiles(full_name)').eq('project_id', projectId).order('report_date', { ascending: false })
    const reportRows = ((dr ?? []) as unknown as { id: string; report_date: string; workers_count: number; progress_pct: number; notes: string | null; issues: string | null; profiles: { full_name: string } | null }[])
      .map((r) => ({ ...r, engineer_name: r.profiles?.full_name ?? '—' }))
    setReports(reportRows)

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    setStats({
      totalReports: reportRows.length,
      reportsThisWeek: reportRows.filter((r) => r.report_date >= weekAgo).length,
      openIssues: reportRows.filter((r) => r.issues).length,
      workersToday: reportRows.filter((r) => r.report_date === today).reduce((s, r) => s + r.workers_count, 0),
    })

    setLoading(false)
  }

  async function saveEdit() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('projects').update(editForm).eq('id', projectId)
    setSaving(false)
    if (error) { toast.error('Could not save changes', error.message); return }
    toast.success('Project updated')
    setEditing(false)
    void loadAll()
  }

  async function archiveProject() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('projects').update({ status: 'cancelled' }).eq('id', projectId)
    if (error) { toast.error('Could not archive', error.message); return }
    await supabase.from('admin_audit_log').insert({ admin_id: user?.id, action: 'archive_project', target_type: 'project', target_id: projectId, details: null })
    toast.success('Project archived')
    setArchiveConfirm(false)
    void loadAll()
  }

  async function confirmDeleteProject() {
    setDeleting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-project', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ projectId }),
    })
    setDeleting(false)
    if (!res.ok) { const body = await res.json().catch(() => ({})); toast.error('Could not delete project', body.error); return }
    toast.success('Project deleted')
    router.push('/admin/projects')
  }

  function copyShareLink() {
    if (!project) return
    navigator.clipboard.writeText(`${window.location.origin}/share/${project.share_token}`)
    toast.success('Link copied to clipboard')
  }

  async function changeRole(userId: string, role: string) {
    const supabase = createClient()
    const { error } = await supabase.from('project_members').update({ role }).eq('project_id', projectId).eq('user_id', userId)
    if (error) { toast.error('Could not change role', error.message); return }
    toast.success('Role updated')
    void loadAll()
  }

  async function removeMember(userId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
    if (error) { toast.error('Could not remove member', error.message); return }
    toast.success('Removed from project')
    void loadAll()
  }

  async function searchUsers(term: string) {
    setAddMemberSearch(term)
    if (term.length < 2) { setAddMemberResults([]); return }
    const supabase = createClient()
    const { data } = await supabase.rpc('get_admin_users', { p_search: term, p_role: null, p_status: 'all', p_limit: 8, p_offset: 0 })
    setAddMemberResults(((data as { users: UserOption[] } | null)?.users ?? []).filter((u) => !team.some((t) => t.user_id === u.id)))
  }

  async function addMember(userId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: userId, role: addMemberRole })
    if (error) { toast.error('Could not add member', error.message); return }
    toast.success('Member added')
    setShowAddMember(false); setAddMemberSearch(''); setAddMemberResults([])
    void loadAll()
  }

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</div>
  if (!project) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Project not found</div>

  const daysElapsed = Math.floor((Date.now() - new Date(project.start_date).getTime()) / 86400000)
  const daysTotal = Math.floor((new Date(project.expected_end_date).getTime() - new Date(project.start_date).getTime()) / 86400000)
  const daysRemaining = Math.floor((new Date(project.expected_end_date).getTime() - Date.now()) / 86400000)
  const plannedProgress = daysTotal > 0 ? Math.min(100, Math.round((daysElapsed / daysTotal) * 100)) : 0

  const totalBudget = sections.reduce((s, sec) => s + sec.items.reduce((si, i) => si + Number(i.budgeted_total ?? 0), 0), 0)
  const totalSpent = sections.reduce((s, sec) => s + sec.items.reduce((si, i) => si + Number(i.used_total ?? 0), 0), 0)

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/admin/projects" style={{ fontSize: '13px', color: '#5C7080', marginBottom: '16px', display: 'inline-block' }}>&larr; Back to projects</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1A2332' }}>{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p style={{ fontSize: '13px', color: '#5C7080' }}>{project.companies?.name ?? '—'} &middot; PM: {project.profiles?.full_name ?? '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={copyShareLink} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>Share owner link</button>
          {isSuperAdmin && <button type="button" onClick={() => setArchiveConfirm(true)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #EF9F27', backgroundColor: 'transparent', fontSize: '13px', fontWeight: 600, color: '#854F0B' }}>Archive</button>}
          {isSuperAdmin && <button type="button" onClick={() => setDeleteConfirm(true)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Delete</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #DDE3E8', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['overview', 'boq', 'team', 'reports', ...(isSuperAdmin ? ['settings'] as Tab[] : [])] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: tab === t ? '#DC2626' : '#5C7080', borderBottom: tab === t ? '2px solid #DC2626' : '2px solid transparent' }}>
            {t === 'boq' ? 'BOQ' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '12px' }}>Project details</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '13px' }}>
              <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Location</p><p style={{ color: '#1A2332' }}>{project.location}</p></div>
              <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Client</p><p style={{ color: '#1A2332' }}>{project.client_name}</p></div>
              <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Start date</p><p style={{ color: '#1A2332' }}>{formatDate(project.start_date)}</p></div>
              <div><p style={{ color: '#8FA3B3', fontSize: '11px' }}>Expected end</p><p style={{ color: '#1A2332' }}>{formatDate(project.expected_end_date)}</p></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '12px' }}>Progress</p>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: '#EEEEEE', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${project.overall_progress}%`, height: '100%', backgroundColor: '#DC2626' }} />
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#5C7080', flexWrap: 'wrap' }}>
              <span>Actual: {project.overall_progress}%</span>
              <span>Planned: {plannedProgress}%</span>
              <span>{daysElapsed} days elapsed</span>
              <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Past due date'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[['Total reports', stats.totalReports], ['This week', stats.reportsThisWeek], ['Open issues', stats.openIssues], ['Workers today', stats.workersToday]].map(([l, v]) => (
              <div key={l as string} style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '11px', color: '#5C7080', marginBottom: '4px' }}>{l}</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A2332' }}>{v}</p>
              </div>
            ))}
          </div>

          {project.plan_image_url && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '12px' }}>Floor plan</p>
              <img src={project.plan_image_url} alt="Floor plan" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          )}
        </div>
      )}

      {tab === 'boq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '24px', backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
            <div><p style={{ fontSize: '11px', color: '#8FA3B3' }}>Total budget</p><p style={{ fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>RWF {totalBudget.toLocaleString()}</p></div>
            <div><p style={{ fontSize: '11px', color: '#8FA3B3' }}>Total spent</p><p style={{ fontSize: '16px', fontWeight: 700, color: '#1A2332' }}>RWF {totalSpent.toLocaleString()}</p></div>
          </div>
          {sections.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8FA3B3', padding: '24px' }}>No BOQ sections</p>
          ) : sections.map((sec) => {
            const secBudget = sec.items.reduce((s, i) => s + Number(i.budgeted_total ?? 0), 0)
            return (
              <div key={sec.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
                <button type="button" onClick={() => setExpandedSection(expandedSection === sec.id ? null : sec.id)} style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', backgroundColor: '#F4F6F8', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{sec.title}</span>
                  <span style={{ fontSize: '12px', color: '#5C7080' }}>RWF {secBudget.toLocaleString()} &middot; {sec.items.length} items</span>
                </button>
                {expandedSection === sec.id && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #EEEEEE' }}>
                        {['Description', 'Unit', 'Qty', 'Rate', 'Budgeted', 'Used'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8FA3B3' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F4F6F8' }}>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#1A2332' }}>{item.description}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#5C7080' }}>{item.unit}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#5C7080' }}>{item.quantity}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#5C7080' }}>{Number(item.unit_rate).toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#1A2332' }}>{Number(item.budgeted_total).toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#1A2332' }}>{Number(item.used_total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAddMember(!showAddMember)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Add member</button>
          </div>
          {showAddMember && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
              <input value={addMemberSearch} onChange={(e) => searchUsers(e.target.value)} placeholder="Search user by name or email" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', marginBottom: '10px' }} />
              <select value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8', marginBottom: '10px' }}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {addMemberResults.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE' }}>
                  <span style={{ fontSize: '13px', color: '#1A2332' }}>{u.full_name} <span style={{ color: '#8FA3B3' }}>({u.email})</span></span>
                  <button type="button" onClick={() => addMember(u.id)} style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Add</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                  {['Name', 'Role', 'Assigned', 'Actions'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#8FA3B3' }}>No team members</td></tr>
                ) : team.map((m) => (
                  <tr key={m.user_id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{m.full_name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value)} style={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #DDE3E8', padding: '4px' }}>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{formatDate(m.assigned_at)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {isSuperAdmin && <button type="button" onClick={() => removeMember(m.user_id)} style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reports.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8FA3B3', padding: '24px' }}>No reports submitted</p>
          ) : reports.map((r) => (
            <div key={r.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
              <button type="button" onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)} style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                <span style={{ fontSize: '13px', color: '#1A2332' }}>{formatDate(r.report_date)} &middot; {r.engineer_name}</span>
                <span style={{ fontSize: '12px', color: r.issues ? '#DC2626' : '#5C7080' }}>{r.workers_count} workers, {r.progress_pct}% {r.issues ? '(issue flagged)' : ''}</span>
              </button>
              {expandedReport === r.id && (
                <div style={{ padding: '0 16px 16px', fontSize: '13px', color: '#5C7080' }}>
                  {r.notes && <p style={{ marginBottom: '6px' }}><strong style={{ color: '#1A2332' }}>Notes:</strong> {r.notes}</p>}
                  {r.issues && <p style={{ color: '#DC2626' }}><strong>Issues:</strong> {r.issues}</p>}
                  {!r.notes && !r.issues && <p>No additional notes</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332' }}>Edit project details</p>
              {!editing && <button type="button" onClick={() => setEditing(true)} style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Edit</button>}
            </div>
            {editing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="Location" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <input value={editForm.client_name} onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })} placeholder="Client name" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <input type="date" value={editForm.expected_end_date} onChange={(e) => setEditForm({ ...editForm, expected_end_date: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }}>
                  <option value="active">Active</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" disabled={saving} onClick={saveEdit} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" onClick={() => setEditing(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DC2626', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>Danger zone</p>
            <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '14px' }}>Archive stops project activity. Delete permanently removes all project data.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setArchiveConfirm(true)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #EF9F27', backgroundColor: 'transparent', color: '#854F0B', fontSize: '13px', fontWeight: 600 }}>Archive project</button>
              <button type="button" onClick={() => setDeleteConfirm(true)} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Delete project</button>
            </div>
          </div>
        </div>
      )}

      {archiveConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setArchiveConfirm(false)}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A2332', marginBottom: '8px' }}>Archive {project.name}?</p>
            <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '18px' }}>This will stop all activity on this project.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setArchiveConfirm(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
              <button type="button" onClick={archiveProject} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#EF9F27', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Archive</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={confirmDeleteProject}
        title="Delete project"
        body={`This will permanently delete ${project.name} and all its BOQ, reports, and team data. This cannot be undone.`}
        confirmText={project.name}
        loading={deleting}
      />
    </div>
  )
}
