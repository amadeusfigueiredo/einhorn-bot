// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanupAfterEach, fireEvent, renderUI, screen, within } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { questionIds } from '../logic/classProgress'
import { createInitialState } from '../logic/gameMachine'
import { gameStore } from '../logic/gameStore.instance'
import { placeStore } from '../places/placeStore'
import { EMPTY_PROGRESS } from '../stickers/stickerModel'
import { StickerGrid, type GoTarget } from './StickerGrid'

cleanupAfterEach()
beforeEach(() => {
  gameStore.setState(createInitialState(STAGES, null))
  placeStore.setState({ place: 'class', from: 'class', trip: null })
})

const sticker = (name: string) => screen.getByText(name).closest('li')!

describe('StickerGrid: where each missing sticker is, and a way to go there', () => {
  it('says where each sticker that is not won is to be found', () => {
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} />, 'en')
    expect(within(sticker('Ball star')).getByText('In the schoolyard')).toBeTruthy()
    expect(within(sticker('Bookworm')).getByText('In the library')).toBeTruthy()
    expect(within(sticker('Thinker')).getByText('In a classroom')).toBeTruthy()
    expect(within(sticker('Dancer')).getByText('Anywhere')).toBeTruthy()
    expect(within(sticker('Candy Classroom')).getByText('Finish class 1')).toBeTruthy()
  })

  it('has no "Go there" button when it is not told what to do with it (the album only looks)', () => {
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} />, 'en')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('a sticker she has won says nothing of where, and has no button', () => {
    gameStore.setState({ solved: new Set(questionIds(STAGES[0])) })
    renderUI(<StickerGrid progress={{ ...EMPTY_PROGRESS, got: ['yard'] }} onGo={() => {}} />, 'en')
    expect(within(sticker('Yard kid')).queryByRole('button')).toBeNull()
    expect(within(sticker('Yard kid')).queryByText('In the schoolyard')).toBeNull()
    expect(within(sticker('Candy Classroom')).queryByRole('button')).toBeNull()
  })

  it.each([
    ['Ball star', { kind: 'place', where: 'yard' }],
    ['Bookworm', { kind: 'place', where: 'library' }],
    ['Moon Class', { kind: 'class', index: 2 }],
  ] as [string, GoTarget][])('"Go there" at %s goes to the right place', (name, expected) => {
    const onGo = vi.fn()
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} onGo={onGo} />, 'en')
    fireEvent.click(within(sticker(name)).getByRole('button'))
    expect(onGo).toHaveBeenCalledWith(expected)
  })

  it('a sticker for questions or classes done goes to the first class still to do', () => {
    gameStore.setState({ solved: new Set(questionIds(STAGES[0])), stageIndex: 5 })
    const onGo = vi.fn()
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} onGo={onGo} />, 'en')
    fireEvent.click(within(sticker('Thinker')).getByRole('button'))
    expect(onGo).toHaveBeenCalledWith({ kind: 'class', index: 1 })
  })

  it('no button for a dance (anywhere), and none to go where she already is', () => {
    placeStore.setState({ place: 'yard' })
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} onGo={() => {}} />, 'en')
    expect(within(sticker('Dancer')).queryByRole('button')).toBeNull()
    expect(within(sticker('Ball star')).queryByRole('button')).toBeNull()
    expect(within(sticker('Bookworm')).getByRole('button')).toBeTruthy()
  })

  it('no button for the class she is in, and none to go to the class that is still to do when she is in it', () => {
    gameStore.setState({ stageIndex: 0 })
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} onGo={() => {}} />, 'en')
    expect(within(sticker('Candy Classroom')).queryByRole('button')).toBeNull()
    // class 1 is the first still to do, and she is in it: "Thinker" has nowhere else to send her
    expect(within(sticker('Thinker')).queryByRole('button')).toBeNull()
    expect(within(sticker('Beach School')).getByRole('button')).toBeTruthy()
  })

  it('with every class done, a sticker for the classes has nowhere to send her', () => {
    gameStore.setState({ solved: new Set(STAGES.flatMap(questionIds)) })
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} onGo={() => {}} />, 'en')
    expect(within(sticker('Thinker')).queryByRole('button')).toBeNull()
  })

  it('names the button after the sticker for a screen reader, in her language', () => {
    renderUI(<StickerGrid progress={EMPTY_PROGRESS} onGo={() => {}} />, 'de')
    expect(screen.getAllByRole('button', { name: /^Hingehen: / }).length).toBeGreaterThan(5)
  })
})
