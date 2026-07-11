'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'

interface PlatformStats {
  total_companies: number
  total_users: number
  total_projects: number
  total_reports: number
  total_boq_value: number
  new_companies: number
  new_users: number
  new_projects: number
  new_reports: number
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '18px' }}>
      <p style={{ fontSize: '12px', color: '#5C7080', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: '#1A2332' }}>{value}</p>
    </div>
  )
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      style={{ display: 'block', backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '18px', textDecoration: 'none' }}
    >
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '12px', color: '#5C7080' }}>{description}</p>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const { adminLevel, isSuperAdmin } = useAdminRole()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.rpc('get_platform_stats', { p_days: 30 })
      setStats(data as PlatformStats)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Admin Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#5C7080' }}>
          {adminLevel === 'super_admin' ? 'Full platform access' : 'Manage users across the platform'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse" style={{ height: '80px', backgroundColor: '#EEEEEE', borderRadius: '12px' }} />
          ))
        ) : (
          <>
            <StatCard label="Companies" value={stats?.total_companies ?? 0} />
            <StatCard label="Users" value={stats?.total_users ?? 0} />
            <StatCard label="Projects" value={stats?.total_projects ?? 0} />
            <StatCard label="Reports submitted" value={stats?.total_reports ?? 0} />
            <StatCard label="Total BOQ value" value={`RWF ${Number(stats?.total_boq_value ?? 0).toLocaleString()}`} />
          </>
        )}
      </div>

      <p style={{ fontSize: '13px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
        Quick access
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <QuickLink href="/admin/companies" label="Companies" description="View, suspend, or delete companies" />
        <QuickLink href="/admin/users" label="Users" description="Manage roles, suspensions, and accounts" />
        <QuickLink href="/admin/projects" label="Projects" description="Browse and manage every project" />
        <QuickLink href="/admin/analytics" label="Analytics" description="Platform growth and usage metrics" />
        <QuickLink href="/admin/audit" label="Audit Log" description="Every admin action, searchable" />
        {isSuperAdmin && <QuickLink href="/admin/settings" label="Settings" description="Manage admin accounts and platform settings" />}
      </div>
    </div>
  )
}
