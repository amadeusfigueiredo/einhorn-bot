import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useT } from '../i18n/useT'

/**
 * A small gear button that opens a panel next to it: the old stage picker
 * lives in here now, out of the way of a child at play. Escape or a click
 * elsewhere closes it.
 */
export function StageMenu({ children }: { children: ReactNode }) {
  const { t } = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="stage-menu" ref={root}>
      <button
        type="button"
        className="sound-toggle menu-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={open ? t('hud.menuClose') : t('hud.menu')}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⚙️</span>
        <span className="menu-toggle__text" aria-hidden="true">{t('hud.menu')}</span>
      </button>
      {open && (
        <div className="stage-menu__panel" id={id} role="group" aria-label={t('hud.menu')}>
          {children}
        </div>
      )}
    </div>
  )
}
