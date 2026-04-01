import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const skeletonVariants = cva('animate-pulse rounded-lg', {
  variants: {
    variant: {
      default: 'bg-[var(--th-skeleton)]',
      light: 'bg-[var(--th-skeleton-light)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type SkeletonProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonVariants>

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div className={cn(skeletonVariants({ variant, className }))} {...props} />
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-border-dim bg-surface p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

export function IndicatorCardSkeleton() {
  return (
    <div className="rounded-lg border border-border-dim bg-surface p-4">
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

export function GlobalIndicesCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${Math.min(count, 6)}, 1fr)` }}
      role="status"
      aria-label="지표 로딩 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border-dim bg-surface p-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-6 w-20 mb-2.5" />
          <Skeleton className="h-6 w-full" variant="light" />
        </div>
      ))}
    </div>
  )
}

export function NewsCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="status"
      aria-label="뉴스 로딩 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border-dim bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3 w-3 rounded" variant="light" />
          </div>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-2" variant="light" />
          <Skeleton className="h-3 w-2/3 mb-4" variant="light" />
          <div className="flex items-center gap-2 pt-3 border-t border-border-dim">
            <Skeleton className="h-3 w-16" variant="light" />
            <Skeleton className="h-3 w-20" variant="light" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="테이블 로딩 중">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 px-4 border-b border-border-dim">
          <div className="flex-1">
            <Skeleton className="h-3.5 w-24 mb-1.5" />
            <Skeleton className="h-3 w-14" variant="light" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-[60px]" variant="light" />
          <Skeleton className="h-3 w-10" variant="light" />
        </div>
      ))}
    </div>
  )
}
