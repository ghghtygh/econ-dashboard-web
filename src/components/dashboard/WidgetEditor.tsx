import { useState, useEffect } from 'react'
import { BarChart3, LineChartIcon, AreaChartIcon, Hash, CandlestickChart } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/store/dashboardStore'
import { useIndicatorData } from '@/hooks/useIndicators'
import type { DashboardWidget, ChartType, Indicator } from '@/types/indicator'
import type { DateRange } from '@/hooks/useIndicators'

interface WidgetEditorProps {
  widget: DashboardWidget
  indicator?: Indicator
  open: boolean
  onClose: () => void
}

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: typeof LineChartIcon }[] = [
  { value: 'line', label: 'Line', icon: LineChartIcon },
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'area', label: 'Area', icon: AreaChartIcon },
  { value: 'candlestick', label: 'Candle', icon: CandlestickChart },
  { value: 'number', label: 'Number', icon: Hash },
]

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1D', label: '1일' },
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '1Y', label: '1년' },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

export function WidgetEditor({ widget, indicator, open, onClose }: WidgetEditorProps) {
  const [title, setTitle] = useState(widget.title ?? '')
  const [chartType, setChartType] = useState<ChartType>(widget.chartType)
  const [dateRange, setDateRange] = useState<DateRange>(widget.dateRange ?? '1M')
  const [color, setColor] = useState(widget.color ?? COLORS[0])
  const updateWidget = useDashboardStore((s) => s.updateWidget)

  const { data: previewData } = useIndicatorData(widget.indicatorId)

  useEffect(() => {
    setTitle(widget.title ?? '')
    setChartType(widget.chartType)
    setDateRange(widget.dateRange ?? '1M')
    setColor(widget.color ?? COLORS[0])
  }, [widget])

  const handleSave = () => {
    updateWidget(widget.id, { title: title || undefined, chartType, dateRange, color })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <ModalHeader onClose={onClose}>위젯 설정</ModalHeader>
      <ModalBody className="space-y-5">
        {/* 제목 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">위젯 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={indicator?.name ?? '위젯 제목'}
            className="w-full rounded-lg border border-border-mid bg-elevated px-3 py-2 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 차트 타입 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">차트 타입</label>
          <div className="grid grid-cols-5 gap-2">
            {CHART_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setChartType(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors',
                    chartType === opt.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-border-mid bg-elevated text-muted hover:border-border-mid',
                  )}
                >
                  <Icon size={18} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 기간 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">데이터 기간</label>
          <div className="flex gap-1">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  dateRange === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-elevated text-muted hover:text-heading',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 색상 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">차트 색상</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-transform',
                  color === c ? 'border-white scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* 미리보기 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">미리보기</label>
          <div className="rounded-xl border border-border-dim bg-page p-4 h-[180px]">
            {previewData && previewData.length > 0 ? (
              <ChartRenderer
                type={chartType}
                data={previewData}
                color={color}
                unit={indicator?.unit}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-faint text-xs">미리보기 데이터 로딩 중...</p>
              </div>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
        <Button size="sm" onClick={handleSave}>저장</Button>
      </ModalFooter>
    </Modal>
  )
}
