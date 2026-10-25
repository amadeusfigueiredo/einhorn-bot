// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen, within } from '../../test/ui'
import { COATS, DEFAULT_OUTFIT, HORNS, TRIM_IDS, WEARABLES } from '../player/outfit'
import { outfitSettings } from '../player/outfitSettings'
import { SWEATER_IDS } from '../views/three/amara/amaraLook'

import Wardrobe from './Wardrobe'

cleanupAfterEach()
afterEach(() => {
  outfitSettings.getState().reset()
})

const group = (name: string) => within(screen.getByRole('group', { name }))
const pressed = (g: ReturnType<typeof group>) => g.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('aria-label'))

describe('the wardrobe', () => {
  it('has a row of choices for the coat, the horn, what to wear and Amara\'s sweater, with what is worn now pressed', () => {
    renderUI(<Wardrobe onClose={() => {}} />, 'en')
    expect(group('Coat').getAllByRole('button')).toHaveLength(Object.keys(COATS).length)
    expect(group('Horn').getAllByRole('button')).toHaveLength(HORNS.length)
    expect(group('Wearing').getAllByRole('button')).toHaveLength(WEARABLES.length)
    expect(group("Amara's sweater").getAllByRole('button')).toHaveLength(SWEATER_IDS.length)
    expect(pressed(group('Coat'))).toEqual(['White'])
    expect(pressed(group('Horn'))).toEqual(['Plain'])
    expect(pressed(group('Wearing'))).toEqual(['Nothing'])
    expect(pressed(group("Amara's sweater"))).toEqual(['Rainbow'])
  })

  it('a tap on a choice puts it on, at once, and presses it', () => {
    renderUI(<Wardrobe onClose={() => {}} />, 'en')
    fireEvent.click(group('Coat').getByRole('button', { name: 'Pink' }))
    fireEvent.click(group('Horn').getByRole('button', { name: 'Star' }))
    fireEvent.click(group('Wearing').getByRole('button', { name: 'Crown' }))
    fireEvent.click(group("Amara's sweater").getByRole('button', { name: 'Sunset' }))
    expect(outfitSettings.getState()).toMatchObject({ coat: 'pink', horn: 'star', accessory: 'crown', sweater: 'sunset' })
    expect(pressed(group('Coat'))).toEqual(['Pink'])
    expect(pressed(group('Wearing'))).toEqual(['Crown'])
  })

  it('asks for a colour only when something is worn', () => {
    renderUI(<Wardrobe onClose={() => {}} />, 'en')
    expect(screen.queryByRole('group', { name: 'Colour' })).toBeNull()
    fireEvent.click(group('Wearing').getByRole('button', { name: 'Bow' }))
    expect(group('Colour').getAllByRole('button')).toHaveLength(TRIM_IDS.length)
    fireEvent.click(group('Colour').getByRole('button', { name: 'Violet' }))
    expect(outfitSettings.getState().trim).toBe('violet')
    fireEvent.click(group('Wearing').getByRole('button', { name: 'Nothing' }))
    expect(screen.queryByRole('group', { name: 'Colour' })).toBeNull()
  })

  it('"Back to normal" takes everything off, and "Done" leaves', () => {
    const onClose = vi.fn()
    outfitSettings.getState().choose({ coat: 'mint', horn: 'curly', accessory: 'scarf', sweater: 'night' })
    renderUI(<Wardrobe onClose={onClose} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Back to normal' }))
    const s = outfitSettings.getState()
    expect({ sweater: s.sweater, coat: s.coat, horn: s.horn, accessory: s.accessory, trim: s.trim }).toEqual(DEFAULT_OUTFIT)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('follows a change made somewhere else', () => {
    renderUI(<Wardrobe onClose={() => {}} />, 'en')
    act(() => outfitSettings.getState().choose({ coat: 'sky' }))
    expect(pressed(group('Coat'))).toEqual(['Sky'])
  })

  it('has no picture of the two of them (that is the 3D game): the choices are all there is', () => {
    renderUI(<Wardrobe onClose={() => {}} />, 'en')
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByRole('group', { name: 'Coat' })).toBeTruthy()
  })

  it('starts at the top with the title where the focus is', () => {
    renderUI(<Wardrobe onClose={() => {}} />, 'en')
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: /Dress-up/ }))
  })

  it('speaks German and Portuguese, down to the names of the choices', () => {
    const de = renderUI(<Wardrobe onClose={() => {}} />, 'de')
    expect(screen.getByRole('group', { name: 'Fell' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sonnenbrille' })).toBeTruthy()
    de.unmount()
    renderUI(<Wardrobe onClose={() => {}} />, 'pt')
    expect(screen.getByRole('group', { name: 'Pelo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Óculos de sol' })).toBeTruthy()
  })
})
