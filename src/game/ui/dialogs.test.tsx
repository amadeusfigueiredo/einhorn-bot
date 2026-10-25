// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderUI, screen, setReducedMotion, cleanupAfterEach, within } from '../../test/ui'
import { languageSettings } from '../i18n/language'
import { profileStore, MAX_NAME_LENGTH } from '../player/playerName'
import { DialogueBox } from './DialogueBox'
import { NameModal } from './NameModal'
import { QuestionCard } from './QuestionCard'
import { StageCard } from './StageCard'
import { LoadingScreen } from './LoadingScreen'
import { SparkleBurst } from './SparkleBurst'
import { STAGES } from '../constants/stages'

cleanupAfterEach()
afterEach(() => {
  vi.useRealTimers()
  setReducedMotion(false)
  profileStore.getState().skip()
})

describe('NameModal (the welcome card)', () => {
  beforeEach(() => {
    // A first visit: no name, not skipped.
    profileStore.setState({ name: null, skipped: false, modalOpen: true })
  })

  it('welcomes the child, asks the name, and has the mascot, a big field and a go button', () => {
    const { container } = renderUI(<NameModal />, 'en')
    expect(screen.getByRole('dialog', { name: 'Welcome to Unicorn Dream School!' })).toBeTruthy()
    expect(screen.getByLabelText('What is your name?')).toBeTruthy()
    expect(screen.getByRole('button', { name: "Let's go!" })).toBeTruthy()
    expect(container.querySelector('.name-modal__mascot')).toBeTruthy()
  })

  it('Tab from the last control goes back to the field, Shift+Tab from the field to the last control: the focus never leaves the card', () => {
    renderUI(<NameModal />, 'en')
    const dialog = screen.getByRole('dialog')
    const controls = dialog.querySelectorAll<HTMLElement>('input, button')
    const first = controls[0]
    const last = controls[controls.length - 1]
    last.focus()
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false)
    expect(document.activeElement).toBe(first)
    expect(fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(last)
  })

  it('Tab in the middle of the card moves on as usual', () => {
    renderUI(<NameModal />, 'en')
    const dialog = screen.getByRole('dialog')
    const controls = dialog.querySelectorAll<HTMLElement>('input, button')
    expect(controls.length).toBeGreaterThan(2)
    controls[1].focus()
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(true)
    expect(fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })).toBe(true)
  })

  it('other keys are left alone', () => {
    renderUI(<NameModal />, 'en')
    expect(fireEvent.keyDown(screen.getByRole('dialog'), { key: 'a' })).toBe(true)
  })

  it('focuses the field so she can type at once', () => {
    renderUI(<NameModal />, 'en')
    expect(document.activeElement).toBe(screen.getByLabelText('What is your name?'))
  })

  it('a name saves, closes the dialog, and is remembered', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.change(screen.getByLabelText('What is your name?'), { target: { value: '  Amara  ' } })
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    expect(profileStore.getState().name).toBe('Amara')
    expect(profileStore.getState().modalOpen).toBe(false)
  })

  it('Enter in the field confirms too', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.change(screen.getByLabelText('What is your name?'), { target: { value: 'Lia' } })
    fireEvent.submit(screen.getByRole('dialog'))
    expect(profileStore.getState().name).toBe('Lia')
  })

  it('an empty name is not accepted: she is asked kindly to write it, the field is marked', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    expect(screen.getByRole('alert').textContent).toBe('Please write your name.')
    expect(screen.getByLabelText('What is your name?').getAttribute('aria-invalid')).toBe('true')
    expect(profileStore.getState().name).toBeNull()
    expect(profileStore.getState().modalOpen).toBe(true)
  })

  it('typing again clears the complaint', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    fireEvent.change(screen.getByLabelText('What is your name?'), { target: { value: 'A' } })
    expect(screen.getByRole('alert').textContent).toBe('')
    expect(screen.getByLabelText('What is your name?').getAttribute('aria-invalid')).toBe('false')
  })

  it('a name made only of brackets and spaces is not a name', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.change(screen.getByLabelText('What is your name?'), { target: { value: ' <<>> {} ' } })
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    expect(profileStore.getState().name).toBeNull()
  })

  it('a long name is cut to 20 letters, and an emoji counts as one', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.change(screen.getByLabelText('What is your name?'), { target: { value: '🦄'.repeat(30) } })
    fireEvent.click(screen.getByRole('button', { name: "Let's go!" }))
    expect(Array.from(profileStore.getState().name!)).toHaveLength(MAX_NAME_LENGTH)
  })

  it('"Play without a name" on a first visit skips it for good', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Play without a name' }))
    expect(profileStore.getState()).toMatchObject({ name: null, skipped: true, modalOpen: false })
  })

  it('later it says "Cancel" instead, and keeps the name', () => {
    profileStore.setState({ name: 'Amara', skipped: false, modalOpen: true })
    renderUI(<NameModal />, 'en')
    expect((screen.getByLabelText('What is your name?') as HTMLInputElement).value).toBe('Amara')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(profileStore.getState()).toMatchObject({ name: 'Amara', modalOpen: false })
  })

  it('Escape closes it', () => {
    profileStore.setState({ name: 'Amara', skipped: false, modalOpen: true })
    renderUI(<NameModal />, 'en')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(profileStore.getState().modalOpen).toBe(false)
  })

  it('Tab stays inside the dialog: from the last button back to the first control', () => {
    renderUI(<NameModal />, 'en')
    const last = screen.getByRole('button', { name: 'Play without a name' })
    last.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getAllByRole('button')[0])
    // And Shift+Tab from the first goes to the last.
    const first = screen.getAllByRole('button')[0]
    first.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('has a language choice, and changing it changes the words on the card', () => {
    renderUI(<NameModal />, 'en')
    fireEvent.click(screen.getByRole('button', { name: /Language/ }))
    act(() => languageSettings.getState().setLang('de'))
    expect(screen.getByRole('dialog', { name: 'Willkommen in der Unicorn Dream School!' })).toBeTruthy()
  })
})

describe('DialogueBox', () => {
  it('shows who is speaking, and the whole line to a screen reader at once', () => {
    renderUI(<DialogueBox text="Hello there, friend!" onContinue={() => {}} />, 'en')
    expect(screen.getByText('Teacher Unicorn')).toBeTruthy()
    expect(screen.getByRole('dialog').querySelector('.visually-hidden')?.textContent).toBe('Hello there, friend!')
  })

  it('types the line out, letter by letter', () => {
    vi.useFakeTimers()
    renderUI(<DialogueBox text="Hello there, friend!" onContinue={() => {}} />, 'en')
    const typed = () => screen.getByRole('dialog').querySelector('.dialogue__text')!.textContent!
    expect(typed().length).toBeLessThan(5)
    act(() => vi.advanceTimersByTime(250))
    expect(typed().length).toBeGreaterThan(2)
    expect(typed().length).toBeLessThan('Hello there, friend!'.length)
    act(() => vi.advanceTimersByTime(2000))
    expect(typed()).toBe('Hello there, friend!')
  })

  it('a tap while typing finishes the line; a tap after goes on', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    renderUI(<DialogueBox text="Hello there, friend!" onContinue={onContinue} />, 'en')
    fireEvent.click(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog').querySelector('.dialogue__text')?.textContent).toBe('Hello there, friend!')
    expect(onContinue).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it.each(['e', 'Enter', ' '])('the %s key does the same', (key) => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    renderUI(<DialogueBox text="Hi!" onContinue={onContinue} />, 'en')
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.keyDown(window, { key })
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('ignores a held-down key (the E that opened the conversation) and other keys', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    renderUI(<DialogueBox text="Hi!" onContinue={onContinue} />, 'en')
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.keyDown(window, { key: 'e', repeat: true })
    fireEvent.keyDown(window, { key: 'x' })
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('does not steal keys typed into a text field', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    renderUI(<div><input aria-label="field" /><DialogueBox text="Hi!" onContinue={onContinue} /></div>, 'en')
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.keyDown(screen.getByLabelText('field'), { key: 'e' })
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('with reduced motion the line is simply there', () => {
    setReducedMotion(true)
    renderUI(<DialogueBox text="Hello there, friend!" onContinue={() => {}} />, 'en')
    expect(screen.getByRole('dialog').querySelector('.dialogue__text')?.textContent).toBe('Hello there, friend!')
    expect(screen.getByRole('dialog').textContent).toContain('Continue with E')
  })

  it('shows the portrait when it has one', () => {
    const { container } = renderUI(<DialogueBox text="Hi" portraitSrc="/p.png" onContinue={() => {}} />)
    expect(container.querySelector('img.dialogue__portrait')?.getAttribute('src')).toBe('/p.png')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })
})

describe('QuestionCard', () => {
  const choices = ['11', '12', '13', '10']

  it('is a modal dialog with the question, labelled by it, and focus inside', () => {
    renderUI(<QuestionCard prompt="What is 7 + 5?" choices={choices} onPick={() => {}} />)
    const d = screen.getByRole('dialog', { name: 'What is 7 + 5?' })
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(d)
  })

  it('one button per answer, lettered A to D', () => {
    renderUI(<QuestionCard prompt="Q" choices={choices} onPick={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['A11', 'B12', 'C13', 'D10'])
  })

  it('a click picks that answer', () => {
    const onPick = vi.fn()
    renderUI(<QuestionCard prompt="Q" choices={choices} onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: /13/ }))
    expect(onPick).toHaveBeenCalledWith(2)
  })

  it.each([['a', 0], ['B', 1], ['c', 2], ['d', 3]])('the %s key picks answer %i', (key, index) => {
    const onPick = vi.fn()
    renderUI(<QuestionCard prompt="Q" choices={choices} onPick={onPick} />)
    fireEvent.keyDown(window, { key })
    expect(onPick).toHaveBeenCalledWith(index)
  })

  it('a letter with no answer, a held key and shortcuts do nothing', () => {
    const onPick = vi.fn()
    renderUI(<QuestionCard prompt="Q" choices={['x', 'y']} onPick={onPick} />)
    fireEvent.keyDown(window, { key: 'c' })
    fireEvent.keyDown(window, { key: 'a', repeat: true })
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'a', metaKey: true })
    expect(onPick).not.toHaveBeenCalled()
  })

  it('shows a personal lead-in when it has one', () => {
    renderUI(<QuestionCard kicker="Amara, do you know this?" prompt="Q" choices={choices} onPick={() => {}} />)
    expect(screen.getByText('Amara, do you know this?')).toBeTruthy()
  })

  it('works with long German answers too', () => {
    renderUI(<QuestionCard prompt="Was passiert bei der Fotosynthese?" choices={['Pflanzen erzeugen mit Licht Sauerstoff und Zucker', 'Pflanzen trinken Öl']} onPick={() => {}} />, 'de')
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})

describe('StageCard', () => {
  it('announces the stage, its subject and the stars for its level', () => {
    vi.useFakeTimers()
    const { container } = renderUI(<StageCard stage={STAGES[7]} stageIndex={7} totalStages={15} />, 'en')
    expect(container.querySelector('.stage-card__stage')?.textContent).toBe('Stage 8 of 15')
    expect(container.querySelector('.stage-card__subject')?.textContent).toBe('Science')
    // medium = two of three stars
    expect(container.querySelector('.stage-card__stars')?.textContent).toBe('★★☆')
  })

  it('has one, two or three stars for easy, medium and hard', () => {
    vi.useFakeTimers()
    const stars = (i: number) => {
      const { container, unmount } = renderUI(<StageCard stage={STAGES[i]} stageIndex={i} totalStages={15} />)
      const t = container.querySelector('.stage-card__stars')?.textContent
      unmount()
      return t
    }
    expect([stars(0), stars(1), stars(2)]).toEqual(['★☆☆', '★★☆', '★★★'])
  })

  it('wishes the child well by name, and not without one', () => {
    vi.useFakeTimers()
    const plain = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    expect(plain.container.querySelector('.stage-card__wish')).toBeNull()
    plain.unmount()
    profileStore.getState().setName('Amara')
    const named = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    expect(named.container.querySelector('.stage-card__wish')?.textContent).toContain('Amara')
  })

  it('is decoration: the page announces the stage elsewhere', () => {
    vi.useFakeTimers()
    const { container } = renderUI(<StageCard stage={STAGES[0]} stageIndex={0} totalStages={15} />)
    expect(container.querySelector('.stage-card')?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('LoadingScreen and SparkleBurst', () => {
  it('says the unicorns are on their way, politely', () => {
    renderUI(<LoadingScreen />, 'en')
    expect(within(screen.getByRole('status')).getByText(/on their way/)).toBeTruthy()
  })

  it('a burst has as many sparkles as asked for, all decoration', () => {
    const { container } = renderUI(<SparkleBurst count={12} />)
    expect(container.querySelectorAll('.sparkle')).toHaveLength(12)
    expect(container.querySelector('.sparkle-burst')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('every sparkle has a colour, a delay and a drift', () => {
    const { container } = renderUI(<SparkleBurst />)
    for (const s of container.querySelectorAll<HTMLElement>('.sparkle')) {
      expect(s.style.backgroundColor).not.toBe('')
      expect(s.style.animationDelay).toMatch(/s$/)
      expect(s.style.getPropertyValue('--drift')).toMatch(/px$/)
    }
  })
})
