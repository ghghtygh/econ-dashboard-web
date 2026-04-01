import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { installGlobalHandlers } from './services/errorReporter'
import { initWebVitals } from './services/webVitals'

// Install global error handlers before rendering
installGlobalHandlers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Collect Web Vitals after initial render
initWebVitals()
