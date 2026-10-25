// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, renderUI, screen, cleanupAfterEach, within } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { questionIds } from '../logic/classProgress'
import { gameStore } from '../logic/gameStore.instance'
import { placeStore } from '../places/placeStore'
import { stickerStore } from '../stickers/stickerStore'
import { STICKERS } from '../data/stickers'
import { profileStore } from '../player/playerName'
import { EndingScreen } from './EndingScreen'
import { PLAY_STICKERS } from '../stickers/stickerData'

cleanupAfterEach()
afterEach(() => profileStore.getState().skip())

describe('EndingScreen', () => {
  it('is a dialog that says the game is won, with the mascot wearing a crown', () => {
    const { container } = renderUI(<EndingScreen onRestart={() => {}} />, 'en')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'You did it!' })).toBeTruthy()
    expect(container.querySelector('.mascot path[d^="M126 46"]')).toBeTruthy()
    expect(container.querySelectorAll('.ending__stars li')).toHaveLength(5)
  })

  it('greets the child by name', () => {
    profileStore.getState().setName('Amara')
    renderUI(<EndingScreen onRestart={() => {}} />, 'de')
    expect(screen.getByRole('heading', { name: 'Geschafft, Amara!' })).toBeTruthy()
    expect(screen.getByText(/Du hast die ganze Unicorn Dream School gemeistert, Amara/)).toBeTruthy()
  })

  it('focuses "play again" so Enter starts a new game', () => {
    renderUI(<EndingScreen onRestart={() => {}} />, 'en')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Play again' }))
  })

  it('"play again" restarts', () => {
    const onRestart = vi.fn()
    renderUI(<EndingScreen onRestart={onRestart} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('opens the sticker album with all 15 stickers collected, and closes it again', () => {
    // at the end every class is done
    gameStore.setState({ solved: new Set(STAGES.flatMap(questionIds)) })
    renderUI(<EndingScreen onRestart={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Sticker album' }))
    const album = screen.getByRole('dialog', { name: 'Your sticker album' })
    // every class's sticker is won at the end, and the play stickers she has not won wait in grey
    expect(within(album).getByText(new RegExp(`^15 of ${STICKERS.length + PLAY_STICKERS.length} stickers`))).toBeTruthy()
    expect(album.querySelectorAll('.sticker-book__sticker.is-got')).toHaveLength(15)
    expect(album.querySelectorAll('.sticker-book__sticker')).toHaveLength(STICKERS.length + PLAY_STICKERS.length)
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull()
    // the card is as tall as the frame while the album is in it (the list scrolls inside, the way back stays in view)
    expect(album.parentElement!.className).toContain('ending--album')
    fireEvent.click(within(album).getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'Play again' })).toBeTruthy()
  })
})

describe('EndingScreen: keep playing for 100 %', () => {
  const everything = () => new Set(STAGES.flatMap(questionIds))

  it('says how much of the whole game is done and offers to keep playing while there is more to find', () => {
    gameStore.setState({ solved: everything() })
    const onKeepPlaying = vi.fn()
    renderUI(<EndingScreen onRestart={() => {}} onKeepPlaying={onKeepPlaying} />, 'en')
    expect(screen.getByText(/You have \d+ % of the game\. Look for the stickers you are missing!/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep playing for 100 %' }))
    expect(onKeepPlaying).toHaveBeenCalledTimes(1)
  })

  it('has no such button when it is not given a way to keep playing', () => {
    gameStore.setState({ solved: everything() })
    renderUI(<EndingScreen onRestart={() => {}} />, 'en')
    expect(screen.queryByRole('button', { name: /Keep playing/ })).toBeNull()
  })

  it('has none at 100 %: with every class and every sticker there is nothing more to find', () => {
    gameStore.setState({ solved: everything() })
    stickerStore.setState({ got: PLAY_STICKERS.map((s) => s.id) })
    renderUI(<EndingScreen onRestart={() => {}} onKeepPlaying={() => {}} />, 'en')
    expect(screen.queryByRole('button', { name: /Keep playing/ })).toBeNull()
    expect(screen.queryByText(/Look for the stickers/)).toBeNull()
    stickerStore.setState({ got: [] })
  })

  it('"Go there" in the album goes on with the game first, then goes there', () => {
    gameStore.setState({ solved: everything() })
    placeStore.setState({ place: 'class', from: 'class', trip: null })
    const onKeepPlaying = vi.fn()
    renderUI(<EndingScreen onRestart={() => {}} onKeepPlaying={onKeepPlaying} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Sticker album' }))
    fireEvent.click(screen.getByRole('button', { name: /^Go there: Ball star/ }))
    expect(onKeepPlaying).toHaveBeenCalledTimes(1)
    expect(placeStore.getState().trip).toEqual({ from: 'class', to: 'yard' })
  })

  it('and in a class: the hint for a class goes into it', () => {
    gameStore.setState({ solved: new Set(STAGES.flatMap(questionIds).filter((id) => !questionIds(STAGES[4]).includes(id))), stageIndex: 0 })
    placeStore.setState({ place: 'class', from: 'class', trip: null })
    renderUI(<EndingScreen onRestart={() => {}} onKeepPlaying={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Sticker album' }))
    fireEvent.click(screen.getByRole('button', { name: /^Go there: Underwater School/ }))
    expect(gameStore.getState().stageIndex).toBe(4)
  })

  it('the album only looks when there is no way to keep playing', () => {
    gameStore.setState({ solved: everything() })
    renderUI(<EndingScreen onRestart={() => {}} />, 'en')
    fireEvent.click(screen.getByRole('button', { name: 'Sticker album' }))
    expect(screen.queryAllByRole('button', { name: /Go there/ })).toHaveLength(0)
  })
})

