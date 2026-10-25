import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { languageSettings, useLang } from '../i18n/language'
import { LANGUAGES, languageInfo } from '../i18n/languages'
import { useT } from '../i18n/useT'
import { menuKey } from './menuKeys'

/**
 * Dropdown that switches the whole game's language: a pill that opens a small
 * list in the game's own style (a native list cannot be styled). Works with
 * touch, mouse and keyboard (arrows, Home/End, Enter/Space, Escape) and is
 * announced as a listbox. `compact` shows the short code (game frame);
 * otherwise the full name (name dialog).
 */
export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const lang = useLang()
  const { t } = useT()
  const id = useId()
  const current = languageInfo(lang)
  const selected = Math.max(0, LANGUAGES.findIndex((l) => l.code === lang))

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(selected)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (open) list.current?.focus()
  }, [open])

  const openMenu = () => {
    setActive(selected)
    setOpen(true)
  }
  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }
  const choose = (index: number) => {
    languageSettings.getState().setLang(LANGUAGES[index].code)
    close(true)
  }

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      openMenu()
    }
  }

  const onListKeyDown = (e: KeyboardEvent) => {
    const action = menuKey(e.key, active, LANGUAGES.length)
    if (!action) return
    // Escape must close only this list, not the dialog around it.
    e.stopPropagation()
    if (action.type !== 'close') e.preventDefault()
    if (action.type === 'move') setActive(action.index)
    else if (action.type === 'choose') choose(action.index)
    else close(e.key === 'Escape')
  }

  return (
    <div
      className="lang-select"
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={button}
        type="button"
        className="sound-toggle lang-select__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${t('language.label')}: ${current.name}`}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
      >
        <span aria-hidden="true">🌐</span>
        <span aria-hidden="true">{compact ? current.short : current.name}</span>
        <span className="lang-select__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul
          ref={list}
          id={id}
          className="lang-menu"
          role="listbox"
          tabIndex={-1}
          aria-label={t('language.label')}
          aria-activedescendant={`${id}-${LANGUAGES[active].code}`}
          onKeyDown={onListKeyDown}
        >
          {LANGUAGES.map((l, i) => (
            <li
              key={l.code}
              id={`${id}-${l.code}`}
              role="option"
              lang={l.htmlLang}
              aria-selected={l.code === lang}
              data-active={i === active || undefined}
              className="lang-menu__item"
              // Keep focus in the list so a tap does not close it before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span className="lang-menu__name">{l.name}</span>
              <span className="lang-menu__short" aria-hidden="true">
                {l.short}
              </span>
              <span className="lang-menu__check" aria-hidden="true">
                {l.code === lang ? '✓' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
