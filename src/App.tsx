import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/DashboardPage'
import { useThemeStore } from '@/store/themeStore'
import { useWidgetSync } from '@/hooks/useWidgetSync'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { ApiErrorListener } from '@/components/ui/ApiErrorListener'
import { MockDataBanner } from '@/components/ui/MockDataBanner'
import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton'

const ExplorePage = lazy(() => import('@/pages/ExplorePage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function App() {
  const theme = useThemeStore((s) => s.theme)
  useWidgetSync()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ApiErrorListener />
        <MockDataBanner />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route
                path="/explore"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSkeleton variant="explore" />}>
                      <ExplorePage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/news"
                element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSkeleton variant="news" />}>
                      <NewsPage />
                    </Suspense>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/*"
                element={
                  <ErrorBoundary>
                    <DashboardPage />
                  </ErrorBoundary>
                }
              />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
