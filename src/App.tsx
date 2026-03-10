import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { DashboardPage } from '@/pages/DashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#0f1117]">
        <Header />
        <DashboardPage />
      </div>
    </QueryClientProvider>
  )
}

export default App
