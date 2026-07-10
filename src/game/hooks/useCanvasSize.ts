import { useEffect, useState } from 'react'
import { pickCanvasSize, type CanvasSize } from '../utils/canvasSize'

function currentViewportSize(): CanvasSize {
  if (typeof window === 'undefined') {
    return pickCanvasSize(0, 0)
  }
  return pickCanvasSize(window.innerWidth, window.innerHeight)
}

/**
 * The design resolution to render the game at: landscape on wide viewports,
 * portrait on tall/narrow ones (a phone held upright), updated on resize
 * and orientation change.
 */
export function useCanvasSize(): CanvasSize {
  const [size, setSize] = useState(currentViewportSize)

  useEffect(() => {
    const onResize = () => setSize(currentViewportSize())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return size
}
