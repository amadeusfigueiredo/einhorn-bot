import { useT } from '../i18n/useT'
import { pauseStore } from '../pause/pauseStore'
import { stickerStore } from '../stickers/stickerStore'

/** The round button of the controls bar that opens the sticker book (the game waits behind it, like the pause menu). */
export function StickerButton() {
  const { t } = useT()
  return (
    <button
      type="button"
      className="sound-toggle sticker-toggle"
      aria-label={t('stickers.button')}
      onClick={() => {
        pauseStore.getState().pause()
        stickerStore.getState().openBook()
      }}
    >
      <span aria-hidden="true">📒</span>
    </button>
  )
}
