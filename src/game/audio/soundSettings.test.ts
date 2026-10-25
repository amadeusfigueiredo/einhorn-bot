import { describe, it, expect } from 'vitest'
import { createSoundSettings, DEFAULT_EFFECTS_VOLUME, DEFAULT_MUSIC_VOLUME, MUSIC_FULL, musicLevel, MUTE_STORAGE_KEY, VOLUME_STORAGE_KEY } from './soundSettings'

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
  }
}

describe('sound settings', () => {
  it('sound is on the first time', () => {
    expect(createSoundSettings(fakeStorage()).getState().muted).toBe(false)
  })

  it('remembers that the child muted it', () => {
    const storage = fakeStorage()
    const s = createSoundSettings(storage)
    s.getState().setMuted(true)
    expect(storage.data[MUTE_STORAGE_KEY]).toBe('1')
    expect(createSoundSettings(storage).getState().muted).toBe(true)
    s.getState().setMuted(false)
    expect(storage.data[MUTE_STORAGE_KEY]).toBe('0')
    expect(createSoundSettings(storage).getState().muted).toBe(false)
  })

  it('toggle flips it each time', () => {
    const s = createSoundSettings(fakeStorage())
    s.getState().toggleMuted()
    expect(s.getState().muted).toBe(true)
    s.getState().toggleMuted()
    expect(s.getState().muted).toBe(false)
  })

  it('anything else in storage means sound on', () => {
    expect(createSoundSettings(fakeStorage({ [MUTE_STORAGE_KEY]: 'yes' })).getState().muted).toBe(false)
    expect(createSoundSettings(fakeStorage({ [MUTE_STORAGE_KEY]: '' })).getState().muted).toBe(false)
  })

  it('works without storage at all (private mode): the switch still switches', () => {
    const s = createSoundSettings(null)
    s.getState().toggleMuted()
    expect(s.getState().muted).toBe(true)
  })

  it('works when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('no')
      },
      setItem: () => {
        throw new Error('full')
      },
    }
    const s = createSoundSettings(broken)
    expect(s.getState().muted).toBe(false)
    expect(() => s.getState().toggleMuted()).not.toThrow()
    expect(s.getState().muted).toBe(true)
  })

  it('tells listeners when it changes', () => {
    const s = createSoundSettings(fakeStorage())
    const seen: boolean[] = []
    s.subscribe((st) => seen.push(st.muted))
    s.getState().toggleMuted()
    s.getState().toggleMuted()
    expect(seen).toEqual([true, false])
  })
})

describe('volumes of the music and of the sounds', () => {
  it('the music starts at three quarters (the level the game always had) and the sounds at full', () => {
    const s = createSoundSettings(fakeStorage()).getState()
    expect(s.musicVolume).toBe(DEFAULT_MUSIC_VOLUME)
    expect(s.effectsVolume).toBe(DEFAULT_EFFECTS_VOLUME)
    expect(musicLevel(DEFAULT_MUSIC_VOLUME)).toBeCloseTo(0.6)
    expect(MUSIC_FULL).toBe(0.8)
  })

  it('each has its own volume: turning one does not move the other', () => {
    const s = createSoundSettings(fakeStorage())
    s.getState().setMusicVolume(0.2)
    expect(s.getState().musicVolume).toBe(0.2)
    expect(s.getState().effectsVolume).toBe(DEFAULT_EFFECTS_VOLUME)
    s.getState().setEffectsVolume(0.4)
    expect(s.getState().effectsVolume).toBe(0.4)
    expect(s.getState().musicVolume).toBe(0.2)
  })

  it('remembers both for the next visit', () => {
    const storage = fakeStorage()
    const s = createSoundSettings(storage)
    s.getState().setMusicVolume(0.3)
    s.getState().setEffectsVolume(0.9)
    expect(JSON.parse(storage.data[VOLUME_STORAGE_KEY])).toEqual({ music: 0.3, effects: 0.9 })
    const again = createSoundSettings(storage).getState()
    expect(again.musicVolume).toBe(0.3)
    expect(again.effectsVolume).toBe(0.9)
  })

  it('never goes below silent or above full, and not-a-number means silent', () => {
    const s = createSoundSettings(fakeStorage())
    s.getState().setMusicVolume(-2)
    expect(s.getState().musicVolume).toBe(0)
    s.getState().setMusicVolume(7)
    expect(s.getState().musicVolume).toBe(1)
    s.getState().setEffectsVolume(Number.NaN)
    expect(s.getState().effectsVolume).toBe(0)
  })

  it('muting is separate: it keeps the volumes, and the volumes keep the mute', () => {
    const s = createSoundSettings(fakeStorage())
    s.getState().setMusicVolume(0.5)
    s.getState().setMuted(true)
    expect(s.getState().musicVolume).toBe(0.5)
    s.getState().setMusicVolume(0.6)
    expect(s.getState().muted).toBe(true)
  })

  it('whatever is in storage that is not a volume falls back to the defaults', () => {
    for (const raw of ['', 'nonsense', '{', 'null', '[]', '{"music":"loud"}']) {
      const s = createSoundSettings(fakeStorage({ [VOLUME_STORAGE_KEY]: raw })).getState()
      expect(s.musicVolume, raw).toBe(DEFAULT_MUSIC_VOLUME)
      expect(s.effectsVolume, raw).toBe(DEFAULT_EFFECTS_VOLUME)
    }
  })

  it('takes one volume from storage when the other is missing, and clamps what it finds', () => {
    const s = createSoundSettings(fakeStorage({ [VOLUME_STORAGE_KEY]: '{"music":5}' })).getState()
    expect(s.musicVolume).toBe(1)
    expect(s.effectsVolume).toBe(DEFAULT_EFFECTS_VOLUME)
    expect(createSoundSettings(fakeStorage({ [VOLUME_STORAGE_KEY]: '{"effects":0.25}' })).getState().effectsVolume).toBe(0.25)
  })

  it('still works when storage throws, and without any storage', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const s = createSoundSettings(broken)
    expect(s.getState().musicVolume).toBe(DEFAULT_MUSIC_VOLUME)
    s.getState().setMusicVolume(0.1)
    s.getState().setEffectsVolume(0.2)
    expect(s.getState()).toMatchObject({ musicVolume: 0.1, effectsVolume: 0.2 })
    const none = createSoundSettings(null)
    none.getState().setEffectsVolume(0.3)
    expect(none.getState().effectsVolume).toBe(0.3)
  })
})
