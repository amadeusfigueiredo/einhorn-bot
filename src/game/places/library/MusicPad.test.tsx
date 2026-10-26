// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, cleanupAfterEach } from '../../../test/ui'
import { creationsStore } from '../../activity/creations'
import { stickerStore } from '../../stickers/stickerStore'
import { MusicPad } from './MusicPad'
import { musicStore } from './musicStore'
import { BARS, SONGS, songById, songSchedule } from './xylophone'

const rang = vi.hoisted(() => ({ notes: [] as { freq: number }[][] }))
vi.mock('../../audio/sfx', async (orig) => ({ ...(await orig<typeof import('../../audio/sfx')>()), playNotes: (n: { freq: number }[]) => void rang.notes.push(n), playSfx: vi.fn() }))

cleanupAfterEach()
const reset = () => {
  musicStore.getState().close()
  creationsStore.setState({ saved: {} })
  musicStore.setState({ take: [], creations: [], finished: false })
  stickerStore.setState({ counts: {}, seen: {}, got: [], toasts: [], bookOpen: false })
  rang.notes.length = 0
}
beforeEach(reset)
afterEach(() => {
  reset()
  vi.useRealTimers()
})

const open = (lang: 'en' | 'de' | 'pt' = 'en') => {
  const view = renderUI(<MusicPad />, lang)
  act(() => musicStore.getState().openPanel())
  return view
}
const bars = () => screen.getAllByRole('button', { name: /^(Bar|Klangstab|Barra) / })
const key = (k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(window, { key: k, ...init })

describe('MusicPad', () => {
  it('is nothing while the xylophone is closed', () => {
    const { container } = renderUI(<MusicPad />, 'en')
    expect(container.firstChild).toBeNull()
  })

  it('opens as a dialog with eight bars in the colours of the rainbow, each named', () => {
    open()
    expect(screen.getByRole('dialog', { name: 'Xylophone' })).toBeTruthy()
    expect(bars()).toHaveLength(8)
    bars().forEach((b, i) => {
      expect(b.getAttribute('aria-label')).toBe(`Bar ${i + 1}: ${BARS[i].name.en}`)
      expect(b.style.getPropertyValue('--bar-color')).toBe(BARS[i].color)
    })
  })

  it('makes each bar a little shorter than the one before', () => {
    open()
    const lengths = bars().map((b) => Number(b.style.getPropertyValue('--bar-length')))
    for (let i = 1; i < 8; i++) expect(lengths[i]).toBeLessThan(lengths[i - 1])
    expect(lengths[0]).toBe(1)
  })

  it('puts the keyboard on the first bar', () => {
    open()
    expect(document.activeElement).toBe(bars()[0])
  })

  it.each([
    ['de', 'Xylophon', 'Klangstab 7: H'],
    ['pt', 'Xilofone', 'Barra 7: Si'],
  ] as const)('speaks %s', (lang, title, bar) => {
    open(lang)
    expect(screen.getByRole('dialog', { name: title })).toBeTruthy()
    expect(screen.getByRole('button', { name: bar })).toBeTruthy()
  })

  describe('striking', () => {
    it('a press on a bar rings its note, the pitch of that bar', () => {
      open()
      fireEvent.pointerDown(bars()[4])
      expect(rang.notes).toHaveLength(1)
      expect(rang.notes[0][0].freq).toBe(BARS[4].freq)
    })

    it('a mouse click (a press, then a click) rings once, not twice', () => {
      open()
      fireEvent.pointerDown(bars()[2])
      fireEvent.click(bars()[2], { detail: 1 })
      expect(rang.notes).toHaveLength(1)
    })

    it('Enter or Space on a focused bar (a click with no pointer) rings it', () => {
      open()
      fireEvent.click(bars()[6], { detail: 0 })
      expect(rang.notes).toHaveLength(1)
      expect(rang.notes[0][0].freq).toBe(BARS[6].freq)
    })

    it('shows the bar pressed for a moment', () => {
      vi.useFakeTimers()
      open()
      fireEvent.pointerDown(bars()[3])
      expect(bars()[3].className).toContain('is-struck')
      expect(bars()[2].className).not.toContain('is-struck')
      act(() => void vi.advanceTimersByTime(300))
      expect(bars()[3].className).not.toContain('is-struck')
    })

    it('the keys 1 to 8 and A S D F G H J K ring the bars, capital letters too', () => {
      open()
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8']) key(k)
      for (const k of ['a', 's', 'd', 'f', 'g', 'h', 'j', 'K']) key(k)
      expect(rang.notes.map((n) => n[0].freq)).toEqual([...BARS.map((b) => b.freq), ...BARS.map((b) => b.freq)])
    })

    it('other keys do nothing, and a key held down does not ring over and over', () => {
      open()
      key('z')
      key('9')
      key(' ')
      key('1', { repeat: true })
      expect(rang.notes).toHaveLength(0)
    })

    it('a shortcut (Ctrl, Alt or the Command key with a letter) is left alone', () => {
      open()
      key('a', { ctrlKey: true })
      key('s', { metaKey: true })
      key('d', { altKey: true })
      expect(rang.notes).toHaveLength(0)
    })

    it('does not take a letter typed in a field', () => {
      open()
      const field = document.createElement('input')
      document.body.appendChild(field)
      fireEvent.keyDown(field, { key: 'a' })
      field.remove()
      expect(rang.notes).toHaveLength(0)
    })

    it('stops the page from scrolling when it takes a key, and leaves the keys it does not take', () => {
      open()
      const mine = new KeyboardEvent('keydown', { key: '3', cancelable: true, bubbles: true })
      window.dispatchEvent(mine)
      expect(mine.defaultPrevented).toBe(true)
      const other = new KeyboardEvent('keydown', { key: 'x', cancelable: true, bubbles: true })
      window.dispatchEvent(other)
      expect(other.defaultPrevented).toBe(false)
    })

    it('does not listen to the keyboard while it is closed', () => {
      renderUI(<MusicPad />, 'en')
      key('1')
      expect(rang.notes).toHaveLength(0)
    })

    it('stops listening to the keyboard when it closes', () => {
      open()
      act(() => musicStore.getState().close())
      key('1')
      expect(rang.notes).toHaveLength(0)
    })

    it('counts the notes for the stickers: all eight make the musician', () => {
      open()
      for (let i = 0; i < 8; i++) fireEvent.pointerDown(bars()[i])
      expect(stickerStore.getState().got).toContain('musician')
    })
  })

  describe('closing', () => {
    it('the cross closes it', () => {
      open()
      fireEvent.click(screen.getByRole('button', { name: 'Close the xylophone' }))
      expect(musicStore.getState().open).toBe(false)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('Escape closes it, and only it (the game is not also paused by the same key)', () => {
      open()
      let reachedPage = false
      const onBubble = () => void (reachedPage = true)
      window.addEventListener('keydown', onBubble)
      const e = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true })
      act(() => void window.dispatchEvent(e))
      window.removeEventListener('keydown', onBubble)
      expect(musicStore.getState().open).toBe(false)
      expect(e.defaultPrevented).toBe(true)
      expect(reachedPage).toBe(true)
    })
  })

  describe('recording', () => {
    it('Record starts a take, says so, and the button becomes Stop; Stop keeps the tune and "My tune" can be played', () => {
      open()
      expect((screen.getByRole('button', { name: /My tune/ }) as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(screen.getByRole('button', { name: /Record/ }))
      expect(screen.getByRole('status').textContent).toBe('Recording … play your tune!')
      expect(screen.queryByRole('button', { name: /Record/ })).toBeNull()
      expect((screen.getByRole('button', { name: /My tune/ }) as HTMLButtonElement).disabled).toBe(true)
      fireEvent.pointerDown(bars()[0])
      fireEvent.pointerDown(bars()[2])
      fireEvent.click(screen.getByRole('button', { name: /Stop/ }))
      expect(screen.getByRole('button', { name: /Record/ })).toBeTruthy()
      expect((screen.getByRole('button', { name: /My tune/ }) as HTMLButtonElement).disabled).toBe(false)
      expect(musicStore.getState().take.map((t) => t.event)).toEqual([0, 2])
    })

    it('keeps up to three tunes: once she has recorded more than one, a numbered button plays each, and the one she chooses is "My tune"', () => {
      vi.useFakeTimers()
      open()
      const record = (...bar: number[]) => {
        fireEvent.click(screen.getByRole('button', { name: /Record/ }))
        for (const b of bar) fireEvent.pointerDown(bars()[b])
        fireEvent.click(screen.getByRole('button', { name: /Stop/ }))
      }
      record(0, 1, 2, 3)
      expect(screen.queryByRole('button', { name: /Play my creation number/ })).toBeNull()
      record(4, 5, 6, 7)
      expect(screen.getByRole('button', { name: 'Play my creation number 1' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Play my creation number 2' })).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Play my creation number 1' }))
      expect(musicStore.getState().take.map((t) => t.event)).toEqual([0, 1, 2, 3])
      act(() => void vi.advanceTimersByTime(3000))
      vi.useRealTimers()
    })

    it('plays the tune back with the bars lighting up one after the other', () => {
      vi.useFakeTimers()
      open()
      fireEvent.click(screen.getByRole('button', { name: /Record/ }))
      fireEvent.pointerDown(bars()[1])
      act(() => void vi.advanceTimersByTime(500))
      fireEvent.pointerDown(bars()[5])
      fireEvent.click(screen.getByRole('button', { name: /Stop/ }))
      rang.notes.length = 0
      fireEvent.click(screen.getByRole('button', { name: /My tune/ }))
      expect(screen.getByRole('status').textContent).toBe('Listen …')
      act(() => void vi.advanceTimersByTime(10))
      expect(bars()[1].className).toContain('is-lit')
      act(() => void vi.advanceTimersByTime(500))
      expect(bars()[5].className).toContain('is-lit')
      expect(bars()[1].className).not.toContain('is-lit')
      expect(rang.notes.map((n) => n[0].freq)).toEqual([BARS[1].freq, BARS[5].freq])
      act(() => void vi.advanceTimersByTime(2000))
      expect(screen.getByRole('status').textContent).toBe('Tap the colours, or press 1 to 8.')
    })

    it('a tune of four notes played back wins the composer sticker', () => {
      vi.useFakeTimers()
      open()
      fireEvent.click(screen.getByRole('button', { name: /Record/ }))
      for (const i of [0, 1, 2, 3]) {
        fireEvent.pointerDown(bars()[i])
        act(() => void vi.advanceTimersByTime(200))
      }
      fireEvent.click(screen.getByRole('button', { name: /Stop/ }))
      fireEvent.click(screen.getByRole('button', { name: /My tune/ }))
      act(() => void vi.advanceTimersByTime(5000))
      expect(stickerStore.getState().got).toContain('composer')
    })
  })

  describe('songs', () => {
    it('lists the three songs with a name in the language, each with a Listen and a Play-along button', () => {
      open()
      const list = screen.getByRole('list', { name: 'Songs' })
      expect(list.querySelectorAll('li')).toHaveLength(3)
      for (const s of SONGS) {
        expect(screen.getByText(s.name.en)).toBeTruthy()
        expect(screen.getByRole('button', { name: `Listen to ${s.name.en}` })).toBeTruthy()
        expect(screen.getByRole('button', { name: `Play ${s.name.en} along with the lights` })).toBeTruthy()
      }
    })

    it('names them in German too', () => {
      open('de')
      expect(screen.getByText('Alle meine Entchen')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Alle meine Entchen anhören' })).toBeTruthy()
    })

    it('Listen plays the song, lighting the bars, with a Stop button while it plays', () => {
      vi.useFakeTimers()
      open()
      expect(screen.queryByRole('button', { name: /Stop the music/ })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: `Listen to ${songById('ducks')!.name.en}` }))
      expect(screen.getByRole('status').textContent).toBe('Listen …')
      act(() => void vi.advanceTimersByTime(10))
      expect(bars()[0].className).toContain('is-lit')
      act(() => void vi.advanceTimersByTime(songSchedule(songById('ducks')!).at(-1)!.at * 1000))
      expect(rang.notes.length).toBe(songById('ducks')!.notes.length)
      fireEvent.click(screen.getByRole('button', { name: /Stop the music/ }))
      expect(screen.queryByRole('button', { name: /Stop the music/ })).toBeNull()
    })

    it('Play along lights the first bar and asks for it; each right bar lights the next; the end says Bravo', () => {
      open()
      fireEvent.click(screen.getByRole('button', { name: `Play ${songById('twinkle')!.name.en} along with the lights` }))
      expect(screen.getByRole('status').textContent).toBe('Play the glowing colour!')
      const song = songById('twinkle')!
      expect(bars()[song.notes[0].bar].className).toContain('is-lit')
      fireEvent.pointerDown(bars()[song.notes[0].bar])
      expect(bars()[song.notes[1].bar].className).toContain('is-lit')
      for (const n of song.notes.slice(1)) fireEvent.pointerDown(bars()[n.bar])
      expect(screen.getByRole('status').textContent).toBe('Bravo! You played the whole song!')
      expect(stickerStore.getState().got).toContain('songPlayer')
      expect(bars().some((b) => b.className.includes('is-lit'))).toBe(false)
    })

    it('a wrong bar rings but the glow stays where it was', () => {
      open()
      const song = songById('ducks')!
      fireEvent.click(screen.getByRole('button', { name: `Play ${song.name.en} along with the lights` }))
      const wrong = (song.notes[0].bar + 4) % 8
      fireEvent.pointerDown(bars()[wrong])
      expect(rang.notes).toHaveLength(1)
      expect(bars()[song.notes[0].bar].className).toContain('is-lit')
      expect(screen.getByRole('status').textContent).toBe('Play the glowing colour!')
    })

    it('playing all three songs through wins the concert star', () => {
      open()
      for (const s of SONGS) {
        fireEvent.click(screen.getByRole('button', { name: `Play ${s.name.en} along with the lights` }))
        for (const n of s.notes) fireEvent.pointerDown(bars()[n.bar])
      }
      expect(stickerStore.getState().got).toEqual(expect.arrayContaining(['songPlayer', 'concert']))
    })
  })
})
