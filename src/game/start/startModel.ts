/**
 * When the start menu (title, language, "Who do you play?") is shown. Pure, so the rule is tested without a screen.
 * It opens every time the game opens, so a child sees there are two heroes and can pick the language; the
 * address can skip it for testing and links: `?menu=0`, and `?intro=0` (which the browser scripts already use,
 * and which means "straight into the game").
 */
export function shouldShowStartMenu(search: string): boolean {
  const params = new URLSearchParams(search)
  for (const key of ['menu', 'intro']) {
    const flag = params.get(key)?.toLowerCase()
    if (flag === '0' || flag === 'off' || flag === 'false') return false
  }
  return true
}
