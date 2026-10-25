/**
 * Is she busy with something that has the room, so that nobody walks about and a tap in the room does nothing? A
 * friend's talk, an open book and the open xylophone are. Each of them says so itself (`registerBusy`, at the moment its
 * code is loaded), so the page that asks does not have to load all of them: the first page of the game asks and
 * has none of their code, texts or songs yet (nothing can be open then).
 */
const sources = new Set<() => boolean>()

export function registerBusy(isBusy: () => boolean): void {
  sources.add(isBusy)
}

export function isBusy(): boolean {
  for (const source of sources) if (source()) return true
  return false
}
