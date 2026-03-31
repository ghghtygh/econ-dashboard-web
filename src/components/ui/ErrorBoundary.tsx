import { Component, type ReactNode, useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { captureException } from '@/services/errorReporter'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** 에러 발생 시 표시할 위젯/섹션 이름 */
  label?: string
}

interface State {
  hasError: boolean
  error?: Error
}

function DefaultFallback({ error, label, onRetry }: { error?: Error; label?: string; onRetry: () => void }) {
  const [showDetail, setShowDetail] = useState(false)
  const isDev = import.meta.env.DEV

  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-center">
      <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
      <p className="text-red-300 text-sm">
        {label ? `${label}을(를) 표시할 수 없습니다` : '이 위젯을 표시할 수 없습니다'}
      </p>
      <button
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-800 bg-red-950/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/50 transition-colors"
      >
        <RefreshCw size={12} />
        재시도
      </button>
      {isDev && error && (
        <div className="mt-3">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="inline-flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
          >
            {showDetail ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            에러 상세
          </button>
          {showDetail && (
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-red-950/60 p-2 text-left text-[10px] text-red-400/80 leading-relaxed">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      severity: 'fatal',
      tags: { source: 'ErrorBoundary', label: this.props.label ?? 'unknown' },
      extra: { componentStack: info.componentStack ?? undefined },
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <DefaultFallback
          error={this.state.error}
          label={this.props.label}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}
