import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { useHealthStatus } from '@/hooks/useHealthStatus'

export function MockDataBanner() {
  const { data: health } = useHealthStatus()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !health) return null
  if (health.status === 'ok') return null

  const issues: string[] = []
  if (!health.dataSources.database) issues.push('데이터베이스')
  if (!health.dataSources.redis) issues.push('Redis')

  if (issues.length === 0) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/50 px-4 py-2.5">
      <div className="max-w-screen-2xl mx-auto flex items-start gap-3">
        <AlertTriangle
          size={16}
          className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">서비스 상태 이상</span> — 다음 연결에 문제가 있습니다:{' '}
            {issues.join(', ')}
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
