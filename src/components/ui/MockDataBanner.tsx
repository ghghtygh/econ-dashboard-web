import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { useHealthStatus } from '@/hooks/useHealthStatus'

export function MockDataBanner() {
  const { data: health } = useHealthStatus()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !health) return null

  const missing: string[] = []
  if (!health.dataSources.fred) missing.push('FRED (VIX, CPI, 국채금리, 기준금리, 실업률)')
  if (!health.dataSources.alphaVantage) missing.push('Alpha Vantage (S&P 500, USD/KRW)')

  if (missing.length === 0) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/50 px-4 py-2.5">
      <div className="max-w-screen-2xl mx-auto flex items-start gap-3">
        <AlertTriangle
          size={16}
          className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">모의 데이터 사용 중</span> — 다음 데이터소스의 API 키가 설정되지 않아 샘플 데이터로 표시됩니다:{' '}
            {missing.join(', ')}. 실시간 데이터를 보려면{' '}
            <code className="bg-amber-100 dark:bg-amber-800/40 px-1 py-0.5 rounded text-[11px]">
              FRED_API_KEY
            </code>{' '}
            및{' '}
            <code className="bg-amber-100 dark:bg-amber-800/40 px-1 py-0.5 rounded text-[11px]">
              ALPHA_VANTAGE_API_KEY
            </code>{' '}
            를 설정하세요.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors shrink-0"
          aria-label="닫기"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
