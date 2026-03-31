import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { X, GripVertical, Settings, LayoutGrid, Download, Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { ChartSkeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { WidgetEditor } from '@/components/dashboard/WidgetEditor'
import { ExportModal } from '@/components/ExportModal'
import { useDashboardStore } from '@/store/dashboardStore'
import { useIndicatorSeries, type DateRange } from '@/hooks/useIndicators'
import { dashboardApi } from '@/services/api'
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

function WidgetItem({ widget, indicator, data, isLoading, isFailed, isEditing, onEdit, onExport }: {
  widget: DashboardWidget
  indicator?: Indicator
  data?: import('@/types/indicator').IndicatorData[]
  isLoading: boolean
  isFailed: boolean
  isEditing: boolean
  onEdit: () => void
  onExport: () => void
}) {
  const removeWidget = useDashboardStore((s) => s.removeWidget)
  const updateWidget = useDashboardStore((s) => s.updateWidget)
  const currentRange = widget.dateRange ?? '1M'

  return (
    <div
      id={`widget-chart-${widget.id}`}
      className={cn(
        "h-full rounded-lg border bg-surface flex flex-col overflow-hidden transition-colors",
        isEditing ? "border-blue-400/50 ring-1 ring-blue-400/20" : "border-border-dim",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-dim shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {isEditing && (
            <GripVertical size={14} className="text-faint cursor-grab shrink-0 drag-handle" />
          )}
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
            onClick={onExport}
            className="text-faint hover:text-green-400 transition-colors"
            title="데이터 내보내기"
          >
            <Download size={14} />
          </button>
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
        ) : isFailed ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400 text-xs">데이터를 불러올 수 없습니다</p>
          </div>
        ) : data && data.length > 0 ? (
          <ErrorBoundary label={widget.title ?? indicator?.name}>
            <ChartRenderer
              type={widget.chartType}
              data={data}
              color={widget.color}
              unit={indicator?.unit}
            />
          </ErrorBoundary>
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
    let rafId: number
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width)
        }
      })
    })
    observer.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    return () => {
      cancelAnimationFrame(rafId)
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

  const failedIds = new Set([
    ...(r1W.data?.failedIds ?? []),
    ...(r1M.data?.failedIds ?? []),
    ...(r3M.data?.failedIds ?? []),
    ...(r1Y.data?.failedIds ?? []),
  ])

  const isLoading = r1W.isLoading || r1M.isLoading || r3M.isLoading || r1Y.isLoading

  return { dataByRange, isLoading, failedIds }
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

export function WidgetGrid({ indicators }: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)
  const widgets = useDashboardStore((s) => s.widgets)
  const updateLayouts = useDashboardStore((s) => s.updateLayouts)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)
  const [exportIndicator, setExportIndicator] = useState<Indicator | null>(null)
  const exportChartRef = useRef<HTMLElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isMobile = useIsMobile()
  const editingWidget = widgets.find((w) => w.id === editingWidgetId)
  const editingIndicator = editingWidget ? indicators.find((i) => i.id === editingWidget.indicatorId) : undefined

  const { dataByRange, isLoading, failedIds } = useWidgetData(widgets)

  const toLayoutItem = (w: DashboardWidget): LayoutItem => ({
    i: w.id, x: w.position.x, y: w.position.y, w: w.position.w, h: w.position.h,
    minW: 3, minH: 3,
  })

  const layouts = useMemo(() => ({
    lg: widgets.map(toLayoutItem) as unknown as Layout,
    md: widgets.map((w) => ({ ...toLayoutItem(w), x: w.position.x % 6, w: Math.min(w.position.w, 6) })) as unknown as Layout,
    sm: widgets.map((w) => ({ ...toLayoutItem(w), x: 0, w: 6 })) as unknown as Layout,
  }), [widgets])

  const handleLayoutChange = useCallback((layout: Layout) => {
    if (!isEditing) return
    updateLayouts(layout as unknown as Array<{ i: string; x: number; y: number; w: number; h: number }>)
  }, [isEditing, updateLayouts])

  const saveLayoutToServer = useCallback(async () => {
    setIsSaving(true)
    try {
      const payload = useDashboardStore.getState().widgets.map((w) => ({
        id: w.id,
        indicatorId: w.indicatorId,
        title: w.title ?? '',
        chartType: w.chartType,
        positionX: w.position.x,
        positionY: w.position.y,
        width: w.position.w,
        height: w.position.h,
        config: JSON.stringify({ color: w.color, dateRange: w.dateRange }),
      }))
      await dashboardApi.saveWidgets(payload)
    } catch {
      // persist middleware already saved to localStorage as fallback
    } finally {
      setIsSaving(false)
    }
  }, [])

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      // Exiting edit mode → save to server
      setIsEditing(false)
      saveLayoutToServer()
    } else {
      setIsEditing(true)
    }
  }, [isEditing, saveLayoutToServer])

  // Disable editing on mobile
  const canEdit = !isMobile

  if (widgets.length === 0) {
    return (
      <div ref={containerRef} className="rounded-xl border border-dashed border-border-dim p-12 text-center">
        <div className="flex justify-center mb-3"><LayoutGrid size={40} className="text-faint" /></div>
        <p className="text-faint">위젯을 추가하여 대시보드를 구성하세요</p>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      {/* Edit mode toggle bar */}
      <div className="flex items-center justify-end gap-2 mb-3">
        {isSaving && (
          <span className="text-xs text-muted animate-pulse">저장 중...</span>
        )}
        {canEdit && (
          <button
            onClick={handleToggleEdit}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isEditing
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-elevated border border-border-dim text-muted hover:text-heading hover:border-border-mid',
            )}
          >
            {isEditing ? (
              <><Check size={13} />편집 완료</>
            ) : (
              <><Pencil size={13} />레이아웃 편집</>
            )}
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
          위젯을 드래그하여 위치를 변경하거나 모서리를 끌어 크기를 조절하세요.
        </div>
      )}

      <ResponsiveGridLayout
        width={containerWidth}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 768, sm: 0 }}
        cols={{ lg: 12, md: 6, sm: 6 }}
        rowHeight={40}
        margin={[12, 12] as const}
        onLayoutChange={handleLayoutChange}
        dragConfig={{ enabled: isEditing, handle: '.drag-handle' }}
        resizeConfig={{ enabled: isEditing, handles: ['se'] }}
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
                isFailed={failedIds.has(widget.indicatorId)}
                isEditing={isEditing}
                onEdit={() => setEditingWidgetId(widget.id)}
                onExport={() => {
                  if (indicator) {
                    setExportIndicator(indicator)
                    exportChartRef.current = document.getElementById(`widget-chart-${widget.id}`)
                  }
                }}
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
      {exportIndicator && (
        <ExportModal
          open={!!exportIndicator}
          onClose={() => { setExportIndicator(null); exportChartRef.current = null }}
          indicatorId={exportIndicator.id}
          indicatorSymbol={exportIndicator.symbol}
          indicatorName={exportIndicator.name}
          indicatorUnit={exportIndicator.unit}
          chartRef={exportChartRef}
        />
      )}
    </div>
  )
}
