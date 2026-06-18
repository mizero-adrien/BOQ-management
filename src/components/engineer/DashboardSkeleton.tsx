import { Skeleton, SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="bg-white px-4 pt-4 pb-4 border-b" style={{ borderColor: '#EEEEEE' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton width="80px" height="12px" />
            <Skeleton width="160px" height="20px" />
          </div>
          <Skeleton width="36px" height="36px" borderRadius="50%" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <Skeleton height="56px" borderRadius="12px" />
        <SkeletonStats count={2} />
        <SkeletonTable rows={3} />
        <Skeleton height="48px" borderRadius="12px" />
      </div>
    </div>
  )
}

export function TasksSkeleton() {
  return <SkeletonTable rows={3} />
}
