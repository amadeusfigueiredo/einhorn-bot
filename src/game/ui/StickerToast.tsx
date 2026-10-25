import { useEffect } from 'react'
import { useT } from '../i18n/useT'
import { stickerById } from '../stickers/stickerData'
import { stickerStore, useStickerToast } from '../stickers/stickerStore'

/** How long a won sticker is shown (seconds) before the next one, if there is one, comes. */
export const TOAST_SECONDS = 3.4

/** "New sticker!" over the game for a moment whenever one is won. Polite for the screen reader. */
export function StickerToast() {
  const id = useStickerToast()
  const { t, lang } = useT()
  useEffect(() => {
    if (!id) return
    const timer = setTimeout(() => stickerStore.getState().nextToast(), TOAST_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [id])
  const sticker = id ? stickerById(id) : undefined
  if (!sticker) return null
  return (
    <p className="sticker-toast" role="status" key={id}>
      <span className="sticker-toast__emoji" aria-hidden="true">{sticker.emoji}</span>
      <span>
        <strong>{t('stickers.new')}</strong> {sticker.name[lang]}
      </span>
    </p>
  )
}
