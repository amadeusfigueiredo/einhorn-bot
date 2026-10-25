import type { LoaderAudioAssets, LoaderImageAssets, StageConfig } from '../types'

export type LoaderAssets = LoaderImageAssets & LoaderAudioAssets

const MAX_STAGE = 12
const NPCS_PER_STAGE = 3

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function makeAudio(
  src: string | null | undefined
): HTMLAudioElement | undefined {
  if (!src) return undefined
  try {
    const audio = new Audio(src)
    audio.loop = true
    // Not downloaded until it is played (a stage's music is megabytes; the other three are never needed in that visit).
    audio.preload = 'none'
    audio.volume = 0.8
    return audio
  } catch (e) {
    console.warn('audio creation failed for', src, e)
    return undefined
  }
}

/** What every stage draws besides its own art: the shared fourth unicorn and the player picture (2D view). */
export const SHARED_IMAGE_KEYS = ['stage1Npc4', 'player1'] as const

/**
 * The pictures one stage needs: its background and the portraits of its unicorns, then the shared ones. Stages
 * 13-15 reuse the art of 1-3, so they name pictures that another stage names too (loaded once, see `useStageImages`).
 */
export function stageImageKeys(stage: Pick<StageConfig, 'background' | 'npcs'>): Array<keyof LoaderImageAssets> {
  const keys = [stage.background, ...(stage.npcs ?? []).map((n) => n.imageKey), ...SHARED_IMAGE_KEYS].filter((k): k is NonNullable<typeof k> => Boolean(k))
  return [...new Set(keys)] as Array<keyof LoaderImageAssets>
}

function makeDefaultImageKeys(): Array<keyof LoaderImageAssets> {
  const keys: string[] = []

  // backgrounds: stage1Background ... stage12Background
  for (let s = 1; s <= MAX_STAGE; s++) keys.push(`stage${s}Background`)

  // NPCs: stage1Npc1..3 ... stage12Npc1..3
  for (let s = 1; s <= MAX_STAGE; s++) {
    for (let n = 1; n <= NPCS_PER_STAGE; n++) keys.push(`stage${s}Npc${n}`)
  }

  // special case
  keys.push('stage1Npc4')

  // player
  keys.push('player1')

  return keys as Array<keyof LoaderImageAssets>
}

// Only these stages actually ship a music file, each with its own real
// extension - stage11/stage12 were exported as .mp4 (audio-only AAC, which
// <audio> plays fine) rather than .m4a like stage1/stage2. Every other stage
// falls back to one of these via audioResolver.ts instead of 404ing.
const AUDIO_FILES: Record<keyof LoaderAudioAssets, string> = {
  stage1: 'stage1.m4a',
  stage2: 'stage2.m4a',
  stage11: 'stage11.mp4',
  stage12: 'stage12.mp4',
}

export async function loadImageAssets({
  imageKeys,
  path = '/assets/',
  ext = '.png',
}: {
  imageKeys?: Array<keyof LoaderImageAssets>
  path?: string
  ext?: string
} = {}): Promise<LoaderImageAssets> {
  const assets: LoaderImageAssets = {}

  // ✅ changed: generate defaults instead of hardcoding
  const keys = imageKeys ?? makeDefaultImageKeys()

  const results = await Promise.all(
    keys.map(async (key) => {
      const filename = `${String(key)}${ext}`
      const url = new URL(`${path}${filename}`, import.meta.url).toString()
      try {
        const img = await loadImage(url)
        return { key, img } as const
      } catch (e) {
        console.warn(`failed to load image ${filename} (${url})`, e)
        return { key, img: undefined as HTMLImageElement | undefined } as const
      }
    })
  )

  for (const result of results) {
    if (result.img) (assets as LoaderImageAssets)[result.key] = result.img
  }
  return assets
}

export function loadAudioAssets({
  audioFiles = AUDIO_FILES,
  path = '/assets/',
}: {
  audioFiles?: Partial<Record<keyof LoaderAudioAssets, string>>
  path?: string
} = {}): LoaderAudioAssets {
  const assets: LoaderAudioAssets = {}

  for (const [key, filename] of Object.entries(audioFiles) as Array<
    [keyof LoaderAudioAssets, string]
  >) {
    const url = new URL(`${path}${filename}`, import.meta.url).toString()
    const audio = makeAudio(url)
    if (audio) assets[key] = audio
    else console.warn(`failed to create audio for ${filename} (${url})`)
  }

  return assets
}

export async function loadAssets(options?: {
  imageKeys?: Array<keyof LoaderImageAssets>
  audioFiles?: Partial<Record<keyof LoaderAudioAssets, string>>
  path?: string
  imageExtension?: string
}): Promise<{ images: LoaderImageAssets; audio: LoaderAudioAssets }> {
  const images = await loadImageAssets({
    imageKeys: options?.imageKeys,
    path: options?.path,
    ext: options?.imageExtension ?? '.png',
  })
  const audio = loadAudioAssets({
    audioFiles: options?.audioFiles,
    path: options?.path,
  })
  return { images, audio }
}
