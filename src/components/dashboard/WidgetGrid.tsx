import { useMemo, useRef, useState, useEffect } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { X, GripVertical } from 'lucide-react'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartSkeleton } from '@/components/ui/Skeleton'
import { useDashboardStore } from '@/store/dashboardStore'
import { useIndicatorSeries } from '@/hooks/useIndicators'
import type { Indicator, DashboardWidget } from '@/types/indicator'

interface WidgetGridProps {
  indicators: Indicator[]
}

function WidgetItem({ widget, indicator, data, isLoading }: {
  widget: DashboardWidget
  indicator?: Indicator
  data?: import('@/types/indicator').IndicatorData[]
  isLoading: boolean
}) {
  const removeWidget = useDashboardStore((s) => s.removeWidget)

  return (
    <div className="h-full rounded-xl border border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical size={14} className="text-slate-600 cursor-grab shrink-0 drag-handle" />
          <h3 className="text-xs font-medium text-slate-300 truncate">
            {widget.title ?? indicator?.name ?? '위젯'}
          </h3>
        </div>
        <button
          onClick={() => removeWidget(widget.id)}
          className="text-slate-600 hover:text-red-400 transition-colors shrink-0 ml-2"
        >
          <X size={14} />
        </button>
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
            <p className="text-slate-600 text-xs">데이터 없음</p>
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

export function WidgetGrid({ indicators }: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const widgets = useDashboardStore((s) => s.widgets)
  const updateLayouts = useDashboardStore((s) => s.updateLayouts)

  const indicatorIds = useMemo(
    () => [...new Set(widgets.map((w) => w.indicatorId))],
    [widgets],
  )

  const { data: allData, isLoading } = useIndicatorSeries(indicatorIds, '1M')

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
      <div ref={containerRef} className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
        <p className="text-slate-600">위젯을 추가하여 대시보드를 구성하세요</p>
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
          const data = allData?.[widget.indicatorId]
          return (
            <div key={widget.id}>
              <WidgetItem
                widget={widget}
                indicator={indicator}
                data={data}
                isLoading={isLoading}
              />
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
