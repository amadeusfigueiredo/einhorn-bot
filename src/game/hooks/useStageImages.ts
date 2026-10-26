import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { LoaderImageAssets, StageConfig } from '../types'
import { loadImageAssets, stageImageKeys } from '../utils/loader'
import { savesData, whenIdle } from '../utils/whenIdle'

type Options = {
  stage: StageConfig
  /** The stage after this one, whose pictures are fetched while the child plays (so the next classroom is ready). */
  next?: StageConfig
  /** Wait for the pictures before the game is shown (the 2D view draws them); the 3D view has no use for them till someone talks. */
  blocking: boolean
}

/**
 * The game's pictures, a stage at a time: the pictures of the stage she is in (the 2D view waits for them; the 3D view
 * has them come in behind the scene), then, when the browser is idle, those of the next one. About 70 MB of art ships
 * with the game and one stage needs about a twelfth of it. A picture is fetched once however often it is asked for.
 * What is not there yet is simply not drawn (a plain circle for a unicorn), so a stage reached early is never stuck.
 */
export function useStageImages({ stage, next, blocking }: Options): { assetsRef: RefObject<LoaderImageAssets>; loaded: boolean } {
  const assetsRef = useRef<LoaderImageAssets>({})
  const asked = useRef(new Set<string>())
  const [loaded, setLoaded] = useState(!blocking)

  const ensure = useCallback(async (keys: Array<keyof LoaderImageAssets>) => {
    const wanted = keys.filter((k) => !asked.current.has(k))
    wanted.forEach((k) => asked.current.add(k))
    if (!wanted.length) return
    const images = await loadImageAssets({ imageKeys: wanted })
    Object.assign(assetsRef.current, images)
  }, [])

  const stageKeys = stageImageKeys(stage).join(',')
  const nextKeys = next ? stageImageKeys(next).join(',') : ''

  useEffect(() => {
    let cancelled = false
    ensure(stageKeys.split(',') as Array<keyof LoaderImageAssets>)
      .catch(console.warn)
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [ensure, stageKeys])

  useEffect(() => {
    // On a connection set to save data the next stage waits until she gets there.
    if (!loaded || !nextKeys || savesData()) return
    return whenIdle(() => void ensure(nextKeys.split(',') as Array<keyof LoaderImageAssets>).catch(console.warn))
  }, [ensure, loaded, nextKeys])

  return { assetsRef, loaded }
}
