import { playSfx } from '../../audio/sfx'
import { pitchFor, playVoice } from '../../audio/voice'
import { earnSticker } from '../../stickers/stickerStore'
import type { Localized } from '../../i18n/languages'
import { LIBRARY_THINGS, YARD_THINGS, type Dialog } from '../data/hangouts'
import { drawingStore } from '../library/drawing/drawingStore'
import { readerStore } from '../library/bookReader'
import { musicStore } from '../library/musicStore'
import { placeStore } from '../placeStore'
import { sayStore } from '../sayStore'
import { talkStore } from '../talkStore'
import type { Use } from './things2d'

const THINGS = [...YARD_THINGS, ...LIBRARY_THINGS]
/** The talks of the yard and the library by who they are with, and what each thing says out loud: the same data the 3D rooms use. */
export const TALKS = Object.fromEntries(THINGS.flatMap((t) => (t.dialog ? [[t.id, t.dialog]] : []))) as Record<string, Dialog>
const SAYINGS = Object.fromEntries(THINGS.flatMap((t) => (t.say ? [[t.id, t.say]] : []))) as Record<string, Localized>
export const THING_NAMES = Object.fromEntries(THINGS.map((t) => [t.id, t.label])) as Record<string, Localized>

/**
 * She has walked up to a thing in the 2D view: do what it does. The same stores, sounds and stickers as in the 3D
 * rooms (a book opens the reader, the xylophone its pad, a friend a talk), so the two views play the same game.
 */
export function doThing(use: Use): void {
  const say = (id: string) => sayStore.getState().say(SAYINGS[id])
  switch (use.type) {
    case 'go':
      placeStore.getState().go(use.to)
      break
    case 'classDoor':
      // Every door of the corridor is open: it takes her into the class.
      placeStore.getState().go('class', use.index)
      break
    case 'book':
      playSfx('select')
      readerStore.getState().open(use.id)
      break
    case 'talk':
      playSfx('pop')
      talkStore.getState().open(use.id, TALKS[use.id])
      break
    case 'say':
      if (use.animal) {
        earnSticker('talk', use.id)
        playSfx('pop')
        playVoice('squeak', pitchFor(use.id))
      } else playSfx('whee')
      say(use.id)
      break
    case 'globe':
      earnSticker('globe')
      playSfx('whoosh')
      say('globe')
      break
    case 'lamp':
      earnSticker('lamp')
      playSfx('sparkle')
      say('starLamp')
      break
    case 'aquarium':
      earnSticker('aquarium')
      playSfx('pop')
      say('aquarium')
      break
    case 'pad':
      playSfx('select')
      musicStore.getState().openPanel()
      break
    case 'board':
      playSfx('select')
      drawingStore.getState().openBoard()
      break
  }
}
