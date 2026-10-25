import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export const MUTE_STORAGE_KEY = 'amaras-einhorn-schule:muted:v1'
export const VOLUME_STORAGE_KEY = 'amaras-einhorn-schule:volume:v1'

/** The music and the sounds of the game each have a volume of their own, 0 (silent) to 1 (full). */
export const DEFAULT_MUSIC_VOLUME = 0.75
export const DEFAULT_EFFECTS_VOLUME = 1

/** The loudest the music plays (a track at full slider): the slider's default 0.75 is the 0.6 the game always had. */
export const MUSIC_FULL = 0.8

/** The level of the music for a slider position. */
export function musicLevel(volume: number): number {
  return volume * MUSIC_FULL
}

type SoundSettings = {
  muted: boolean
  /** The background music, 0..1. */
  musicVolume: number
  /** The sounds of the game (chimes, voices), 0..1. */
  effectsVolume: number
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
  setMusicVolume: (volume: number) => void
  setEffectsVolume: (volume: number) => void
}

type MiniStorage = Pick<Storage, 'getItem' | 'setItem'>

function readMuted(storage: MiniStorage | null): boolean {
  try {
    return storage?.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)

function readVolumes(storage: MiniStorage | null): { music: number; effects: number } {
  const fallback = { music: DEFAULT_MUSIC_VOLUME, effects: DEFAULT_EFFECTS_VOLUME }
  try {
    const raw = storage?.getItem(VOLUME_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { music?: unknown; effects?: unknown }
    return {
      music: typeof parsed.music === 'number' ? clamp01(parsed.music) : fallback.music,
      effects: typeof parsed.effects === 'number' ? clamp01(parsed.effects) : fallback.effects,
    }
  } catch {
    return fallback
  }
}

export function createSoundSettings(storage: MiniStorage | null) {
  return createStore<SoundSettings>((set, get) => {
    const write = (muted: boolean) => {
      set({ muted })
      try {
        storage?.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
      } catch {
        // Persistence is a nicety; the toggle still works without it.
      }
    }
    const saveVolumes = () => {
      try {
        storage?.setItem(VOLUME_STORAGE_KEY, JSON.stringify({ music: get().musicVolume, effects: get().effectsVolume }))
      } catch {
        // Persistence is a nicety; the sliders still work without it.
      }
    }
    const volumes = readVolumes(storage)
    return {
      muted: readMuted(storage),
      musicVolume: volumes.music,
      effectsVolume: volumes.effects,
      setMuted: write,
      toggleMuted: () => write(!get().muted),
      setMusicVolume: (volume) => {
        set({ musicVolume: clamp01(volume) })
        saveVolumes()
      },
      setEffectsVolume: (volume) => {
        set({ effectsVolume: clamp01(volume) })
        saveVolumes()
      },
    }
  })
}

export const soundSettings = createSoundSettings(
  typeof window === 'undefined' ? null : window.localStorage
)

export function useMuted(): boolean {
  return useStore(soundSettings, (s) => s.muted)
}

export function useMusicVolume(): number {
  return useStore(soundSettings, (s) => s.musicVolume)
}

export function useEffectsVolume(): number {
  return useStore(soundSettings, (s) => s.effectsVolume)
}
