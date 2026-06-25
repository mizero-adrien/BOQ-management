'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SkeletonTable } from '@/components/shared/Skeleton'
import type { Project } from '@/types/database'
import { formatRole } from '@/lib/utils/roleLabels'
import { toast } from '@/lib/toast'

interface Member {
  id: string
  user_id: string
  role: string
  assigned_at: string
  full_name: string
}

interface Props {
  projects: Project[]
  loading: boolean
}

const ROLES = [
  { value: 'engineer', label: 'Site Engineer' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'qs', label: 'Quantity Surveyor' },
  { value: 'storekeeper', label: 'Storekeeper' },
  { value: 'owner', label: 'Owner / Client' },
]

export default function TeamMembersList({ projects, loading }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [changingRole, setChangingRole] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (!selectedProjectId) return
    async function fetchMembers() {
      setMembersLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('project_members')
        .select('id, user_id, role, assigned_at, profiles(full_name)')
        .eq('project_id', selectedProjectId)
      if (error) { console.error('Members error:', error.message); setMembersLoading(false); return }
      const mapped = (data ?? []).map((m) => ({
        id: m.id as string,
        user_id: m.user_id as string,
        role: m.role as string,
        assigned_at: m.assigned_at as string,
        full_name: (m.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
      }))
      setMembers(mapped)
      setMembersLoading(false)
    }
    fetchMembers()
  }, [selectedProjectId])

  async function handleRoleChange(memberId: string, userId: string, newRole: string) {
    setChangingRole(memberId)
    const supabase = createClient()
    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_role: newRole,
      target_project_id: selectedProjectId,
    })
    if (error) {
      toast.error('Could not change role', error.message)
    } else {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m))
      toast.success('Role updated')
    }
    setChangingRole(null)
  }

  if (loading || membersLoading) return <SkeletonTable rows={4} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111111' }}>Current team</h2>
        {projects.length > 1 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #EEEEEE', backgroundColor: '#fff', color: '#666666', outline: 'none' }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {members.length === 0 ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #DDE3E8', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#BBBBBB' }}>No team members yet. Add or invite your first team member above.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #DDE3E8', overflow: 'hidden' }}>
          {members.map((member, index) => (
            <MemberRow
              key={member.id}
              member={member}
              isLast={index === members.length - 1}
              changing={changingRole === member.id}
              onRoleChange={(newRole) => handleRoleChange(member.id, member.user_id, newRole)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MemberRowProps {
  member: Member
  isLast: boolean
  changing: boolean
  onRoleChange: (newRole: string) => void
}

function MemberRow({ member, isLast, changing, onRoleChange }: MemberRowProps) {
  const [editingRole, setEditingRole] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: isLast ? 'none' : '0.5px solid #EEEEEE' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#1565D8', flexShrink: 0 }}>
        {member.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111111' }}>{member.full_name}</p>
        <p style={{ fontSize: '12px', color: '#BBBBBB' }}>
          {formatRole(member.role)} — Added {new Date(member.assigned_at).toLocaleDateString()}
        </p>
      </div>

      {editingRole ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            defaultValue={member.role}
            disabled={changing}
            onChange={(e) => { onRoleChange(e.target.value); setEditingRole(false) }}
            style={{ padding: '5px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #DDE3E8', backgroundColor: '#fff', color: '#111111', outline: 'none' }}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => setEditingRole(false)}
            style={{ padding: '5px 8px', fontSize: '12px', border: '1px solid #EEEEEE', borderRadius: '6px', backgroundColor: '#fff', color: '#666666', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#E4E9FA', color: '#1565D8', fontWeight: '500' }}>
            {formatRole(member.role)}
          </span>
          <button type="button" onClick={() => setEditingRole(true)}
            style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid #DDE3E8', borderRadius: '6px', backgroundColor: '#fff', color: '#666666', cursor: 'pointer' }}>
            Change role
          </button>
        </div>
      )}
    </div>
  )
}
