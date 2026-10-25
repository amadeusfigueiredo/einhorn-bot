import { createElement, Fragment, forwardRef, type ReactNode } from 'react'

/**
 * A stand-in for framer-motion in tests: `m.div` is a plain div (motion props
 * dropped), AnimatePresence shows or removes its children at once. Animations
 * do not run in jsdom, so a test that needs "the card is gone after 2 s" mocks
 * the library with this.
 */
const MOTION_PROPS = new Set(['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'variants', 'layout', 'layoutId'])

const motion = new Proxy(
  {},
  {
    get: (_t, tag: string) =>
      forwardRef<unknown, Record<string, unknown>>((props, ref) => {
        const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k)))
        return createElement(tag, { ...rest, ref })
      }),
  }
)

const Passthrough = ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children)

export default {
  m: motion,
  motion,
  AnimatePresence: Passthrough,
  LazyMotion: Passthrough,
  MotionConfig: Passthrough,
  domAnimation: {},
}
