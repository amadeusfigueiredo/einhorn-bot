import { useEffect, useRef, useState } from 'react'
import { loadImageAssets } from '../utils/loader'
import type { LoaderImageAssets } from '../types'

export default function useAssets() {
  const assetsRef = useRef<LoaderImageAssets | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadImageAssets()
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
