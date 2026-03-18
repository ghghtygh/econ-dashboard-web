import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const skeletonVariants = cva('animate-pulse rounded-lg', {
  variants: {
    variant: {
      default: 'bg-slate-800',
      light: 'bg-slate-700',
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
