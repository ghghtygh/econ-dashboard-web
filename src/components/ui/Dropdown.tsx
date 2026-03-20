import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function Dropdown({ options, value, onChange, placeholder = '선택', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between gap-2 w-full rounded-lg border border-border-mid bg-elevated px-3 py-2 text-sm transition-colors',
          'hover:border-border-mid focus:outline-none focus:ring-2 focus:ring-blue-500',
          selected ? 'text-body' : 'text-muted',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={cn('text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-mid bg-elevated py-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange?.(option.value)
                setOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                option.value === value
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'text-body hover:bg-hover',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- DropdownMenu (커스텀 트리거) ---

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({ trigger, children, align = 'left', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] rounded-lg border border-border-mid bg-elevated py-1 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  className?: string
}

export function DropdownMenuItem({ children, onClick, danger, className }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2 text-left text-sm transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-900/30'
          : 'text-body hover:bg-hover',
        className,
      )}
    >
      {children}
    </button>
  )
}
