interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = '6px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ width, height, borderRadius, backgroundColor: '#EEEEEE' }}
    />
  )
}

export function SkeletonCard({ height = '80px' }: { height?: string }) {
  return (
    <div
      className="animate-pulse rounded-xl border p-4"
      style={{ borderColor: '#EEEEEE', backgroundColor: '#fff', height }}
    >
      <div className="space-y-2">
        <Skeleton width="60%" height="14px" />
        <Skeleton width="40%" height="12px" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div
      className="animate-pulse flex items-center gap-3 px-4 py-3 border-b"
      style={{ borderColor: '#EEEEEE' }}
    >
      <Skeleton width="36px" height="36px" borderRadius="50%" />
      <div className="flex-1 space-y-1.5">
        <Skeleton width="50%" height="13px" />
        <Skeleton width="30%" height="11px" />
      </div>
      <Skeleton width="60px" height="24px" borderRadius="20px" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#EEEEEE' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height="90px" />
      ))}
    </div>
  )
}
