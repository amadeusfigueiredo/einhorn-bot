// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { DEFAULT_EFFECTS_VOLUME, DEFAULT_MUSIC_VOLUME, soundSettings } from '../audio/soundSettings'
import { playSfx } from '../audio/sfx'
import { VolumeControls } from './VolumeControls'

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }))

cleanupAfterEach()
afterEach(() => {
  soundSettings.getState().setMusicVolume(DEFAULT_MUSIC_VOLUME)
  soundSettings.getState().setEffectsVolume(DEFAULT_EFFECTS_VOLUME)
  vi.mocked(playSfx).mockClear()
})

const music = () => screen.getByRole('slider', { name: /Music/ }) as HTMLInputElement
const sounds = () => screen.getByRole('slider', { name: /Sounds/ }) as HTMLInputElement

describe('VolumeControls', () => {
  it('has two sliders, music and sounds, in a labelled group', () => {
    renderUI(<VolumeControls />, 'en')
    expect(screen.getByRole('group', { name: 'Volume' })).toBeTruthy()
    expect(music()).toBeTruthy()
    expect(sounds()).toBeTruthy()
  })

  it('shows where each stands: the music at three quarters, the sounds at full', () => {
    renderUI(<VolumeControls />, 'en')
    expect(music().value).toBe('15')
    expect(sounds().value).toBe('20')
    expect(music().getAttribute('aria-valuetext')).toBe('75 %')
    expect(sounds().getAttribute('aria-valuetext')).toBe('100 %')
    expect(screen.getByText('75')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
  })

  it('the music slider changes the music volume and nothing else', () => {
    renderUI(<VolumeControls />, 'en')
    fireEvent.change(music(), { target: { value: '4' } })
    expect(soundSettings.getState().musicVolume).toBeCloseTo(0.2)
    expect(soundSettings.getState().effectsVolume).toBe(DEFAULT_EFFECTS_VOLUME)
    expect(music().getAttribute('aria-valuetext')).toBe('20 %')
  })

  it('the sounds slider changes the sounds volume and nothing else', () => {
    renderUI(<VolumeControls />, 'en')
    fireEvent.change(sounds(), { target: { value: '10' } })
    expect(soundSettings.getState().effectsVolume).toBeCloseTo(0.5)
    expect(soundSettings.getState().musicVolume).toBe(DEFAULT_MUSIC_VOLUME)
  })

  it('goes all the way down to silence and up to full', () => {
    renderUI(<VolumeControls />, 'en')
    fireEvent.change(music(), { target: { value: '0' } })
    expect(soundSettings.getState().musicVolume).toBe(0)
    fireEvent.change(music(), { target: { value: '20' } })
    expect(soundSettings.getState().musicVolume).toBe(1)
  })

  it('follows a change that came from elsewhere', () => {
    renderUI(<VolumeControls />, 'en')
    act(() => soundSettings.getState().setMusicVolume(0.5))
    expect(music().value).toBe('10')
  })

  it('plays a sample when the sounds slider is let go (mouse, touch or keys), so the child hears how loud it is', () => {
    renderUI(<VolumeControls />, 'en')
    fireEvent.pointerUp(sounds())
    expect(playSfx).toHaveBeenCalledWith('pop')
    fireEvent.keyUp(sounds(), { key: 'ArrowLeft' })
    expect(playSfx).toHaveBeenCalledTimes(2)
  })

  it('plays no sample for the music slider (the music itself changes)', () => {
    renderUI(<VolumeControls />, 'en')
    fireEvent.pointerUp(music())
    fireEvent.keyUp(music(), { key: 'ArrowRight' })
    expect(playSfx).not.toHaveBeenCalled()
  })

  it('speaks German and Portuguese', () => {
    const de = renderUI(<VolumeControls />, 'de')
    expect(screen.getByRole('slider', { name: /Musik/ })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /Geräusche/ })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Lautstärke' })).toBeTruthy()
    de.unmount()
    renderUI(<VolumeControls />, 'pt')
    expect(screen.getByRole('slider', { name: /Música/ })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /Sons/ })).toBeTruthy()
  })
})
