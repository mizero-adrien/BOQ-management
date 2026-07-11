'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAdminRole } from '@/hooks/useAdminRole'
import { toast } from '@/lib/toast'
import { AdminLevelBadge } from '@/components/admin/StatusBadge'

interface AdminAccount {
  id: string
  full_name: string
  email: string
  role: string
  granted_at: string | null
}

interface UserSearchResult {
  id: string
  full_name: string
  email: string
  role: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { adminId, isSuperAdmin, loading: roleLoading } = useAdminRole()

  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [grantLevel, setGrantLevel] = useState<'admin' | 'super_admin'>('admin')

  const [myName, setMyName] = useState('')
  const [myEmail, setMyEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [platformName, setPlatformName] = useState('Construction Manager')
  const [supportEmail, setSupportEmail] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      toast.error('Access denied', 'Only super admins can view settings')
      router.replace('/admin')
    }
  }, [roleLoading, isSuperAdmin, router])

  useEffect(() => {
    if (isSuperAdmin) {
      void loadAdmins()
      void loadMyAccount()
      void loadPlatformSettings()
    }
  }, [isSuperAdmin])

  async function loadAdmins() {
    setLoadingAdmins(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('get_admin_users', { p_search: null, p_role: null, p_status: 'all', p_limit: 1000, p_offset: 0 })
    const all = ((data as { users: { id: string; full_name: string; email: string; role: string }[] } | null)?.users ?? [])
    const adminList = all.filter((u) => u.role === 'admin' || u.role === 'super_admin')

    const ids = adminList.map((a) => a.id)
    let grantDates: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: grants } = await supabase
        .from('admin_audit_log')
        .select('target_id, created_at')
        .eq('action', 'grant_admin_access')
        .in('target_id', ids)
        .order('created_at', { ascending: false })
      grantDates = (grants ?? []).reduce((acc, g) => {
        if (!acc[g.target_id]) acc[g.target_id] = g.created_at
        return acc
      }, {} as Record<string, string>)
    }

    setAdmins(adminList.map((a) => ({ ...a, granted_at: grantDates[a.id] ?? null })))
    setLoadingAdmins(false)
  }

  async function loadMyAccount() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyEmail(user.email ?? '')
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setMyName(profile?.full_name ?? '')
  }

  async function loadPlatformSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('platform_settings').select('*').eq('id', true).single()
    if (data) {
      setPlatformName(data.platform_name)
      setSupportEmail(data.support_email ?? '')
      setMaintenanceMode(data.maintenance_mode)
    }
  }

  async function searchUsers(term: string) {
    setSearchTerm(term)
    setSelectedUser(null)
    if (term.length < 2) { setSearchResults([]); return }
    const supabase = createClient()
    const { data } = await supabase.rpc('get_admin_users', { p_search: term, p_role: null, p_status: 'all', p_limit: 10, p_offset: 0 })
    const results = ((data as { users: UserSearchResult[] } | null)?.users ?? []).filter((u) => u.role !== 'admin' && u.role !== 'super_admin')
    setSearchResults(results)
  }

  async function grantAccess() {
    if (!selectedUser || !adminId) return
    const supabase = createClient()
    const { error } = await supabase.rpc('grant_admin_access', { target_user_id: selectedUser.id, admin_level: grantLevel, granted_by_id: adminId })
    if (error) { toast.error('Could not grant access', error.message); return }
    toast.success(`${selectedUser.full_name} granted ${grantLevel === 'super_admin' ? 'Super Admin' : 'Admin'} access`)
    setSelectedUser(null); setSearchTerm(''); setSearchResults([])
    void loadAdmins()
  }

  async function revokeAccess(userId: string) {
    if (!adminId) return
    const supabase = createClient()
    const { error } = await supabase.rpc('revoke_admin_access', { target_user_id: userId, revoked_by_id: adminId })
    if (error) { toast.error('Could not revoke access', error.message); return }
    toast.success('Admin access revoked')
    setAdmins((prev) => prev.filter((a) => a.id !== userId))
  }

  async function saveMyName() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: myName }).eq('id', user.id)
    if (error) { toast.error('Could not update name', error.message); return }
    toast.success('Name updated')
  }

  async function changePassword() {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { toast.error('Could not update password', error.message); return }
    toast.success('Password updated')
    setNewPassword(''); setConfirmPassword('')
  }

  async function savePlatformSettings() {
    setSavingSettings(true)
    const supabase = createClient()
    const { error } = await supabase.from('platform_settings').update({
      platform_name: platformName, support_email: supportEmail, updated_at: new Date().toISOString(),
    }).eq('id', true)
    setSavingSettings(false)
    if (error) { toast.error('Could not save settings', error.message); return }
    toast.success('Platform settings saved')
  }

  async function toggleMaintenanceMode() {
    const next = !maintenanceMode
    const supabase = createClient()
    const { error } = await supabase.from('platform_settings').update({ maintenance_mode: next, updated_at: new Date().toISOString() }).eq('id', true)
    if (error) { toast.error('Could not update maintenance mode', error.message); return }
    setMaintenanceMode(next)
    toast.success(next ? 'Maintenance mode enabled' : 'Maintenance mode disabled')
  }

  async function exportAllData() {
    const supabase = createClient()
    const [companies, users, projects] = await Promise.all([
      supabase.rpc('get_admin_companies'),
      supabase.rpc('get_admin_users', { p_search: null, p_role: null, p_status: 'all', p_limit: 10000, p_offset: 0 }),
      supabase.from('projects').select('*'),
    ])
    const payload = {
      exported_at: new Date().toISOString(),
      companies: companies.data ?? [],
      users: (users.data as { users: unknown[] } | null)?.users ?? [],
      projects: projects.data ?? [],
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `platform-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  }

  if (roleLoading || !isSuperAdmin) return <div style={{ padding: '32px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</div>

  return (
    <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A2332', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#5C7080' }}>Manage admin access and platform configuration</p>
      </div>

      <section>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A2332', marginBottom: '2px' }}>Admin accounts</p>
        <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '14px' }}>Manage who has access to the admin panel</p>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8', borderBottom: '1px solid #DDE3E8' }}>
                {['Name', 'Email', 'Level', 'Granted', ''].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#5C7080', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loadingAdmins ? (
                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#8FA3B3' }}>Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#8FA3B3' }}>No admins yet</td></tr>
              ) : admins.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1A2332' }}>{a.full_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5C7080' }}>{a.email}</td>
                  <td style={{ padding: '12px 16px' }}><AdminLevelBadge level={a.role as 'admin' | 'super_admin'} /></td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5C7080' }}>{a.granted_at ? new Date(a.granted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {a.role === 'admin' && (
                      <button type="button" onClick={() => revokeAccess(a.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #DC2626', backgroundColor: 'transparent', fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>Revoke access</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332', marginBottom: '10px' }}>Add admin</p>
          <input value={searchTerm} onChange={(e) => searchUsers(e.target.value)} placeholder="Search user by name or email" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #DDE3E8', marginBottom: '8px' }} />
          {searchResults.length > 0 && !selectedUser && (
            <div style={{ marginBottom: '10px' }}>
              {searchResults.map((u) => (
                <button key={u.id} type="button" onClick={() => { setSelectedUser(u); setSearchResults([]) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: '13px', border: 'none', backgroundColor: 'transparent', borderBottom: '1px solid #EEEEEE', cursor: 'pointer' }}>
                  {u.full_name} <span style={{ color: '#8FA3B3' }}>({u.email})</span>
                </button>
              ))}
            </div>
          )}
          {selectedUser && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', color: '#1A2332', marginBottom: '8px' }}>Selected: <strong>{selectedUser.full_name}</strong> ({selectedUser.email})</p>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1A2332' }}>
                  <input type="radio" checked={grantLevel === 'admin'} onChange={() => setGrantLevel('admin')} /> Admin (can manage users)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1A2332' }}>
                  <input type="radio" checked={grantLevel === 'super_admin'} onChange={() => setGrantLevel('super_admin')} /> Super Admin (full access)
                </label>
              </div>
              <button type="button" onClick={grantAccess} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>Grant access</button>
            </div>
          )}
        </div>
      </section>

      <section>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A2332', marginBottom: '14px' }}>My account</p>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Name</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={myName} onChange={(e) => setMyName(e.target.value)} style={{ flex: 1, padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8' }} />
              <button type="button" onClick={saveMyName} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Save</button>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Email</p>
            <p style={{ fontSize: '13px', color: '#5C7080' }}>{myEmail}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Change password</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8', marginBottom: '8px' }} />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8', marginBottom: '8px' }} />
            <button type="button" onClick={changePassword} style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>Update password</button>
          </div>
        </div>
      </section>

      <section>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A2332', marginBottom: '14px' }}>Platform settings</p>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3E8', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Platform name</p>
            <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8' }} />
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Support email</p>
            <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #DDE3E8' }} />
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div><p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Default country</p><p style={{ fontSize: '13px', color: '#1A2332' }}>Rwanda</p></div>
            <div><p style={{ fontSize: '11px', color: '#8FA3B3', marginBottom: '4px' }}>Default currency</p><p style={{ fontSize: '13px', color: '#1A2332' }}>RWF</p></div>
          </div>
          <button type="button" disabled={savingSettings} onClick={savePlatformSettings} style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{savingSettings ? 'Saving...' : 'Save'}</button>
        </div>
      </section>

      <section>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#DC2626', marginBottom: '14px' }}>Danger zone</p>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DC2626', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>Maintenance mode</p>
              <p style={{ fontSize: '12px', color: '#5C7080' }}>When enabled, non-admin users see a maintenance page instead of the app</p>
              <p style={{ fontSize: '11px', color: maintenanceMode ? '#DC2626' : '#5DCAA5', fontWeight: 600, marginTop: '4px' }}>{maintenanceMode ? 'Currently ON' : 'Currently OFF'}</p>
            </div>
            <button
              type="button"
              onClick={toggleMaintenanceMode}
              style={{ width: '44px', height: '24px', borderRadius: '999px', border: 'none', backgroundColor: maintenanceMode ? '#DC2626' : '#DDE3E8', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', top: '2px', left: maintenanceMode ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF', transition: 'left 0.15s' }} />
            </button>
          </div>
          <div>
            <button type="button" onClick={exportAllData} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #DC2626', backgroundColor: 'transparent', color: '#DC2626', fontSize: '13px', fontWeight: 600 }}>Export all data</button>
          </div>
        </div>
      </section>
    </div>
  )
}
