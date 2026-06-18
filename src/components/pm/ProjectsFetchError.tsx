export default function ProjectsFetchError() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '10px' }}>
      <p style={{ fontSize: '14px', color: '#666666' }}>Failed to load projects — check your connection</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{ fontSize: '14px', fontWeight: '600', color: '#00236F', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Reload
      </button>
    </div>
  )
}
