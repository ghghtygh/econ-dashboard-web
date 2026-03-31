/**
 * Centralized error reporting service.
 *
 * In production, replace the transport with Sentry SDK or a custom
 * `/api/errors` endpoint. The rest of the codebase calls these
 * functions and stays transport-agnostic.
 */

type Severity = 'info' | 'warning' | 'error' | 'fatal'

interface ErrorReport {
  message: string
  stack?: string
  severity: Severity
  tags: Record<string, string>
  extra?: Record<string, unknown>
  timestamp: string
  url: string
  userAgent: string
}

const ENV = import.meta.env.MODE ?? 'development'

function buildReport(
  error: unknown,
  severity: Severity,
  tags: Record<string, string> = {},
  extra?: Record<string, unknown>,
): ErrorReport {
  const err = error instanceof Error ? error : new Error(String(error))
  return {
    message: err.message,
    stack: err.stack,
    severity,
    tags: { env: ENV, ...tags },
    extra,
    timestamp: new Date().toISOString(),
    url: globalThis.location?.href ?? '',
    userAgent: globalThis.navigator?.userAgent ?? '',
  }
}

/** Send to monitoring backend. Currently logs; swap with fetch/Sentry later. */
function transport(report: ErrorReport) {
  if (ENV === 'development' || ENV === 'test') {
    console.error('[ErrorReporter]', report.severity.toUpperCase(), report.message, report)
    return
  }

  // Production/QA: POST to backend error collection endpoint.
  // Fire-and-forget; never let reporting itself throw.
  fetch('/api/monitoring/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  }).catch(() => {
    // Swallow — reporting must not cause secondary failures.
  })
}

/** Report a caught error (ErrorBoundary, try/catch, etc.) */
export function captureException(
  error: unknown,
  opts: { severity?: Severity; tags?: Record<string, string>; extra?: Record<string, unknown> } = {},
) {
  transport(buildReport(error, opts.severity ?? 'error', opts.tags, opts.extra))
}

/** Report a breadcrumb/warning that is not an exception. */
export function captureMessage(
  message: string,
  opts: { severity?: Severity; tags?: Record<string, string>; extra?: Record<string, unknown> } = {},
) {
  transport(buildReport(new Error(message), opts.severity ?? 'info', opts.tags, opts.extra))
}

/** Install global handlers: window.onerror + unhandledrejection */
export function installGlobalHandlers() {
  window.addEventListener('error', (event) => {
    captureException(event.error ?? event.message, {
      severity: 'fatal',
      tags: { source: 'window.onerror' },
      extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason ?? 'Unhandled promise rejection', {
      severity: 'error',
      tags: { source: 'unhandledrejection' },
    })
  })
}
