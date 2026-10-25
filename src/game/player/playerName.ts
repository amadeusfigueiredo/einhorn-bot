import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { StorageLike } from '../utils/progressStorage'

export const MAX_NAME_LENGTH = 20
export const PROFILE_STORAGE_KEY = 'amaras-einhorn-schule:player:v1'

/**
 * Cleans what a child typed: no control characters or angle brackets, single
 * spaces, trimmed, at most 20 characters (counted as visible characters, so
 * an emoji is one). Returns '' when nothing usable is left.
 */
export function sanitizeName(raw: string): string {
  const cleaned = Array.from(raw.replace(/[\t\n\r]/g, ' '))
    .filter((ch) => {
      // (every character of the text has a code)
      const code = ch.codePointAt(0) as number
      return code >= 32 && code !== 127 && !'<>{}'.includes(ch)
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  return Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim()
}

/**
 * Fills a name into copy. `{, name}` becomes ", Anna" (or nothing without a
 * name) so one template reads well both ways; `{name}` is only for templates
 * that are used when a name exists.
 */
export function fillName(template: string, name: string | null | undefined): string {
  const n = name ? sanitizeName(name) : ''
  return template.replace(/\{, name\}/g, n ? `, ${n}` : '').replace(/\{name\}/g, n)
}

export type Profile = {
  /** The child's name, or null when not set (asked, or skipped). */
  name: string | null
  /** The child chose to play without a name: do not ask again. */
  skipped: boolean
}

export type ProfileState = Profile & {
  /** True while the name dialog is open: the world stands still. */
  modalOpen: boolean
  setName: (raw: string) => boolean
  skip: () => void
  openModal: () => void
  closeModal: () => void
}

export type ProfileStore = StoreApi<ProfileState>

function load(storage: StorageLike | null | undefined): Profile {
  const empty: Profile = { name: null, skipped: false }
  if (!storage) return empty
  try {
    const raw = storage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return empty
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return empty
    const p = parsed as Record<string, unknown>
    const name = typeof p.name === 'string' ? sanitizeName(p.name) : ''
    return { name: name || null, skipped: p.skipped === true }
  } catch {
    return empty
  }
}

function save(storage: StorageLike | null | undefined, profile: Profile) {
  if (!storage) return
  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    /* private mode or full storage: the name just isn't remembered */
  }
}

/**
 * The player's profile. The name stays on this device (localStorage) and is
 * never sent anywhere. The dialog opens by itself until a name was entered or
 * skipped.
 */
export function createProfileStore(storage: StorageLike | null | undefined): ProfileStore {
  const saved = load(storage)
  return createStore<ProfileState>((set, get) => ({
    ...saved,
    modalOpen: saved.name === null && !saved.skipped,
    setName: (raw) => {
      const name = sanitizeName(raw)
      if (!name) return false
      set({ name, skipped: false, modalOpen: false })
      save(storage, { name, skipped: false })
      return true
    },
    skip: () => {
      set({ name: null, skipped: true, modalOpen: false })
      save(storage, { name: null, skipped: true })
    },
    openModal: () => set({ modalOpen: true }),
    closeModal: () => {
      // Closing without a choice counts as playing without a name for now.
      if (get().name === null && !get().skipped) get().skip()
      else set({ modalOpen: false })
    },
  }))
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const profileStore = createProfileStore(browserStorage())

export function useProfile<T>(selector: (state: ProfileState) => T): T {
  return useStore(profileStore, selector)
}

export function usePlayerName(): string | null {
  return useProfile((s) => s.name)
}
