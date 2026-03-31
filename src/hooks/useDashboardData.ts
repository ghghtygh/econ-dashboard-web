import { useMemo } from 'react'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import type { Indicator, IndicatorData } from '@/types/indicator'
import type { DateRange } from '@/hooks/useIndicators'

export interface IndicatorItem {
  indicator: Indicator
  series: IndicatorData[]
  latest?: IndicatorData
  prev?: IndicatorData
  change: number
}

function groupIndicators(
  indicators: Indicator[],
  allData: Record<number, IndicatorData[]>,
): Record<string, IndicatorItem[]> {
  const groups: Record<string, IndicatorItem[]> = {}

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

export function useDashboardData(globalPeriod: DateRange) {
  const { data: indicators } = useIndicators()
  const indicatorIds = indicators?.map((i) => i.id) ?? []
  const { data: allData } = useIndicatorSeries(indicatorIds, globalPeriod)

  const groups = useMemo(
    () => groupIndicators(indicators ?? [], allData?.data ?? {}),
    [indicators, allData],
  )

  return {
    groups,
    stockIndicators: groups['STOCK'] ?? [],
    cryptoIndicators: groups['CRYPTO'] ?? [],
    commodityIndicators: groups['COMMODITY'] ?? [],
    bondIndicators: groups['BOND'] ?? [],
    macroIndicators: groups['MACRO'] ?? [],
    forexIndicators: groups['FOREX'] ?? [],
  }
}
