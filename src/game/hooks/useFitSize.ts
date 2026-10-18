import { useLayoutEffect, useRef, useState } from 'react'
import { fitToBox, type Size } from '../utils/fitSize'

/**
 * Measures the free space of the element behind `areaRef` and returns the
 * largest size, in CSS pixels, at which the canvas fits it completely. Updates
 * on resize, rotation and when the mobile browser bars show or hide.
 */
export function useFitSize(canvas: Size) {
  const areaRef = useRef<HTMLDivElement | null>(null)
  const [box, setBox] = useState<Size>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const measure = () => {
      const { clientWidth, clientHeight } = el
      setBox((prev) =>
        prev.width === clientWidth && prev.height === clientHeight
          ? prev
          : { width: clientWidth, height: clientHeight }
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { areaRef, fit: fitToBox(canvas, box) }
}
