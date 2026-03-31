import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { IndicatorData } from '@/types/indicator'

export type ExportFormat = 'csv' | 'json' | 'pdf'
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
  } else if (format === 'json') {
    downloadBlob(toJson(data, symbol, unit), filename, 'application/json;charset=utf-8;')
  }
}

export async function exportChartToPdf(
  chartElement: HTMLElement,
  data: IndicatorData[],
  name: string,
  symbol: string,
  unit: string,
  period: ExportPeriod,
) {
  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#0f1117',
    scale: 2,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Title
  pdf.setFontSize(16)
  pdf.setTextColor(40, 40, 40)
  pdf.text(`${name} (${symbol})`, 14, 18)

  // Period and date
  pdf.setFontSize(10)
  pdf.setTextColor(120, 120, 120)
  pdf.text(`기간: ${EXPORT_PERIOD_LABELS[period]} | 내보내기: ${new Date().toISOString().slice(0, 10)}`, 14, 26)

  // Chart image
  const imgWidth = pageWidth - 28
  const imgHeight = (canvas.height / canvas.width) * imgWidth
  const chartY = 32
  const maxImgHeight = pageHeight - chartY - 40
  const finalHeight = Math.min(imgHeight, maxImgHeight)
  pdf.addImage(imgData, 'PNG', 14, chartY, imgWidth, finalHeight)

  // Data summary
  const summaryY = chartY + finalHeight + 8
  if (data.length > 0) {
    const latest = data[data.length - 1]
    const first = data[0]
    pdf.setFontSize(9)
    pdf.setTextColor(80, 80, 80)
    pdf.text(`최신값: ${latest.value} ${unit}`, 14, summaryY)
    pdf.text(`기간: ${first.date} ~ ${latest.date} (${data.length}개 데이터포인트)`, 14, summaryY + 5)
    if (latest.change != null) {
      pdf.text(`변동: ${latest.change > 0 ? '+' : ''}${latest.change}%`, 14, summaryY + 10)
    }
  }

  const filename = buildFilename(symbol, period, 'pdf')
  pdf.save(filename)
}
