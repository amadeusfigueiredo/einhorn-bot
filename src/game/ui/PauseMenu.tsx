import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { pauseStore } from '../pause/pauseStore'
import { heroSettings, useHero, type Hero } from '../player/heroSettings'
import { startStore } from '../start/startStore'
import { LanguageSelect } from './LanguageSelect'
import { VolumeControls } from './VolumeControls'
import { SoundToggle } from './SoundToggle'
import { useT } from '../i18n/useT'

// The grown-ups' corner is a lazy chunk: nothing of it is loaded until a grown-up asks for it.
const ParentCorner = lazy(() => import('../parent/ParentCorner'))
// So is the wardrobe, with its picture of the two of them.
const Wardrobe = lazy(() => import('../wardrobe/Wardrobe'))

/** The round pause button of the controls bar. */
export function PauseButton() {
  const { t } = useT()
  return (
    <button type="button" className="sound-toggle pause-toggle" aria-label={t('pause.button')} onClick={() => pauseStore.getState().pause()}>
      <span aria-hidden="true">⏸️</span>
    </button>
  )
}

const HEROES: { hero: Hero; icon: string; label: 'pause.heroAmara' | 'pause.heroUnicorn' }[] = [
  { hero: 'amara', icon: '👧', label: 'pause.heroAmara' },
  { hero: 'unicorn', icon: '🦄', label: 'pause.heroUnicorn' },
]

/** Who the child plays; the other one walks beside. */
function HeroChoice() {
  const hero = useHero()
  const { t } = useT()
  return (
    <div className="pause-menu__heroes" role="group" aria-label={t('pause.hero')}>
      <p className="pause-menu__heroes-title">{t('pause.hero')}</p>
      <div className="pause-menu__row">
        {HEROES.map((h) => (
          <button key={h.hero} type="button" className="sound-toggle hero-toggle" aria-pressed={hero === h.hero} onClick={() => heroSettings.getState().setHero(h.hero)}>
            <span aria-hidden="true">{h.icon}</span> {t(h.label)}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * What a stage shows while it is paused: keep playing, the language, the
 * sound and who to play. A dialog the whole page waits behind; Escape and P go on (the
 * pause keys are in `usePauseControls`).
 */
export function PauseMenu({ onUnmute }: { onUnmute: () => void }) {
  const { t } = useT()
  const resume = useRef<HTMLButtonElement>(null)
  const [panel, setPanel] = useState<'parents' | 'wardrobe' | null>(null)
  useEffect(() => {
    if (!panel) resume.current?.focus()
  }, [panel])
  if (panel) {
    return (
      <div className="scrim scrim--pause" role="dialog" aria-modal="true" aria-labelledby={panel === 'parents' ? 'parent-title' : 'wardrobe-title'}>
        <div className="card pause-menu parent-menu">
          <Suspense fallback={<p>…</p>}>{panel === 'parents' ? <ParentCorner onClose={() => setPanel(null)} /> : <Wardrobe onClose={() => setPanel(null)} />}</Suspense>
        </div>
      </div>
    )
  }
  return (
    <div className="scrim scrim--pause" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="card pause-menu">
        <h2 id="pause-title" className="pause-menu__title">
          <span aria-hidden="true">⏸️</span> {t('pause.title')}
        </h2>
        <button ref={resume} type="button" className="btn pause-menu__resume" onClick={() => pauseStore.getState().resume()}>
          <span aria-hidden="true">▶️</span> {t('pause.resume')}
        </button>
        <div className="pause-menu__row">
          <LanguageSelect />
          <SoundToggle onUnmute={onUnmute} />
        </div>
        <VolumeControls />
        <HeroChoice />
        <button
          type="button"
          className="btn pause-menu__main"
          onClick={() => {
            pauseStore.getState().resume()
            startStore.getState().open()
          }}
        >
          {t('start.mainMenu')}
        </button>
        <button type="button" className="btn pause-menu__dress" onClick={() => setPanel('wardrobe')}>
          <span aria-hidden="true">👗</span> {t('wardrobe.open')}
        </button>
        <button type="button" className="btn btn--ghost pause-menu__parents" onClick={() => setPanel('parents')}>
          <span aria-hidden="true">🔒</span> {t('parent.open')}
        </button>
        <p className="pause-menu__hint">{t('pause.hint')}</p>
      </div>
    </div>
  )
}
