import { useEffect, useRef, useState } from 'react'
import { LANGUAGES } from '../i18n/languages'
import { languageSettings, useLang } from '../i18n/language'
import { useT } from '../i18n/useT'
import { heroSettings, useHero, type Hero } from '../player/heroSettings'

/** The picture of a hero on the start menu: an emoji (the 3D game has a small 3D picture here). */
export function PreviewPlaceholder({ hero }: { hero: Hero }) {
  return (
    <span className="hero-placeholder" aria-hidden="true">
      {hero === 'amara' ? '👧' : '🦄'}
    </span>
  )
}

/** The title of the game, the same in every language. */
const TITLE = 'Unicorn Dream School'

const HEROES: { hero: Hero; name: 'pause.heroAmara' | 'pause.heroUnicorn' }[] = [
  { hero: 'amara', name: 'pause.heroAmara' },
  { hero: 'unicorn', name: 'pause.heroUnicorn' },
]

export type StartMenuProps = {
  onStart: () => void
}

/**
 * The first screen, every time the game opens: the title with Amara waving, the language, then "Who do you play?"
 * (Amara or the unicorn; the other always walks along) and "Let's go!". The language and the hero take effect
 * the moment they are tapped (the menu itself changes language), so nothing is left to confirm but "Let's go!".
 * Everything is a big button; Escape goes back a step.
 */
export function StartMenu({ onStart }: StartMenuProps) {
  const { t } = useT()
  const lang = useLang()
  const hero = useHero()
  const [step, setStep] = useState<'language' | 'hero'>('language')
  const root = useRef<HTMLDivElement>(null)

  // The first big button of a step has the focus, so Enter and Tab work at once.
  useEffect(() => {
    root.current?.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus()
  }, [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'hero') {
        e.preventDefault()
        setStep('language')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  return (
    <div className="start-menu" role="dialog" aria-modal="true" aria-label={t('start.label')} ref={root}>
      <div className="start-menu__stars" aria-hidden="true" />
      {step === 'language' ? (
        <section className="start-menu__step" key="language">
          <p className="start-menu__small">{t('start.titleSmall')}</p>
          <h1 className="start-menu__title">{TITLE}</h1>
          <div className="start-menu__preview" aria-hidden="true">
            <PreviewPlaceholder hero="amara" />
          </div>
          <p className="start-menu__prompt">Sprache · Idioma · Language</p>
          <div className="start-menu__row">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                lang={l.htmlLang}
                className="start-menu__big start-menu__language"
                aria-current={l.code === lang ? 'true' : undefined}
                data-autofocus={l.code === lang}
                onClick={() => {
                  languageSettings.getState().setLang(l.code)
                  setStep('hero')
                }}
              >
                {l.name}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="start-menu__step" key="hero">
          <h1 className="start-menu__heading">{t('pause.hero')}</h1>
          <div className="start-menu__row start-menu__cards">
            {HEROES.map((h) => (
              <button
                key={h.hero}
                type="button"
                className="hero-card"
                aria-pressed={hero === h.hero}
                data-autofocus={hero === h.hero}
                onClick={() => heroSettings.getState().setHero(h.hero)}
              >
                <span className="hero-card__picture">
                  <PreviewPlaceholder hero={h.hero} />
                </span>
                <span className="hero-card__name">{t(h.name)}</span>
              </button>
            ))}
          </div>
          <p className="start-menu__friend">{t('start.friend')}</p>
          <div className="start-menu__row">
            <button type="button" className="start-menu__big start-menu__go" onClick={onStart}>
              {t('start.go')}
            </button>
          </div>
          <button type="button" className="start-menu__back" onClick={() => setStep('language')}>
            ‹ {t('start.back')}
          </button>
        </section>
      )}
    </div>
  )
}
