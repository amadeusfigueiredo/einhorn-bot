import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import type { LoaderAudioAssets, StageConfig } from '../types'

export default function useAudioManager(opts: {
  audioRef: RefObject<LoaderAudioAssets | null>
  stage: StageConfig
  assetsLoaded: boolean
}) {
  const { audioRef, stage, assetsLoaded } = opts

  const audioUnlockedRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const [showEnableAudio, setShowEnableAudio] = useState(false)

  // stable function to try to play audio
  const tryPlayAudio = useCallback(async (audio?: HTMLAudioElement | null) => {
    if (!audio) return false
    try {
      audio.loop = true
      // set a sane default volume (don't override if intentionally set elsewhere)
      if (
        typeof audio.volume === 'number' &&
        (audio.volume === 1 || audio.volume === 0)
      ) {
        console.log(audio.volume)
        // do nothing if 0 or explicitly 1; otherwise set 0.6 as default
      } else {
        audio.volume = audio.volume ?? 0.6
      }
      await audio.play()
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }, [])

  /**
   * Resolve an Audio element for the current stage from the provided audio assets.
   * Tries multiple candidate keys and falls back to the first audio present.
   */
  const getAudioForStage = useCallback(
    (a?: LoaderAudioAssets | null): HTMLAudioElement | undefined => {
      if (!a) return undefined

      // Make a plain map of the audio-like entries
      const audioCollections: Record<string, HTMLAudioElement | string> = {
        ...a,
      }

      // Build candidates from stage data
      const candidates: string[] = []
      if (stage?.name) candidates.push(String(stage.name)) // "stage1"
      if (stage?.background) candidates.push(String(stage.background)) // "stage1Background"
      if (
        stage?.background &&
        String(stage.background).endsWith('Background')
      ) {
        candidates.push(String(stage.background).replace(/Background$/, '')) // "stage1Background" -> "stage1"
      }

      // Also try lowercased variants (robustness)
      const altCandidates = candidates.flatMap((c) => [
        c,
        c.toLowerCase(),
        c.replace(/[-_]/g, ''),
      ])

      for (const key of altCandidates) {
        const found = audioCollections[key as keyof typeof audioCollections]
        if (found instanceof HTMLAudioElement) return found
        if (typeof found === 'string') {
          try {
            const au = new Audio(found)
            au.loop = true
            au.preload = 'auto'
            au.volume = 0.6
            return au
          } catch {
            // ignore
          }
        }
      }

      for (const k of Object.keys(audioCollections)) {
        const v = audioCollections[k]
        if (v instanceof HTMLAudioElement) return v
        if (typeof v === 'string') {
          try {
            const au = new Audio(v)
            au.loop = true
            au.preload = 'auto'
            au.volume = 0.6
            return au
          } catch {
            console.error('fallback audio not loaded')
          }
        }
      }

      return undefined
    },
    [stage]
  )

  const enableAudioNow = useCallback(() => {
    audioUnlockedRef.current = true
    setShowEnableAudio(false)

    const a = audioRef.current
    if (!a) {
      console.warn('enableAudioNow: no assets present yet')
      return
    }
    const presentKeys = (
      Object.keys(a) as Array<keyof LoaderAudioAssets>
    ).filter((k) => Boolean(a[k]))

    const audio = getAudioForStage(a)
    if (audio) {
      currentAudioRef.current = audio
      tryPlayAudio(audio).then((ok) => {
        if (!ok) console.warn('enableAudioNow: audio play blocked')
      })
    } else {
      console.warn(
        'enableAudioNow: no audio found in assets for current stage',
        {
          stageName: stage?.name,
          keys: presentKeys,
        }
      )
    }
  }, [audioRef, stage, getAudioForStage, tryPlayAudio])

  useEffect(() => {
    if (audioUnlockedRef.current) return

    function onFirstGesture() {
      audioUnlockedRef.current = true
      setShowEnableAudio(false)

      const a = audioRef.current
      const audio = getAudioForStage(a)
      if (audio) {
        currentAudioRef.current = audio
        void tryPlayAudio(audio).then((ok) => {
          if (!ok) console.warn('onFirstGesture: audio play blocked')
        })
      }
      window.removeEventListener('keydown', onFirstGesture)
      window.removeEventListener('click', onFirstGesture)
      window.removeEventListener('touchstart', onFirstGesture)
    }

    window.addEventListener('keydown', onFirstGesture, { once: true })
    window.addEventListener('click', onFirstGesture, { once: true })
    window.addEventListener('touchstart', onFirstGesture, { once: true })

    return () => {
      window.removeEventListener('keydown', onFirstGesture)
      window.removeEventListener('click', onFirstGesture)
      window.removeEventListener('touchstart', onFirstGesture)
    }
  }, [assetsLoaded, audioRef, getAudioForStage, tryPlayAudio])

  useEffect(() => {
    //switch audio by stage
    const a = audioRef.current
    if (!a) return
    const nextAudio = getAudioForStage(a)

    if (currentAudioRef.current && currentAudioRef.current !== nextAudio) {
      try {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      } catch (e) {
        console.warn('useAudioManager: failed to stop previous audio', e)
      }
    }

    currentAudioRef.current = nextAudio ?? null

    if (audioUnlockedRef.current && currentAudioRef.current) {
      void tryPlayAudio(currentAudioRef.current).then((ok) => {
        if (!ok)
          console.warn('useAudioManager: failed to autoplay after stage change')
      })
    }
  }, [stage, assetsLoaded, audioRef, getAudioForStage, tryPlayAudio])

  useEffect(() => {
    return () => {
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
          currentAudioRef.current.currentTime = 0
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  return {
    showEnableAudio,
    enableAudioNow,
  }
}
