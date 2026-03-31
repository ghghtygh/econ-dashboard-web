import { useState } from 'react'
import { BarChart3, LineChartIcon, AreaChartIcon, Hash, CandlestickChart } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/store/dashboardStore'
import type { Indicator, ChartType } from '@/types/indicator'

interface AddWidgetModalProps {
  open: boolean
  onClose: () => void
  indicators: Indicator[]
}

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: typeof LineChartIcon }[] = [
  { value: 'line', label: 'Line', icon: LineChartIcon },
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'area', label: 'Area', icon: AreaChartIcon },
  { value: 'candlestick', label: 'Candle', icon: CandlestickChart },
  { value: 'number', label: 'Number', icon: Hash },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316']
const COLOR_NAMES: Record<string, string> = {
  '#3b82f6': '파랑', '#8b5cf6': '보라', '#f59e0b': '노랑', '#10b981': '초록',
  '#ef4444': '빨강', '#ec4899': '분홍', '#06b6d4': '하늘', '#f97316': '주황',
}

export function AddWidgetModal({ open, onClose, indicators }: AddWidgetModalProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<string>('')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [color, setColor] = useState(COLORS[0])
  const addWidget = useDashboardStore((s) => s.addWidget)
  const widgets = useDashboardStore((s) => s.widgets)

  const handleAdd = () => {
    const indicator = indicators.find((i) => String(i.id) === selectedIndicator)
    if (!indicator) return

    const maxY = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 0)
    const w = chartType === 'number' ? 3 : 6
    const h = chartType === 'number' ? 4 : 6

    addWidget({
      id: `widget-${Date.now()}`,
      indicatorId: indicator.id,
      chartType,
      position: { x: 0, y: maxY, w, h },
      title: indicator.name,
      color,
      dateRange: '1M',
    })

    setSelectedIndicator('')
    setChartType('line')
    setColor(COLORS[0])
    onClose()
  }

  const indicatorOptions = indicators.map((i) => ({ value: String(i.id), label: `${i.name} (${i.symbol})` }))

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>위젯 추가</ModalHeader>
      <ModalBody className="space-y-4">
        <div>
          <label htmlFor="indicator-select" className="block text-xs text-muted mb-1.5">지표 선택</label>
          <Dropdown id="indicator-select" aria-label="지표 선택" options={indicatorOptions} value={selectedIndicator} onChange={setSelectedIndicator} placeholder="지표를 선택하세요" />
        </div>

        <div>
          <span id="chart-type-label" className="block text-xs text-muted mb-1.5">차트 타입</span>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="chart-type-label">
            {CHART_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setChartType(opt.value)}
                  role="radio"
                  aria-checked={chartType === opt.value}
                  aria-label={`차트 타입: ${opt.label}`}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors',
                    chartType === opt.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-border-mid bg-elevated text-muted hover:border-border-mid',
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span id="color-label" className="block text-xs text-muted mb-1.5">색상</span>
          <div className="flex gap-2" role="radiogroup" aria-labelledby="color-label">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                role="radio"
                aria-checked={color === c}
                aria-label={`색상: ${COLOR_NAMES[c] ?? c}`}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-transform',
                  color === c ? 'border-white scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
        <Button size="sm" onClick={handleAdd} disabled={!selectedIndicator}>추가</Button>
      </ModalFooter>
    </Modal>
  )
}
