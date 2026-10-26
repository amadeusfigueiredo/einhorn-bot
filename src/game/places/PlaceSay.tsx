import { useEffect } from 'react'
import { useT } from '../i18n/useT'
import { SAY_SECONDS, sayStore, useSaying } from './sayStore'

/** What a thing says out loud, for a few seconds, over the room (and for the screen reader, politely). */
export function PlaceSay() {
  const saying = useSaying()
  const { lang } = useT()
  const key = saying?.key
  useEffect(() => {
    if (key === undefined) return
    const timer = window.setTimeout(() => sayStore.getState().clear(), SAY_SECONDS * 1000)
    return () => window.clearTimeout(timer)
  }, [key])
  if (!saying) return null
  return (
    <p className="place-say" role="status">
      {saying.text[lang]}
    </p>
  )
}
