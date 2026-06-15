import type { TeamMember } from '@/hooks/usePMTeam'

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Site Engineer',
  pm: 'Project Manager',
  foreman: 'Foreman',
  qs: 'Quantity Surveyor',
  storekeeper: 'Storekeeper',
}

export default function MemberRow({ member }: { member: TeamMember }) {
  const initials = member.fullName
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 mb-2"
      style={{ border: '0.5px solid #EEEEEE' }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#E4E9FA' }}
      >
        <span className="text-xs font-bold" style={{ color: '#00236F' }}>
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>
          {member.fullName}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#666666' }}>
          {member.projectName}
        </p>
      </div>
      <span
        className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}
      >
        {ROLE_LABEL[member.role] ?? member.role}
      </span>
    </div>
  )
}
