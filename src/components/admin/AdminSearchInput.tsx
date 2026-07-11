interface AdminSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  width?: string
}

export default function AdminSearchInput({ value, onChange, placeholder = 'Search...', width = '280px' }: AdminSearchInputProps) {
  return (
    <div style={{ position: 'relative', width }}>
      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8FA3B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 12px 9px 34px',
          fontSize: '13px',
          borderRadius: '8px',
          border: '1px solid #DDE3E8',
          backgroundColor: '#FFFFFF',
          color: '#1A2332',
          outline: 'none',
        }}
      />
    </div>
  )
}
