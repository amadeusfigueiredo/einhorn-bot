import { useCallback, useEffect, useRef, useState } from 'react'
import { typewriterDuration, typewriterSlice } from '../utils/typewriter'
import { playSfx } from '../audio/sfx'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'

const MS_PER_CHAR = 30

/**
 * Types `text` out character by character. `finish()` shows the rest at once
 * (any key or tap skips ahead). With reduced motion the text is simply there.
 */
export function useTypewriter(text: string) {
  const instant = prefersReducedMotion()
  const [elapsed, setElapsed] = useState(0)
  const lastTickRef = useRef(0)

  const total = typewriterDuration(text, MS_PER_CHAR)
  const done = instant || elapsed >= total

  useEffect(() => {
    if (instant) return
    setElapsed(0)
    lastTickRef.current = 0
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const e = now - start
      setElapsed(e)
      if (e < total) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [text, total, instant])

  const shown = done ? text : typewriterSlice(text, elapsed, MS_PER_CHAR)

  // A soft tick every few letters, never on spaces.
  useEffect(() => {
    const count = Array.from(shown).length
    if (!done && count - lastTickRef.current >= 3 && !shown.endsWith(' ')) {
      lastTickRef.current = count
      playSfx('tick')
    }
  }, [shown, done])

  const finish = useCallback(() => setElapsed(Number.POSITIVE_INFINITY), [])

  return { shown, done, finish }
}
