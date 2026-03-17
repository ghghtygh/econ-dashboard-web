import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-slate-800', className)} />
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

export function IndicatorCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-3 w-12 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-14" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  )
}
