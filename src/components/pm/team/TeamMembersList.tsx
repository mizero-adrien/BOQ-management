'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SkeletonTable } from '@/components/shared/Skeleton'
import type { Project } from '@/types/database'
import { formatRole } from '@/lib/utils/roleLabels'

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

export default function TeamMembersList({ projects, loading }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState('')

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
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #EEEEEE', padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#BBBBBB' }}>No team members yet. Add or invite your first team member above.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '0.5px solid #EEEEEE', overflow: 'hidden' }}>
          {members.map((member, index) => (
            <div
              key={member.id}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: index < members.length - 1 ? '0.5px solid #EEEEEE' : 'none' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E4E9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#00236F', flexShrink: 0 }}>
                {member.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111111' }}>{member.full_name}</p>
                <p style={{ fontSize: '12px', color: '#BBBBBB' }}>
                  {formatRole(member.role)} -- Added {new Date(member.assigned_at).toLocaleDateString()}
                </p>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#E4E9FA', color: '#00236F', fontWeight: '500' }}>
                {formatRole(member.role)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
