export type Progress = {
  stageIndex: number
  answeredIds: string[]
}

export const PROGRESS_STORAGE_KEY = 'amaras-einhorn-schule:progress:v1'

/** Minimal Storage shape so this stays testable without a real browser. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isValidProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.stageIndex === 'number' &&
    Array.isArray(candidate.answeredIds) &&
    candidate.answeredIds.every((id) => typeof id === 'string')
  )
}

export function loadProgress(
  storage: StorageLike | null | undefined
): Progress | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidProgress(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveProgress(
  storage: StorageLike | null | undefined,
  progress: Progress
): void {
  if (!storage) return
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage can be unavailable (private browsing, quota exceeded, etc.) -
    // losing persistence isn't worth crashing the game over.
  }
}

export function clearProgress(storage: StorageLike | null | undefined): void {
  if (!storage) return
  try {
    storage.removeItem(PROGRESS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
