const features = [
  {
    title: 'BOQ Tracking',
    description: 'Track budget vs actual costs in real time.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    title: 'Daily Site Reports',
    description: 'Engineers report from site. PM reviews from anywhere.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: 'Full Team Access',
    description: 'PM, engineers, QS, foreman and procurement in one place.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

export default function BrandContent() {
  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>

      {/* Logo */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: '#1565D8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 22V12h6v10" />
          <path d="M9 7h1" /><path d="M14 7h1" />
          <path d="M9 11h1" /><path d="M14 11h1" />
        </svg>
      </div>

      {/* Headline */}
      <h2 style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#1A2332',
        lineHeight: '1.35',
        marginBottom: '10px',
      }}>
        Construction management, simplified.
      </h2>

      {/* Subtext */}
      <p style={{
        fontSize: '14px',
        color: '#5C7080',
        lineHeight: '1.6',
        marginBottom: '40px',
      }}>
        Built for construction teams in Rwanda and East Africa.
      </p>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {features.map((feature) => (
          <div key={feature.title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(21,101,216,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {feature.icon}
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A2332', marginBottom: '2px' }}>
                {feature.title}
              </p>
              <p style={{ fontSize: '12px', color: '#5C7080', lineHeight: '1.5' }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
