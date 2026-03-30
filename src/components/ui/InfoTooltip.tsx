import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  children: ReactNode
  className?: string
}

export function InfoTooltip({ children, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-faint hover:text-muted transition-colors"
        aria-label="지표 설명 보기"
      >
        <Info size={13} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'w-64 rounded-lg border border-border-mid bg-surface p-3 shadow-lg',
            'text-xs text-body leading-relaxed',
            'animate-fadeIn',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 rotate-45 border-r border-b border-border-mid bg-surface" />
          </div>
        </div>
      )}
    </div>
  )
}

interface IndicatorTooltipContentProps {
  definition: string
  importance: string
  related: string[]
}

export function IndicatorTooltipContent({ definition, importance, related }: IndicatorTooltipContentProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-medium text-heading mb-0.5">정의</p>
        <p>{definition}</p>
      </div>
      <div>
        <p className="font-medium text-heading mb-0.5">왜 중요한가</p>
        <p>{importance}</p>
      </div>
      {related.length > 0 && (
        <div>
          <p className="font-medium text-heading mb-0.5">관련 지표</p>
          <div className="flex flex-wrap gap-1">
            {related.map((r) => (
              <span
                key={r}
                className="px-1.5 py-0.5 rounded bg-elevated text-muted text-[10px]"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
