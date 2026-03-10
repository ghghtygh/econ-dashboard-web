import { BarChart2 } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-3">
        <BarChart2 className="text-blue-400" size={22} />
        <span className="font-semibold text-white text-lg">Econ Dashboard</span>
        <span className="text-slate-500 text-sm ml-auto">경제 지표 대시보드</span>
      </div>
    </header>
  )
}
