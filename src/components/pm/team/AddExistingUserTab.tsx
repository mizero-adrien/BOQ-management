'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/database'
import { toast } from '@/lib/toast'
import { formatRole } from '@/lib/utils/roleLabels'

interface SearchResult {
  id: string
  full_name: string
  role: string
  avatar_url: string | null
}

interface ProjectMembership {
  project_name: string
  role: string
}

interface Props {
  projects: Project[]
  currentUserId: string
}

export default function AddExistingUserTab({ projects, currentUserId }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null)
  const [memberships, setMemberships] = useState<ProjectMembership[]>([])
  const [selectedRole, setSelectedRole] = useState('engineer')
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')
  const [adding, setAdding] = useState(false)

  async function handleSearch(term: string) {
    setSearchTerm(term)
    if (term.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('search_users', { search_term: term })
      if (error) { console.error('Search error:', error.message); setResults([]); return }
      setResults((data ?? []).filter((u: SearchResult) => u.id !== currentUserId))
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  async function handleSelectUser(user: SearchResult) {
    setSelectedUser(user)
    const supabase = createClient()
    const { data } = await supabase
      .from('project_members')
      .select('role, projects(name)')
      .eq('user_id', user.id)
    if (data) {
      setMemberships(data.map((row: unknown) => {
        const m = row as { role: string; projects: { name: string }[] | { name: string } | null }
        const proj = Array.isArray(m.projects) ? m.projects[0] : m.projects
        return { project_name: proj?.name ?? 'Unknown', role: m.role }
      }))
    }
  }

  async function handleAdd() {
    if (!selectedUser || !selectedProjectId) return
    setAdding(true)
    try {
      const supabase = createClient()
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', currentUserId)
        .single()

      if (!companyMember) { toast.error('Company not found'); setAdding(false); return }

      const { error: pmError } = await supabase
        .from('project_members')
        .insert({ project_id: selectedProjectId, user_id: selectedUser.id, role: selectedRole })

      if (pmError) {
        if (pmError.code === '23505') { toast.warning('Already a member', 'This person is already on this project') }
        else { toast.error('Could not add member', pmError.message) }
        setAdding(false)
        return
      }

      await supabase.from('company_members').upsert(
        { company_id: companyMember.company_id, user_id: selectedUser.id, role: selectedRole },
        { onConflict: 'company_id,user_id' }
      )

      // Pass target_project_id so update_user_role only updates profiles.role when pending
      await supabase.rpc('update_user_role', {
        target_user_id: selectedUser.id,
        new_role: selectedRole,
        target_project_id: selectedProjectId,
      })

      const selectedProject = projects.find((p) => p.id === selectedProjectId)
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        project_id: selectedProjectId,
        type: 'task_assigned',
        title: 'You have been added to a project',
        body: 'You have been added to ' + (selectedProject?.name ?? 'a project') + ' as ' + selectedRole,
        read: false,
      })

      toast.success('Team member added', selectedUser.full_name + ' has joined the project')
      setSelectedUser(null)
      setMemberships([])
      setSearchTerm('')
      setResults([])
    } catch (err) {
      console.error('Add member error:', err)
      toast.error('Unexpected error', 'An unexpected error occurred')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#111111', marginBottom: '6px' }}>
          Search by name
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Type a name to search"
          style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', outline: 'none' }}
        />
      </div>

      {searching && (
        <p style={{ fontSize: '13px', color: '#BBBBBB', marginBottom: '10px' }}>Searching...</p>
      )}

      {results.length > 0 && !selectedUser && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #EEEEEE', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
          {results.map((user) => (
            <div
              key={user.id}
              onClick={() => handleSelectUser(user)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#1565D8', flexShrink: 0 }}>
                {user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111111' }}>{user.full_name}</p>
                <p style={{ fontSize: '12px', color: '#BBBBBB' }}>{formatRole(user.role)}</p>
              </div>
              <button type="button" style={{ padding: '6px 12px', backgroundColor: '#1565D8', border: 'none', borderRadius: '6px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                Select
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div style={{ backgroundColor: '#E4E9FA', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#1565D8', marginBottom: '10px' }}>
            Adding: {selectedUser.full_name}
          </p>

          {memberships.length > 0 && (
            <div style={{ marginBottom: '10px', padding: '8px 10px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #C8D4F8' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#1565D8', marginBottom: '4px' }}>Current project memberships</p>
              {memberships.map((m, i) => (
                <p key={i} style={{ fontSize: '12px', color: '#666666' }}>{m.project_name} — {formatRole(m.role)}</p>
              ))}
            </div>
          )}

          {projects.length > 1 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1565D8', marginBottom: '4px' }}>Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C8D4F8', backgroundColor: '#fff', color: '#111111', outline: 'none' }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1565D8', marginBottom: '4px' }}>Role on project</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C8D4F8', backgroundColor: '#fff', color: '#111111', outline: 'none' }}
            >
              <option value="engineer">Site Engineer</option>
              <option value="pm">Project Manager</option>
              <option value="foreman">Foreman</option>
              <option value="qs">Quantity Surveyor</option>
              <option value="storekeeper">Storekeeper</option>
              <option value="owner">Owner / Client</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              style={{ flex: 2, padding: '10px', backgroundColor: adding ? '#BBBBBB' : '#1565D8', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: adding ? 'not-allowed' : 'pointer' }}
            >
              {adding ? 'Adding...' : 'Confirm add'}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedUser(null); setMemberships([]); setSearchTerm(''); setResults([]) }}
              style={{ flex: 1, padding: '10px', backgroundColor: '#fff', border: '1px solid #EEEEEE', borderRadius: '8px', fontSize: '13px', color: '#666666', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {searchTerm.length < 2 && !selectedUser && (
        <p style={{ fontSize: '13px', color: '#BBBBBB', textAlign: 'center', paddingTop: '20px' }}>
          Type at least 2 characters to search for a team member
        </p>
      )}

      {searchTerm.length >= 2 && results.length === 0 && !searching && !selectedUser && (
        <p style={{ fontSize: '13px', color: '#BBBBBB', textAlign: 'center', paddingTop: '20px' }}>
          No users found matching that name. Use the Invite by link tab to invite someone new.
        </p>
      )}
    </div>
  )
}
