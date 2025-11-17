import type { LoaderAudioAssets, LoaderImageAssets } from '../types'

export type LoaderAssets = LoaderImageAssets & LoaderAudioAssets

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

  const defaultKeys: Array<keyof LoaderImageAssets> = [
    'stage1Background',
    'stage2Background',
    'stage3Background',
    'stage4Background',
    'stage5Background',
    'stage6Background',
    'stage7Background',
    'stage8Background',
    'stage1Npc1',
    'stage1Npc2',
    'stage1Npc3',
    'stage1Npc4',
    'stage2Npc1',
    'player1',
    // --- New Popup Asset Keys ---
    'winPopup',
    'tryAgainPopup',
    'gameEndPopup',
  ]

  const keys = imageKeys ?? defaultKeys

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

  const defaultKeys: Array<keyof LoaderAudioAssets> = [
    'stage1',
    'stage2',
    'stage3',
  ]
  const keys = audioKeys ?? defaultKeys

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
