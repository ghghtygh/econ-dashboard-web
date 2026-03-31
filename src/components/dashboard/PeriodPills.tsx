import { PERIODS, type PeriodId } from './constants'

interface Props {
  active: string
  onChange: (p: PeriodId) => void
  size?: 'sm' | 'md'
  showReset?: boolean
  onReset?: () => void
}

export function PeriodPills({ active, onChange, size = 'md', showReset, onReset }: Props) {
  const isSm = size === 'sm'
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-[7px] p-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`
            font-mono rounded-[5px] border-none cursor-pointer transition-all duration-150 leading-snug
            ${isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-[3px] text-[11px]'}
            ${active === p.id
              ? 'font-semibold text-indigo-600 bg-white shadow-sm'
              : 'font-medium text-slate-400 bg-transparent'}
          `}
        >
          {p.label}
        </button>
      ))}
      {showReset && (
        <button
          onClick={onReset}
          title="Reset to global"
          className={`
            text-slate-400 bg-transparent border-none cursor-pointer font-inherit leading-none
            border-l border-slate-200 ml-0.5
            ${isSm ? 'px-1.5 py-0.5 text-[9px]' : 'px-[7px] py-[3px] text-[10px]'}
          `}
        >
          ↻
        </button>
      )}
    </div>
  )
}
