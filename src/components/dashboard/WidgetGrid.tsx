import { useMemo, useRef, useState, useEffect } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { X, GripVertical, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartSkeleton } from '@/components/ui/Skeleton'
import { WidgetEditor } from '@/components/dashboard/WidgetEditor'
import { useDashboardStore } from '@/store/dashboardStore'
import { useIndicatorSeries, type DateRange } from '@/hooks/useIndicators'
import type { Indicator, DashboardWidget } from '@/types/indicator'

interface WidgetGridProps {
  indicators: Indicator[]
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '1Y', label: '1년' },
]

function WidgetItem({ widget, indicator, data, isLoading, onEdit }: {
  widget: DashboardWidget
  indicator?: Indicator
  data?: import('@/types/indicator').IndicatorData[]
  isLoading: boolean
  onEdit: () => void
}) {
  const removeWidget = useDashboardStore((s) => s.removeWidget)
  const updateWidget = useDashboardStore((s) => s.updateWidget)
  const currentRange = widget.dateRange ?? '1M'

  return (
    <div className="h-full rounded-xl border border-border-dim bg-surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-dim shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical size={14} className="text-faint cursor-grab shrink-0 drag-handle" />
          <h3 className="text-xs font-medium text-body truncate">
            {widget.title ?? indicator?.name ?? '위젯'}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Period selector */}
          <div className="flex items-center gap-0.5 mr-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateWidget(widget.id, { dateRange: opt.value })}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded transition-colors',
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
            className="text-faint hover:text-blue-400 transition-colors"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => removeWidget(widget.id)}
            className="text-faint hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 min-h-0">
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
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(1200)
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    return () => observer.disconnect()
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
    '1W': r1W.data,
    '1M': r1M.data,
    '3M': r3M.data,
    '1Y': r1Y.data,
  }

  const isLoading = r1W.isLoading || r1M.isLoading || r3M.isLoading || r1Y.isLoading

  return { dataByRange, isLoading }
}

export function WidgetGrid({ indicators }: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const widgets = useDashboardStore((s) => s.widgets)
  const updateLayouts = useDashboardStore((s) => s.updateLayouts)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)
  const editingWidget = widgets.find((w) => w.id === editingWidgetId)
  const editingIndicator = editingWidget ? indicators.find((i) => i.id === editingWidget.indicatorId) : undefined

  const { dataByRange, isLoading } = useWidgetData(widgets)

  const toLayoutItem = (w: DashboardWidget): LayoutItem => ({
    i: w.id, x: w.position.x, y: w.position.y, w: w.position.w, h: w.position.h,
    minW: 3, minH: 3,
  })

  const layouts = useMemo(() => ({
    lg: widgets.map(toLayoutItem) as unknown as Layout,
    md: widgets.map((w) => ({ ...toLayoutItem(w), x: w.position.x % 6, w: Math.min(w.position.w, 6) })) as unknown as Layout,
    sm: widgets.map((w) => ({ ...toLayoutItem(w), x: 0, w: 6 })) as unknown as Layout,
  }), [widgets])

  const handleLayoutChange = (layout: Layout) => {
    updateLayouts(layout as unknown as Array<{ i: string; x: number; y: number; w: number; h: number }>)
  }

  if (widgets.length === 0) {
    return (
      <div ref={containerRef} className="rounded-xl border border-dashed border-border-dim p-12 text-center">
        <p className="text-faint">위젯을 추가하여 대시보드를 구성하세요</p>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        width={containerWidth}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 768, sm: 0 }}
        cols={{ lg: 12, md: 6, sm: 6 }}
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
          return (
            <div key={widget.id}>
              <WidgetItem
                widget={widget}
                indicator={indicator}
                data={data}
                isLoading={isLoading}
                onEdit={() => setEditingWidgetId(widget.id)}
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
