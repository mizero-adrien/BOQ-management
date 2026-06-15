'use client'

import { SkeletonStats, SkeletonCard } from '@/components/shared/Skeleton'

export default function BOQSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonStats count={4} />
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} height="60px" />
      ))}
    </div>
  )
}
