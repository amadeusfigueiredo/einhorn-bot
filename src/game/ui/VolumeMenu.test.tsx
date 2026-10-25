// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { VolumeMenu } from './VolumeMenu'

cleanupAfterEach()
const button = () => screen.getByRole('button', { name: /Volume of the music/ })

describe('VolumeMenu', () => {
  it('is a closed button at first, with no sliders on screen', () => {
    renderUI(<VolumeMenu />, 'en')
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('opens the two sliders next to it, and says so to a screen reader', () => {
    renderUI(<VolumeMenu />, 'en')
    fireEvent.click(button())
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    const close = screen.getByRole('button', { name: 'Close the volume' })
    expect(close.getAttribute('aria-expanded')).toBe('true')
    expect(close.getAttribute('aria-controls')).toBeTruthy()
  })

  it('closes with the button again', () => {
    renderUI(<VolumeMenu />, 'en')
    fireEvent.click(button())
    fireEvent.click(screen.getByRole('button', { name: 'Close the volume' }))
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('closes with Escape, and with a tap elsewhere, but not with a tap on the sliders', () => {
    const { container } = renderUI(
      <div>
        <VolumeMenu />
        <p>elsewhere</p>
      </div>,
      'en'
    )
    fireEvent.click(button())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('slider')).toBeNull()
    fireEvent.click(button())
    fireEvent.pointerDown(screen.getAllByRole('slider')[0])
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    fireEvent.pointerDown(container.querySelector('p')!)
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('other keys leave it open', () => {
    renderUI(<VolumeMenu />, 'en')
    fireEvent.click(button())
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('stops listening when it is closed or gone', () => {
    const view = renderUI(<VolumeMenu />, 'en')
    fireEvent.click(button())
    view.unmount()
    expect(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
      fireEvent.pointerDown(document.body)
    }).not.toThrow()
  })

  it('speaks German and Portuguese', () => {
    const de = renderUI(<VolumeMenu />, 'de')
    expect(screen.getByRole('button', { name: 'Lautstärke von Musik und Geräuschen' })).toBeTruthy()
    de.unmount()
    renderUI(<VolumeMenu />, 'pt')
    expect(screen.getByRole('button', { name: 'Volume da música e dos sons' })).toBeTruthy()
  })
})
