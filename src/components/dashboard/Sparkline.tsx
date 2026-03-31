import { memo, useMemo } from 'react'

interface Props {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export const Sparkline = memo(function Sparkline({
  data,
  color = '#6366F1',
  width = 80,
  height = 28,
}: Props) {
  const { pts, uid } = useMemo(() => {
    if (!data || data.length < 2) return { pts: '', uid: '' }
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    return {
      pts: data
        .map(
          (v, i) =>
            `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`,
        )
        .join(' '),
      uid: `sp${color.replace(/[^a-zA-Z0-9]/g, '')}${width}${height}`,
    }
  }, [data, color, width, height])

  if (!pts) return null
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${width},${height} 0,${height}`} fill={`url(#${uid})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
})
