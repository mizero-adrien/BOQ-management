'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import AdminSearchInput from '@/components/admin/AdminSearchInput'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import { ProjectStatusBadge } from '@/components/admin/StatusBadge'

interface ProjectRow {
  id: string
  name: string
  location: string
  status: string
  overall_progress: number
  created_at: string
  companies: { name: string } | null
  profiles: { full_name: string } | null
}

const STATUS_TABS = [
  ['all', 'All'], ['active', 'Active'], ['on_hold', 'On hold'], ['completed', 'Completed'], ['cancelled', 'Cancelled'],
]

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminProjectsPage() {
  const { isSuperAdmin } = useAdminRole()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({})
  const [boqTotals, setBoqTotals] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { void fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select('*, companies(name), profiles!projects_pm_id_fkey(full_name)')
      .order('created_at', { ascending: false })

    const rows = (data ?? []) as unknown as ProjectRow[]
    setProjects(rows)

    const ids = rows.map((p) => p.id)
    if (ids.length > 0) {
      const { data: members } = await supabase.from('project_members').select('project_id').in('project_id', ids)
      const counts: Record<string, number> = {}
      for (const m of members ?? []) counts[m.project_id] = (counts[m.project_id] ?? 0) + 1
      setTeamCounts(counts)

      const { data: boq } = await supabase.from('boq_items').select('budgeted_total, boq_sections!inner(project_id)').in('boq_sections.project_id', ids)
      const totals: Record<string, number> = {}
      for (const item of (boq ?? []) as unknown as { budgeted_total: number; boq_sections: { project_id: string } }[]) {
        const pid = item.boq_sections.project_id
        totals[pid] = (totals[pid] ?? 0) + Number(item.budgeted_total ?? 0)
      }
      setBoqTotals(totals)
    }

    setLoading(false)
  }

  const filtered = projects.filter((p) =>
    (statusFilter === 'all' || p.status === statusFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()))
  )

  async function archiveProject(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('projects').update({ status: 'cancelled' }).eq('id', id)
    if (error) { toast.error('Could not archive project', error.message); return }
    await supabase.from('admin_audit_log').insert({ admin_id: user?.id, action: 'archive_project', target_type: 'project', target_id: id, details: null })
    toast.success('Project archived')
    setArchiveConfirm(null)
    void fetchProjects()
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-project', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ projectId: deleteConfirm.id }),
    })
    setDeleting(false)
    if (!res.ok) { const body = await res.json().catch(() => ({})); toast.error('Could not delete project', body.error); return }
    toast.success('Project deleted')
    setProjects((prev) => prev.filter((p) => p.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Projects</h1>
          <p style={{ fontSize: '14px', color: '#5C7080' }}>{projects.length} total projects</p>
        </div>
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name or location" />
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STATUS_TABS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setStatusFilter(v)}
            style={{
              padding: '7px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, border: '1px solid #DDE3E8',
              backgroundColor: statusFilter === v ? '#DC2626' : '#FFFFFF',
              color: statusFilter === v ? '#FFFFFF' : '#5C7080',
              borderColor: statusFilter === v ? '#DC2626' : '#DDE3E8',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Project', 'Company', 'PM', 'Status', 'Progress', 'Team', 'BOQ', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>No projects found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{initials(p.name)}</div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{p.name}</p>
                        <p style={{ fontSize: '12px', color: '#8FA3B3' }}>{p.location}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{p.companies?.name ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{p.profiles?.full_name ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}><ProjectStatusBadge status={p.status} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: '#EEEEEE', overflow: 'hidden' }}>
                        <div style={{ width: `${p.overall_progress}%`, height: '100%', backgroundColor: '#DC2626' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#5C7080' }}>{p.overall_progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{teamCounts[p.id] ?? 0}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: boqTotals[p.id] ? '#1A2332' : '#8FA3B3' }}>{boqTotals[p.id] ? `RWF ${boqTotals[p.id].toLocaleString()}` : 'No BOQ'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{formatDate(p.created_at)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/admin/projects/${p.id}`} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DDE3E8', fontSize: '12px', fontWeight: 600, color: '#5C7080' }}>View</Link>
                      {isSuperAdmin && (
                        <button type="button" onClick={() => setArchiveConfirm({ id: p.id, name: p.name })} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #EF9F27', backgroundColor: 'transparent', fontSize: '12px', fontWeight: 600, color: '#854F0B' }}>Archive</button>
                      )}
                      {isSuperAdmin && (
                        <button type="button" onClick={() => setDeleteConfirm({ id: p.id, name: p.name })} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {archiveConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setArchiveConfirm(null)}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A2332', marginBottom: '8px' }}>Archive {archiveConfirm.name}?</p>
            <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '18px' }}>This will stop all activity on this project.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setArchiveConfirm(null)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#5C7080' }}>Cancel</button>
              <button type="button" onClick={() => archiveProject(archiveConfirm.id)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#EF9F27', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Archive</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete project"
        body={`This will permanently delete ${deleteConfirm?.name ?? 'this project'} and all its BOQ, reports, and team data. This cannot be undone.`}
        confirmText={deleteConfirm?.name ?? ''}
        loading={deleting}
      />
    </div>
  )
}
