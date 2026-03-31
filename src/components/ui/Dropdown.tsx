import { useState, useRef, useEffect, useId, useCallback, type ReactNode } from 'react'
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
  id?: string
  'aria-label'?: string
}

export function Dropdown({ options, value, onChange, placeholder = '선택', className, id: externalId, 'aria-label': ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const autoId = useId()
  const buttonId = externalId ?? autoId
  const listboxId = `${buttonId}-listbox`

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

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value)
      setHighlightIdx(idx >= 0 ? idx : 0)
    }
  }, [open, options, value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); return }
        setHighlightIdx((prev) => Math.min(prev + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) { setOpen(true); return }
        setHighlightIdx((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!open) { setOpen(true); return }
        if (highlightIdx >= 0 && highlightIdx < options.length) {
          onChange?.(options[highlightIdx].value)
          setOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Home':
        if (open) { e.preventDefault(); setHighlightIdx(0) }
        break
      case 'End':
        if (open) { e.preventDefault(); setHighlightIdx(options.length - 1) }
        break
    }
  }, [open, highlightIdx, options, onChange])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        id={buttonId}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && highlightIdx >= 0 ? `${listboxId}-option-${highlightIdx}` : undefined}
        aria-label={ariaLabel}
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
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          className="absolute z-50 mt-1 w-full rounded-lg border border-border-mid bg-elevated py-1 shadow-xl"
        >
          {options.map((option, idx) => (
            <button
              key={option.value}
              id={`${listboxId}-option-${idx}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange?.(option.value)
                setOpen(false)
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                option.value === value
                  ? 'bg-blue-600/20 text-blue-300'
                  : idx === highlightIdx
                    ? 'bg-hover text-body'
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
