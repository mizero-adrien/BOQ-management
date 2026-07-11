type BadgeVariant = 'filled' | 'outline'

interface StatusBadgeProps {
  label: string
  color: string
  variant?: BadgeVariant
}

export default function StatusBadge({ label, color, variant = 'outline' }: StatusBadgeProps) {
  const style = variant === 'filled'
    ? { backgroundColor: color, color: '#FFFFFF', border: `1px solid ${color}` }
    : { backgroundColor: 'transparent', color, border: `1px solid ${color}` }

  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export function ActiveSuspendedBadge({ isSuspended }: { isSuspended: boolean }) {
  return isSuspended
    ? <StatusBadge label="Suspended" color="#DC2626" variant="filled" />
    : <StatusBadge label="Active" color="#5DCAA5" variant="outline" />
}

export function AdminLevelBadge({ level }: { level: 'admin' | 'super_admin' }) {
  return level === 'super_admin'
    ? <StatusBadge label="Super Admin" color="#DC2626" variant="filled" />
    : <StatusBadge label="Admin" color="#DC2626" variant="outline" />
}

const ROLE_COLORS: Record<string, string> = {
  pm: '#1565D8',
  engineer: '#5DCAA5',
  foreman: '#EF9F27',
  qs: '#778EDE',
  storekeeper: '#00236F',
  owner: '#5C7080',
  procurement: '#0F6E56',
  admin: '#DC2626',
  super_admin: '#991B1B',
  pending: '#8FA3B3',
}

export function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? '#778EDE'
  return <StatusBadge label={formatRoleLabel(role)} color={color} variant="filled" />
}

export function formatRoleLabel(role: string): string {
  if (role === 'pm') return 'PM'
  if (role === 'qs') return 'QS'
  if (role === 'super_admin') return 'Super Admin'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

const PROJECT_STATUS: Record<string, { color: string; variant: BadgeVariant }> = {
  active: { color: '#1565D8', variant: 'filled' },
  on_hold: { color: '#EF9F27', variant: 'outline' },
  completed: { color: '#5C7080', variant: 'filled' },
  cancelled: { color: '#DC2626', variant: 'outline' },
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const cfg = PROJECT_STATUS[status] ?? { color: '#5C7080', variant: 'outline' as BadgeVariant }
  return <StatusBadge label={formatRoleLabel(status).replace('_', ' ')} color={cfg.color} variant={cfg.variant} />
}
