'use client'

import type { Profile } from '@/types/database'

const ROLE_LABELS: Record<string, string> = {
  engineer: 'Site Engineer',
  pm: 'Project Manager',
  foreman: 'Foreman',
  qs: 'Quantity Surveyor',
  storekeeper: 'Storekeeper',
  owner: 'Owner',
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ProfileHeaderCard({
  profile,
  email,
}: {
  profile: Profile
  email: string
}) {
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="rounded-2xl p-6 mb-5 flex flex-col items-center text-center"
      style={{ backgroundColor: '#00236F', borderRadius: '16px' }}
    >
      <div
        className="flex items-center justify-center mb-3"
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.4)',
        }}
      >
        <span style={{ fontSize: '24px', fontWeight: 600, color: '#FFFFFF' }}>{initials}</span>
      </div>
      <p style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>{profile.full_name}</p>
      <p className="mt-1" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
        {roleLabel(profile.role)}
      </p>
      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>System role</p>
      <p className="mt-0.5" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{email}</p>
    </div>
  )
}
