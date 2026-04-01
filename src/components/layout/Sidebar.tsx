import { useState } from 'react'
import { BarChart2, LayoutDashboard, Search, Newspaper, Sun, Moon, Menu, X, TrendingUp, DollarSign, Bitcoin, Package, Calendar, Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { useAlertStore } from '@/store/alertStore'

const NAV_ITEMS = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/indices', label: '지수', icon: TrendingUp },
  { path: '/stocks', label: '주식', icon: DollarSign },
  { path: '/crypto', label: '암호화폐', icon: Bitcoin },
  { path: '/commodities', label: '원자재', icon: Package },
  { path: '/news', label: '뉴스', icon: Newspaper },
  { path: '/explore', label: '지표 탐색', icon: Search },
  { path: '/calendar', label: '캘린더', icon: Calendar },
  { path: '/alerts', label: '알림', icon: Bell },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()
  const unreadCount = useAlertStore((s) => s.unreadCount())

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-border-dim px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <BarChart2 className="text-white" size={18} />
        </div>
        <span className="text-base font-semibold text-heading tracking-tight">Econ Dashboard</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-muted hover:text-heading lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-6 space-y-1.5">
        <p className="px-3 mb-3 text-[11px] font-medium text-faint uppercase tracking-wider">메뉴</p>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-muted hover:bg-elevated hover:text-heading',
              )}
            >
              <Icon size={20} />
              {label}
              {path === '/' && unreadCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-400">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-dim px-5 py-5 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium text-muted hover:bg-elevated hover:text-heading transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? '라이트 모드' : '다크 모드'}
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border-dim bg-surface px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-muted hover:bg-elevated hover:text-heading transition-colors"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <BarChart2 className="text-white" size={14} />
          </div>
          <span className="text-base font-semibold text-heading">Econ Dashboard</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-overlay" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-surface animate-slideIn">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col border-r border-border-dim bg-surface">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
