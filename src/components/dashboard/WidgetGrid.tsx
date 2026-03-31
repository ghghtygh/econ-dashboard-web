import { useMemo, useRef, useState, useEffect, useCallback, memo } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { X, GripVertical, Settings, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartSkeleton } from '@/components/ui/Skeleton'
import { WidgetEditor } from '@/components/dashboard/WidgetEditor'
import { useDashboardStore } from '@/store/dashboardStore'
import { SyncStatusIndicator } from '@/components/dashboard/SyncStatusIndicator'
import { useIndicatorSeries, type DateRange } from '@/hooks/useIndicators'
import type { Indicator, DashboardWidget } from '@/types/indicator'

interface WidgetGridProps {
  indicators: Indicator[]
}

const MOBILE_BREAKPOINT = 768

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '1Y', label: '1년' },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT,
  )
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

const WidgetItem = memo(function WidgetItem({ widget, indicator, data, isLoading, onEdit, isMobile, onMoveUp, onMoveDown, position, total }: {
  widget: DashboardWidget
  indicator?: Indicator
  data?: import('@/types/indicator').IndicatorData[]
  isLoading: boolean
  onEdit: () => void
  isMobile: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  position?: number
  total?: number
}) {
  const removeWidget = useDashboardStore((s) => s.removeWidget)
  const updateWidget = useDashboardStore((s) => s.updateWidget)
  const currentRange = widget.dateRange ?? '1M'
  const widgetName = widget.title ?? indicator?.name ?? '위젯'

  return (
    <div
      className="h-full rounded-lg border border-border-dim bg-surface flex flex-col overflow-hidden"
      role="region"
      aria-label={`${widgetName} 위젯${position != null && total != null ? ` (${position}/${total})` : ''}`}
    >
      <div className={cn(
        "flex items-center justify-between border-b border-border-dim shrink-0",
        isMobile ? "px-4 py-3" : "px-3 py-2",
      )}>
        <div className="flex items-center gap-1.5 min-w-0">
          {!isMobile && (
            <>
              <GripVertical size={14} className="text-faint cursor-grab shrink-0 drag-handle" aria-hidden="true" />
              <div className="flex flex-col shrink-0" role="group" aria-label="위젯 순서 변경">
                <button
                  onClick={onMoveUp}
                  disabled={position === 1}
                  className="text-faint hover:text-body disabled:opacity-30 transition-colors p-0 leading-none"
                  aria-label={`${widgetName} 위로 이동`}
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={position === total}
                  className="text-faint hover:text-body disabled:opacity-30 transition-colors p-0 leading-none"
                  aria-label={`${widgetName} 아래로 이동`}
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            </>
          )}
          <h3 className={cn(
            "font-medium text-body truncate",
            isMobile ? "text-sm" : "text-xs",
          )}>
            {widgetName}
          </h3>
        </div>
        <div className={cn(
          "flex items-center shrink-0 ml-2",
          isMobile ? "gap-1" : "gap-1",
        )}>
          <div className={cn(
            "flex items-center mr-1",
            isMobile ? "gap-1" : "gap-0.5",
          )} role="group" aria-label="기간 선택">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateWidget(widget.id, { dateRange: opt.value })}
                aria-pressed={currentRange === opt.value}
                className={cn(
                  'rounded transition-colors',
                  isMobile
                    ? 'text-xs px-2.5 py-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center'
                    : 'text-[9px] px-1.5 py-0.5',
                  currentRange === opt.value
                    ? 'bg-elevated text-heading font-medium'
                    : 'text-faint hover:text-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={onEdit}
            aria-label={`${widgetName} 설정`}
            className={cn(
              "text-faint hover:text-blue-400 transition-colors",
              isMobile && "min-w-[44px] min-h-[44px] flex items-center justify-center",
            )}
          >
            <Settings size={isMobile ? 18 : 14} />
          </button>
          <button
            onClick={() => removeWidget(widget.id)}
            aria-label={`${widgetName} 삭제`}
            className={cn(
              "text-faint hover:text-red-400 transition-colors",
              isMobile && "min-w-[44px] min-h-[44px] flex items-center justify-center",
            )}
          >
            <X size={isMobile ? 18 : 14} />
          </button>
        </div>
      </div>
      <div className={cn("flex-1 min-h-0", isMobile ? "p-4" : "p-3")}>
        {isLoading ? (
          <ChartSkeleton />
        ) : data && data.length > 0 ? (
          <ChartRenderer
            type={widget.chartType}
            data={data}
            color={widget.color}
            unit={indicator?.unit}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-faint text-xs">데이터 없음</p>
          </div>
        )}
      </div>
    </div>
  )
})

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(1200)
  useEffect(() => {
    if (!ref.current) return
    let rafId: number | null = null
    let lastWidth = ref.current.offsetWidth
    const observer = new ResizeObserver((entries) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        for (const entry of entries) {
          const newWidth = Math.round(entry.contentRect.width)
          if (newWidth !== lastWidth) {
            lastWidth = newWidth
            setWidth(newWidth)
          }
        }
      })
    })
    observer.observe(ref.current)
    setWidth(lastWidth)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [ref])
  return width
}

/**
 * 위젯별 dateRange에 따라 그룹화하여 각 그룹별로 useIndicatorSeries를 호출.
 * (React hooks는 조건부 호출이 안 되므로, 고정 4개 range에 대해 항상 호출)
 */
function useWidgetData(widgets: DashboardWidget[]) {
  const byRange = useMemo(() => {
    const groups: Record<DateRange, number[]> = { '1D': [], '1W': [], '1M': [], '3M': [], '1Y': [] }
    for (const w of widgets) {
      const r = w.dateRange ?? '1M'
      if (!groups[r].includes(w.indicatorId)) groups[r].push(w.indicatorId)
    }
    return groups
  }, [widgets])

  const r1W = useIndicatorSeries(byRange['1W'], '1W')
  const r1M = useIndicatorSeries(byRange['1M'], '1M')
  const r3M = useIndicatorSeries(byRange['3M'], '3M')
  const r1Y = useIndicatorSeries(byRange['1Y'], '1Y')

  const dataByRange: Record<string, Record<number, import('@/types/indicator').IndicatorData[]> | undefined> = {
    '1W': r1W.data?.data,
    '1M': r1M.data?.data,
    '3M': r3M.data?.data,
    '1Y': r1Y.data?.data,
  }

  const isLoading = r1W.isLoading || r1M.isLoading || r3M.isLoading || r1Y.isLoading

  return { dataByRange, isLoading }
}

export function WidgetGrid({ indicators }: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const isMobile = useIsMobile()
  const widgets = useDashboardStore((s) => s.widgets)
  const updateLayouts = useDashboardStore((s) => s.updateLayouts)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)
  const editingWidget = widgets.find((w) => w.id === editingWidgetId)
  const editingIndicator = editingWidget ? indicators.find((i) => i.id === editingWidget.indicatorId) : undefined

  const { dataByRange, isLoading } = useWidgetData(widgets)

  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
    const idx = sorted.findIndex((w) => w.id === widgetId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const current = sorted[idx]
    const swap = sorted[swapIdx]
    updateLayouts([
      { i: current.id, x: swap.position.x, y: swap.position.y, w: current.position.w, h: current.position.h },
      { i: swap.id, x: current.position.x, y: current.position.y, w: swap.position.w, h: swap.position.h },
    ])
  }, [widgets, updateLayouts])

  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x),
    [widgets],
  )

  const toLayoutItem = useCallback((w: DashboardWidget): LayoutItem => ({
    i: w.id, x: w.position.x, y: w.position.y, w: w.position.w, h: w.position.h,
    minW: 1, minH: 3,
  }), [])

  const layouts = useMemo(() => ({
    lg: widgets.map(toLayoutItem),
    md: widgets.map((w) => ({ ...toLayoutItem(w), x: w.position.x % 6, w: Math.min(w.position.w, 6), minW: 2 })),
    sm: widgets.map((w) => ({ ...toLayoutItem(w), x: 0, w: 1, minW: 1 })),
  }), [widgets, toLayoutItem])

  const handleLayoutChange = (layout: Layout) => {
    updateLayouts(layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))
  }

  if (widgets.length === 0) {
    return (
      <div ref={containerRef} className="rounded-xl border border-dashed border-border-dim p-12 text-center">
        <div className="flex justify-center mb-3"><LayoutGrid size={40} className="text-faint" /></div>
        <p className="text-faint">위젯을 추가하여 대시보드를 구성하세요</p>
      </div>
    )
  }

  // Mobile: stacked list view (no drag-and-drop)
  if (isMobile) {
    return (
      <div ref={containerRef} className="widget-grid-mobile" role="list" aria-label="대시보드 위젯 목록">
        {sortedWidgets.map((widget, idx) => {
          const indicator = indicators.find((i) => i.id === widget.indicatorId)
          const range = widget.dateRange ?? '1M'
          const data = dataByRange[range]?.[widget.indicatorId]
          return (
            <div key={widget.id} className="widget-grid-mobile-item" role="listitem">
              <WidgetItem
                widget={widget}
                indicator={indicator}
                data={data}
                isLoading={isLoading}
                onEdit={() => setEditingWidgetId(widget.id)}
                isMobile
                position={idx + 1}
                total={sortedWidgets.length}
              />
            </div>
          )
        })}
        {editingWidget && (
          <WidgetEditor
            key={editingWidget.id}
            widget={editingWidget}
            indicator={editingIndicator}
            open={!!editingWidgetId}
            onClose={() => setEditingWidgetId(null)}
          />
        )}
      </div>
    )
  }

  // Desktop/tablet: grid layout with drag-and-drop
  return (
    <div ref={containerRef} role="region" aria-label="대시보드 위젯 그리드">
      <div className="flex justify-end mb-2">
        <SyncStatusIndicator />
      </div>
      <ResponsiveGridLayout
        width={containerWidth}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 768, sm: 0 }}
        cols={{ lg: 12, md: 6, sm: 1 }}
        rowHeight={40}
        margin={[12, 12] as const}
        onLayoutChange={handleLayoutChange}
        dragConfig={{ enabled: true, handle: '.drag-handle' }}
        resizeConfig={{ enabled: true, handles: ['se'] }}
      >
        {widgets.map((widget) => {
          const indicator = indicators.find((i) => i.id === widget.indicatorId)
          const range = widget.dateRange ?? '1M'
          const data = dataByRange[range]?.[widget.indicatorId]
          const sortedIdx = sortedWidgets.findIndex((w) => w.id === widget.id)
          return (
            <div key={widget.id}>
              <WidgetItem
                widget={widget}
                indicator={indicator}
                data={data}
                isLoading={isLoading}
                onEdit={() => setEditingWidgetId(widget.id)}
                isMobile={false}
                onMoveUp={() => moveWidget(widget.id, 'up')}
                onMoveDown={() => moveWidget(widget.id, 'down')}
                position={sortedIdx + 1}
                total={widgets.length}
              />
            </div>
          )
        })}
      </ResponsiveGridLayout>
      {editingWidget && (
        <WidgetEditor
          key={editingWidget.id}
          widget={editingWidget}
          indicator={editingIndicator}
          open={!!editingWidgetId}
          onClose={() => setEditingWidgetId(null)}
        />
      )}
    </div>
  )
}
