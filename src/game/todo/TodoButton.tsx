import { STAGES } from '../constants/stages'
import { useT } from '../i18n/useT'
import { missingClasses } from '../logic/classProgress'
import { useGame } from '../logic/gameStore.instance'
import { pauseStore } from '../pause/pauseStore'
import { todoStore } from './todoStore'

/** The round button of the controls bar that opens "What is left?": which classes she still has to do (the game waits behind it, like the pause menu). It says how many are left. */
export function TodoButton() {
  const { t } = useT()
  const solved = useGame((g) => g.solved)
  const left = missingClasses(solved, STAGES).length
  return (
    <button
      type="button"
      className="sound-toggle todo-toggle"
      aria-label={t('todo.button')}
      onClick={() => {
        pauseStore.getState().pause()
        todoStore.getState().openList()
      }}
    >
      <span aria-hidden="true">📋</span>
      {left > 0 && <span className="todo-toggle__count" aria-hidden="true">{left}</span>}
    </button>
  )
}
