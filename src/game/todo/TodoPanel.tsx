import { useEffect, useRef } from 'react'
import { STAGES } from '../constants/stages'
import { roomFor } from '../data/classrooms'
import { WORLD_NAMES } from '../data/worlds'
import { useT } from '../i18n/useT'
import { answeredIn, missingClasses, requiredAnswers } from '../logic/classProgress'
import { useGame } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { usePlace } from '../places/placeStore'
import { goToClass } from './travel'
import { todoStore } from './todoStore'

/**
 * "What is left?": the classes she has not finished yet, each with how many of its questions she has answered and a
 * button to go there (in the corridor she walks to its door; in a classroom she goes straight in). A dialog the game waits
 * behind, like the sticker book; Escape or P go back to the game.
 */
export function TodoPanel() {
  const { t, lang } = useT()
  const solved = useGame((g) => g.solved)
  const here = useGame((g) => g.stageIndex)
  const place = usePlace()
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
  }, [])
  const left = missingClasses(solved, STAGES)

  const back = () => {
    todoStore.getState().closeList()
    pauseStore.getState().resume()
  }

  return (
    <div className="scrim scrim--pause" role="dialog" aria-modal="true" aria-labelledby="todo-title">
      <div className="card todo">
        <h2 id="todo-title" className="todo__title">
          <span aria-hidden="true">📋</span> {t('todo.title')}
        </h2>
        <p className="todo__count">{left.length === 0 ? t('todo.none') : left.length === 1 ? t('todo.one') : t('todo.many', { n: left.length })}</p>
        {left.length === 0 ? (
          <p className="todo__all-done">{t('todo.allDone')}</p>
        ) : (
          <ul className="todo__list">
            {left.map((i) => {
              const stage = STAGES[i]
              const answered = answeredIn(solved, stage).size
              return (
                <li key={i} className="todo__item">
                  <span className="todo__num">{i + 1}</span>
                  <span className="todo__text">
                    <span className="todo__name">{WORLD_NAMES[roomFor(stage.name).world][lang]}</span>
                    <span className="todo__how">{t('todo.answered', { n: answered, total: requiredAnswers(stage) })}</span>
                  </span>
                  {i === here && place === 'class' ? (
                    <span className="todo__here">{t('todo.here')}</span>
                  ) : (
                    <button type="button" className="btn todo__go" onClick={() => goToClass(i)}>
                      {t('todo.go')}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <button ref={close} type="button" className="btn todo__close" onClick={back}>
          <span aria-hidden="true">▶️</span> {t('todo.close')}
        </button>
      </div>
    </div>
  )
}
