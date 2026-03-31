import { useState, useRef, useEffect, useId, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThresholdLevel } from '@/data/indicatorDescriptions'

interface InfoTooltipProps {
  children: ReactNode
  className?: string
}

export function InfoTooltip({ children, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

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
        aria-describedby={open ? tooltipId : undefined}
      >
        <Info size={13} />
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'w-72 max-h-80 overflow-y-auto rounded-lg border border-border-mid bg-surface p-3 shadow-lg',
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

const SEVERITY_COLORS: Record<string, string> = {
  safe: '#1D9E75',
  warning: '#EF9F27',
  danger: '#E24B4A',
}

interface IndicatorTooltipContentProps {
  definition: string
  importance: string
  related: string[]
  thresholds?: ThresholdLevel[]
  interpretation?: string
  learnMore?: string
}

export function IndicatorTooltipContent({
  definition,
  importance,
  related,
  thresholds,
  interpretation,
  learnMore,
}: IndicatorTooltipContentProps) {
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
      {interpretation && (
        <div>
          <p className="font-medium text-heading mb-0.5">해석 가이드</p>
          <p className="text-muted">{interpretation}</p>
        </div>
      )}
      {thresholds && thresholds.length > 0 && (
        <div>
          <p className="font-medium text-heading mb-1">주요 기준값</p>
          <div className="space-y-0.5">
            {thresholds.map((t) => (
              <div key={t.level} className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: SEVERITY_COLORS[t.severity] }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] text-heading w-10 shrink-0">{t.level}</span>
                <span className="text-[10px] text-muted">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
      {learnMore && (
        <div className="pt-1 border-t border-border-dim">
          <p className="text-[10px] text-faint">{learnMore}</p>
        </div>
      )}
    </div>
  )
}
