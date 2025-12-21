import type { LoaderAudioAssets, LoaderImageAssets } from '../types'

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
    audio.preload = 'auto'
    audio.volume = 0.8
    return audio
  } catch (e) {
    console.warn('audio creation failed for', src, e)
    return undefined
  }
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

  // player + popups
  keys.push('player1', 'winPopup', 'tryAgainPopup', 'gameEndPopup')

  return keys as Array<keyof LoaderImageAssets>
}

function makeDefaultAudioKeys(): Array<keyof LoaderAudioAssets> {
  const keys: string[] = []
  for (let s = 1; s <= MAX_STAGE; s++) keys.push(`stage${s}`)
  return keys as Array<keyof LoaderAudioAssets>
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
  audioKeys,
  path = '/assets/',
  ext = '.m4a',
}: {
  audioKeys?: Array<keyof LoaderAudioAssets>
  path?: string
  ext?: string
} = {}): LoaderAudioAssets {
  const assets: LoaderAudioAssets = {}

  // ✅ changed: generate defaults instead of hardcoding
  const keys = audioKeys ?? makeDefaultAudioKeys()

  for (const k of keys) {
    const filename = `${String(k)}${ext}`
    const url = new URL(`${path}${filename}`, import.meta.url).toString()
    const audio = makeAudio(url)
    if (audio) (assets as LoaderAudioAssets)[k] = audio
    else console.warn(`failed to create audio for ${filename} (${url})`)
  }

  return assets
}

export async function loadAssets(options?: {
  imageKeys?: Array<keyof LoaderImageAssets>
  audioKeys?: Array<keyof LoaderAudioAssets>
  path?: string
  imageExtension?: string
  audioExtension?: string
}): Promise<{ images: LoaderImageAssets; audio: LoaderAudioAssets }> {
  const images = await loadImageAssets({
    imageKeys: options?.imageKeys,
    path: options?.path,
    ext: options?.imageExtension ?? '.png',
  })
  const audio = loadAudioAssets({
    audioKeys: options?.audioKeys,
    path: options?.path,
    ext: options?.audioExtension ?? '.m4a',
  })
  return { images, audio }
}
