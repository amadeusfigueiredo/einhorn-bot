import { describe, it, expect } from 'vitest'
import { MAX_NAME_LENGTH, PROFILE_STORAGE_KEY, createProfileStore, fillName, sanitizeName } from './playerName'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => void (data[k] = v),
    removeItem: (k: string) => void delete data[k],
  }
}

describe('sanitizeName', () => {
  it('trims, collapses spaces and keeps real names intact', () => {
    expect(sanitizeName('  Amara  ')).toBe('Amara')
    expect(sanitizeName('Ana   Maria')).toBe('Ana Maria')
    expect(sanitizeName('João')).toBe('João')
    expect(sanitizeName('Zoë-Marie')).toBe('Zoë-Marie')
  })
  it('removes markup-looking and control characters', () => {
    expect(sanitizeName('<b>Max</b>')).toBe('bMax/b')
    expect(sanitizeName('A\u0000B\nC')).toBe('AB C')
    expect(sanitizeName('{name}')).toBe('name')
  })
  it('limits the length by visible characters', () => {
    expect(Array.from(sanitizeName('x'.repeat(50)))).toHaveLength(MAX_NAME_LENGTH)
    expect(Array.from(sanitizeName('🦄'.repeat(30)))).toHaveLength(MAX_NAME_LENGTH)
  })
  it('returns an empty string when nothing usable is left', () => {
    expect(sanitizeName('   ')).toBe('')
    expect(sanitizeName('<>')).toBe('')
  })
})

describe('fillName', () => {
  it('adds the name after a comma, or nothing at all', () => {
    expect(fillName('Hallo{, name}!', 'Amara')).toBe('Hallo, Amara!')
    expect(fillName('Hallo{, name}!', null)).toBe('Hallo!')
    expect(fillName('Hallo{, name}!', '')).toBe('Hallo!')
  })
  it('fills plain placeholders and cleans the name first', () => {
    expect(fillName('Klasse, {name}!', '  Max ')).toBe('Klasse, Max!')
    expect(fillName('{name} und {name}', 'Lu')).toBe('Lu und Lu')
  })
})

describe('profile store', () => {
  it('asks for a name on the first visit', () => {
    const s = createProfileStore(memoryStorage())
    expect(s.getState().modalOpen).toBe(true)
    expect(s.getState().name).toBeNull()
  })

  it('saves the name and does not ask again next time', () => {
    const storage = memoryStorage()
    const s = createProfileStore(storage)
    expect(s.getState().setName('  Amara ')).toBe(true)
    expect(s.getState().name).toBe('Amara')
    expect(s.getState().modalOpen).toBe(false)
    const again = createProfileStore(storage)
    expect(again.getState().name).toBe('Amara')
    expect(again.getState().modalOpen).toBe(false)
  })

  it('rejects an empty name and keeps the dialog open', () => {
    const s = createProfileStore(memoryStorage())
    expect(s.getState().setName('   ')).toBe(false)
    expect(s.getState().modalOpen).toBe(true)
  })

  it('remembers a skip so the child is not asked every time', () => {
    const storage = memoryStorage()
    createProfileStore(storage).getState().skip()
    const again = createProfileStore(storage)
    expect(again.getState().modalOpen).toBe(false)
    expect(again.getState().name).toBeNull()
  })

  it('the name can be changed later and the dialog reopened', () => {
    const storage = memoryStorage()
    const s = createProfileStore(storage)
    s.getState().setName('Amara')
    s.getState().openModal()
    expect(s.getState().modalOpen).toBe(true)
    s.getState().setName('Lia')
    expect(createProfileStore(storage).getState().name).toBe('Lia')
  })

  it('closing the dialog keeps an existing name', () => {
    const s = createProfileStore(memoryStorage())
    s.getState().setName('Amara')
    s.getState().openModal()
    s.getState().closeModal()
    expect(s.getState().name).toBe('Amara')
    expect(s.getState().modalOpen).toBe(false)
  })

  it('survives broken or hostile saved data', () => {
    for (const raw of ['not json', '42', 'null', '{"name":42}', '{"name":"<>"}']) {
      const s = createProfileStore(memoryStorage({ [PROFILE_STORAGE_KEY]: raw }))
      expect(s.getState().name).toBeNull()
    }
    expect(createProfileStore(null).getState().modalOpen).toBe(true)
  })
})

describe('the profile when the browser will not keep anything', () => {
  it('works without any storage at all, and nothing is saved', () => {
    const store = createProfileStore(null)
    expect(store.getState().name).toBeNull()
    expect(store.getState().setName('Amara')).toBe(true)
    expect(store.getState().name).toBe('Amara')
  })

  it('works when storage refuses to save (private mode, full disk)', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {},
    }
    const store = createProfileStore(broken)
    expect(store.getState().setName('Lia')).toBe(true)
    expect(store.getState().name).toBe('Lia')
  })

  it('starts empty when what is stored cannot be read', () => {
    const garbled = memoryStorage({ [PROFILE_STORAGE_KEY]: '{not json' })
    expect(createProfileStore(garbled).getState().name).toBeNull()
    const notAnObject = memoryStorage({ [PROFILE_STORAGE_KEY]: '5' })
    expect(createProfileStore(notAnObject).getState().name).toBeNull()
  })

  it('closing the card with no name counts as playing without one, for this visit and the next', () => {
    const storage = memoryStorage()
    const store = createProfileStore(storage)
    store.getState().openModal()
    store.getState().closeModal()
    expect(store.getState().skipped).toBe(true)
    expect(store.getState().modalOpen).toBe(false)
    expect(createProfileStore(storage).getState().skipped).toBe(true)
  })

  it('closing the card when she already has a name just closes it', () => {
    const store = createProfileStore(memoryStorage())
    store.getState().setName('Amara')
    store.getState().openModal()
    store.getState().closeModal()
    expect(store.getState().modalOpen).toBe(false)
    expect(store.getState().name).toBe('Amara')
    expect(store.getState().skipped).toBe(false)
  })
})
