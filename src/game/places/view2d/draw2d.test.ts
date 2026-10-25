import { describe, expect, it, vi } from 'vitest'
import { DOOR_THEMES } from '../../film/filmData'
import { PLAYER_LOOK } from '../../data/unicornLooks'
import { doorSignText } from '../../hall/hallText'
import { translate } from '../../i18n/translate'
import { HALL_WALKERS } from '../../hall/hallFolk'
import { HALL, HALL_BENCH, benchX, sectionGaps } from '../../hall/hallLayout'
import { count, recorder } from '../../../test/canvas'
import { drawBackdrop, drawDoor, playerDrawable, standing, type Scene2D } from './draw2d'
import { frameFor } from './frame2d'
import { PLACE_DOOR_THEMES } from '../placeDoors'

/** The first `n` classes are finished. */
const first = (n: number) => Array.from({ length: 15 }, (_, i) => i < n)
const scene = (over: Partial<Scene2D> = {}): Scene2D => ({ t: 1, reduceMotion: false, lang: 'en', done: first(0), ...over })
const texts = (calls: string[]) => calls.filter((c) => c.startsWith('fillText:')).map((c) => c.slice(9).split(',')[0])

function backdrop(place: 'yard' | 'library' | 'hall' | 'sports' | 'pony' | 'pool' | 'dojo' | 'dance', camX = 0, s = scene(), W = 1280, H = 720) {
  const r = recorder()
  drawBackdrop(r.ctx, frameFor(place, W, H, camX), s)
  return r
}

function everything(place: 'yard' | 'library' | 'hall' | 'sports' | 'pony' | 'pool' | 'dojo' | 'dance', camX = 0, s = scene(), W = 1280, H = 720) {
  const r = recorder()
  const f = frameFor(place, W, H, camX)
  drawBackdrop(r.ctx, f, s)
  const items = [...standing(r.ctx, f, s), playerDrawable(r.ctx, f, s, { x: camX, z: 0, facingLeft: false, moving: false, look: PLAYER_LOOK })]
  items.sort((a, b) => a.z - b.z).forEach((d) => d.draw())
  return { ...r, items }
}

describe('the 2D rooms: backdrop and doors', () => {
  it('clears the picture first, and every room paints its wall and floor', () => {
    for (const place of ['yard', 'library', 'hall', 'sports', 'pony', 'pool', 'dojo', 'dance'] as const) {
      const { calls } = backdrop(place)
      expect(calls[0], place).toBe('clearRect:0,0,1280,720')
      expect(count(calls, 'fillRect'), place).toBeGreaterThanOrEqual(3)
    }
  })

  it('the library has a door to the yard and one to the corridor, with their signs', () => {
    expect(texts(backdrop('library').calls)).toEqual([translate('en', 'places.toYard'), translate('en', 'places.toHall')])
  })

  it('the sports hall has its four archways, each with its name, and the door back to the corridor', () => {
    const t = texts(backdrop('sports').calls)
    for (const key of ['sports.pony', 'sports.pool', 'sports.dojo', 'sports.dance', 'places.toHall'] as const) expect(t).toContain(translate('en', key))
    expect(texts(backdrop('sports', 0, scene({ lang: 'de' })).calls)).toContain('Tanzsaal')
    expect(everything('sports').items).toHaveLength(1)
  })

  it('the pony yard has the door back to the sports hall, with its sign, and nothing else on its floor but her', () => {
    expect(texts(backdrop('pony').calls)).toEqual([translate('en', 'places.toSports')])
    expect(everything('pony').items).toHaveLength(1)
  })

  it('the pool, the dojo and the dance hall each have the door back to the sports hall and nothing else on their floor', () => {
    for (const place of ['pool', 'dojo', 'dance'] as const) {
      expect(texts(backdrop(place).calls), place).toEqual([translate('en', 'places.toSports')])
      expect(everything(place).items, place).toHaveLength(1)
    }
  })

  it('the corridor shows the three big doors at its far end, unless ?rooms=0 closes them (the sports hall, the tech room, the science room)', () => {
    const at = (x: number) => texts(backdrop('hall', x).calls)
    expect(at(31)).toContain(translate('en', 'places.toSports'))
    expect(at(26)).toContain(translate('en', 'places.toTech'))
    expect(at(21)).toContain(translate('en', 'places.toScience'))
    expect(at(-29)).not.toContain(translate('en', 'places.toSports'))
    vi.stubGlobal('window', { location: { search: '?rooms=0' } })
    for (const x of [21, 26, 31]) expect(at(x).some((t) => /^To the (sports|tech|science)/.test(t))).toBe(false)
    vi.unstubAllGlobals()
  })

  it('the yard has the door back to the class', () => {
    expect(texts(backdrop('yard', -12).calls)).toContain(translate('en', 'places.toClass'))
  })

  it('the signs speak the language of the game', () => {
    expect(texts(backdrop('library', 0, scene({ lang: 'de' })).calls)).toEqual([translate('de', 'places.toYard'), translate('de', 'places.toHall')])
  })

  it('the corridor shows its doors in order, each with its sign, and the banners of the subjects', () => {
    const t = texts(backdrop('hall', -29, scene({ done: first(3) })).calls)
    expect(t).toContain(doorSignText('en', 0))
    expect(t).toContain(translate('en', 'hall.exitDoor'))
    expect(t.some((x) => /Maths/.test(x))).toBe(true)
  })

  it('only the doors on the screen are drawn: further along the corridor there are other ones', () => {
    const start = texts(backdrop('hall', -29).calls)
    const end = texts(backdrop('hall', 11).calls)
    expect(start).toContain(doorSignText('en', 1))
    expect(start).not.toContain(doorSignText('en', 13))
    expect(end).toContain(doorSignText('en', 13))
    expect(end).not.toContain(doorSignText('en', 1))
  })

  it('the next door still to do has a "New!" badge, once; with every class done there is none', () => {
    const doorsAt = (n: number) => backdrop('hall', -29, scene({ done: first(n) })).calls
    expect(texts(doorsAt(1))).toContain(translate('en', 'hall.doorNew'))
    expect(texts(doorsAt(0)).filter((x) => x === translate('en', 'hall.doorNew'))).toHaveLength(1)
    expect(texts(doorsAt(15)).filter((x) => x === translate('en', 'hall.doorNew'))).toHaveLength(0)
  })

  it('no door has a padlock: every door of the corridor is open, whatever is done', () => {
    for (const n of [0, 3, 15]) expect(backdrop('hall', -29, scene({ done: first(n) })).calls.filter((c) => c === 'strokeStyle=#E0A93B')).toHaveLength(0)
  })

  it('the next one is the first still to do, even when later classes are finished: a finished class has a star over it, a plain one has nothing', () => {
    const done = first(0).map((_, i) => i === 1 || i === 2)
    const t = texts(backdrop('hall', -29, scene({ done })).calls)
    // class 1 is the next one to do: its badge is up; classes 2 and 3 are finished
    expect(t.filter((x) => x === translate('en', 'hall.doorNew'))).toHaveLength(1)
  })

  it('the school corridor is lilac and the yard is green and blue', () => {
    expect(backdrop('hall').calls).toContain('fillStyle=#E3D8FF')
    expect(backdrop('yard').calls).toContain('fillStyle=#7FD08A')
    expect(backdrop('library').calls).toContain('fillStyle=#C98F55')
  })

  it('the floor goes all the way to the bottom of the screen', () => {
    for (const place of ['yard', 'library', 'hall'] as const) {
      const f = frameFor(place, 1280, 720, 0)
      const round = (n: number) => Math.round(n * 100) / 100
      expect(backdrop(place, 0, scene(), 1280, 720).calls, place).toContain(`fillRect:0,${round(f.horizon)},1280,${round(720 - f.horizon)}`)
    }
  })
})

describe('the 2D rooms: what moves', () => {
  it('the clouds drift, the swing swings and the fish swim, and with reduced motion they hold still', () => {
    for (const place of ['yard', 'library'] as const) {
      const a = everything(place, 0, scene({ t: 0.3 })).calls.join('|')
      const b = everything(place, 0, scene({ t: 2.9 })).calls.join('|')
      expect(a, place).not.toBe(b)
      expect(everything(place, 0, scene({ t: 0.3, reduceMotion: true })).calls.join('|'), place).toBe(everything(place, 0, scene({ t: 2.9, reduceMotion: true })).calls.join('|'))
    }
  })

  it('the children walk along the corridor, and stand in the middle of their way with reduced motion', () => {
    const at = (t: number, reduceMotion = false) => everything('hall', -29, scene({ t, reduceMotion })).calls.join('|')
    expect(at(1)).not.toBe(at(6))
    expect(at(1, true)).toBe(at(6, true))
  })

  it('the next door pulses and its badge bounces, and both are still with reduced motion', () => {
    const at = (t: number, reduceMotion: boolean) => backdrop('hall', -29, scene({ t, reduceMotion, done: first(1) })).calls.join('|')
    expect(at(0.2, false)).not.toBe(at(1.1, false))
    expect(at(0.2, true)).toBe(at(1.1, true))
  })
})

describe('the 2D rooms: what stands in them', () => {
  it('the library has its table, desk with the owl, the reading unicorn and the things to play with', () => {
    const { items, calls } = everything('library')
    // table, desk, nook, globe, lamp, aquarium, xylophone, easel, and the player
    expect(items).toHaveLength(9)
    expect(count(calls, 'ellipse')).toBeGreaterThan(60)
  })

  it('the yard has its play things and its two friends when they are in view, and only those', () => {
    const near = everything('yard', 0).items.length
    const far = everything('yard', 12).items.length
    expect(near).toBeGreaterThan(4)
    expect(far).not.toBe(near)
  })

  it('the corridor has the walkers, the koala on the bench and the penguin and capybara when in view', () => {
    const zs = (camX: number) => everything('hall', camX).items.map((i) => i.z)
    // the bench with the koala is in the first gap, the penguin and the capybara in the fourth, and the walkers keep to their own stretch
    expect(zs(benchX())).toContain(HALL_BENCH.z)
    expect(zs(HALL.halfW - 7)).not.toContain(HALL_BENCH.z)
    expect(zs(sectionGaps()[3])).toEqual(expect.arrayContaining([1.2, 1.6]))
    expect(zs(-29)).not.toEqual(expect.arrayContaining([1.2, 1.6]))
    expect(zs(-23 + HALL.startX + 24.8)).toContain(HALL_WALKERS[0].z)
  })

  it('draws the further things first and the player where she stands', () => {
    const f = frameFor('library', 1280, 720, 0)
    const r = recorder()
    const back = playerDrawable(r.ctx, f, scene(), { x: 0, z: -1, facingLeft: false, moving: false, look: PLAYER_LOOK })
    const front = playerDrawable(r.ctx, f, scene(), { x: 0, z: 2, facingLeft: true, moving: true, look: PLAYER_LOOK })
    expect(back.z).toBeLessThan(front.z)
    front.draw()
    expect(r.calls).toContain('scale:-1,1')
  })

  it('she hops a little while she walks, and not with reduced motion', () => {
    const feet = (moving: boolean, reduceMotion: boolean, t: number) => {
      const r = recorder()
      playerDrawable(r.ctx, frameFor('library', 1280, 720, 0), scene({ t, reduceMotion }), { x: 0, z: 0, facingLeft: false, moving, look: PLAYER_LOOK }).draw()
      return r.calls.find((c) => c.startsWith('translate:'))
    }
    expect(feet(true, false, 0.05)).not.toBe(feet(true, false, 0.17))
    expect(feet(false, false, 0.05)).toBe(feet(false, false, 0.17))
    expect(feet(true, true, 0.05)).toBe(feet(true, true, 0.17))
  })
})

describe('drawDoor', () => {
  const door = (opts: Parameters<typeof drawDoor>[6] = {}, label = 'Door') => {
    const r = recorder()
    drawDoor(r.ctx, 100, 300, 60, PLACE_DOOR_THEMES.library, label, opts)
    return r
  }

  it('stands on the floor at its foot, with its sign over it and a balanced save and restore', () => {
    const { calls } = door()
    expect(texts(calls)).toEqual(['Door'])
    expect(count(calls, 'save')).toBe(count(calls, 'restore'))
  })

  it('a finished door has a star over it (its sign moves up to make room)', () => {
    const plain = door({}).calls.find((c) => c.startsWith('fillText'))!
    const done = door({ state: 'done' }).calls.find((c) => c.startsWith('fillText'))!
    expect(Number(done.split(',')[2])).toBeLessThan(Number(plain.split(',')[2]))
  })

  it('the next door glows, and bounces its badge', () => {
    const next = door({ state: 'next', badge: 'New!', t: 0.2 })
    expect(texts(next.calls)).toEqual(['New!', 'Door'])
    expect(next.calls.join('|')).not.toBe(door({ state: 'next', badge: 'New!', t: 0.9 }).calls.join('|'))
    expect(door({ state: 'next', badge: 'New!', t: 0.2, reduceMotion: true }).calls.join('|')).toBe(door({ state: 'next', badge: 'New!', t: 0.9, reduceMotion: true }).calls.join('|'))
  })

  it('needs no clock: without a time the next door is as at time zero', () => {
    expect(door({ state: 'next', badge: 'New!' }).calls.join('|')).toBe(door({ state: 'next', badge: 'New!', t: 0 }).calls.join('|'))
  })

  it('shows the class through its round window, in the colour it is told, else in the glow of the door', () => {
    expect(door({ windowColor: '#123456' }).calls).toContain('fillStyle=#123456')
    expect(door({}).calls).toContain(`fillStyle=${PLACE_DOOR_THEMES.library.glow}`)
    expect(DOOR_THEMES).toHaveLength(15)
  })

  it('a long sign is kept inside the width it is given', () => {
    const calls = door({ signWidth: 80 }, 'A very long name for a class').calls
    expect(calls.find((c) => c.startsWith('fillText'))!.split(',').slice(-1)[0]).toBe('69.8')
  })
})
