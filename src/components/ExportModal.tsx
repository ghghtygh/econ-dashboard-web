import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileText, FileJson, FileImage } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { indicatorApi } from '@/services/api'
import { useToast } from '@/components/ui/useToast'
import { exportIndicatorData, exportChartToPdf, EXPORT_PERIOD_LABELS, getExportDateRange } from '@/lib/export'
import type { ExportFormat, ExportPeriod } from '@/lib/export'
import type { ApiResponse, IndicatorData, PagedResponse } from '@/types/indicator'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  indicatorId: number
  indicatorSymbol: string
  indicatorName: string
  indicatorUnit: string
  chartRef?: React.RefObject<HTMLElement | null>
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: typeof FileText }[] = [
  { value: 'csv', label: 'CSV', icon: FileText },
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'pdf', label: 'PDF', icon: FileImage },
]

const PERIODS: ExportPeriod[] = ['1M', '3M', '6M', '1Y', 'ALL']

export function ExportModal({ open, onClose, indicatorId, indicatorSymbol, indicatorName, indicatorUnit, chartRef }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [period, setPeriod] = useState<ExportPeriod>('1M')
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleExport = async () => {
    setExporting(true)
    try {
      const range = getExportDateRange(period)
      const res = await indicatorApi.getData(
        String(indicatorId),
        range?.from,
        range?.to,
      )
      const paged = (res.data as ApiResponse<PagedResponse<IndicatorData>>).data

      if (format === 'pdf') {
        if (!chartRef?.current) {
          toast(t('export.chartNotFound'), 'error')
          return
        }
        await exportChartToPdf(chartRef.current, paged.content, indicatorName, indicatorSymbol, indicatorUnit, period)
      } else {
        exportIndicatorData(paged.content, indicatorSymbol, indicatorUnit, period, format)
      }
      toast(t('export.success'), 'success')
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      toast(t('export.error'), 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <Download size={16} />
          {t('export.title')}
        </div>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <div className="rounded-lg border border-border-dim bg-elevated px-4 py-3">
          <p className="text-xs text-muted">{t('export.indicator')}</p>
          <p className="text-sm font-medium text-heading">{indicatorName} <span className="text-xs text-faint font-mono">({indicatorSymbol})</span></p>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">{t('export.fileFormat')}</label>
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-colors',
                    format === opt.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-border-mid bg-elevated text-muted hover:border-border-mid',
                  )}
                >
                  <Icon size={16} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5">{t('export.period')}</label>
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'flex-1 text-xs px-3 py-2 rounded-lg border transition-colors',
                  period === p
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-border-mid bg-elevated text-muted hover:border-border-mid',
                )}
              >
                {EXPORT_PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-faint">
          파일명: {indicatorSymbol}_{period}_{new Date().toISOString().slice(0, 10).replace(/-/g, '')}.{format}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>{t('export.cancel')}</Button>
        <Button size="sm" onClick={handleExport} disabled={exporting}>
          <Download size={14} className="mr-1.5" />
          {exporting ? t('export.exporting') : t('export.exportBtn')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
