import { describe, expect, it } from 'vitest'
import { devToolsEnabled } from './devTools'

describe('devToolsEnabled', () => {
  it('is on in the development server, whatever the address says', () => {
    expect(devToolsEnabled('', true)).toBe(true)
    expect(devToolsEnabled('?dev=0', true)).toBe(true)
  })

  it('is off in a built game (children do not skip classes)', () => {
    expect(devToolsEnabled('', false)).toBe(false)
    expect(devToolsEnabled('?view=3d&intro=0', false)).toBe(false)
  })

  it('is on in a built game when the address says ?dev', () => {
    expect(devToolsEnabled('?dev', false)).toBe(true)
    expect(devToolsEnabled('?view=3d&dev=1', false)).toBe(true)
    expect(devToolsEnabled('?dev=true', false)).toBe(true)
  })

  it('stays off for dev=0, off and false', () => {
    for (const v of ['0', 'off', 'false', 'OFF']) expect(devToolsEnabled(`?dev=${v}`, false), v).toBe(false)
  })

  it('looks at the address of the page and the build when it is not told (the test run is a development build)', () => {
    expect(devToolsEnabled()).toBe(true)
  })
})
