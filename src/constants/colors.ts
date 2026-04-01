// ── Canonical category colors (simple string mapping) ───────────────
// Used across dashboard, explore, market cards, charts, etc.
export const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#378ADD',
  FOREX: '#E24B4A',
  CRYPTO: '#F59E0B',
  MACRO: '#7F77DD',
  BOND: '#1D9E75',
  COMMODITY: '#EF9F27',
}

// ── Extended badge-style category colors (light/dark mode) ──────────
export const CATEGORY_BADGE_COLORS: Record<
  string,
  { bg: string; text: string; dot: string; darkBg: string; darkText: string }
> = {
  STOCK: { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD', darkBg: 'rgba(55,138,221,0.15)', darkText: '#93C5FD' },
  FOREX: { bg: '#FEE2E2', text: '#991B1B', dot: '#E24B4A', darkBg: 'rgba(226,75,74,0.15)', darkText: '#FCA5A5' },
  CRYPTO: { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27', darkBg: 'rgba(239,159,39,0.15)', darkText: '#FCD34D' },
  MACRO: { bg: '#EEEDFE', text: '#3C3489', dot: '#7F77DD', darkBg: 'rgba(127,119,221,0.15)', darkText: '#C4B5FD' },
  BOND: { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75', darkBg: 'rgba(29,158,117,0.15)', darkText: '#6EE7B7' },
  COMMODITY: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', darkBg: 'rgba(245,158,11,0.15)', darkText: '#FDE68A' },
}

// ── Chart overlay/comparison palette ────────────────────────────────
export const CHART_PALETTE = ['#378ADD', '#E24B4A', '#1D9E75', '#EF9F27', '#7F77DD'] as const

// ── Widget customization colors ─────────────────────────────────────
export const WIDGET_COLORS: string[] = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

export const WIDGET_COLOR_NAMES: Record<string, string> = {
  '#3b82f6': '파랑', '#8b5cf6': '보라', '#f59e0b': '노랑', '#10b981': '초록',
  '#ef4444': '빨강', '#ec4899': '분홍', '#06b6d4': '하늘', '#f97316': '주황',
}

// ── Positive/Negative change colors ─────────────────────────────────
export const POSITIVE_COLOR = '#16A34A'
export const NEGATIVE_COLOR = '#DC2626'

export const chgColor = (v: number) => (v >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR)

// ── Severity/threshold colors (MiniBar, Gauge, etc.) ────────────────
export const SEVERITY_COLORS: Record<string, string> = {
  safe: '#1D9E75',
  warning: '#EF9F27',
  danger: '#E24B4A',
}

// ── Gauge gradient stops ────────────────────────────────────────────
export const GAUGE_GRADIENT_STOPS = [
  { offset: '0%', color: '#DC2626' },
  { offset: '25%', color: '#D97706' },
  { offset: '50%', color: '#9CA3AF' },
  { offset: '75%', color: '#65A30D' },
  { offset: '100%', color: '#16A34A' },
] as const

export function thresholdColor(value: number): string {
  if (value <= 25) return '#DC2626'
  if (value <= 45) return '#D97706'
  if (value <= 55) return '#9CA3AF'
  if (value <= 75) return '#65A30D'
  return '#16A34A'
}

// ── Commodity group colors ──────────────────────────────────────────
export const COMMODITY_GROUP_COLORS: Record<string, string> = {
  Energy: '#EF9F27',
  Metals: '#E24B4A',
  Agriculture: '#1D9E75',
}
