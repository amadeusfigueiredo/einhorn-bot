/** A drawing surface that remembers what was drawn, and answers the few questions the code asks it. */
export function recorder() {
  const calls: string[] = []
  const state: Record<string, unknown> = {}
  const ctx = new Proxy(state, {
    get: (t, name: string) => {
      if (name in t) return t[name]
      if (name === 'measureText') return (text: string) => ({ width: String(text).length * 9 })
      if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => ({ addColorStop: () => calls.push('stop') })
      return (...args: unknown[]) => void calls.push(`${name}:${args.map((a) => (typeof a === 'number' ? Math.round(a * 100) / 100 : typeof a === 'object' ? 'obj' : a)).join(',')}`)
    },
    set: (t, name: string, value: unknown) => {
      t[name] = value
      calls.push(`${name}=${typeof value === 'object' ? 'obj' : typeof value === 'number' ? Math.round(value * 100) / 100 : value}`)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, calls, state }
}

/** A loaded picture of this size. */
export const image = (w = 600, h = 400) => ({ width: w, height: h, naturalWidth: w, naturalHeight: h }) as unknown as HTMLImageElement

/** How many of the calls start with `name` (a drawing command, or `name=` for a setting). */
export const count = (calls: string[], name: string) => calls.filter((c) => c.startsWith(name)).length
