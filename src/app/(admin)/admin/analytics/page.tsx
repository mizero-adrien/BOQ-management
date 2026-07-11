'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PlatformStats {
  new_companies: number
  new_users: number
  new_projects: number
  new_reports: number
  total_companies: number
  total_users: number
  total_projects: number
  total_reports: number
  total_boq_value: number
  signups_by_week: { week_label: string; count: number }[]
  role_distribution: { role: string; count: number; pct: number }[]
  top_companies: { company_name: string; reports_this_month: number; active_projects: number; members: number }[]
}

interface AuditEntry {
  id: string
  action: string
  target_type: string
  created_at: string
  admin_name: string
}

const PERIODS: [number, string][] = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last 12 months']]

const ROLE_COLORS: Record<string, string> = {
  pm: '#1565D8', engineer: '#5DCAA5', foreman: '#EF9F27', qs: '#778EDE',
  storekeeper: '#00236F', owner: '#5C7080', procurement: '#0F6E56',
  admin: '#DC2626', super_admin: '#991B1B', pending: '#8FA3B3',
}

const ACTION_LABELS: Record<string, string> = {
  grant_admin_access: 'granted admin access',
  revoke_admin_access: 'revoked admin access',
  suspend_user: 'suspended a user',
  unsuspend_user: 'unsuspended a user',
  suspend_company: 'suspended a company',
  unsuspend_company: 'unsuspended a company',
  delete_user: 'deleted a user',
  delete_company: 'deleted a company',
  delete_project: 'deleted a project',
  change_role: 'changed a role',
  archive_project: 'archived a project',
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
      <p style={{ fontSize: '11px', color: '#5C7080', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A2332' }}>{value}</p>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [feed, setFeed] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function loadStats() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('get_platform_stats', { p_days: days })
    setStats(data as PlatformStats)
    setLoading(false)
  }

  async function loadFeed() {
    const supabase = createClient()
    const { data } = await supabase
      .from('admin_audit_log')
      .select('id, action, target_type, created_at, profiles!admin_audit_log_admin_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)
    setFeed(((data ?? []) as unknown as { id: string; action: string; target_type: string; created_at: string; profiles: { full_name: string } | null }[])
      .map((a) => ({ id: a.id, action: a.action, target_type: a.target_type, created_at: a.created_at, admin_name: a.profiles?.full_name ?? 'Unknown' })))
  }

  useEffect(() => { void loadStats() }, [days])

  useEffect(() => {
    void loadFeed()
    const supabase = createClient()
    const channel = supabase
      .channel('admin_audit_log_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_log' }, () => { void loadFeed() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  const maxWeek = Math.max(1, ...(stats?.signups_by_week ?? []).map((w) => w.count))

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Platform Analytics</h1>
          <p style={{ fontSize: '14px', color: '#5C7080' }}>Growth and usage metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {PERIODS.map(([d, l]) => (
            <button key={d} type="button" onClick={() => setDays(d)} style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #DDE3E8', backgroundColor: days === d ? '#DC2626' : '#FFFFFF', color: days === d ? '#FFFFFF' : '#5C7080' }}>{l}</button>
          ))}
        </div>
      </div>

      {loading || !stats ? (
        <p style={{ textAlign: 'center', color: '#8FA3B3', padding: '32px' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <section>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Growth this period</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <StatCard label="New companies" value={stats.new_companies} />
              <StatCard label="New users" value={stats.new_users} />
              <StatCard label="New projects" value={stats.new_projects} />
              <StatCard label="Reports submitted" value={stats.new_reports} />
            </div>
          </section>

          <section>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Platform totals</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <StatCard label="Companies" value={stats.total_companies} />
              <StatCard label="Users" value={stats.total_users} />
              <StatCard label="Projects" value={stats.total_projects} />
              <StatCard label="Reports" value={stats.total_reports} />
              <StatCard label="Total BOQ value" value={`RWF ${Number(stats.total_boq_value).toLocaleString()}`} />
            </div>
          </section>

          <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '16px' }}>Weekly signups</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' }}>
              {stats.signups_by_week.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#8FA3B3' }}>No signups yet</p>
              ) : stats.signups_by_week.map((w) => (
                <div key={w.week_label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#5C7080' }}>{w.count}</span>
                  <div style={{ width: '100%', height: `${(w.count / maxWeek) * 120}px`, backgroundColor: '#DC2626', borderRadius: '3px 3px 0 0', minHeight: w.count > 0 ? '2px' : '0' }} />
                  <span style={{ fontSize: '10px', color: '#8FA3B3', whiteSpace: 'nowrap' }}>{w.week_label}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '16px' }}>Role distribution</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.role_distribution.map((r) => (
                <div key={r.role}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{r.role.replace('_', ' ')}</span>
                    <span>{r.count} ({r.pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: '#EEEEEE', overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', backgroundColor: ROLE_COLORS[r.role] ?? '#778EDE' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', padding: '20px 20px 0' }}>Most active companies</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                  {['Company', 'Reports this month', 'Active projects', 'Members'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {stats.top_companies.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#8FA3B3' }}>No data yet</td></tr>
                ) : stats.top_companies.map((c) => (
                  <tr key={c.company_name} style={{ borderBottom: '1px solid #EEEEEE' }}>
                    <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{c.company_name}</td>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: '#1A2332' }}>{c.reports_this_month}</td>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: '#1A2332' }}>{c.active_projects}</td>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: '#1A2332' }}>{c.members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '12px' }}>Recent platform activity</p>
            {feed.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8FA3B3' }}>No recent activity</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feed.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #EEEEEE' }}>
                    <span style={{ color: '#1A2332' }}>{f.admin_name} {ACTION_LABELS[f.action] ?? f.action}</span>
                    <span style={{ color: '#8FA3B3' }}>{new Date(f.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
