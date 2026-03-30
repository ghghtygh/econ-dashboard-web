import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 text-slate-300',
        blue: 'bg-blue-900/50 text-blue-300',
        green: 'bg-green-900/50 text-green-300',
        red: 'bg-red-900/50 text-red-300',
        yellow: 'bg-yellow-900/50 text-yellow-300',
        purple: 'bg-purple-900/50 text-purple-300',
        pink: 'bg-pink-900/50 text-pink-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
