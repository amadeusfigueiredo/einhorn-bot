import { beforeEach, describe, expect, it, vi } from 'vitest'

const sound = vi.hoisted(() => ({ sfx: [] as string[], voice: [] as string[] }))
vi.mock('../../audio/sfx', () => ({ playSfx: (n: string) => void sound.sfx.push(n) }))
vi.mock('../../audio/voice', () => ({ playVoice: (n: string) => void sound.voice.push(n), pitchFor: () => 1 }))

import { gameStore } from '../../logic/gameStore.instance'
import { stickerStore } from '../../stickers/stickerStore'
import { drawingStore } from '../library/drawing/drawingStore'
import { readerStore } from '../library/bookReader'
import { musicStore } from '../library/musicStore'
import { placeStore } from '../placeStore'
import { sayStore } from '../sayStore'
import { talkStore } from '../talkStore'
import { LIBRARY_THINGS, YARD_THINGS } from '../data/hangouts'
import { doThing, TALKS, THING_NAMES } from './actions2d'

const said = () => sayStore.getState().saying?.text
const thing = (id: string) => [...YARD_THINGS, ...LIBRARY_THINGS].find((t) => t.id === id)!

beforeEach(() => {
  sound.sfx.length = 0
  sound.voice.length = 0
  placeStore.setState({ place: 'library', from: 'yard', trip: null })
  sayStore.getState().clear()
  talkStore.getState().close()
  readerStore.getState().close()
  musicStore.getState().close()
  drawingStore.getState().close()
  gameStore.getState().startOver()
})

describe('what the 2D view does when she uses a thing (the same as the 3D rooms)', () => {
  it('a door starts the walk through it', () => {
    doThing({ type: 'go', to: 'hall' })
    expect(placeStore.getState().trip).toEqual({ from: 'library', to: 'hall' })
  })

  it.each([3, 5, 14])('every class door of the corridor takes her into that class, whether the classes before it are done or not (class %i)', (index) => {
    placeStore.setState({ place: 'hall', from: 'yard', trip: null })
    doThing({ type: 'classDoor', index })
    expect(placeStore.getState().trip).toEqual({ from: 'hall', to: 'class', stage: index })
    expect(sound.sfx).not.toContain('knock')
    expect(said()).toBeUndefined()
  })

  it('a book opens in the reader', () => {
    doThing({ type: 'book', id: 2 })
    expect(readerStore.getState().reading).not.toBeNull()
    expect(sound.sfx).toContain('select')
  })

  it('a friend starts their talk, with the right dialogue', () => {
    doThing({ type: 'talk', id: 'owl' })
    expect(talkStore.getState().talk?.id).toBe('owl')
    expect(TALKS.owl).toBeDefined()
    expect(sound.sfx).toContain('pop')
    doThing({ type: 'talk', id: 'friendDay' })
    expect(talkStore.getState().talk?.id).toBe('friendDay')
  })

  it('an animal says its line, squeaks and earns a sticker for the talk', () => {
    const earn = vi.spyOn(stickerStore.getState(), 'earn')
    doThing({ type: 'say', id: 'koala', animal: true })
    expect(said()).toEqual(thing('koala').say)
    expect(sound.voice).toContain('squeak')
    expect(sound.sfx).toContain('pop')
    expect(earn).toHaveBeenCalledWith('talk', 'koala')
    earn.mockRestore()
  })

  it('a swing or a slide says its line with a whee', () => {
    doThing({ type: 'say', id: 'swing' })
    expect(said()).toEqual(thing('swing').say)
    expect(sound.sfx).toContain('whee')
    expect(sound.voice).toHaveLength(0)
  })

  it.each([
    ['globe', 'whoosh', 'globe'],
    ['lamp', 'sparkle', 'starLamp'],
    ['aquarium', 'pop', 'aquarium'],
  ] as const)('the %s makes its sound and says its line', (type, sfx, id) => {
    doThing({ type })
    expect(sound.sfx).toContain(sfx)
    expect(said()).toEqual(thing(id).say)
  })

  it('the xylophone opens its pad and the easel its board', () => {
    doThing({ type: 'pad' })
    expect(musicStore.getState().open).toBe(true)
    doThing({ type: 'board' })
    expect(drawingStore.getState().open).toBe(true)
  })

  it('knows the name of everything that has a talk or a line', () => {
    for (const id of ['owl', 'friendDay', 'koala', 'globe', 'swing']) expect(THING_NAMES[id].en).toBeTruthy()
  })
})
