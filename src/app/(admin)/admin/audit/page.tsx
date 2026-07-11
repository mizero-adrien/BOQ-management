'use client'

export const dynamic = 'force-dynamic'

import { Fragment, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'

interface AuditLogRow {
  id: string
  admin_id: string
  admin_name: string
  admin_role: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_OPTIONS = [
  ['', 'All actions'],
  ['grant_admin_access', 'Granted admin access'],
  ['revoke_admin_access', 'Revoked admin access'],
  ['suspend_user', 'Suspended user'],
  ['unsuspend_user', 'Unsuspended user'],
  ['suspend_company', 'Suspended company'],
  ['unsuspend_company', 'Unsuspended company'],
  ['delete_user', 'Deleted user'],
  ['change_role', 'Changed role'],
  ['delete_company', 'Deleted company'],
  ['delete_project', 'Deleted project'],
  ['archive_project', 'Archived project'],
]

const TARGET_OPTIONS = [['', 'All'], ['user', 'User'], ['company', 'Company'], ['project', 'Project'], ['platform', 'Platform']]

function actionLabel(action: string) {
  const found = ACTION_OPTIONS.find(([v]) => v === action)
  return found ? found[1] : action
}

function targetName(details: Record<string, unknown> | null): string {
  if (!details) return '—'
  const name = (details.company_name ?? details.project_name ?? details.full_name ?? details.new_role) as string | undefined
  return name ?? '—'
}

function toCsvRow(cells: string[]) {
  return cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')
}

export default function AdminAuditLogPage() {
  const { isSuperAdmin } = useAdminRole()
  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function loadLog() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('admin_audit_log')
      .select('id, admin_id, action, target_type, target_id, details, created_at, profiles!admin_audit_log_admin_id_fkey(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (fromDate) query = query.gte('created_at', fromDate)
    if (toDate) query = query.lte('created_at', `${toDate}T23:59:59`)
    if (actionFilter) query = query.eq('action', actionFilter)
    if (targetFilter) query = query.eq('target_type', targetFilter)

    const { data } = await query
    setRows(((data ?? []) as unknown as { id: string; admin_id: string; action: string; target_type: string; target_id: string | null; details: Record<string, unknown> | null; created_at: string; profiles: { full_name: string; role: string } | null }[])
      .map((r) => ({ id: r.id, admin_id: r.admin_id, action: r.action, target_type: r.target_type, target_id: r.target_id, details: r.details, created_at: r.created_at, admin_name: r.profiles?.full_name ?? 'Unknown', admin_role: r.profiles?.role ?? '' })))
    setLoading(false)
  }

  useEffect(() => { void loadLog() }, [fromDate, toDate, actionFilter, targetFilter])

  const filtered = rows.filter((r) =>
    search === '' ||
    r.admin_name.toLowerCase().includes(search.toLowerCase()) ||
    targetName(r.details).toLowerCase().includes(search.toLowerCase())
  )

  function exportCsv() {
    const header = toCsvRow(['Admin', 'Action', 'Target Type', 'Target Name', 'Details', 'Date'])
    const lines = filtered.map((r) => toCsvRow([
      r.admin_name, actionLabel(r.action), r.target_type, targetName(r.details), JSON.stringify(r.details ?? {}), r.created_at,
    ]))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Audit Log</h1>
          <p style={{ fontSize: '14px', color: '#5C7080' }}>{filtered.length} entries</p>
        </div>
        {isSuperAdmin && (
          <button type="button" onClick={exportCsv} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #DDE3E8', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>Export CSV</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }} />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }}>
          {ACTION_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8' }}>
          {TARGET_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by target name" style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', flex: 1, minWidth: '180px' }} />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Admin', 'Action', 'Target', 'Details', 'Date'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>No audit entries found</td></tr>
              ) : filtered.map((r) => (
                <Fragment key={r.id}>
                  <tr style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>
                      {r.admin_name}
                      {r.admin_role && <span style={{ marginLeft: '6px', fontSize: '11px', color: '#DC2626', fontWeight: 600, textTransform: 'capitalize' }}>{r.admin_role.replace('_', ' ')}</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1A2332' }}>{actionLabel(r.action)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#F4F6F8', fontSize: '11px', fontWeight: 600, marginRight: '6px', textTransform: 'capitalize' }}>{r.target_type}</span>
                      {targetName(r.details)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button type="button" onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {expanded === r.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#5C7080' }}>{new Date(r.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-details`}>
                      <td colSpan={5} style={{ padding: '12px 16px', backgroundColor: '#F4F6F8' }}>
                        <pre style={{ fontSize: '12px', color: '#1A2332', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(r.details ?? {}, null, 2)}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
