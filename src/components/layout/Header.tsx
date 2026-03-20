import { BarChart2, Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export function Header() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className="border-b border-border-dim bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-3">
        <BarChart2 className="text-blue-400" size={22} />
        <span className="font-semibold text-heading text-lg">Econ Dashboard</span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted hover:text-heading hover:bg-elevated transition-colors"
            aria-label="테마 전환"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-muted text-sm">경제 지표 대시보드</span>
        </div>
      </div>
    </header>
  )
}
