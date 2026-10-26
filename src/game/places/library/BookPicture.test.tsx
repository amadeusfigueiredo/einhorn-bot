// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { BOOK_ART, PAGE_SIZE, PROP_KINDS, type Prop, type Scene } from './bookArt'
import { BookPicture } from './BookPicture'

afterEach(cleanup)
const sceneWith = (props: Prop[], over: Partial<Scene> = {}): Scene => ({ sky: ['#112233', '#445566'], props, ...over })

describe('BookPicture', () => {
  it('is a drawing for the eyes only: hidden from screen readers, not a tab stop', () => {
    const { container } = render(<BookPicture scene={sceneWith([{ kind: 'star', x: 50, y: 50 }])} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${PAGE_SIZE} ${PAGE_SIZE}`)
  })

  it.each(PROP_KINDS)('can draw a %s: something, and nothing outside its own group', (kind) => {
    const { container } = render(<BookPicture scene={sceneWith([{ kind, x: 100, y: 100, text: '7', color: '#FF0000', mood: 'asleep' }])} />)
    const group = container.querySelector(`[data-kind="${kind}"]`)!
    expect(group).toBeTruthy()
    expect(group.children.length).toBeGreaterThan(0)
  })

  it('draws every kind in both moods without a problem', () => {
    for (const mood of [undefined, 'asleep', 'up'] as const) {
      const { container } = render(<BookPicture scene={sceneWith(PROP_KINDS.map((kind, i) => ({ kind, x: 20 + i * 8, y: 100, mood, text: '1' })))} />)
      expect(container.querySelectorAll('[data-kind]')).toHaveLength(PROP_KINDS.length)
      cleanup()
    }
  })

  it('puts each thing where the scene says, at its size, and turns it round when told', () => {
    const { container } = render(<BookPicture scene={sceneWith([{ kind: 'heart', x: 40, y: 60, s: 0.5 }, { kind: 'heart', x: 140, y: 90, flip: true }])} />)
    const [a, b] = [...container.querySelectorAll('[data-kind]')]
    expect(a.getAttribute('transform')).toBe('translate(40 60) scale(0.5 0.5)')
    expect(b.getAttribute('transform')).toBe('translate(140 90) scale(-1 1)')
  })

  it('draws the things back to front, in the order of the scene', () => {
    const { container } = render(<BookPicture scene={sceneWith([{ kind: 'cloud', x: 40, y: 40 }, { kind: 'star', x: 60, y: 60 }, { kind: 'moon', x: 80, y: 80 }])} />)
    expect([...container.querySelectorAll('[data-kind]')].map((g) => g.getAttribute('data-kind'))).toEqual(['cloud', 'star', 'moon'])
  })

  it('paints the sky from the top colour to the bottom colour', () => {
    const { container } = render(<BookPicture scene={sceneWith([{ kind: 'star', x: 50, y: 50 }])} />)
    const stops = [...container.querySelectorAll('stop')]
    expect(stops.map((s) => s.getAttribute('stop-color'))).toEqual(['#112233', '#445566'])
  })

  it('draws a hill for the ground, where the scene says, and none when there is none', () => {
    const withGround = render(<BookPicture scene={sceneWith([], { ground: { color: '#8CE99A', y: 130 } })} />)
    const hill = withGround.container.querySelector('ellipse')!
    expect(hill.getAttribute('fill')).toBe('#8CE99A')
    expect(Number(hill.getAttribute('cy')) - Number(hill.getAttribute('ry'))).toBe(130)
    cleanup()
    const without = render(<BookPicture scene={sceneWith([])} />)
    expect(without.container.querySelector('ellipse')).toBeNull()
  })

  it('gives each picture its own sky, so two on a page do not share a gradient', () => {
    const { container } = render(
      <>
        <BookPicture scene={sceneWith([])} />
        <BookPicture scene={sceneWith([])} />
      </>
    )
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id)
    expect(new Set(ids).size).toBe(2)
    const fills = [...container.querySelectorAll('svg > rect')].map((r) => r.getAttribute('fill'))
    expect(fills).toEqual(ids.map((id) => `url(#${id})`))
  })

  it('draws the digit of a number, in the text of the scene', () => {
    const { container } = render(<BookPicture scene={sceneWith([{ kind: 'number', x: 50, y: 50, text: '3' }])} />)
    expect(container.querySelector('text')!.textContent).toBe('3')
  })

  it('shows a sleeping koala and a waking one differently (shut eyes are curves, open ones are dots)', () => {
    const awake = render(<BookPicture scene={sceneWith([{ kind: 'koala', x: 100, y: 100 }])} />)
    const dots = awake.container.querySelectorAll('[data-kind="koala"] circle[r="3"]').length
    cleanup()
    const asleep = render(<BookPicture scene={sceneWith([{ kind: 'koala', x: 100, y: 100, mood: 'asleep' }])} />)
    expect(asleep.container.querySelectorAll('[data-kind="koala"] circle[r="3"]').length).toBeLessThan(dots)
    expect(asleep.container.querySelectorAll('[data-kind="koala"] g[stroke] path').length).toBeGreaterThan(0)
  })

  it('draws every real page of every book', () => {
    for (const scenes of Object.values(BOOK_ART)) for (const s of scenes) {
      const { container } = render(<BookPicture scene={s} />)
      expect(container.querySelectorAll('[data-kind]')).toHaveLength(s.props.length)
      cleanup()
    }
  })
})
