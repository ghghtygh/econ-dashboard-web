import type { IndicatorData } from '@/types/indicator'

export type ExportFormat = 'csv' | 'json'
export type ExportPeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL'

export const EXPORT_PERIOD_LABELS: Record<ExportPeriod, string> = {
  '1M': '1개월',
  '3M': '3개월',
  '6M': '6개월',
  '1Y': '1년',
  ALL: '전체',
}

export function getExportDateRange(period: ExportPeriod): { from: string; to: string } | null {
  if (period === 'ALL') return null
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today)
  switch (period) {
    case '1M': from.setMonth(today.getMonth() - 1); break
    case '3M': from.setMonth(today.getMonth() - 3); break
    case '6M': from.setMonth(today.getMonth() - 6); break
    case '1Y': from.setFullYear(today.getFullYear() - 1); break
  }
  return { from: from.toISOString().slice(0, 10), to }
}

function buildFilename(symbol: string, period: ExportPeriod, format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${symbol}_${period}_${date}.${format}`
}

function toCsv(data: IndicatorData[], unit: string): string {
  const header = 'date,value,unit,open,high,low,close,volume,change'
  const rows = data.map((d) =>
    [d.date, d.value, unit, d.open ?? '', d.high ?? '', d.low ?? '', d.close ?? '', d.volume ?? '', d.change ?? ''].join(','),
  )
  return [header, ...rows].join('\n')
}

function toJson(data: IndicatorData[], symbol: string, unit: string): string {
  return JSON.stringify(
    {
      symbol,
      unit,
      exportedAt: new Date().toISOString(),
      count: data.length,
      data: data.map((d) => ({
        date: d.date,
        value: d.value,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
        change: d.change,
      })),
    },
    null,
    2,
  )
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportIndicatorData(
  data: IndicatorData[],
  symbol: string,
  unit: string,
  period: ExportPeriod,
  format: ExportFormat,
) {
  const filename = buildFilename(symbol, period, format)
  if (format === 'csv') {
    downloadBlob(toCsv(data, unit), filename, 'text/csv;charset=utf-8;')
  } else {
    downloadBlob(toJson(data, symbol, unit), filename, 'application/json;charset=utf-8;')
  }
}
