// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { POPUPS } from '../data/popups'
import { profileStore } from '../player/playerName'
import { FeedbackPopup } from './FeedbackPopup'

cleanupAfterEach()
afterEach(() => profileStore.getState().skip())

describe('FeedbackPopup: right', () => {
  it('says "Right!", cheers with the mascot and a star', () => {
    const { container } = renderUI(<FeedbackPopup config={POPUPS.WIN} seed={1} />, 'en')
    expect(screen.getByRole('heading', { name: 'Correct!' })).toBeTruthy()
    expect(screen.getByText(/\+1 star/)).toBeTruthy()
    expect(container.querySelector('.popup--win')).toBeTruthy()
    expect(container.querySelector('.mascot__jump')).toBeTruthy()
    expect(container.querySelectorAll('.sparkle').length).toBeGreaterThan(10)
  })

  it('has no button: it goes away by itself', () => {
    renderUI(<FeedbackPopup config={POPUPS.WIN} seed={1} onDismiss={() => {}} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is announced politely, and is in German, Portuguese and English', () => {
    for (const [lang, title] of [['de', 'Richtig!'], ['pt', null], ['en', 'Correct!']] as const) {
      const { unmount } = renderUI(<FeedbackPopup config={POPUPS.WIN} seed={0} />, lang)
      expect(screen.getByRole('status')).toBeTruthy()
      if (title) expect(screen.getByRole('heading', { name: title })).toBeTruthy()
      else expect(screen.getByRole('heading').textContent!.length).toBeGreaterThan(2)
      unmount()
    }
  })

  it('uses the child\'s name when it knows it, and never leaves a placeholder', () => {
    profileStore.getState().setName('Amara')
    renderUI(<FeedbackPopup config={POPUPS.WIN} seed={0} />, 'en')
    expect(screen.getByRole('status').textContent).toContain('Amara')
    expect(screen.getByRole('status').textContent).not.toMatch(/[{}]/)
  })

  it('the same seed gives the same line, other seeds give other lines', () => {
    const line = (seed: number) => {
      const { container, unmount } = renderUI(<FeedbackPopup config={POPUPS.WIN} seed={seed} />)
      const t = container.querySelector('.popup__text')?.textContent
      unmount()
      return t
    }
    expect(line(3)).toBe(line(3))
    expect(new Set([0, 1, 2, 3].map(line)).size).toBeGreaterThan(1)
  })
})

describe('FeedbackPopup: almost', () => {
  it('says "Almost!", thinks, shows the right answer kindly, and offers to try again', () => {
    const { container } = renderUI(<FeedbackPopup config={POPUPS.TRY_AGAIN} seed={1} answer="20" onDismiss={() => {}} />, 'en')
    expect(screen.getByRole('heading', { name: 'Almost!' })).toBeTruthy()
    expect(screen.getByText('The right answer: 20')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
    expect(container.querySelector('.popup--wrong')).toBeTruthy()
    expect(container.querySelector('.mascot')?.textContent).toContain('?')
  })

  it('the button closes it at once', () => {
    const onDismiss = vi.fn()
    renderUI(<FeedbackPopup config={POPUPS.TRY_AGAIN} seed={1} answer="20" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('without an answer to show, there is no answer line (and no empty box)', () => {
    const { container } = renderUI(<FeedbackPopup config={POPUPS.TRY_AGAIN} seed={1} onDismiss={() => {}} />)
    expect(container.querySelector('.popup__answer')).toBeNull()
  })

  it('without a way to dismiss, there is no button', () => {
    renderUI(<FeedbackPopup config={POPUPS.TRY_AGAIN} seed={1} answer="x" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('says the answer in the language of the game', () => {
    renderUI(<FeedbackPopup config={POPUPS.TRY_AGAIN} seed={1} answer="Katze" onDismiss={() => {}} />, 'de')
    expect(screen.getByText('Die richtige Antwort: Katze')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nochmal' })).toBeTruthy()
  })

  it('has no sparkles and is never red', () => {
    const { container } = renderUI(<FeedbackPopup config={POPUPS.TRY_AGAIN} seed={1} answer="1" onDismiss={() => {}} />)
    expect(container.querySelectorAll('.sparkle')).toHaveLength(0)
    expect(container.innerHTML).not.toMatch(/#ff0000|#f00\b|color:\s*red|❌/i)
  })
})

describe('FeedbackPopup: class done, but not the whole school', () => {
  it('is a happy message (the mascot cheers, there are sparkles) that says the class is done and how many are still waiting', () => {
    const { container } = renderUI(<FeedbackPopup config={POPUPS.FINISH_ALL} seed={1} left={4} />, 'en')
    expect(screen.getByRole('heading', { name: 'Class done!' })).toBeTruthy()
    expect(screen.getByText('But the school is not finished yet: 4 classes are still waiting for you.')).toBeTruthy()
    expect(container.querySelector('.popup--win')).toBeTruthy()
    expect(container.querySelectorAll('.sparkle').length).toBeGreaterThan(10)
    // it is not the "right answer" message: no "+1 star"
    expect(screen.queryByText(/\+1 star/)).toBeNull()
  })

  it('says "1 class" when only one is left', () => {
    renderUI(<FeedbackPopup config={POPUPS.FINISH_ALL} seed={1} left={1} />, 'en')
    expect(screen.getByText('But the school is not finished yet: 1 class is still waiting for you.')).toBeTruthy()
  })

  it('has a "Show me" button that shows which classes are left', () => {
    const onShowLeft = vi.fn()
    renderUI(<FeedbackPopup config={POPUPS.FINISH_ALL} seed={1} left={3} onShowLeft={onShowLeft} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }))
    expect(onShowLeft).toHaveBeenCalledTimes(1)
  })

  it('has no button when it has nothing to show', () => {
    renderUI(<FeedbackPopup config={POPUPS.FINISH_ALL} seed={1} left={3} />, 'en')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('has no name in the line, whatever the child is called, and is in German and Portuguese too', () => {
    profileStore.getState().setName('Amara')
    renderUI(<FeedbackPopup config={POPUPS.FINISH_ALL} seed={0} left={2} />, 'de')
    expect(screen.getByRole('heading', { name: 'Klasse geschafft!' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Noch 2 Klassen warten auf dich.')
  })

  it('lasts long enough to read, and the winning popup is quick', () => {
    expect(POPUPS.FINISH_ALL.durationMs).toBeGreaterThan(POPUPS.WIN.durationMs!)
  })
})
