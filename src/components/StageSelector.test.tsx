// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { cleanupAfterEach, fireEvent, renderUI, screen } from '../test/ui'
import StageSelector from './StageSelector'
import { STAGES } from '../game/constants/stages'

cleanupAfterEach()

function setup(over: Partial<Parameters<typeof StageSelector>[0]> = {}) {
  const props = {
    stageIndex: 2,
    stage: STAGES[2],
    totalStages: STAGES.length,
    jumpInput: '',
    setJumpInput: vi.fn(),
    handleJumpSubmit: vi.fn(),
    nextStage: vi.fn(),
    prevStage: vi.fn(),
    nextQuestion: vi.fn(),
    prevQuestion: vi.fn(),
    ...over,
  }
  const view = renderUI(<StageSelector {...props} />, 'en')
  return { props, ...view }
}

describe('StageSelector', () => {
  it('shows which stage it is out of how many, with its subject and level', () => {
    const { container } = setup()
    const text = container.querySelector('.stage-selector-current')!.textContent!
    expect(text).toContain(`3 / ${STAGES.length}`)
    expect(text).toMatch(/\(.+\)/)
  })

  it('the arrows go to the previous and the next stage', () => {
    const { props } = setup()
    fireEvent.click(screen.getByLabelText('Previous stage'))
    fireEvent.click(screen.getByLabelText('Next stage'))
    expect(props.prevStage).toHaveBeenCalledTimes(1)
    expect(props.nextStage).toHaveBeenCalledTimes(1)
  })

  it('typing a number reports it, and Go or Enter jumps there', () => {
    const { props, container } = setup({ jumpInput: '7' })
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: '9' } })
    expect(props.setJumpInput).toHaveBeenCalledWith('9')
    fireEvent.keyDown(input, { key: 'a' })
    expect(props.handleJumpSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(props.handleJumpSubmit).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.stage-selector-btn:last-child')!)
    expect(props.handleJumpSubmit).toHaveBeenCalledTimes(2)
  })

  it('only takes numbers from 1 to the last stage', () => {
    const { container } = setup()
    const input = container.querySelector('input')!
    expect(input.type).toBe('number')
    expect(input.min).toBe('1')
    expect(input.max).toBe(String(STAGES.length))
  })

  it('does not break before the stage is known', () => {
    const { container } = setup({ stage: undefined as never })
    expect(container.querySelector('.stage-selector-current')!.textContent).toContain('3 /')
  })

describe('StageSelector: the questions inside a class', () => {
  it('shows which question she is at, out of how many, and the arrows step back and on', () => {
    const { props, container } = setup()
    const text = container.querySelector('.stage-selector-question')!.textContent!
    expect(text).toMatch(/^Question \d+ \/ \d+$/)
    fireEvent.click(screen.getByLabelText('Previous question'))
    fireEvent.click(screen.getByLabelText('Next question'))
    expect(props.prevQuestion).toHaveBeenCalledTimes(1)
    expect(props.nextQuestion).toHaveBeenCalledTimes(1)
  })

  it('shows nothing to step through before the stage is known', () => {
    const { container } = setup({ stage: undefined as never })
    expect(container.querySelector('.stage-selector-question')!.textContent).toBe('Question 0 / 0')
  })
})
})
