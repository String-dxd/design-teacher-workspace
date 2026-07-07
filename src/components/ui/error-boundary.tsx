import React from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

type FallbackRender = (retry: () => void) => React.ReactNode

interface ErrorBoundaryProps {
  children: React.ReactNode
  /**
   * Custom fallback UI. Pass a node, or a render function that receives the
   * `retry` handler so your fallback's own button can re-attempt the render
   * (e.g. reloading a Module Federation remote that failed to load).
   */
  fallback?: React.ReactNode | FallbackRender
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.handleReset)
          : this.props.fallback
      }

      return <ModuleLoadError onRetry={this.handleReset} />
    }

    return this.props.children
  }
}

interface ModuleLoadErrorProps {
  onRetry: () => void
}

/**
 * Fallback for a section that failed to load — most commonly a Module
 * Federation remote that couldn't be fetched at runtime. Unlike a 404, the
 * address is valid and the app shell is intact, so recovery leads with a retry
 * (these failures are usually transient) and offers navigation as the escape
 * hatch. Fills its container; the surrounding chrome stays in place.
 */
export function ModuleLoadError({ onRetry }: ModuleLoadErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <img
          src="/404-illustration.png"
          alt="A person surrounded by scattered papers and screens, looking lost"
          className="h-auto w-64 object-contain"
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            This section didn’t load
          </h2>
          <p className="text-muted-foreground">
            This is usually temporary. Try again, or come back in a few minutes
            if it keeps happening.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onRetry}>Try again</Button>
          <Button variant="outline" render={<Link to="/" />}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  )
}
