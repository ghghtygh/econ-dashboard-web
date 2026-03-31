import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { NewsPage } from '@/pages/NewsPage'
import { useThemeStore } from '@/store/themeStore'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { ApiErrorListener } from '@/components/ui/ApiErrorListener'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ApiErrorListener />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route
                path="/explore"
                element={
                  <ErrorBoundary>
                    <ExplorePage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/news"
                element={
                  <ErrorBoundary>
                    <NewsPage />
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
