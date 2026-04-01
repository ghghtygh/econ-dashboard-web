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
    <header className="border-b border-border-dim bg-surface/90 backdrop-blur-md sticky top-0 z-50" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="max-w-screen-2xl mx-auto px-3 md:px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BarChart2 className="text-white" size={18} />
          </div>
          <span className="font-bold text-heading text-[15px] tracking-tight">Econ Dashboard</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 ml-2 md:ml-6">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 md:px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all',
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:text-heading hover:bg-elevated',
                )}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          {/* Alert Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2.5 rounded-lg text-muted hover:text-heading hover:bg-elevated transition-all"
              aria-label="알림"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border-dim bg-surface animate-fadeIn z-50" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-dim">
                  <span className="text-sm font-semibold text-heading">알림</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-accent hover:underline transition-colors"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <p className="text-xs text-faint text-center py-8">알림이 없습니다</p>
                  ) : (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'px-4 py-3 border-b border-border-dim last:border-0 text-xs',
                          !n.read && 'bg-accent-soft',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-body leading-relaxed">{n.message}</p>
                            <p className="text-faint text-[10px] mt-1">
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
            className="p-2.5 rounded-lg text-muted hover:text-heading hover:bg-elevated transition-all"
            aria-label="테마 전환"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}
