interface StatCardProps {
  label: string
  value: string
  alert?: boolean
  children?: React.ReactNode
}

export default function StatCard({ label, value, alert, children }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-5 flex flex-col gap-2"
      style={{ border: '0.5px solid #EEEEEE' }}
    >
      {children && (
        <div className="self-start opacity-60">{children}</div>
      )}
      <p
        className="text-3xl font-bold leading-none"
        style={{ color: alert ? '#E24B4A' : '#111111' }}
      >
        {value}
      </p>
      <p className="text-sm" style={{ color: '#666666' }}>
        {label}
      </p>
    </div>
  )
}
