import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/store/dashboardStore'

/**
 * 앱 마운트 시 서버에서 위젯 레이아웃을 한 번 가져옵니다.
 * 서버 데이터가 있으면 localStorage 대신 서버 데이터를 사용합니다 (서버 우선 전략).
 * 서버 실패 시 localStorage 폴백을 유지합니다.
 */
export function useWidgetSync() {
  const fetched = useRef(false)
  const fetchWidgetsFromServer = useDashboardStore((s) => s.fetchWidgetsFromServer)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetchWidgetsFromServer()
  }, [fetchWidgetsFromServer])
}
