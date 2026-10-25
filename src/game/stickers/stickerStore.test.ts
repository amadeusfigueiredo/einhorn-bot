import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStickerStore, earnSticker, stickerStore, STICKER_STORAGE_KEY } from './stickerStore'

const played = vi.hoisted(() => ({ names: [] as string[] }))
vi.mock('../audio/sfx', () => ({ playSfx: (n: string) => void played.names.push(n) }))

const memory = (initial?: string) => {
  const data = new Map<string, string>(initial === undefined ? [] : [[STICKER_STORAGE_KEY, initial]])
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
}

afterEach(() => {
  played.names.length = 0
  stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false })
})

describe('the sticker store', () => {
  it('starts empty with no storage', () => {
    const s = createStickerStore(null).getState()
    expect(s.got).toEqual([])
    expect(s.toasts).toEqual([])
    expect(s.bookOpen).toBe(false)
  })

  it('wins a sticker, queues it for the toast and plays a tune', () => {
    const s = createStickerStore(null)
    s.getState().earn('visitYard')
    expect(s.getState().got).toEqual(['yard'])
    expect(s.getState().toasts).toEqual(['yard'])
    expect(played.names).toEqual(['tada'])
  })

  it('is quiet when nothing is won', () => {
    const s = createStickerStore(null)
    s.getState().earn('kick')
    expect(s.getState().counts.kick).toBe(1)
    expect(s.getState().toasts).toEqual([])
    expect(played.names).toEqual([])
  })

  it('tells about the stickers one after another', () => {
    const s = createStickerStore(null)
    s.getState().earn('visitYard')
    s.getState().earn('visitLibrary')
    expect(s.getState().toasts).toEqual(['yard', 'library'])
    s.getState().nextToast()
    expect(s.getState().toasts).toEqual(['library'])
    s.getState().nextToast()
    s.getState().nextToast()
    expect(s.getState().toasts).toEqual([])
  })

  it('opens and closes the book', () => {
    const s = createStickerStore(null)
    s.getState().openBook()
    expect(s.getState().bookOpen).toBe(true)
    s.getState().closeBook()
    expect(s.getState().bookOpen).toBe(false)
  })

  it('remembers what she has won: a new visit has the same stickers and counts', () => {
    const storage = memory()
    const first = createStickerStore(storage)
    first.getState().earn('visitYard')
    first.getState().earn('kick')
    first.getState().earn('talk', 'owl')
    const again = createStickerStore(storage).getState()
    expect(again.got).toEqual(['yard', 'hello'])
    expect(again.counts.kick).toBe(1)
    expect(again.seen.talk).toEqual(['owl'])
    // but not the toasts or an open book
    expect(again.toasts).toEqual([])
    expect(again.bookOpen).toBe(false)
  })

  it('carries on counting from what was remembered (the fifth kick of two visits wins)', () => {
    const storage = memory()
    const a = createStickerStore(storage)
    for (let i = 0; i < 3; i++) a.getState().earn('kick')
    const b = createStickerStore(storage)
    b.getState().earn('kick')
    expect(b.getState().got).toEqual([])
    b.getState().earn('kick')
    expect(b.getState().got).toEqual(['kicker'])
  })

  it.each(['not json', '{"counts":3}', 'null', '[]', ''])('starts fresh when what was saved is %j', (saved) => {
    expect(createStickerStore(memory(saved)).getState().got).toEqual([])
  })

  it('starts fresh and keeps going when the browser will not let it read or write', () => {
    const broken = {
      getItem: () => {
        throw new Error('no reading')
      },
      setItem: () => {
        throw new Error('no writing')
      },
      removeItem: () => {},
    }
    const s = createStickerStore(broken)
    expect(s.getState().got).toEqual([])
    s.getState().earn('visitYard')
    expect(s.getState().got).toEqual(['yard'])
  })

  it('saves under its own key', () => {
    const storage = memory()
    createStickerStore(storage).getState().earn('visitYard')
    expect(JSON.parse(storage.data.get(STICKER_STORAGE_KEY)!).got).toEqual(['yard'])
  })

  it('earnSticker tells the one store of the game', () => {
    earnSticker('visitLibrary')
    expect(stickerStore.getState().got).toContain('library')
  })
})
