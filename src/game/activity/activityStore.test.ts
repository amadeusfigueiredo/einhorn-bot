import { describe, expect, it } from 'vitest'
import { HINT_MS, PRESSED_MS, TAIL_MS, createActivityStore, type ActivityConfig, type Lesson } from './activityStore'
import { createCreationsStore } from './creations'

/**
 * A made-up activity, not a xylophone: the events are dance steps (words), and the lessons are two little dances. It
 * shows the engine is the same one for every activity: free play, hear it, do it along with the glow, make your own,
 * a sticker for each.
 */
type Step = 'twirl' | 'hop' | 'clap' | 'bow'
const LESSONS: Lesson<Step>[] = [
  { id: 'welcome', steps: ['bow', 'twirl', 'clap'], demo: [{ event: 'bow', at: 0 }, { event: 'twirl', at: 1 }, { event: 'clap', at: 2 }] },
  { id: 'jumpy', steps: ['hop', 'hop', 'clap', 'bow'], demo: [{ event: 'hop', at: 0 }, { event: 'hop', at: 0.5 }, { event: 'clap', at: 1 }, { event: 'bow', at: 1.5 }] },
]
const CONFIG: ActivityConfig<Step> = {
  key: 'dance',
  lessons: LESSONS,
  take: { maxEvents: 6, maxSeconds: 10, minEvents: 3 },
  onEvent: (step) => ['move', step],
  onLessonDone: (id) => ['song', id],
  onCreationPlayed: () => ['take'],
}

function setup(creations = createCreationsStore(null)) {
  let now = 0
  const queue: { at: number; fn: () => void; id: number; live: boolean }[] = []
  let id = 0
  const done: Step[] = []
  const earned: [string, string | undefined][] = []
  const store = createActivityStore<Step>(CONFIG, {
    perform: (s) => void done.push(s),
    now: () => now,
    timers: {
      set: (fn, ms) => {
        const t = { at: now + ms, fn, id: ++id, live: true }
        queue.push(t)
        return t
      },
      clear: (h) => void ((h as { live: boolean }).live = false),
    },
    earn: (type, key) => void earned.push([type, key]),
    creations,
  })
  const advance = (ms: number) => {
    const target = now + ms
    for (;;) {
      const due = queue.filter((t) => t.live && t.at <= target).sort((a, b) => a.at - b.at || a.id - b.id)[0]
      if (!due) break
      due.live = false
      now = due.at
      due.fn()
    }
    now = target
  }
  return { store, advance, done, earned, setNow: (ms: number) => (now = ms) }
}

describe('the activity engine, with an activity that is not music', () => {
  it('free play first: whatever she does happens at once, and tells the stickers', () => {
    const { store, done, earned } = setup()
    store.getState().strike('twirl')
    expect(done).toEqual(['twirl'])
    expect(earned).toEqual([['move', 'twirl']])
    expect(store.getState().struck?.event).toBe('twirl')
  })

  it('hearing a lesson plays its demonstration, each step lighting as it happens, and is free at the end', () => {
    const { store, advance, done, earned } = setup()
    store.getState().listen('welcome')
    expect(store.getState()).toMatchObject({ mode: 'playing', lesson: 'welcome' })
    advance(0)
    expect(store.getState().lit).toBe('bow')
    advance(1000)
    expect(store.getState().lit).toBe('twirl')
    advance(1000 + TAIL_MS)
    expect(done).toEqual(['bow', 'twirl', 'clap'])
    expect(store.getState()).toMatchObject({ mode: 'free', lit: null, lesson: null })
    expect(earned).toEqual([])
  })

  it('doing a lesson along: the next step glows, a right one moves on, a wrong one only sounds, and the end wins the sticker', () => {
    const { store, done, earned } = setup()
    store.getState().follow('jumpy')
    expect(store.getState()).toMatchObject({ mode: 'follow', lit: 'hop', lesson: 'jumpy', finished: false })
    store.getState().strike('bow')
    expect(store.getState().lit).toBe('hop')
    store.getState().strike('hop')
    store.getState().strike('hop')
    expect(store.getState().lit).toBe('clap')
    store.getState().strike('clap')
    store.getState().strike('bow')
    expect(store.getState()).toMatchObject({ mode: 'free', lit: null, lesson: null, finished: true })
    expect(done).toEqual(['bow', 'hop', 'hop', 'clap', 'bow'])
    expect(earned.filter(([t]) => t === 'song')).toEqual([['song', 'jumpy']])
  })

  it('making her own: recording keeps what she does with its timing, stopping saves it, "play mine" plays it back and wins the sticker', () => {
    const { store, advance, done, earned, setNow } = setup()
    store.getState().record()
    setNow(100)
    store.getState().strike('hop')
    advance(500)
    store.getState().strike('clap')
    advance(500)
    store.getState().strike('bow')
    store.getState().stopRecording()
    expect(store.getState().take).toEqual([{ event: 'hop', at: 0 }, { event: 'clap', at: 0.5 }, { event: 'bow', at: 1 }])
    expect(store.getState().creations).toHaveLength(1)
    done.length = 0
    earned.length = 0
    store.getState().playTake()
    advance(1000 + TAIL_MS)
    expect(done).toEqual(['hop', 'clap', 'bow'])
    expect(earned).toEqual([['take', undefined]])
  })

  it('a take too short to be a creation is not kept, and wins nothing', () => {
    const { store, advance, earned } = setup()
    store.getState().record()
    store.getState().strike('hop')
    store.getState().stopRecording()
    expect(store.getState().creations).toEqual([])
    earned.length = 0
    store.getState().playTake()
    advance(TAIL_MS + 10)
    expect(earned).toEqual([])
  })

  it('keeps up to three creations and plays any of them again; her last one is there when she comes back', () => {
    const creations = createCreationsStore(null)
    const { store, advance, done, setNow } = setup(creations)
    const make = (steps: Step[]) => {
      store.getState().record()
      setNow(0)
      steps.forEach((s) => store.getState().strike(s))
      store.getState().stopRecording()
    }
    make(['hop', 'hop', 'hop'])
    make(['clap', 'clap', 'clap'])
    make(['bow', 'bow', 'bow'])
    make(['twirl', 'twirl', 'twirl'])
    expect(store.getState().creations.map((c) => c.take[0].event)).toEqual(['clap', 'bow', 'twirl'])
    const first = store.getState().creations[0]
    done.length = 0
    store.getState().playCreation(first.id)
    advance(TAIL_MS + 10)
    expect(done).toEqual(['clap', 'clap', 'clap'])
    // and tomorrow: a new page, the same device
    const tomorrow = setup(creations)
    expect(tomorrow.store.getState().creations).toHaveLength(3)
    expect(tomorrow.store.getState().take.map((m) => m.event)).toEqual(['twirl', 'twirl', 'twirl'])
  })

  it('does nothing for a creation that is not there, and for a lesson that is not there', () => {
    const { store, done } = setup()
    store.getState().playCreation('nope')
    store.getState().listen('nope')
    store.getState().follow('nope')
    expect(done).toEqual([])
    expect(store.getState().mode).toBe('free')
  })

  it('a struck step shows pressed for a moment, and an old press does not put out a newer one', () => {
    const { store, advance } = setup()
    store.getState().strike('hop')
    advance(PRESSED_MS - 20)
    store.getState().strike('clap')
    advance(30)
    expect(store.getState().struck?.event).toBe('clap')
    advance(PRESSED_MS)
    expect(store.getState().struck).toBeNull()
  })

  it('stopping or closing puts everything out and leaves nothing waiting to play', () => {
    const { store, advance, done } = setup()
    store.getState().openPanel()
    store.getState().listen('jumpy')
    advance(0)
    store.getState().close()
    advance(5000)
    expect(done).toEqual(['hop'])
    expect(store.getState()).toMatchObject({ open: false, mode: 'free', lit: null, lesson: null })
  })

  it('works without anything telling the stickers or keeping creations', () => {
    const store = createActivityStore<Step>({ key: 'x', lessons: [], take: CONFIG.take }, { perform: () => {}, now: () => 0, timers: { set: () => 0, clear: () => {} }, earn: () => {} })
    store.getState().strike('hop')
    store.getState().record()
    for (const s of ['hop', 'clap', 'bow'] as Step[]) store.getState().strike(s)
    store.getState().stopRecording()
    expect(store.getState().take).toHaveLength(3)
    expect(store.getState().creations).toEqual([])
  })

  it('a lesson with nothing in it ends at once and glows nothing', () => {
    const empty: Lesson<Step> = { id: 'empty', steps: [], demo: [] }
    let now = 0
    const queue: { at: number; fn: () => void; live: boolean }[] = []
    const store = createActivityStore<Step>({ ...CONFIG, lessons: [empty] }, { perform: () => {}, now: () => now, timers: { set: (fn, ms) => { const t = { at: now + ms, fn, live: true }; queue.push(t); return t }, clear: (h) => void ((h as { live: boolean }).live = false) }, earn: () => {} })
    store.getState().follow('empty')
    expect(store.getState()).toMatchObject({ mode: 'follow', lit: null, lesson: 'empty' })
    store.getState().listen('empty')
    now = TAIL_MS
    queue.filter((t) => t.live).forEach((t) => t.fn())
    expect(store.getState()).toMatchObject({ mode: 'free', lit: null, lesson: null })
  })

  it('tells the surface to start afresh when something new starts (a recording, a demonstration, a lesson along, a tune played back), and not for free play', () => {
    let begun = 0
    const store = createActivityStore<Step>(CONFIG, { perform: () => {}, now: () => 0, timers: { set: () => 0, clear: () => {} }, earn: () => {}, begin: () => void begun++ })
    store.getState().strike('hop')
    expect(begun).toBe(0)
    store.getState().record()
    expect(begun).toBe(1)
    for (const s of ['hop', 'clap', 'bow'] as Step[]) store.getState().strike(s)
    store.getState().stopRecording()
    expect(begun).toBe(1)
    store.getState().playTake()
    store.getState().listen('welcome')
    store.getState().follow('welcome')
    expect(begun).toBe(4)
  })
})

describe('a challenge: the same lesson, with the way hidden until she asks for it', () => {
  const challenge = () => {
    const ctx = setup()
    return ctx
  }

  it('lights nothing on its own, and a right step moves on without lighting the next', () => {
    const { store, done } = challenge()
    store.getState().challenge('welcome')
    expect(store.getState()).toMatchObject({ mode: 'follow', challenging: true, lit: null, lesson: 'welcome', hints: 0 })
    store.getState().strike('bow')
    expect(done).toEqual(['bow'])
    expect(store.getState().lit).toBeNull()
  })

  it('"show me the way" lights the next step for a moment, and counts how often she asked', () => {
    const { store, advance } = challenge()
    store.getState().challenge('welcome')
    store.getState().hint()
    expect(store.getState()).toMatchObject({ lit: 'bow', hints: 1 })
    advance(HINT_MS)
    expect(store.getState().lit).toBeNull()
    store.getState().strike('bow')
    store.getState().hint()
    expect(store.getState()).toMatchObject({ lit: 'twirl', hints: 2 })
  })

  it('a wrong step is only a sound: nothing is lost, and the lit step stays', () => {
    const { store } = challenge()
    store.getState().challenge('welcome')
    store.getState().hint()
    store.getState().strike('clap')
    expect(store.getState()).toMatchObject({ mode: 'follow', lit: 'bow' })
  })

  it('doing it through wins the challenge sticker, told how many hints she used, and not the lesson one', () => {
    const earned: [string, string | undefined][] = []
    const store = createActivityStore<Step>({ ...CONFIG, onChallengeDone: (id, hints) => ['song', `${id}:${hints}`] }, { perform: () => {}, now: () => 0, timers: { set: () => 0, clear: () => {} }, earn: (t, k) => void earned.push([t, k]) })
    store.getState().challenge('welcome')
    store.getState().hint()
    for (const s of ['bow', 'twirl', 'clap'] as Step[]) store.getState().strike(s)
    expect(store.getState()).toMatchObject({ mode: 'free', finished: true, challenging: false })
    expect(earned.filter(([t]) => t === 'song')).toEqual([['song', 'welcome:1']])
  })

  it('help does nothing outside a challenge (a lesson done along already glows), and a missing lesson is no challenge', () => {
    const { store } = challenge()
    store.getState().hint()
    expect(store.getState().hints).toBe(0)
    store.getState().follow('welcome')
    store.getState().hint()
    expect(store.getState().hints).toBe(0)
    store.getState().challenge('nothing')
    expect(store.getState().challenging).toBe(false)
  })

  it('stopping ends the challenge, and a lesson done along afterwards is a lesson again', () => {
    const { store } = challenge()
    store.getState().challenge('welcome')
    store.getState().stop()
    expect(store.getState()).toMatchObject({ mode: 'free', challenging: false })
    store.getState().follow('welcome')
    expect(store.getState().lit).toBe('bow')
  })

  it('tells the surface to start afresh', () => {
    let begun = 0
    const store = createActivityStore<Step>(CONFIG, { perform: () => {}, now: () => 0, timers: { set: () => 0, clear: () => {} }, earn: () => {}, begin: () => void begun++ })
    store.getState().challenge('welcome')
    expect(begun).toBe(1)
  })
})

describe('rewards and progress', () => {
  it('a lesson can win several stickers at once, and the steps done are counted while she does it along', () => {
    const earned: [string, string | undefined][] = []
    const store = createActivityStore<Step>({ ...CONFIG, onLessonDone: (id) => [['song', id], ['take', 'twice']] }, { perform: () => {}, now: () => 0, timers: { set: () => 0, clear: () => {} }, earn: (t, k) => void earned.push([t, k]) })
    store.getState().follow('welcome')
    expect(store.getState().step).toBe(0)
    store.getState().strike('bow')
    expect(store.getState().step).toBe(1)
    store.getState().strike('clap')
    expect(store.getState().step).toBe(1)
    store.getState().strike('twirl')
    store.getState().strike('clap')
    expect(store.getState().step).toBe(0)
    expect(earned.filter(([t]) => t === 'song' || t === 'take')).toEqual([['song', 'welcome'], ['take', 'twice']])
  })
})
