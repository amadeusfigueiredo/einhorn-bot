import type { PointerEvent } from 'react'
import type { Keys, MoveTarget } from '../types'
import { useT } from '../i18n/useT'

type MoveControlsProps = {
  keysRef: React.RefObject<Keys>
  moveTargetRef: React.MutableRefObject<MoveTarget | null>
}

const DIRECTIONS = [
  { key: 'arrowup', className: 'move-btn-up', label: '▲', name: 'up' },
  { key: 'arrowleft', className: 'move-btn-left', label: '◀', name: 'left' },
  { key: 'arrowdown', className: 'move-btn-down', label: '▼', name: 'down' },
  { key: 'arrowright', className: 'move-btn-right', label: '▶', name: 'right' },
] as const

export function MoveControls({ keysRef, moveTargetRef }: MoveControlsProps) {
  const { t } = useT()
  const press = (key: string) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    moveTargetRef.current = null
    if (keysRef.current) keysRef.current[key] = true
  }

  const release = (key: string) => () => {
    if (keysRef.current) keysRef.current[key] = false
  }

  return (
    <div className="move-controls" aria-label={t('moveControls.label')}>
      {DIRECTIONS.map(({ key, className, label, name }) => (
        <button
          key={key}
          type="button"
          aria-label={t(`moveControls.${name}`)}
          className={`move-btn ${className}`}
          onPointerDown={press(key)}
          onPointerUp={release(key)}
          onPointerLeave={release(key)}
          onPointerCancel={release(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
