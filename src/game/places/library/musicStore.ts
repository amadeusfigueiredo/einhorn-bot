import { playNotes } from '../../audio/sfx'
import { createActivityStore, type ActivityDeps, type ActivityMode, type ActivityState, type Lesson } from '../../activity/activityStore'
import { creationsStore } from '../../activity/creations'
import { earnSticker } from '../../stickers/stickerStore'
import { registerBusy } from '../placeBusy'
import { SONGS, TUNE_RULES, barNotes, songSchedule } from './xylophone'

/** The xylophone is an activity of the shared engine (`activity/activityStore.ts`): the events are the bars, the lessons the three songs. */
export type MusicMode = ActivityMode
export type MusicState = ActivityState<number>

export type MusicDeps = {
  play: (bar: number) => void
  /** Milliseconds, only for the time between two bars she strikes. */
  now: () => number
  timers: ActivityDeps<number>['timers']
  earn: ActivityDeps<number>['earn']
  /** Where her tunes are kept. */
  creations?: ActivityDeps<number>['creations']
}

export { PRESSED_MS, TAIL_MS } from '../../activity/activityStore'

/** The three songs as lessons: the bars in order (the next one glows), and when each sounds when she listens. */
export const SONG_LESSONS: readonly Lesson<number>[] = SONGS.map((song) => ({
  id: song.id,
  steps: song.notes.map((n) => n.bar),
  demo: songSchedule(song).map((s) => ({ event: s.bar, at: s.at })),
}))

export function createMusicStore(deps: MusicDeps) {
  return createActivityStore<number>(
    {
      key: 'xylophone',
      lessons: SONG_LESSONS,
      take: TUNE_RULES,
      // Every bar she strikes tells the stickers which note it was; a song she plays through, its name; a tune of four notes or more played back, that she composed.
      onEvent: (bar) => ['note', String(bar)],
      onLessonDone: (id) => ['song', id],
      onCreationPlayed: () => ['take'],
    },
    { perform: deps.play, now: deps.now, timers: deps.timers, earn: deps.earn, creations: deps.creations }
  )
}

/** The one xylophone: its sounds are the game's own, its timers are the page's, and her tunes are kept on the device. */
export const musicStore = createMusicStore({
  play: (bar) => playNotes(barNotes(bar)),
  now: () => Date.now(),
  timers: { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
  earn: earnSticker,
  creations: creationsStore,
})

/** Non-React code (the room's taps and walking) asks this. */
export function isMusicOpen(): boolean {
  return musicStore.getState().open
}

// The open xylophone has the room.
registerBusy(isMusicOpen)
