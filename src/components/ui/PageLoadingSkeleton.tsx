import { Skeleton, IndicatorCardSkeleton } from './Skeleton'

type PageLoadingSkeletonProps = {
  variant: 'explore' | 'news'
}

export function PageLoadingSkeleton({ variant }: PageLoadingSkeletonProps) {
  if (variant === 'explore') {
    return (
      <main className="dash-container" aria-busy="true" aria-label="페이지 로딩 중">
        <div className="pb-6 mb-6 border-b border-border-dim">
          <Skeleton className="h-5 w-28 mb-2" />
          <Skeleton className="h-4 w-56" variant="light" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-14 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <IndicatorCardSkeleton key={i} />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="dash-container" aria-busy="true" aria-label="페이지 로딩 중">
      <div className="pb-6 mb-6 border-b border-border-dim">
        <Skeleton className="h-5 w-20 mb-2" />
        <Skeleton className="h-4 w-48" variant="light" />
      </div>
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-dim bg-surface p-4">
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-3 w-full mb-2" variant="light" />
            <Skeleton className="h-3 w-2/3 mb-4" variant="light" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" variant="light" />
              <Skeleton className="h-3 w-20" variant="light" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
