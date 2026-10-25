import { Component, type ReactNode } from 'react'

/**
 * Catches a view that fails to load or render (e.g. the lazy chunk of the 2D places could
 * not be fetched) and shows nothing broken instead of a blank page.
 */
export class ViewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('View failed to load:', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
