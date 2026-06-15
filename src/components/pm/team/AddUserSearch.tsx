'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserSearch } from '@/hooks/useUserSearch'
import UserSearchResult from './UserSearchResult'

interface Props {
  projectId: string
  companyId: string
}

export default function AddUserSearch({ projectId, companyId }: Props) {
  const { searchTerm, setSearchTerm, results, searching } = useUserSearch()
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAdd(userId: string, role: string): Promise<boolean> {
    setAddError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role })

    if (error) {
      if (error.code === '23505') {
        setAddError('This user is already a member of the project.')
      } else {
        setAddError('Could not add user. Please try again.')
      }
      return false
    }

    await Promise.all([
      supabase
        .from('company_members')
        .upsert(
          { company_id: companyId, user_id: userId, role },
          { onConflict: 'company_id,user_id', ignoreDuplicates: true }
        ),
      supabase.rpc('update_user_role', { target_user_id: userId, new_role: role }),
      supabase.from('notifications').insert({
        user_id: userId,
        project_id: projectId,
        type: 'task_assigned',
        title: 'You have been added to a project',
        body: 'A project manager has added you as a team member.',
        read: false,
      }),
    ])

    setAdded((prev) => new Set(prev).add(userId))
    return true
  }

  return (
    <div className="bg-white rounded-xl p-4 mb-5" style={{ border: '0.5px solid #EEEEEE' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Search existing users</p>
      <input
        type="text"
        placeholder="Type a name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2.5 text-sm rounded-lg outline-none mb-3"
        style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
      />
      {addError && (
        <p className="text-xs mb-2" style={{ color: '#E24B4A' }}>{addError}</p>
      )}
      {searching && (
        <p className="text-xs mb-2" style={{ color: '#BBBBBB' }}>Searching...</p>
      )}
      {!searching && searchTerm.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs" style={{ color: '#BBBBBB' }}>No users found.</p>
      )}
      <div className="flex flex-col gap-2">
        {results.map((r) => (
          <UserSearchResult
            key={r.id}
            result={r}
            added={added.has(r.id)}
            onAdd={(role) => handleAdd(r.id, role)}
          />
        ))}
      </div>
    </div>
  )
}
