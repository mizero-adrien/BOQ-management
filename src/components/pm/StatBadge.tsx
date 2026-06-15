import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  value: string | number
  label: string
}

export default function StatBadge({ icon, value, label }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: '#BBBBBB' }}>{icon}</span>
      <span style={{ color: '#666666', fontSize: '12px' }}>
        {value} {label}
      </span>
    </div>
  )
}
