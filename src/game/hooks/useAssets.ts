import { useEffect, useRef, useState } from 'react'
import { loadAssets, type Assets } from '../utils/loader'

export default function useAssets() {
  const assetsRef = useRef<Assets | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadAssets()
      .then((a) => {
        if (cancelled) return
        assetsRef.current = a
        setLoaded(true)
      })
      .catch((err) => {
        console.warn('useAssets: load failed', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { assetsRef, loaded }
}
