import { useState, useRef, useEffect } from 'react'
import { BarChart2, Sun, Moon, Search, LayoutDashboard, Newspaper, Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'
import { useAlertStore } from '@/store/alertStore'

const NAV_ITEMS = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/explore', label: '지표 탐색', icon: Search },
  { path: '/news', label: '뉴스', icon: Newspaper },
]

export function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()
  const notifications = useAlertStore((s) => s.notifications)
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead)
  const unreadCount = useAlertStore((s) => s.unreadCount())
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bellOpen) return
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen])

  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="border-b border-border-dim bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <BarChart2 className="text-blue-400" size={20} />
          <span className="font-semibold text-heading text-[15px]">Econ Dashboard</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 ml-4">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  active
                    ? 'bg-elevated text-heading'
                    : 'text-muted hover:text-heading hover:bg-elevated/50',
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {/* Alert Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2 rounded-lg text-muted hover:text-heading hover:bg-elevated transition-colors"
              aria-label="알림"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-border-mid bg-surface shadow-xl animate-fadeIn z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-dim">
                  <span className="text-xs font-medium text-heading">알림</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <p className="text-xs text-faint text-center py-6">알림이 없습니다</p>
                  ) : (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'px-4 py-2.5 border-b border-border-dim last:border-0 text-xs',
                          !n.read && 'bg-blue-500/5',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-body leading-relaxed">{n.message}</p>
                            <p className="text-faint text-[10px] mt-0.5">
                              {n.indicatorName} · {new Date(n.triggeredAt).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted hover:text-heading hover:bg-elevated transition-colors"
            aria-label="테마 전환"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
