import type { Indicator, IndicatorData } from '@/types/indicator'
export { CATEGORY_COLORS, chgColor } from '@/constants/colors'
export { CATEGORY_ICONS } from '@/constants/categories'

// ── Time Periods ─────────────────────────────────────────────────────
export const PERIODS = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '1Y', label: '1Y' },
] as const

export type PeriodId = (typeof PERIODS)[number]['id']

// ── Helpers ──────────────────────────────────────────────────────────
export const fmtNum = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const chgText = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

// ── Types ────────────────────────────────────────────────────────────
export type IndicatorGroupItem = {
  indicator: Indicator
  series: IndicatorData[]
  latest?: IndicatorData
  prev?: IndicatorData
  change: number
}
export type IndicatorGroup = Record<string, IndicatorGroupItem[]>

// ── Build indicator groups from API data ─────────────────────────────
export function groupIndicators(
  indicators: Indicator[],
  allData: Record<number, IndicatorData[]>,
): IndicatorGroup {
  const groups: IndicatorGroup = {}
  for (const ind of indicators) {
    const series = allData[ind.id] ?? []
    const latest = series.length > 0 ? series[series.length - 1] : undefined
    const prev = series.length > 1 ? series[series.length - 2] : undefined
    const change =
      latest && prev && prev.value !== 0
        ? ((latest.value - prev.value) / prev.value) * 100
        : (latest?.change ?? 0)
    if (!groups[ind.category]) groups[ind.category] = []
    groups[ind.category].push({ indicator: ind, series, latest, prev, change })
  }
  return groups
}
