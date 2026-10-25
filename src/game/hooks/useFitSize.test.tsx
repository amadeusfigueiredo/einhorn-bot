// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render } from '@testing-library/react'
import { useFitSize } from './useFitSize'
import { cleanupAfterEach } from '../../test/ui'

cleanupAfterEach()

const observers: { cb: () => void; observed: Element[]; disconnect: ReturnType<typeof vi.fn> }[] = []

beforeEach(() => {
  observers.length = 0
  globalThis.ResizeObserver = class {
    entry = { cb: () => {}, observed: [] as Element[], disconnect: vi.fn() }
    constructor(cb: () => void) {
      this.entry.cb = cb
      observers.push(this.entry)
    }
    observe(el: Element) {
      this.entry.observed.push(el)
    }
    disconnect() {
      this.entry.disconnect()
    }
    unobserve() {}
  } as never
})

function setBox(el: HTMLElement, width: number, height: number) {
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: height })
}

let fit = { width: 0, height: 0 }
function Probe({ box }: { box: { width: number; height: number } }) {
  const r = useFitSize({ width: 960, height: 540 })
  fit = r.fit
  return (
    <div
      data-testid="area"
      ref={(el) => {
        if (el && !r.areaRef.current) setBox(el, box.width, box.height)
        r.areaRef.current = el
      }}
    />
  )
}

describe('useFitSize', () => {
  it('fits the picture into the free space, keeping its shape', () => {
    render(<Probe box={{ width: 480, height: 600 }} />)
    expect(fit).toEqual({ width: 480, height: 270 })
  })

  it('never blows the picture up beyond its own size', () => {
    render(<Probe box={{ width: 3000, height: 2000 }} />)
    expect(fit).toEqual({ width: 960, height: 540 })
  })

  it('uses the whole picture size while nothing is measured yet', () => {
    render(<Probe box={{ width: 0, height: 0 }} />)
    expect(fit).toEqual({ width: 960, height: 540 })
  })

  it('measures again when the space changes (rotation, browser bars)', () => {
    const { getByTestId } = render(<Probe box={{ width: 480, height: 600 }} />)
    const el = getByTestId('area')
    setBox(el, 960, 270)
    act(() => observers[0].cb())
    expect(fit).toEqual({ width: 480, height: 270 })
    setBox(el, 240, 600)
    act(() => observers[0].cb())
    expect(fit).toEqual({ width: 240, height: 135 })
  })

  it('watches the area, and stops when it goes away', () => {
    const { unmount, getByTestId } = render(<Probe box={{ width: 480, height: 600 }} />)
    expect(observers).toHaveLength(1)
    expect(observers[0].observed[0]).toBe(getByTestId('area'))
    unmount()
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
  })
})
