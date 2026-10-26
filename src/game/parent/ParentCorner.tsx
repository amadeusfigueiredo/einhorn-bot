import { useEffect, useRef, useState } from 'react'
import { STICKERS, collected } from '../data/stickers'
import { STAGES } from '../constants/stages'
import { className } from '../hall/hallText'
import { useT } from '../i18n/useT'
import { doneFlags } from '../logic/classProgress'
import { gameStore, useGame } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { usePlayerName } from '../player/playerName'
import { PLAY_STICKERS } from '../stickers/stickerData'
import { stickerStore } from '../stickers/stickerStore'
import { useStore } from 'zustand'
import { LanguageSelect } from '../ui/LanguageSelect'
import { VolumeControls } from '../ui/VolumeControls'
import { ParentGate } from './ParentGate'
import { timeText } from './parentText'
import { dayKey, secondsOn, rightShare } from './practiceModel'
import { practiceStore, usePractice } from './practiceStore'

/** What the grown-up sees after the gate: how far she has got, how she did, how long she played, and a fresh start. */
function Contents({ onClose }: { onClose: () => void }) {
  const { t, lang } = useT()
  const name = usePlayerName()
  const solved = useGame((g) => g.solved)
  const here = useGame((g) => g.stageIndex)
  const phase = useGame((g) => g.phase)
  const practice = usePractice()
  const playStickers = useStore(stickerStore, (s) => s.got.length)
  const [confirming, setConfirming] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)
  // The dialog starts at its top, with the title the one that has the focus (a screen reader reads from there).
  useEffect(() => {
    title.current?.focus()
  }, [])

  const total = STAGES.length
  // Every class has its own state (she can play them in any order): done, the one she is in, or still to do.
  const done = doneFlags(solved, STAGES)
  const finished = done.filter(Boolean).length
  const finishedAll = phase === 'ending' || finished === total
  const gotStickers = collected(finished).length + playStickers

  const startOver = () => {
    gameStore.getState().startOver()
    practiceStore.getState().clear()
    pauseStore.getState().resume()
  }

  return (
    <div className="parent-corner">
      <h2 id="parent-title" ref={title} tabIndex={-1} className="pause-menu__title">
        <span aria-hidden="true">🔓</span> {t('parent.title')}
      </h2>
      <p className="parent-corner__player">{t('parent.player', { name: name ?? t('parent.noName') })}</p>

      <section className="parent-corner__section" aria-labelledby="parent-progress">
        <h3 id="parent-progress">{t('parent.progressTitle')}</h3>
        <p>{finishedAll ? t('parent.finishedAll', { total }) : t('parent.progress', { n: finished, total })}</p>
        <progress className="parent-corner__bar" max={total} value={finishedAll ? total : finished} aria-label={t('parent.progressTitle')} />
        <table className="parent-corner__table">
          <thead>
            <tr>
              <th scope="col">{t('parent.classHead')}</th>
              <th scope="col">{t('parent.rightHead')}</th>
              <th scope="col">{t('parent.againHead')}</th>
            </tr>
          </thead>
          <tbody>
            {STAGES.map((_, i) => {
              const state = done[i] ? 'done' : i === here ? 'now' : 'todo'
              const row = practice.classes[String(i)]
              const share = rightShare(row)
              return (
                <tr key={i} className={`is-${state}`}>
                  <th scope="row">
                    {i + 1} · {className(lang, i)}
                    <span className="parent-corner__state">{t(`parent.${state}`)}</span>
                  </th>
                  <td>{row ? row.right : '–'}</td>
                  <td className={share !== null && share < 0.5 ? 'is-hard' : undefined}>{row ? row.wrong : '–'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="parent-corner__section" aria-labelledby="parent-time">
        <h3 id="parent-time">{t('parent.timeTitle')}</h3>
        <p>{t('parent.timeTotal', { time: timeText(t, practice.seconds) })}</p>
        <p>{t('parent.timeToday', { time: timeText(t, secondsOn(practice, dayKey(new Date()))) })}</p>
        <p>{t('parent.stickers', { n: gotStickers, total: STICKERS.length + PLAY_STICKERS.length })}</p>
      </section>

      <section className="parent-corner__section" aria-labelledby="parent-settings">
        <h3 id="parent-settings">{t('parent.settingsTitle')}</h3>
        <div className="pause-menu__row">
          <LanguageSelect />
        </div>
        <VolumeControls />
      </section>

      <p className="pause-menu__hint">{t('parent.tip')}</p>

      <section className="parent-corner__section" aria-labelledby="parent-reset">
        <h3 id="parent-reset">{t('parent.resetTitle')}</h3>
        <p>{t('parent.resetText')}</p>
        {confirming ? (
          <div className="pause-menu__row">
            <button type="button" className="btn btn--danger" onClick={startOver}>
              {t('parent.resetConfirm')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)}>
              {t('parent.resetCancel')}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)}>
            {t('parent.resetButton')}
          </button>
        )}
      </section>

      <button type="button" className="btn" onClick={onClose}>
        {t('parent.close')}
      </button>
    </div>
  )
}

/** The corner for grown-ups: behind a gate (a sum), then what the game can tell them. It replaces the pause menu's card while it is open. */
export default function ParentCorner({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return open ? <Contents onClose={onClose} /> : <ParentGate onOpen={() => setOpen(true)} onClose={onClose} />
}
