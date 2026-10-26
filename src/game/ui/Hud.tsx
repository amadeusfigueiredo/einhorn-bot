import { useMemo } from 'react'
import { useGame } from '../logic/gameStore.instance'
import { requiredAnswers } from '../logic/gameMachine'
import { STAGES } from '../constants/stages'
import type { StageConfig } from '../types'
import { useT } from '../i18n/useT'
import { makeI18n } from '../i18n/i18nContext'
import { difficultyText, subjectText } from '../i18n/phrases'
import { progressDots, starStates, otherLang } from './hudModel'

const SUBJECTS = STAGES.map((s) => s.subject)

/**
 * What is on top of the 3D room: a badge with the stage number, subject and
 * level (in the language of the game and, small, in the other one), four
 * stars for the questions, and fifteen dots for the whole school.
 */
export function Hud({ stage, stageIndex }: { stage: StageConfig; stageIndex: number }) {
  const { t, lang } = useT()
  const answered = useGame((g) => g.answered.size)
  const required = requiredAnswers(stage)
  const second = useMemo(() => makeI18n(otherLang(lang)).t, [lang])
  const stars = starStates(answered, required)
  const dots = progressDots(stageIndex, SUBJECTS)

  return (
    <div className="hud">
      <div className="hud__badge">
        <span className="hud__num">{stageIndex + 1}</span>
        <span className="hud__text">
          <span className="hud__title">{`${subjectText(t, stage.subject)} · ${difficultyText(t, stage.difficulty)}`}</span>
          <span className="hud__sub" lang={otherLang(lang)}>{`${subjectText(second, stage.subject)} · ${difficultyText(second, stage.difficulty)}`}</span>
        </span>
        <span className="hud__stars" role="img" aria-label={t('hud.stars', { n: answered, total: required })}>
          {stars.map((lit, i) => (
            <span key={i} className={lit ? 'hud__star is-earned' : 'hud__star'} aria-hidden="true" />
          ))}
        </span>
      </div>
      <ol className="hud__dots" aria-label={t('hud.progress', { n: stageIndex + 1, total: dots.length })}>
        {dots.map((d) => (
          <li key={d.index} className={`hud__dot is-${d.state}${d.startsGroup ? ' has-gap' : ''}`} />
        ))}
      </ol>
    </div>
  )
}
