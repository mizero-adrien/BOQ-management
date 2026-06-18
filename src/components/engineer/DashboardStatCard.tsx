interface Props {
  label: string
  value: string
  sublabel: string
}

export default function DashboardStatCard({ label, value, sublabel }: Props) {
  return (
    <div
      className="bg-white rounded-xl p-4 border"
      style={{ borderColor: '#EEEEEE' }}
    >
      <p className="text-2xl font-semibold" style={{ color: '#00236F' }}>
        {value}
      </p>
      <p className="text-xs font-medium mt-0.5" style={{ color: '#111111' }}>
        {label}
      </p>
      <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>
        {sublabel}
      </p>
    </div>
  )
}
