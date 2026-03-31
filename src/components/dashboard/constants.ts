export const PERIODS = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '1Y', label: '1Y' },
] as const

export type PeriodId = (typeof PERIODS)[number]['id']

export const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#4F46E5',
  FOREX: '#2563EB',
  CRYPTO: '#EA580C',
  MACRO: '#7C3AED',
  BOND: '#0D9488',
  COMMODITY: '#CA8A04',
}

export const CATEGORY_ICONS: Record<string, string> = {
  STOCK: '◩',
  FOREX: '$',
  CRYPTO: '₿',
  MACRO: '◫',
  BOND: '◧',
  COMMODITY: '◆',
}

export const fmtNum = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const chgColor = (v: number) => (v >= 0 ? '#16A34A' : '#DC2626')

export const chgText = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
