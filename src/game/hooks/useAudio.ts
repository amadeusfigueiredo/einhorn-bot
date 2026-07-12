import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import type { LoaderAudioAssets, StageConfig } from '../types'
import { resolveStageAudioKey } from '../utils/audioResolver'

export default function useAudioManager(opts: {
  audioRef: RefObject<LoaderAudioAssets | null>
  stage: StageConfig
  stageIndex: number
  assetsLoaded: boolean
}) {
  const { audioRef, stage, stageIndex, assetsLoaded } = opts

  const audioUnlockedRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const [showEnableAudio, setShowEnableAudio] = useState(false)

  // stable function to try to play audio
  const tryPlayAudio = useCallback(async (audio?: HTMLAudioElement | null) => {
    if (!audio) return false
    try {
      audio.loop = true
      audio.volume = 0.6
      await audio.play()
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }, [])

  /**
   * Resolve an Audio element for the current stage: its own track if it has
   * one, otherwise a deterministically-cycled fallback so every stage has
   * music even without a dedicated file.
   */
  const getAudioForStage = useCallback(
    (a?: LoaderAudioAssets | null): HTMLAudioElement | undefined => {
      if (!a) return undefined
      const availableTrackKeys = (
        Object.keys(a) as Array<keyof LoaderAudioAssets>
      ).filter((k) => Boolean(a[k]))
      const key = resolveStageAudioKey(
        stageIndex,
        stage.name,
        availableTrackKeys
      )
      return key ? a[key as keyof LoaderAudioAssets] : undefined
    },
    [stage, stageIndex]
  )

  const enableAudioNow = useCallback(() => {
    audioUnlockedRef.current = true
    setShowEnableAudio(false)

    const a = audioRef.current
    if (!a) {
      console.warn('enableAudioNow: no assets present yet')
      return
    }

    const audio = getAudioForStage(a)
    if (audio) {
      currentAudioRef.current = audio
      tryPlayAudio(audio).then((ok) => {
        if (!ok) console.warn('enableAudioNow: audio play blocked')
      })
    } else {
      console.warn(
        'enableAudioNow: no audio found in assets for current stage',
        { stageName: stage?.name }
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
