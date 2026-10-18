import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export const MUTE_STORAGE_KEY = 'amaras-einhorn-schule:muted:v1'

type SoundSettings = {
  muted: boolean
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

type MiniStorage = Pick<Storage, 'getItem' | 'setItem'>

function readMuted(storage: MiniStorage | null): boolean {
  try {
    return storage?.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
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
    return {
      muted: readMuted(storage),
      setMuted: write,
      toggleMuted: () => write(!get().muted),
    }
  })
}

export const soundSettings = createSoundSettings(
  typeof window === 'undefined' ? null : window.localStorage
)

export function useMuted(): boolean {
  return useStore(soundSettings, (s) => s.muted)
}
