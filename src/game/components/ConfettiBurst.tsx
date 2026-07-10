import { useMemo, type CSSProperties } from 'react'
import { generateConfetti } from '../utils/confetti'

type ConfettiPieceStyle = CSSProperties & { '--drift': string }

export function ConfettiBurst({ count = 32 }: { count?: number }) {
  const pieces = useMemo(() => generateConfetti(count), [count])

  return (
    <div className="confetti-burst" aria-hidden="true">
      {pieces.map((p, i) => {
        const style: ConfettiPieceStyle = {
          left: `${p.left}%`,
          backgroundColor: p.color,
          animationDelay: `${p.delaySeconds}s`,
          animationDuration: `${p.durationSeconds}s`,
          transform: `rotate(${p.rotationDeg}deg)`,
          '--drift': `${p.driftPx}px`,
        }
        return <span key={i} className="confetti-piece" style={style} />
      })}
    </div>
  )
}
