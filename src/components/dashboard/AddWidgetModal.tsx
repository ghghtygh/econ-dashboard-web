import { useState } from 'react'
import { BarChart3, LineChartIcon, AreaChartIcon, Hash } from 'lucide-react'
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
  { value: 'number', label: 'Number', icon: Hash },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

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
          <label className="block text-xs text-slate-400 mb-1.5">지표 선택</label>
          <Dropdown options={indicatorOptions} value={selectedIndicator} onChange={setSelectedIndicator} placeholder="지표를 선택하세요" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">차트 타입</label>
          <div className="grid grid-cols-4 gap-2">
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
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600',
                  )}
                >
                  <Icon size={18} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">색상</label>
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
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
        <Button size="sm" onClick={handleAdd} disabled={!selectedIndicator}>추가</Button>
      </ModalFooter>
    </Modal>
  )
}
