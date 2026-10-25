import { STAGES } from '../constants/stages'
import { useT } from '../i18n/useT'
import { firstTodo } from '../hall/progress'
import { doneFlags } from '../logic/classProgress'
import { useGame } from '../logic/gameStore.instance'
import { usePlace } from '../places/placeStore'
import { playStickers, schoolStickers, type AlbumSticker } from '../stickers/albumModel'
import type { StickerProgress } from '../stickers/stickerModel'

/** Where "Go there" takes her: a class (0-based), or the yard or the library. */
export type GoTarget = { kind: 'class'; index: number } | { kind: 'place'; where: 'yard' | 'library' | 'pony' | 'pool' | 'dojo' | 'dance' | 'tech' | 'science' }

/**
 * Every sticker there is, the ones she has won in colour and the others waiting in grey with how to win them, where to
 * find them and a "Go there" button (when `onGo` is given): the play stickers first, then one for every class. The sticker
 * book in the menu and the album on the finale card are this.
 */
export function StickerGrid({ progress, onGo }: { progress: StickerProgress; onGo?: (target: GoTarget) => void }) {
  const { t, lang } = useT()
  const solved = useGame((g) => g.solved)
  const here = useGame((g) => g.stageIndex)
  const place = usePlace()

  /** Where a missing sticker is to be found, and whether she is not there already. */
  const target = (s: AlbumSticker): GoTarget | null => {
    if (s.kind === 'school') return place === 'class' && here === s.classIndex ? null : { kind: 'class', index: s.classIndex! }
    if (s.where === 'yard' || s.where === 'library' || s.where === 'pony' || s.where === 'pool' || s.where === 'dojo' || s.where === 'dance' || s.where === 'tech' || s.where === 'science') return place === s.where ? null : { kind: 'place', where: s.where }
    if (s.where === 'class') {
      // (the questions and the finished classes: any class that is still to do)
      const next = firstTodo(doneFlags(solved, STAGES))
      return next === null || (place === 'class' && here === next) ? null : { kind: 'class', index: next }
    }
    return null
  }
  const whereText = (s: AlbumSticker) => (s.kind === 'school' ? t('stickers.finishClass', { n: s.classIndex! + 1 }) : t(`stickers.where.${s.where!}`))

  const row = (s: AlbumSticker) => {
    const go = !s.got && onGo ? target(s) : null
    return (
      <li key={s.id} className={s.got ? 'sticker-book__sticker is-got' : 'sticker-book__sticker'}>
        <span className="sticker-book__emoji" aria-hidden="true">{s.emoji}</span>
        <span className="sticker-book__name">{s.name[lang]}</span>
        {s.how && <span className="sticker-book__how">{s.got ? t('stickers.got') : s.need! > 1 ? `${s.how[lang]} (${s.have}/${s.need})` : s.how[lang]}</span>}
        {!s.got && <span className="sticker-book__where">{whereText(s)}</span>}
        {go && (
          <button type="button" className="sticker-book__go" onClick={() => onGo!(go)} aria-label={`${t('stickers.go')}: ${s.name[lang]}`}>
            {t('stickers.go')}
          </button>
        )}
      </li>
    )
  }
  return (
    <>
      <h3 className="sticker-book__heading">{t('stickers.play')}</h3>
      <ul className="sticker-book__grid">{playStickers(progress).map(row)}</ul>
      <h3 className="sticker-book__heading">{t('stickers.school')}</h3>
      <ul className="sticker-book__grid">{schoolStickers(solved).map(row)}</ul>
    </>
  )
}
