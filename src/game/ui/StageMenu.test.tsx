// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { StageMenu } from './StageMenu'

cleanupAfterEach()

const gear = () => screen.getByRole('button', { name: /menu/i })

describe('StageMenu', () => {
  it('is a closed gear button at first, with nothing from the panel on screen', () => {
    renderUI(<StageMenu><p>Stage picker</p></StageMenu>)
    expect(gear().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Stage picker')).toBeNull()
  })

  it('opens the panel on a click and says so to a screen reader', () => {
    renderUI(<StageMenu><p>Stage picker</p></StageMenu>)
    fireEvent.click(gear())
    expect(screen.getByText('Stage picker')).toBeTruthy()
    expect(gear().getAttribute('aria-expanded')).toBe('true')
    expect(gear().getAttribute('aria-label')).toBe('Close the menu')
    expect(screen.getByRole('group', { name: 'Menu' })).toBeTruthy()
    expect(gear().getAttribute('aria-controls')).toBe(screen.getByRole('group').id)
  })

  it('closes on a second click on the gear', () => {
    renderUI(<StageMenu><p>Stage picker</p></StageMenu>)
    fireEvent.click(gear())
    fireEvent.click(gear())
    expect(screen.queryByText('Stage picker')).toBeNull()
  })

  it('closes on Escape, and Escape does not reach the game', () => {
    renderUI(<StageMenu><p>Stage picker</p></StageMenu>)
    fireEvent.click(gear())
    const reached: string[] = []
    window.addEventListener('keydown', (e) => reached.push(e.key))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Stage picker')).toBeNull()
    expect(reached).toEqual([])
  })

  it('closes when a tap lands anywhere else, but not when it lands inside the panel', () => {
    renderUI(<div><button type="button">elsewhere</button><StageMenu><p>Stage picker</p></StageMenu></div>)
    fireEvent.click(gear())
    fireEvent.pointerDown(screen.getByText('Stage picker'))
    expect(screen.getByText('Stage picker')).toBeTruthy()
    fireEvent.pointerDown(screen.getByRole('button', { name: 'elsewhere' }))
    expect(screen.queryByText('Stage picker')).toBeNull()
  })

  it('has the label in German too', () => {
    renderUI(<StageMenu><p>x</p></StageMenu>, 'de')
    expect(screen.getByRole('button', { name: 'Menü' })).toBeTruthy()
  })

  it('other keys do nothing', () => {
    renderUI(<StageMenu><p>Stage picker</p></StageMenu>)
    fireEvent.click(gear())
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByText('Stage picker')).toBeTruthy()
  })
})
