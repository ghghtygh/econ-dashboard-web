/**
 * Web Vitals collection using the browser PerformanceObserver API.
 * No external dependency required — uses the native APIs directly.
 */

import { captureMessage } from './errorReporter'

interface VitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
}

function rate(name: string, value: number): VitalsMetric['rating'] {
  const t = THRESHOLDS[name]
  if (!t) return 'good'
  return value <= t[0] ? 'good' : value <= t[1] ? 'needs-improvement' : 'poor'
}

function report(metric: VitalsMetric) {
  if (import.meta.env.MODE === 'development') {
    console.info(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`)
  }

  captureMessage(`WebVital: ${metric.name}`, {
    severity: metric.rating === 'poor' ? 'warning' : 'info',
    tags: { source: 'web-vitals', metric: metric.name, rating: metric.rating },
    extra: { value: metric.value },
  })
}

export function initWebVitals() {
  if (typeof PerformanceObserver === 'undefined') return

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      if (last) report({ name: 'LCP', value: last.startTime, rating: rate('LCP', last.startTime) })
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* unsupported */ }

  // FID
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { processingStart: number; startTime: number }
        const delay = e.processingStart - e.startTime
        report({ name: 'FID', value: delay, rating: rate('FID', delay) })
      }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch { /* unsupported */ }

  // CLS
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
        if (!e.hadRecentInput) clsValue += e.value
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        report({ name: 'CLS', value: clsValue, rating: rate('CLS', clsValue) })
      }
    })
  } catch { /* unsupported */ }

  // FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          report({ name: 'FCP', value: entry.startTime, rating: rate('FCP', entry.startTime) })
        }
      }
    })
    fcpObserver.observe({ type: 'paint', buffered: true })
  } catch { /* unsupported */ }

  // TTFB
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const ttfb = navEntries[0].responseStart - navEntries[0].requestStart
      report({ name: 'TTFB', value: ttfb, rating: rate('TTFB', ttfb) })
    }
  } catch { /* unsupported */ }
}
