import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { useT } from '../i18n/useT'
import { COATS, COAT_IDS, HORNS, TRIMS, TRIM_IDS, WEARABLES, type Outfit } from '../player/outfit'
import { outfitSettings } from '../player/outfitSettings'
import { SWEATERS, SWEATER_IDS } from '../views/three/amara/amaraLook'

// The little picture needs three.js: it is a chunk of its own, and only where there is WebGL to draw it with.

/** One row of choices: a title and a button for each, the chosen one pressed. */
function Choices<T extends string>({ title, options, value, onPick }: { title: string; options: readonly { id: T; label: string; icon?: string; swatch?: string }[]; value: T; onPick: (id: T) => void }) {
  return (
    <div className="wardrobe__group" role="group" aria-label={title}>
      <p className="wardrobe__title">{title}</p>
      <div className="wardrobe__row">
        {options.map((o) => (
          <button key={o.id} type="button" className="wardrobe__choice" aria-pressed={value === o.id} aria-label={o.label} title={o.label} onClick={() => onPick(o.id)}>
            {o.swatch ? <span className="wardrobe__swatch" style={{ background: o.swatch }} aria-hidden="true" /> : <span aria-hidden="true">{o.icon}</span>}
            <span className="wardrobe__label">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** The wardrobe: the child dresses the unicorn (coat, horn, one thing to wear and its colour) and picks Amara's sweater, and sees both. */
export default function Wardrobe({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const outfit = useStore(outfitSettings, (s) => s) as Outfit
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    title.current?.focus()
  }, [])
  const choose = (change: Partial<Outfit>) => outfitSettings.getState().choose(change)

  return (
    <div className="wardrobe">
      <h2 id="wardrobe-title" ref={title} tabIndex={-1} className="pause-menu__title">
        <span aria-hidden="true">👗</span> {t('wardrobe.title')}
      </h2>
      <Choices title={t('wardrobe.coat')} value={outfit.coat} onPick={(coat) => choose({ coat })} options={COAT_IDS.map((id) => ({ id, label: t(`wardrobe.coats.${id}`), swatch: COATS[id] }))} />
      <Choices title={t('wardrobe.horn')} value={outfit.horn} onPick={(horn) => choose({ horn })} options={HORNS.map((id) => ({ id, label: t(`wardrobe.horns.${id}`), icon: '🦄' }))} />
      <Choices title={t('wardrobe.wear')} value={outfit.accessory} onPick={(accessory) => choose({ accessory })} options={WEARABLES.map((w) => ({ id: w.id, label: t(`wardrobe.wears.${w.id}`), icon: w.icon }))} />
      {outfit.accessory !== 'none' && <Choices title={t('wardrobe.trim')} value={outfit.trim} onPick={(trim) => choose({ trim })} options={TRIM_IDS.map((id) => ({ id, label: t(`wardrobe.trims.${id}`), swatch: TRIMS[id] }))} />}
      <Choices
        title={t('wardrobe.amara')}
        value={outfit.sweater}
        onPick={(sweater) => choose({ sweater })}
        options={SWEATER_IDS.map((id) => ({ id, label: t(`wardrobe.sweaters.${id}`), swatch: `linear-gradient(135deg, ${SWEATERS[id].blobs[0]}, ${SWEATERS[id].base} 50%, ${SWEATERS[id].blobs[1]})` }))}
      />
      <div className="pause-menu__row">
        <button type="button" className="btn btn--ghost" onClick={() => outfitSettings.getState().reset()}>
          {t('wardrobe.reset')}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          {t('wardrobe.done')}
        </button>
      </div>
    </div>
  )
}
