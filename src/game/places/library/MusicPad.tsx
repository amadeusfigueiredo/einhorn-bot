import { useMemo } from 'react'
import { ActivityPanel, type ActivityLabels } from '../../activity/ActivityPanel'
import { useT } from '../../i18n/useT'
import { musicStore } from './musicStore'
import { BARS, SONGS, barForKey } from './xylophone'

/**
 * The xylophone over the library: eight coloured bars to tap (or press 1 to 8, or A to K), a record button that keeps
 * her tune and plays it back, and three songs to hear or to play along with while the next bar glows. It is the panel of
 * the shared activity engine (`activity/ActivityPanel.tsx`) with the bars as what she plays on. Page elements, not part
 * of the picture. Escape closes it.
 */
export function MusicPad() {
  const { t, lang } = useT()
  const labels = useMemo<ActivityLabels>(
    () => ({
      title: t('music.title'),
      icon: '🎵',
      close: t('music.close'),
      hint: t('music.hint'),
      recording: t('music.recording'),
      follow: t('music.follow'),
      listening: t('music.listening'),
      done: t('music.done'),
      record: t('music.record'),
      stop: t('music.stop'),
      playMine: t('music.playTune'),
      stopLesson: t('music.stopSong'),
      lessons: t('music.songs'),
      listen: (song) => t('music.listen', { song }),
      along: (song) => t('music.along', { song }),
      creation: (n) => t('activity.creation', { n }),
    }),
    [t]
  )
  const songs = useMemo(() => SONGS.map((s) => ({ id: s.id, name: s.name[lang] })), [lang])
  return (
    <ActivityPanel store={musicStore} labels={labels} lessons={songs} keyToEvent={barForKey} className="music-pad">
      {({ lit, struck, strike, first }) => (
        <div className="music-pad__bars">
          {BARS.map((bar) => {
            const classes = ['music-pad__bar']
            if (lit === bar.id) classes.push('is-lit')
            if (struck === bar.id) classes.push('is-struck')
            return (
              <button
                key={bar.id}
                ref={bar.id === 0 ? first : undefined}
                type="button"
                className={classes.join(' ')}
                style={{ ['--bar-color' as string]: bar.color, ['--bar-length' as string]: String(1 - bar.id * 0.045) }}
                aria-label={t('music.bar', { n: bar.id + 1, note: bar.name[lang] })}
                onPointerDown={() => strike(bar.id)}
                // (A press with the keyboard has no pointer: its click has no position.)
                onClick={(e) => e.detail === 0 && strike(bar.id)}
              >
                <span className="music-pad__note">{bar.name[lang]}</span>
                <span className="music-pad__number" aria-hidden="true">{bar.id + 1}</span>
              </button>
            )
          })}
        </div>
      )}
    </ActivityPanel>
  )
}
