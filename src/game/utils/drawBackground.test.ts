import { describe, it, expect } from 'vitest'
import { drawBackground } from './drawBackground'
import { image, recorder, count } from '../../test/canvas'
import type { LoaderImageAssets, StageConfig } from '../types'

const stage = (background?: string) => ({ background }) as unknown as StageConfig
const assets = (a: Record<string, HTMLImageElement>) => a as unknown as LoaderImageAssets

describe('drawBackground', () => {
  it("draws the stage's own picture, cropped from the middle to cover the whole screen", () => {
    const { ctx, calls } = recorder()
    // A wide picture on a square screen: the sides are cut off, nothing is stretched.
    drawBackground(ctx, stage('stage3Background'), assets({ stage3Background: image(2000, 1000) }), 1000, 1000)
    expect(calls).toEqual(['drawImage:obj,500,0,1000,1000,0,0,1000,1000'])
  })

  it('a tall picture on a wide screen is cut at the top and bottom', () => {
    const { ctx, calls } = recorder()
    drawBackground(ctx, stage('stage1Background'), assets({ stage1Background: image(1000, 2000) }), 1000, 500)
    expect(calls).toEqual(['drawImage:obj,0,750,1000,500,0,0,1000,500'])
  })

  it('a picture with the screen\'s own shape is drawn whole', () => {
    const { ctx, calls } = recorder()
    drawBackground(ctx, stage('stage1Background'), assets({ stage1Background: image(800, 450) }), 1600, 900)
    expect(calls).toEqual(['drawImage:obj,0,0,800,450,0,0,1600,900'])
  })

  it('when its own picture is missing (or the stage has none) the room is drawn in code, not another stage\'s picture', () => {
    const { ctx, calls } = recorder()
    const a = assets({ stage5Background: image(100, 100), stage9Background: image(100, 100) })
    drawBackground(ctx, { name: 'stage13' } as unknown as StageConfig, a, 1000, 600)
    expect(count(calls, 'drawImage')).toBe(0)
    // the ice-cream studio's pink wall, its floor and its trim
    expect(calls.filter((c) => c.startsWith('fillRect')).length).toBeGreaterThan(3)
    expect(calls).toContain('fillRect:0,272,1000,8')
  })

  it('works when the stage names no picture at all (the room of the stage is drawn)', () => {
    const { ctx, calls } = recorder()
    drawBackground(ctx, { name: 'stage15' } as unknown as StageConfig, assets({ stage1Background: image(100, 100) }), 100, 100)
    expect(count(calls, 'drawImage')).toBe(0)
    expect(count(calls, 'fillRect')).toBeGreaterThan(3)
  })

  it('with no pictures and no known room it paints the screen black so it is never blank', () => {
    const { ctx, calls } = recorder()
    drawBackground(ctx, stage('stage1Background'), assets({}), 640, 360)
    expect(calls).toContain('fillRect:0,0,640,360')
    expect(count(calls, 'drawImage')).toBe(0)
  })

  it('still paints something while the pictures are loading (no assets object yet)', () => {
    const { ctx, calls } = recorder()
    drawBackground(ctx, stage('stage1Background'), undefined as never, 640, 360)
    expect(calls).toContain('fillRect:0,0,640,360')
  })
})
