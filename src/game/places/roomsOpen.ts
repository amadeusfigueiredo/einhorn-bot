/**
 * The special rooms (the sports hall with the pony yard, the pool, the dojo and the dance hall, the tech room and the
 * science room) are open for everybody. `?rooms=0` in the address closes their doors again (for the developers, to see the
 * school as it was).
 */
export function roomsOpen(search: string = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('rooms') !== '0'
}
