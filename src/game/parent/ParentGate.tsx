import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useT } from '../i18n/useT'
import { isRight, makeGate } from './parentGate'

/** The gate to the grown-ups' corner (see `parentGate.ts`): a sum to solve, and a new one if the answer is not it. */
export function ParentGate({ onOpen, onClose, random = Math.random }: { onOpen: () => void; onClose: () => void; random?: () => number }) {
  const { t } = useT()
  const [gate, setGate] = useState(() => makeGate(random))
  const [typed, setTyped] = useState('')
  const [wrong, setWrong] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (isRight(gate, typed)) {
      onOpen()
      return
    }
    setWrong(true)
    setTyped('')
    setGate(makeGate(random))
    input.current?.focus()
  }

  return (
    <form className="parent-gate" onSubmit={submit}>
      <h2 id="parent-title" className="pause-menu__title">
        <span aria-hidden="true">🔒</span> {t('parent.gateTitle')}
      </h2>
      <p className="parent-gate__ask">{t('parent.gateAsk')}</p>
      <p className="parent-gate__sum" aria-live="polite">
        {gate.a} × {gate.b}
      </p>
      <label className="parent-gate__label">
        <span className="visually-hidden">{t('parent.gateLabel')}</span>
        <input ref={input} className="parent-gate__input" type="text" inputMode="numeric" autoComplete="off" maxLength={4} value={typed} placeholder={t('parent.gateLabel')} onChange={(e) => setTyped(e.target.value)} />
      </label>
      {wrong && (
        <p className="parent-gate__wrong" role="alert">
          {t('parent.gateWrong')}
        </p>
      )}
      <div className="pause-menu__row">
        <button type="submit" className="btn">
          {t('parent.gateOpen')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t('parent.close')}
        </button>
      </div>
    </form>
  )
}
