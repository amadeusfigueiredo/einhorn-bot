// lightweight keyboard hook returning a ref-like object
import { useEffect, useRef } from 'react'
import type { Keys } from '../types'

export default function useKeys() {
  const keysRef = useRef<Keys>({})
  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      (keysRef.current[e.key.toLowerCase()] = true)
    const up = (e: KeyboardEvent) =>
      (keysRef.current[e.key.toLowerCase()] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
  return keysRef
}
