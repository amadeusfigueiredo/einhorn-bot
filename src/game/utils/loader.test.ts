// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LoaderImageAssets } from '../types'
import { loadAssets, loadAudioAssets, loadImage, loadImageAssets, makeAudio, SHARED_IMAGE_KEYS, stageImageKeys } from './loader'
import { STAGES } from '../constants/stages'

class FakeImage {
  static failing = new Set<string>()
  static created: FakeImage[] = []
  onload: () => void = () => {}
  onerror: (e: unknown) => void = () => {}
  private _src = ''
  constructor() {
    FakeImage.created.push(this)
  }
  set src(value: string) {
    this._src = value
    queueMicrotask(() => ([...FakeImage.failing].some((f) => value.includes(f)) ? this.onerror(new Error('404')) : this.onload()))
  }
  get src() {
    return this._src
  }
}

class FakeAudio {
  static created: FakeAudio[] = []
  static throwFor: string | null = null
  loop = false
  preload = ''
  volume = 1
  src: string
  constructor(src: string) {
    this.src = src
    if (FakeAudio.throwFor && src.includes(FakeAudio.throwFor)) throw new Error('no audio')
    FakeAudio.created.push(this)
  }
}

beforeEach(() => {
  FakeImage.failing.clear()
  FakeImage.created = []
  FakeAudio.created = []
  FakeAudio.throwFor = null
  vi.stubGlobal('Image', FakeImage)
  vi.stubGlobal('Audio', FakeAudio)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadImage', () => {
  it('resolves with the image once it has loaded', async () => {
    const img = await loadImage('/a.png')
    expect(img).toBeInstanceOf(FakeImage)
    expect(img.src).toBe('/a.png')
  })

  it('rejects when the picture is missing', async () => {
    FakeImage.failing.add('missing')
    await expect(loadImage('/missing.png')).rejects.toThrow('404')
  })
})

describe('makeAudio', () => {
  it('makes a looping, fairly quiet player that downloads nothing until it is played', () => {
    const a = makeAudio('/m.m4a') as unknown as FakeAudio
    expect(a.loop).toBe(true)
    expect(a.preload).toBe('none')
    expect(a.volume).toBeCloseTo(0.8)
    expect(a.src).toBe('/m.m4a')
  })

  it.each([undefined, null, ''])('makes nothing for %s', (src) => {
    expect(makeAudio(src)).toBeUndefined()
  })

  it('gives up quietly when the browser cannot make audio', () => {
    FakeAudio.throwFor = 'bad'
    expect(makeAudio('/bad.m4a')).toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })
})

describe('loadImageAssets', () => {
  it('loads the pictures asked for, by name', async () => {
    const keys = ['stage1Background', 'player1'] as Array<keyof LoaderImageAssets>
    const assets = await loadImageAssets({ imageKeys: keys })
    expect(Object.keys(assets).sort()).toEqual(['player1', 'stage1Background'])
    expect(FakeImage.created.map((i) => i.src.split('/').pop()).sort()).toEqual(['player1.png', 'stage1Background.png'])
  })

  it('uses the given folder and extension', async () => {
    await loadImageAssets({ imageKeys: ['player1'], path: '/pics/', ext: '.webp' })
    expect(FakeImage.created[0].src).toMatch(/\/pics\/player1\.webp$/)
  })

  it('a picture that fails is left out and the others still arrive', async () => {
    FakeImage.failing.add('stage1Npc1')
    const assets = await loadImageAssets({ imageKeys: ['stage1Npc1', 'stage1Npc2'] as Array<keyof LoaderImageAssets> })
    expect(Object.keys(assets)).toEqual(['stage1Npc2'])
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('by default asks for the backgrounds, the characters and the player of the shipped art', async () => {
    const assets = await loadImageAssets()
    const keys = Object.keys(assets)
    expect(keys).toContain('stage1Background')
    expect(keys).toContain('stage12Background')
    expect(keys).toContain('stage12Npc3')
    expect(keys).toContain('stage1Npc4')
    expect(keys).toContain('player1')
    // 12 backgrounds + 12x3 characters + the 4th of stage 1 + the player
    expect(keys).toHaveLength(12 + 36 + 1 + 1)
  })
})

describe('loadAudioAssets', () => {
  it('makes a player for each of the four music files', () => {
    const audio = loadAudioAssets()
    expect(Object.keys(audio).sort()).toEqual(['stage1', 'stage11', 'stage12', 'stage2'])
    const files = FakeAudio.created.map((a) => a.src.split('/').pop()).sort()
    expect(files).toEqual(['stage1.m4a', 'stage11.mp4', 'stage12.mp4', 'stage2.m4a'])
  })

  it('leaves out a player the browser could not make, and says so', () => {
    FakeAudio.throwFor = 'stage2'
    const audio = loadAudioAssets()
    expect(audio.stage2).toBeUndefined()
    expect(audio.stage1).toBeDefined()
  })

  it('takes its own list of files', () => {
    const audio = loadAudioAssets({ audioFiles: { stage1: 'x.ogg' }, path: '/sounds/' })
    expect(Object.keys(audio)).toEqual(['stage1'])
    expect((audio.stage1 as unknown as FakeAudio).src).toMatch(/\/sounds\/x\.ogg$/)
  })
})

describe('loadAssets', () => {
  it('brings pictures and music together', async () => {
    const { images, audio } = await loadAssets({ imageKeys: ['player1'] as Array<keyof LoaderImageAssets>, imageExtension: '.jpg' })
    expect(Object.keys(images)).toEqual(['player1'])
    expect(FakeImage.created[0].src).toMatch(/player1\.jpg$/)
    expect(Object.keys(audio)).toHaveLength(4)
  })
})

describe('stageImageKeys', () => {
  it('is the background, the three portraits and the shared pictures of a stage', () => {
    expect(stageImageKeys(STAGES[0])).toEqual(['stage1Background', 'stage1Npc1', 'stage1Npc2', 'stage1Npc3', 'stage1Npc4', 'player1'])
    expect(stageImageKeys(STAGES[5])).toEqual(['stage6Background', 'stage6Npc1', 'stage6Npc2', 'stage6Npc3', 'stage1Npc4', 'player1'])
  })

  it('lets stages 13 to 15 reuse the portraits of 1 to 3 (the same pictures, named once), but not their background: their room is drawn in code', () => {
    for (let i = 0; i < 3; i++) {
      expect(stageImageKeys(STAGES[12 + i])).toEqual(stageImageKeys(STAGES[i]).filter((k) => !k.endsWith('Background')))
    }
  })

  it('names every picture that ships, over all the stages, and no other', () => {
    const all = new Set(STAGES.flatMap((s) => stageImageKeys(s)))
    expect(all.size).toBe(12 + 36 + SHARED_IMAGE_KEYS.length)
    expect(all.has('stage12Npc3')).toBe(true)
  })

  it('has no picture twice for one stage (the fourth unicorn of stage 1 is also a shared one)', () => {
    for (const s of STAGES) {
      const keys = stageImageKeys(s)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('copes with a stage that has no unicorns or an unicorn without a portrait', () => {
    expect(stageImageKeys({ background: 'stage2Background', npcs: undefined })).toEqual(['stage2Background', 'stage1Npc4', 'player1'])
    expect(stageImageKeys({ background: 'stage2Background', npcs: [{ imageKey: undefined }] as never })).toEqual(['stage2Background', 'stage1Npc4', 'player1'])
  })
})
