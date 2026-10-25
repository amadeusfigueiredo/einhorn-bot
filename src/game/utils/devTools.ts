/**
 * The tools of the developers (the stage jumper in the gear menu, the keys 1 and 2) skip the classes, which the
 * school corridor does not allow (class N opens only when all the classes before it are done). So children do not see
 * them: they are there in the development server, and in a built game when the address says `?dev`.
 */
export function devToolsEnabled(search: string = typeof window === 'undefined' ? '' : window.location.search, dev: boolean = import.meta.env.DEV): boolean {
  if (dev) return true
  const flag = new URLSearchParams(search).get('dev')?.toLowerCase()
  return flag !== undefined && flag !== '0' && flag !== 'off' && flag !== 'false'
}
