// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { ActivityPanel, type ActivityLabels } from './ActivityPanel'
import { createActivityStore, type Lesson } from './activityStore'
import { createCreationsStore } from './creations'

cleanupAfterEach()

type Step = 'twirl' | 'hop' | 'clap'
const LESSONS: Lesson<Step>[] = [{ id: 'one', steps: ['hop', 'clap'], demo: [{ event: 'hop', at: 0 }, { event: 'clap', at: 0.5 }] }]
const LABELS: ActivityLabels = {
  title: 'Dance floor',
  icon: '💃',
  close: 'Close it',
  hint: 'Tap a step.',
  recording: 'Recording!',
  follow: 'Do the glowing step!',
  listening: 'Watch!',
  done: 'Well done!',
  record: 'Record',
  stop: 'Stop recording',
  playMine: 'My dance',
  stopLesson: 'Stop the lesson',
  lessons: 'Lessons',
  listen: (n) => `Watch ${n}`,
  along: (n) => `Do ${n} along`,
  creation: (n) => `Play creation ${n}`,
}
const KEYS: Record<string, Step> = { '1': 'twirl', '2': 'hop', '3': 'clap' }

function setup(className?: string) {
  const performed: Step[] = []
  const store = createActivityStore<Step>(
    { key: 'dance', lessons: LESSONS, take: { maxEvents: 10, maxSeconds: 20, minEvents: 2 } },
    { perform: (s) => void performed.push(s), now: () => Date.now(), timers: { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) }, earn: () => {}, creations: createCreationsStore(null) }
  )
  const view = renderUI(
    <ActivityPanel store={store} labels={LABELS} lessons={[{ id: 'one', name: 'The first dance' }]} keyToEvent={(k) => KEYS[k] ?? null} className={className}>
      {({ lit, struck, strike, first }) => (
        <div data-testid="floor">
          {(['twirl', 'hop', 'clap'] as Step[]).map((s, i) => (
            <button key={s} ref={i === 0 ? first : undefined} type="button" data-lit={lit === s} data-struck={struck === s} onClick={() => strike(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </ActivityPanel>,
    'en'
  )
  return { store, performed, ...view }
}

describe('ActivityPanel: the panel of an activity that teaches like the xylophone', () => {
  it('is nothing while it is closed', () => {
    const { container } = setup()
    expect(container.firstChild).toBeNull()
  })

  it('opens as a dialog with its title, its surface, a line of help, record and play mine, and the lessons to watch or do along', () => {
    const { store } = setup('dance-floor')
    act(() => store.getState().openPanel())
    const dialog = screen.getByRole('dialog', { name: 'Dance floor' })
    expect(dialog.className).toBe('activity-panel dance-floor')
    expect(screen.getByTestId('floor')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Tap a step.')
    expect(screen.getByRole('button', { name: /Record/ })).toBeTruthy()
    expect((screen.getByRole('button', { name: /My dance/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('The first dance')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Watch The first dance' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Do The first dance along' })).toBeTruthy()
  })

  it('has just the panel class when the activity gives none, and puts the keyboard on the first thing of the surface', () => {
    const { store } = setup()
    act(() => store.getState().openPanel())
    expect(screen.getByRole('dialog').className).toBe('activity-panel')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'twirl' }))
  })

  it('what she taps happens, and shows pressed for a moment', () => {
    const { store, performed } = setup()
    act(() => store.getState().openPanel())
    fireEvent.click(screen.getByRole('button', { name: 'hop' }))
    expect(performed).toEqual(['hop'])
    expect(screen.getByRole('button', { name: 'hop' }).getAttribute('data-struck')).toBe('true')
  })

  it('the keys of the activity do the same, a held key does not repeat, other keys and shortcuts are left alone', () => {
    const { store, performed } = setup()
    act(() => store.getState().openPanel())
    fireEvent.keyDown(window, { key: '3' })
    fireEvent.keyDown(window, { key: '1', repeat: true })
    fireEvent.keyDown(window, { key: '9' })
    fireEvent.keyDown(window, { key: '2', ctrlKey: true })
    expect(performed).toEqual(['clap'])
  })

  it('does not take a letter typed in a field, and does not listen while closed or after it closes', () => {
    const { store, performed } = setup()
    fireEvent.keyDown(window, { key: '1' })
    act(() => store.getState().openPanel())
    const field = document.createElement('input')
    document.body.appendChild(field)
    fireEvent.keyDown(field, { key: '1' })
    field.remove()
    act(() => store.getState().close())
    fireEvent.keyDown(window, { key: '1' })
    expect(performed).toEqual([])
  })

  it('Escape and the cross close it', () => {
    const { store } = setup()
    act(() => store.getState().openPanel())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(store.getState().open).toBe(false)
    act(() => store.getState().openPanel())
    fireEvent.click(screen.getByRole('button', { name: 'Close it' }))
    expect(store.getState().open).toBe(false)
  })

  it('says what is going on: recording, watching, doing it along, and well done at the end', () => {
    const { store } = setup()
    act(() => store.getState().openPanel())
    fireEvent.click(screen.getByRole('button', { name: /Record/ }))
    expect(screen.getByRole('status').textContent).toBe('Recording!')
    expect(screen.getByRole('button', { name: /Stop recording/ }).className).toContain('is-recording')
    fireEvent.click(screen.getByRole('button', { name: /Stop recording/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Watch The first dance' }))
    expect(screen.getByRole('status').textContent).toBe('Watch!')
    expect(screen.getByRole('button', { name: /Stop the lesson/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Do The first dance along' }))
    expect(screen.getByRole('status').textContent).toBe('Do the glowing step!')
    expect(screen.getByRole('button', { name: 'hop' }).getAttribute('data-lit')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'hop' }))
    expect(screen.getByRole('button', { name: 'clap' }).getAttribute('data-lit')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'clap' }))
    expect(screen.getByRole('status').textContent).toBe('Well done!')
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    fireEvent.click(screen.getByRole('button', { name: /Stop recording/ }))
  })

  it('stop ends a lesson that is going', () => {
    const { store } = setup()
    act(() => store.getState().openPanel())
    fireEvent.click(screen.getByRole('button', { name: 'Do The first dance along' }))
    fireEvent.click(screen.getByRole('button', { name: /Stop the lesson/ }))
    expect(store.getState().mode).toBe('free')
  })

  it('"my dance" plays what she made, and one numbered button for each creation shows up once she has made more than one', () => {
    vi.useFakeTimers()
    const { store, performed } = setup()
    act(() => store.getState().openPanel())
    const make = (...steps: string[]) => {
      fireEvent.click(screen.getByRole('button', { name: /Record/ }))
      for (const s of steps) fireEvent.click(screen.getByRole('button', { name: s }))
      fireEvent.click(screen.getByRole('button', { name: /Stop recording/ }))
    }
    make('hop', 'hop')
    expect(screen.queryByRole('button', { name: /Play creation/ })).toBeNull()
    make('clap', 'clap')
    expect(screen.getByRole('button', { name: 'Play creation 1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play creation 2' })).toBeTruthy()
    performed.length = 0
    fireEvent.click(screen.getByRole('button', { name: 'Play creation 1' }))
    act(() => void vi.advanceTimersByTime(1000))
    expect(performed).toEqual(['hop', 'hop'])
    // the one she chose is now "my dance"
    performed.length = 0
    fireEvent.click(screen.getByRole('button', { name: /My dance/ }))
    act(() => void vi.advanceTimersByTime(1000))
    expect(performed).toEqual(['hop', 'hop'])
    performed.length = 0
    fireEvent.click(screen.getByRole('button', { name: 'Play creation 2' }))
    act(() => void vi.advanceTimersByTime(1000))
    expect(performed).toEqual(['clap', 'clap'])
    // while recording they wait
    fireEvent.click(screen.getByRole('button', { name: /Record/ }))
    expect((screen.getByRole('button', { name: 'Play creation 1' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Stop recording/ }))
    vi.useRealTimers()
  })
})

describe('ActivityPanel: a panel of challenges', () => {
  const CHALLENGE_LABELS: ActivityLabels = { ...LABELS, challenge: (n) => `Challenge ${n}`, showWay: 'Show me the way' }
  function challengeSetup() {
    const store = createActivityStore<Step>(
      { key: 'show', lessons: LESSONS, take: { maxEvents: 10, maxSeconds: 20, minEvents: 2 } },
      { perform: () => {}, now: () => Date.now(), timers: { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) }, earn: () => {} }
    )
    let seen = { lesson: null as string | null, challenging: false, hints: 0 }
    renderUI(
      <ActivityPanel store={store} labels={CHALLENGE_LABELS} lessons={[{ id: 'one', name: 'The first show' }]} creating={false}>
        {({ lit, strike, lesson, challenging, hints }) => {
          seen = { lesson, challenging, hints }
          return (
            <div>
              {(['hop', 'clap'] as Step[]).map((s) => (
                <button key={s} type="button" data-lit={lit === s} onClick={() => strike(s)}>
                  {s}
                </button>
              ))}
            </div>
          )
        }}
      </ActivityPanel>,
      'en'
    )
    return { store, seen: () => seen }
  }

  it('has a challenge button instead of "do it along", and no recording', () => {
    const { store } = challengeSetup()
    act(() => store.getState().openPanel())
    expect(screen.getByRole('button', { name: 'Challenge The first show' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Do The first show along/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Watch The first show' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Record/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /My dance/ })).toBeNull()
  })

  it('a challenge lights nothing, "show me the way" lights the next step and counts, and the surface is told', () => {
    const { store, seen } = challengeSetup()
    act(() => store.getState().openPanel())
    expect(screen.queryByRole('button', { name: 'Show me the way' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Challenge The first show' }))
    expect(seen()).toEqual({ lesson: 'one', challenging: true, hints: 0 })
    expect(screen.getByText('hop').getAttribute('data-lit')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Show me the way' }))
    expect(screen.getByText('hop').getAttribute('data-lit')).toBe('true')
    expect(seen().hints).toBe(1)
    fireEvent.click(screen.getByText('hop'))
    fireEvent.click(screen.getByText('clap'))
    expect(screen.getByRole('status').textContent).toBe('Well done!')
    expect(screen.queryByRole('button', { name: 'Show me the way' })).toBeNull()
  })
})
