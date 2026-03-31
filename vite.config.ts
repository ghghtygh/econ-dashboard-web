import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const isQa = mode === 'qa'

  return {
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: [
          'src/components/ui/ErrorBoundary.tsx',
          'src/components/ui/Modal.tsx',
          'src/components/ui/Dropdown.tsx',
          'src/components/ui/Tabs.tsx',
          'src/components/layout/Header.tsx',
          'src/components/layout/Sidebar.tsx',
          'src/components/dashboard/AlertPanel.tsx',
          'src/components/dashboard/EconomicCalendar.tsx',
          'src/components/dashboard/AddWidgetModal.tsx',
          'src/components/dashboard/WidgetGrid.tsx',
        ],
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        filename: 'dist/bundle-stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: isProd ? false : isQa ? 'hidden' : true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            // Order matters: more specific matches first
            if (id.includes('/recharts/') || id.includes('/d3-'))
              return 'vendor-charts'
            if (id.includes('/react-grid-layout/'))
              return 'vendor-grid'
            if (id.includes('@tanstack/react-query'))
              return 'vendor-query'
            if (id.includes('@tanstack/react-virtual'))
              return 'vendor-virtual'
            if (id.includes('/lucide-react/'))
              return 'vendor-icons'
            if (id.includes('/react-dom/') || id.includes('/react-router-dom/') || id.includes('/node_modules/react/') || id.includes('/scheduler/'))
              return 'vendor-react'
            if (id.includes('date-fns') || id.includes('axios') || id.includes('zustand'))
              return 'vendor-utils'
          },
        },
      },
    },
  }
})
