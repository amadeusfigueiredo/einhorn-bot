import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { m } from 'framer-motion'
import { MAX_NAME_LENGTH, profileStore, useProfile } from '../player/playerName'
import { useT } from '../i18n/useT'
import { LanguageSelect } from './LanguageSelect'
import { Mascot } from './Mascot'

/**
 * Asks the child's name (first visit, or from the name button) and saves it on
 * this device. The language can be picked here too, before anything else is
 * shown in the wrong one. Keyboard friendly: the field is focused, Enter confirms, Escape
 * closes, Tab stays inside the dialog.
 */
export function NameModal() {
  const { t } = useT()
  const savedName = useProfile((s) => s.name)
  const skipped = useProfile((s) => s.skipped)
  const [value, setValue] = useState(savedName ?? '')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLFormElement>(null)
  // Already chose once (name or "no name"): offer Cancel instead of Skip.
  const canCancel = savedName !== null || skipped

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!profileStore.getState().setName(value)) setError(true)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      profileStore.getState().closeModal()
      return
    }
    if (e.key !== 'Tab') return
    const items = dialogRef.current?.querySelectorAll<HTMLElement>('input, button')
    if (!items || items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <m.div
      className="scrim scrim--name"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onKeyDown={onKeyDown}
    >
      <div className="name-modal__wrap">
      <Mascot pose="wave" size={150} className="name-modal__mascot" />
      <m.form
        ref={dialogRef}
        className="card name-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-modal-title"
        aria-describedby="name-modal-hint"
        onSubmit={submit}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="name-modal__language">
          <LanguageSelect />
        </div>
        <h2 id="name-modal-title" className="name-modal__title">
          {t('nameModal.title')}
        </h2>
        <p id="name-modal-hint" className="name-modal__hint">
          {t('nameModal.hint')}
        </p>
        <label className="name-modal__label" htmlFor="player-name">
          {t('nameModal.label')}
        </label>
        <input
          ref={inputRef}
          id="player-name"
          className="name-modal__input"
          type="text"
          value={value}
          maxLength={MAX_NAME_LENGTH * 2}
          placeholder={t('nameModal.placeholder')}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={error}
          aria-describedby={error ? 'name-modal-error' : undefined}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
        />
        <p id="name-modal-error" className="name-modal__error" role="alert">
          {error ? t('nameModal.tooShort') : ''}
        </p>
        <div className="name-modal__actions">
          <button type="submit" className="btn">
            {t('nameModal.submit')}
          </button>
          <button
            type="button"
            className="name-modal__skip"
            onClick={() => profileStore.getState().closeModal()}
          >
            {canCancel ? t('nameModal.cancel') : t('nameModal.skip')}
          </button>
        </div>
      </m.form>
      </div>
    </m.div>
  )
}
