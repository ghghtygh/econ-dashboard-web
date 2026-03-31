import type { IndicatorData } from '@/types/indicator'

/**
 * 피어슨 상관계수를 계산합니다.
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return null

  const x = xs.slice(0, n)
  const y = ys.slice(0, n)

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const den = Math.sqrt(denX * denY)
  if (den === 0) return null
  return num / den
}

/**
 * 시계열 값을 첫 값을 100 기준으로 정규화합니다.
 */
export function normalizeToBase100(values: number[]): number[] {
  if (values.length === 0) return []
  const base = values[0]
  if (base === 0) return values.map(() => 0)
  return values.map((v) => (v / base) * 100)
}

/**
 * 날짜 기준으로 두 시리즈의 공통 날짜를 정렬하여 반환합니다.
 */
export function alignByDate(
  seriesMap: Record<number, IndicatorData[]>,
  ids: number[],
): { dates: string[]; valuesByIndicator: Record<number, number[]> } {
  const dateMaps = ids.map((id) => {
    const map = new Map<string, number>()
    for (const d of seriesMap[id] ?? []) {
      map.set(d.date, d.value)
    }
    return { id, map }
  })

  const allDates = new Set<string>()
  for (const { map } of dateMaps) {
    for (const date of map.keys()) allDates.add(date)
  }
  const sortedDates = Array.from(allDates).sort()

  const commonDates = sortedDates.filter((date) =>
    dateMaps.every(({ map }) => map.has(date)),
  )

  const valuesByIndicator: Record<number, number[]> = {}
  for (const { id, map } of dateMaps) {
    valuesByIndicator[id] = commonDates.map((date) => map.get(date)!)
  }

  return { dates: commonDates, valuesByIndicator }
}
