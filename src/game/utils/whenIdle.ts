/**
 * Runs `work` when the browser has nothing to do (or after a second and a half where there is no such call).
 * Returns how to cancel it.
 */
export function whenIdle(work: () => void, fallbackMs = 1500): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(work, { timeout: 4000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(work, fallbackMs)
  return () => window.clearTimeout(id)
}

/** The visitor asked their browser to save data (a slow or paid connection): nothing should be fetched that is not needed yet. */
export function savesData(): boolean {
  return (navigator as { connection?: { saveData?: boolean } }).connection?.saveData === true
}
