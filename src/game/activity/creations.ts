import { createStore } from 'zustand/vanilla'
import type { Take } from './sequence'

/**
 * What she has made in an activity (a tune, a kata, a dance, a robot's way): up to three for each, the newest last, kept
 * on the device so she can play them again another day. Pure but for the storage it is given.
 */
export type Creation<E> = { id: string; at: number; take: Take<E> }

export const CREATIONS_STORAGE_KEY = 'amaras-einhorn-schule:creations:v1'
export const MAX_CREATIONS = 3

export type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void }

type Saved = Record<string, Creation<unknown>[]>

function isCreation(value: unknown): value is Creation<unknown> {
  const c = value as Creation<unknown> | null
  return !!c && typeof c.id === 'string' && typeof c.at === 'number' && Array.isArray(c.take) && c.take.every((m) => !!m && typeof m === 'object' && typeof (m as { at: unknown }).at === 'number' && 'event' in m)
}

function read(storage: StorageLike | null): Saved {
  if (!storage) return {}
  try {
    const raw = storage.getItem(CREATIONS_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).flatMap(([key, list]) => (Array.isArray(list) ? [[key, list.filter(isCreation).slice(-MAX_CREATIONS)]] : [])))
  } catch {
    return {}
  }
}

export type CreationsState = {
  saved: Saved
  /** What she has made in this activity, oldest first. */
  of: <E>(key: string) => Creation<E>[]
  /** Keeps a new one (the oldest goes when there are already three) and returns it. */
  save: <E>(key: string, take: Take<E>, at?: number) => Creation<E>
}

export function createCreationsStore(storage: StorageLike | null) {
  let counter = 0
  return createStore<CreationsState>((set, get) => ({
    saved: read(storage),
    of: <E,>(key: string) => (get().saved[key] ?? []) as Creation<E>[],
    save: <E,>(key: string, take: Take<E>, at = Date.now()) => {
      const creation: Creation<E> = { id: `${at}-${++counter}`, at, take }
      const saved = { ...get().saved, [key]: [...(get().saved[key] ?? []), creation as Creation<unknown>].slice(-MAX_CREATIONS) }
      set({ saved })
      try {
        storage?.setItem(CREATIONS_STORAGE_KEY, JSON.stringify(saved))
      } catch {
        // Storage can be unavailable (private browsing, full): she just does not find it again tomorrow.
      }
      return creation
    },
  }))
}

/** The creations of this device. */
export const creationsStore = createCreationsStore(typeof window === 'undefined' ? null : window.localStorage)
