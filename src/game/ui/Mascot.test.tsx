// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { Mascot, type MascotPose } from './Mascot'

cleanupAfterEach()

const POSES: MascotPose[] = ['wave', 'happy', 'think', 'proud']

describe('Mascot', () => {
  it('is a picture with a name in the language of the game', () => {
    renderUI(<Mascot />, 'de')
    expect(screen.getByRole('img', { name: 'Einhorn' })).toBeTruthy()
  })

  it.each([['de', 'Einhorn'], ['pt', 'Unicórnio'], ['en', 'Unicorn']] as const)('is called %s: %s', (lang, name) => {
    renderUI(<Mascot />, lang)
    expect(screen.getByRole('img', { name })).toBeTruthy()
  })

  it.each(POSES)('the %s pose draws a unicorn with a horn and a mane', (pose) => {
    const { container } = renderUI(<Mascot pose={pose} />)
    expect(container.querySelectorAll('path').length).toBeGreaterThan(2)
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(5)
    // The golden horn.
    expect(container.querySelector('path[fill="#FFD166"]')).toBeTruthy()
  })

  it('every pose looks different from the others', () => {
    const html = POSES.map((pose) => {
      const { container, unmount } = renderUI(<Mascot pose={pose} />)
      const out = container.innerHTML
      unmount()
      return out
    })
    expect(new Set(html).size).toBe(POSES.length)
  })

  it('only the proud one wears a crown and holds a trophy; only the thinking one has a question mark', () => {
    const text = (pose: MascotPose) => {
      const { container, unmount } = renderUI(<Mascot pose={pose} />)
      const out = { question: container.textContent?.includes('?'), crown: !!container.querySelector('path[d^="M126 46"]') }
      unmount()
      return out
    }
    expect(text('proud').crown).toBe(true)
    expect(text('wave').crown).toBe(false)
    expect(text('think').question).toBe(true)
    expect(text('happy').question).toBe(false)
  })

  it('the happy one jumps and sparkles, the waving one waves its leg', () => {
    const happy = renderUI(<Mascot pose="happy" />).container
    expect(happy.querySelector('.mascot__jump')).toBeTruthy()
    expect(happy.querySelectorAll('.mascot__twinkle').length).toBe(2)
    const wave = renderUI(<Mascot pose="wave" />).container
    expect(wave.querySelector('.mascot__wave')).toBeTruthy()
  })

  it('takes a size and an extra class', () => {
    const { container } = renderUI(<Mascot size={90} className="extra" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('90')
    expect(svg.getAttribute('height')).toBe('90')
    expect(svg.classList.contains('extra')).toBe(true)
    expect(svg.classList.contains('mascot')).toBe(true)
  })
})
