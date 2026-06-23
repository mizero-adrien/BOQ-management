export default function Spinner({ size = 14, color = 'white' }: { size?: number; color?: 'white' | 'dark' | 'blue' }) {
  const track = color === 'white' ? 'rgba(255,255,255,0.3)' : color === 'blue' ? 'rgba(0,35,111,0.2)' : 'rgba(0,0,0,0.12)'
  const tip   = color === 'white' ? '#FFFFFF' : color === 'blue' ? '#00236F' : '#111111'
  return (
    <span
      className="inline-block rounded-full animate-spin flex-shrink-0"
      style={{ width: size, height: size, border: `2px solid ${track}`, borderTopColor: tip }}
    />
  )
}
