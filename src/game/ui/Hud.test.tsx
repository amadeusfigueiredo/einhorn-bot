// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, renderUI, screen, cleanupAfterEach } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { gameStore } from '../logic/gameStore.instance'
import { Hud } from './Hud'

cleanupAfterEach()
afterEach(() => act(() => gameStore.getState().jumpToStage(0)))

describe('Hud', () => {
  it('shows the stage number, subject and level in the language of the game', () => {
    const { container } = renderUI(<Hud stage={STAGES[0]} stageIndex={0} />, 'en')
    expect(container.querySelector('.hud__num')?.textContent).toBe('1')
    expect(container.querySelector('.hud__title')?.textContent).toBe('Maths · easy')
  })

  it('and, small, in the other language: German for English and Portuguese, Portuguese for German', () => {
    const sub = (lang: 'de' | 'pt' | 'en') => {
      const { container, unmount } = renderUI(<Hud stage={STAGES[0]} stageIndex={0} />, lang)
      const out = { title: container.querySelector('.hud__title')?.textContent, sub: container.querySelector('.hud__sub')?.textContent, lang: container.querySelector('.hud__sub')?.getAttribute('lang') }
      unmount()
      return out
    }
    expect(sub('de')).toMatchObject({ title: 'Mathematik · leicht', lang: 'pt' })
    expect(sub('de').sub).toContain('Matem')
    expect(sub('pt').lang).toBe('de')
    expect(sub('pt').sub).toBe('Mathematik · leicht')
    expect(sub('en').lang).toBe('de')
  })

  it('every stage shows its own number and subject', () => {
    STAGES.forEach((stage, i) => {
      const { container, unmount } = renderUI(<Hud stage={stage} stageIndex={i} />, 'de')
      expect(container.querySelector('.hud__num')?.textContent).toBe(String(i + 1))
      expect(container.querySelector('.hud__title')?.textContent).toContain(stage.subject === 'Bildende Kunst' ? 'Bildende Kunst' : stage.subject)
      unmount()
    })
  })

  it('has four stars for the four questions, none lit at the start', () => {
    const { container } = renderUI(<Hud stage={STAGES[0]} stageIndex={0} />)
    expect(container.querySelectorAll('.hud__star')).toHaveLength(4)
    expect(container.querySelectorAll('.hud__star.is-earned')).toHaveLength(0)
    expect(screen.getByRole('img', { name: '0 of 4 stars' })).toBeTruthy()
  })

  it('lights a star for each right answer', () => {
    const { container } = renderUI(<Hud stage={STAGES[0]} stageIndex={0} />)
    const st = gameStore.getState()
    const answer = (i: number) => {
      const n = STAGES[0].npcs![i]
      act(() => {
        st.dispatch({ type: 'TALK', key: { kind: 'npc', id: n.id } })
        st.dispatch({ type: 'BEGIN_ASKING' })
        st.dispatch({ type: 'ANSWER', choiceIndex: n.question.correctIndex })
      })
      const s = gameStore.getState()
      if (s.popup) act(() => st.dispatch({ type: 'POPUP_EXPIRED', token: s.popup!.token }))
    }
    answer(0)
    expect(container.querySelectorAll('.hud__star.is-earned')).toHaveLength(1)
    answer(1)
    expect(container.querySelectorAll('.hud__star.is-earned')).toHaveLength(2)
    expect(screen.getByRole('img', { name: '2 of 4 stars' })).toBeTruthy()
  })

  it('has fifteen progress dots, with a gap after every third', () => {
    const { container } = renderUI(<Hud stage={STAGES[0]} stageIndex={0} />)
    const dots = [...container.querySelectorAll('.hud__dot')]
    expect(dots).toHaveLength(15)
    expect(dots.filter((d) => d.classList.contains('has-gap'))).toHaveLength(4)
    expect(dots[3].classList.contains('has-gap')).toBe(true)
  })

  it('marks the stages behind, this one and the ones to come', () => {
    const { container } = renderUI(<Hud stage={STAGES[6]} stageIndex={6} />)
    const dots = [...container.querySelectorAll('.hud__dot')]
    expect(dots.slice(0, 6).every((d) => d.classList.contains('is-done'))).toBe(true)
    expect(dots[6].classList.contains('is-current')).toBe(true)
    expect(dots.slice(7).every((d) => d.classList.contains('is-todo'))).toBe(true)
  })

  it('tells a screen reader where we are in the school', () => {
    const first = renderUI(<Hud stage={STAGES[9]} stageIndex={9} />, 'en')
    expect(screen.getByLabelText('Progress: stage 10 of 15')).toBeTruthy()
    first.unmount()
    renderUI(<Hud stage={STAGES[9]} stageIndex={9} />, 'de')
    expect(screen.getByLabelText('Fortschritt: Stufe 10 von 15')).toBeTruthy()
  })

  it('never takes a tap away from the game', () => {
    const { container } = renderUI(<Hud stage={STAGES[0]} stageIndex={0} />)
    expect(container.querySelector('.hud')).toBeTruthy()
    expect(container.querySelectorAll('button, a, input')).toHaveLength(0)
  })
})
