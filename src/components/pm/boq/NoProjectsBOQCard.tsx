import Link from 'next/link'

export default function NoProjectsBOQCard() {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '0.5px solid #EEEEEE',
        padding: '64px 32px',
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#E4E9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
        No projects yet
      </h2>

      <p style={{ fontSize: '14px', color: '#666666', maxWidth: '380px', margin: '0 auto 8px', lineHeight: '1.6' }}>
        You need to create a project before you can manage a Bill of Quantities.
      </p>

      <p style={{ fontSize: '13px', color: '#BBBBBB', maxWidth: '380px', margin: '8px auto 28px', lineHeight: '1.6' }}>
        Once you create a project you can add BOQ sections, line items, quantities, and unit rates in RWF.
      </p>

      <Link
        href="/pm/projects/new"
        style={{
          display: 'inline-block',
          padding: '13px 28px',
          backgroundColor: '#00236F',
          color: '#FFFFFF',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        Create your first project
      </Link>

      <p style={{ fontSize: '12px', color: '#BBBBBB', marginTop: '16px' }}>
        Or go to{' '}
        <Link href="/pm/projects" style={{ color: '#00236F', textDecoration: 'none', fontWeight: '500' }}>
          Projects
        </Link>
        {' '}to manage existing ones
      </p>
    </div>
  )
}
