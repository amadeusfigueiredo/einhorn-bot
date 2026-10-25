// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, cleanupAfterEach, renderUI, screen } from '../../test/ui'
import { PLAYER_LOOK } from '../data/unicornLooks'
import { COATS, DEFAULT_OUTFIT } from './outfit'
import { OUTFIT_STORAGE_KEY, createOutfitSettings, outfitSettings, useOutfit, useOutfitLook } from './outfitSettings'

cleanupAfterEach()

function memory(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) }
}
const choices = (s: ReturnType<typeof createOutfitSettings>) => {
  const { sweater, coat, horn, accessory, trim } = s.getState()
  return { sweater, coat, horn, accessory, trim }
}

describe('what she wears, kept', () => {
  it('starts as the game always was', () => {
    expect(choices(createOutfitSettings(memory()))).toEqual(DEFAULT_OUTFIT)
  })

  it('changes some of the choices and keeps the others, and remembers', () => {
    const storage = memory()
    const store = createOutfitSettings(storage)
    store.getState().choose({ coat: 'pink' })
    store.getState().choose({ horn: 'star', accessory: 'crown' })
    expect(choices(store)).toEqual({ ...DEFAULT_OUTFIT, coat: 'pink', horn: 'star', accessory: 'crown' })
    expect(choices(createOutfitSettings(storage))).toEqual(choices(store))
  })

  it('goes back to normal, and remembers that too', () => {
    const storage = memory()
    const store = createOutfitSettings(storage)
    store.getState().choose({ coat: 'mint', sweater: 'forest' })
    store.getState().reset()
    expect(choices(store)).toEqual(DEFAULT_OUTFIT)
    expect(choices(createOutfitSettings(storage))).toEqual(DEFAULT_OUTFIT)
  })

  it('starts as normal when what was saved is rubbish or cannot be read, and goes on when it cannot be written', () => {
    for (const bad of ['not json', 'null', '[]']) expect(choices(createOutfitSettings(memory({ [OUTFIT_STORAGE_KEY]: bad }))), bad).toEqual(DEFAULT_OUTFIT)
    const broken = {
      getItem: () => {
        throw new Error('no')
      },
      setItem: () => {
        throw new Error('full')
      },
    }
    const store = createOutfitSettings(broken)
    store.getState().choose({ coat: 'sky' })
    expect(store.getState().coat).toBe('sky')
    expect(choices(createOutfitSettings(null))).toEqual(DEFAULT_OUTFIT)
  })
})

describe('the hooks', () => {
  function Show() {
    const outfit = useOutfit()
    const look = useOutfitLook()
    return (
      <p>
        {outfit.coat}/{look.coat}/{look === PLAYER_LOOK ? 'same' : 'dressed'}
      </p>
    )
  }

  it('give the outfit and the unicorn dressed in it, the very same look when nothing is chosen', () => {
    outfitSettings.getState().reset()
    renderUI(<Show />, 'en')
    expect(screen.getByText('white/#ffffff/same')).toBeTruthy()
    act(() => outfitSettings.getState().choose({ coat: 'pink' }))
    expect(screen.getByText(`pink/${COATS.pink}/dressed`)).toBeTruthy()
    act(() => outfitSettings.getState().reset())
  })
})
