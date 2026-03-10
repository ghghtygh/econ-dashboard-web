import { LayoutDashboard } from 'lucide-react'
import { IndicatorCard } from '@/components/dashboard/IndicatorCard'
import type { Indicator } from '@/types/indicator'

// 임시 목업 데이터 (API 연동 전)
const mockIndicators: Indicator[] = [
  { id: '1', name: 'KOSPI', symbol: 'KS11', category: 'STOCK', unit: 'pt' },
  { id: '2', name: 'S&P 500', symbol: 'SPX', category: 'STOCK', unit: 'pt' },
  { id: '3', name: 'USD/KRW', symbol: 'USDKRW', category: 'FOREX', unit: '₩' },
  { id: '4', name: 'Bitcoin', symbol: 'BTCUSD', category: 'CRYPTO', unit: '$' },
  { id: '5', name: '기준금리', symbol: 'KR.RATE', category: 'MACRO', unit: '%' },
  { id: '6', name: 'WTI 원유', symbol: 'WTI', category: 'COMMODITY', unit: '$' },
]

export function DashboardPage() {
  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard size={18} className="text-blue-400" />
        <h1 className="text-lg font-semibold text-white">대시보드</h1>
      </div>

      <section>
        <h2 className="text-sm text-slate-500 mb-3 uppercase tracking-wide">주요 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {mockIndicators.map((indicator) => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm text-slate-500 mb-3 uppercase tracking-wide">차트</h2>
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
          <p className="text-slate-600">백엔드 API 연동 후 차트가 표시됩니다</p>
        </div>
      </section>
    </main>
  )
}
