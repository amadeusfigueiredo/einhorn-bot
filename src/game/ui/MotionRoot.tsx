import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'

/**
 * Loads only the DOM-animation feature set of Motion (components use the
 * lightweight `m` primitive) and honours the OS "reduce motion" setting for
 * every transform animation below it.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
