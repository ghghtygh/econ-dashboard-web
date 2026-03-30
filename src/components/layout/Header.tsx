import { BarChart2, Sun, Moon, Search, LayoutDashboard, Newspaper } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/themeStore'

const NAV_ITEMS = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/explore', label: '지표 탐색', icon: Search },
  { path: '/news', label: '뉴스', icon: Newspaper },
]

export function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()

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
