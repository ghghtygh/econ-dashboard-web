import { formatPrice } from './chartFormatters'

export function ChartTooltip({ active, payload, label, unit, color }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
  color?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border-mid bg-elevated px-3 py-2 shadow-lg">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>
        {formatPrice(payload[0].value)}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}
