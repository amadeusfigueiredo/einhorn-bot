import { useMemo, type CSSProperties } from 'react'
import { generateConfetti } from '../utils/confetti'

type SparkleStyle = CSSProperties & { '--drift': string }

/** Sparkles that rise from behind the win popup (rewards go up, not down). */
export function SparkleBurst({ count = 28 }: { count?: number }) {
  const pieces = useMemo(() => generateConfetti(count), [count])

  return (
    <div className="sparkle-burst" aria-hidden="true">
      {pieces.map((p, i) => {
        const style: SparkleStyle = {
          left: `${p.left}%`,
          backgroundColor: p.color,
          animationDelay: `${p.delaySeconds}s`,
          '--drift': `${p.driftPx}px`,
        }
        return <span key={i} className="sparkle" style={style} />
      })}
    </div>
  )
}
