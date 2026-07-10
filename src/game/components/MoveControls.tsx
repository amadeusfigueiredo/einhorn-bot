import type { PointerEvent } from 'react'
import type { Keys, MoveTarget } from '../types'

type MoveControlsProps = {
  keysRef: React.RefObject<Keys>
  moveTargetRef: React.MutableRefObject<MoveTarget | null>
}

const DIRECTIONS = [
  { key: 'arrowup', className: 'move-btn-up', label: '▲', aria: 'Hoch' },
  { key: 'arrowleft', className: 'move-btn-left', label: '◀', aria: 'Links' },
  { key: 'arrowdown', className: 'move-btn-down', label: '▼', aria: 'Runter' },
  { key: 'arrowright', className: 'move-btn-right', label: '▶', aria: 'Rechts' },
] as const

export function MoveControls({ keysRef, moveTargetRef }: MoveControlsProps) {
  const press = (key: string) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    moveTargetRef.current = null
    if (keysRef.current) keysRef.current[key] = true
  }

  const release = (key: string) => () => {
    if (keysRef.current) keysRef.current[key] = false
  }

  return (
    <div className="move-controls" aria-label="Bewegungssteuerung">
      {DIRECTIONS.map(({ key, className, label, aria }) => (
        <button
          key={key}
          type="button"
          aria-label={aria}
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
