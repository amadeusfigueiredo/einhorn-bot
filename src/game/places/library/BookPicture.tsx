import { useId, type ReactNode } from 'react'
import { PAGE_SIZE, type Prop, type PropKind, type Scene } from './bookArt'

const INK = '#2A1A52'

/** A star of five points about (0, 0). */
function starPoints(outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`
  }).join(' ')
}

const STAR = starPoints(20, 8.5)

/** Eyes: two dots, or two shut curves when asleep. */
function Eyes({ x, y, gap, asleep }: { x: number; y: number; gap: number; asleep?: boolean }) {
  return asleep ? (
    <g fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round">
      <path d={`M ${x - gap - 4} ${y} q 4 4 8 0`} />
      <path d={`M ${x + gap - 4} ${y} q 4 4 8 0`} />
    </g>
  ) : (
    <g fill={INK}>
      <circle cx={x - gap} cy={y} r="3" />
      <circle cx={x + gap} cy={y} r="3" />
      <circle cx={x - gap + 1} cy={y - 1} r="1" fill="#fff" />
      <circle cx={x + gap + 1} cy={y - 1} r="1" fill="#fff" />
    </g>
  )
}

/** The drawing of each kind of thing, about 100 across and centred on (0, 0). */
const DRAW: Record<PropKind, (p: Prop) => ReactNode> = {
  moon: () => (
    <>
      <circle r="52" fill="#FFF3C4" opacity="0.25" />
      <circle r="38" fill="#FFF3C4" />
      <circle cx="-12" cy="-10" r="8" fill="#F0E2A8" />
      <circle cx="14" cy="8" r="11" fill="#F0E2A8" />
      <circle cx="-8" cy="20" r="5" fill="#F0E2A8" />
    </>
  ),
  star: () => (
    <>
      <circle r="30" fill="#FFE066" opacity="0.22" />
      <polygon points={STAR} fill="#FFE066" />
    </>
  ),
  faceStar: () => (
    <>
      <circle r="42" fill="#FFE066" opacity="0.22" />
      <polygon points={starPoints(36, 16)} fill="#FFE066" />
      <Eyes x={0} y={-2} gap={8} />
      <path d="M -7 8 q 7 7 14 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="-15" cy="6" r="4" fill="#FFA0C0" opacity="0.8" />
      <circle cx="15" cy="6" r="4" fill="#FFA0C0" opacity="0.8" />
      {/* a little waving arm */}
      <path d="M -26 -6 q -16 -4 -18 -20" fill="none" stroke="#FFE066" strokeWidth="7" strokeLinecap="round" />
      <circle cx="-44" cy="-28" r="6" fill="#FFE066" />
    </>
  ),
  shootingStar: () => (
    <>
      <polygon points="-8,-4 -85,38 -10,12" fill="#FFF3C4" opacity="0.55" />
      <polygon points="-6,-2 -60,22 -8,8" fill="#FFE066" opacity="0.8" />
      <polygon points={starPoints(24, 10)} fill="#FFE066" />
      <circle cx="-48" cy="30" r="2.5" fill="#fff" />
      <circle cx="-70" cy="20" r="2" fill="#fff" />
    </>
  ),
  cloud: () => (
    <g fill="#fff" opacity="0.92">
      <circle cx="-22" cy="4" r="18" />
      <circle cx="2" cy="-6" r="24" />
      <circle cx="28" cy="4" r="17" />
      <rect x="-40" y="4" width="84" height="18" rx="9" />
    </g>
  ),
  koala: (p) => (
    <>
      <ellipse cx="-27" cy="14" rx="9" ry="17" fill="#A9AFBC" transform="rotate(18 -27 14)" />
      <ellipse cx="27" cy="14" rx="9" ry="17" fill="#A9AFBC" transform="rotate(-18 27 14)" />
      <ellipse cy="14" rx="29" ry="31" fill="#B8BEC9" />
      <ellipse cy="20" rx="18" ry="21" fill="#E8EBF1" />
      <ellipse cx="-14" cy="44" rx="11" ry="7" fill="#A9AFBC" />
      <ellipse cx="14" cy="44" rx="11" ry="7" fill="#A9AFBC" />
      <circle cx="-23" cy="-44" r="12" fill="#B8BEC9" />
      <circle cx="23" cy="-44" r="12" fill="#B8BEC9" />
      <circle cx="-23" cy="-44" r="6" fill="#F2C6D6" />
      <circle cx="23" cy="-44" r="6" fill="#F2C6D6" />
      <circle cy="-26" r="26" fill="#B8BEC9" />
      <Eyes x={0} y={-30} gap={10} asleep={p.mood === 'asleep'} />
      <ellipse cy="-20" rx="8" ry="10" fill="#3C3A4A" />
      <circle cx="-3" cy="-23" r="2" fill="#fff" opacity="0.5" />
    </>
  ),
  capybara: (p) => (
    <>
      <ellipse cx="-4" cy="16" rx="46" ry="28" fill="#B98760" />
      <ellipse cx="-4" cy="26" rx="34" ry="14" fill="#CDA07A" />
      <ellipse cx="34" cy="-8" rx="24" ry="19" fill="#B98760" />
      <ellipse cx="52" cy="-2" rx="11" ry="13" fill="#A06F4C" />
      <ellipse cx="57" cy="-8" rx="3" ry="2.5" fill="#3C2A1E" />
      <ellipse cx="22" cy="-24" rx="6" ry="5" fill="#A06F4C" />
      {p.mood === 'asleep' ? (
        <path d="M 30 -14 q 5 4 10 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="36" cy="-14" r="3" fill={INK} />
          <circle cx="37" cy="-15" r="1" fill="#fff" />
        </>
      )}
      <path d="M 52 8 q 5 4 10 -2" fill="none" stroke="#3C2A1E" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  parrot: () => (
    <>
      <path d="M -4 14 L -16 52 L 0 40 L 12 52 L 6 14 Z" fill="#74C0FC" />
      <ellipse cy="0" rx="14" ry="20" fill="#FF6B6B" />
      <ellipse cx="8" cy="4" rx="7" ry="14" fill="#4DD4C0" transform="rotate(-12 8 4)" />
      <circle cy="-24" r="12" fill="#FF6B6B" />
      <path d="M 8 -26 L 22 -22 L 9 -17 Z" fill="#FFD166" />
      <circle cx="3" cy="-27" r="2.6" fill={INK} />
      <circle cx="4" cy="-28" r="0.9" fill="#fff" />
    </>
  ),
  bathtub: () => (
    <>
      <path d="M -54 -10 H 54 V 14 q 0 32 -32 32 H -22 q -32 0 -32 -32 Z" fill="#FFFFFF" />
      <path d="M -54 -10 H 54 V -2 H -54 Z" fill="#E4ECF7" />
      <ellipse cy="-10" rx="52" ry="7" fill="#9ED8FF" opacity="0.9" />
      <circle cx="-34" cy="50" r="6" fill="#B79CFF" />
      <circle cx="34" cy="50" r="6" fill="#B79CFF" />
      <circle cx="-18" cy="-22" r="5" fill="#fff" opacity="0.8" />
      <circle cx="12" cy="-26" r="4" fill="#fff" opacity="0.8" />
      <circle cx="32" cy="-20" r="6" fill="#fff" opacity="0.8" />
    </>
  ),
  bubble: (p) => (
    <>
      <circle r="14" fill={p.color ?? '#DFF6FF'} opacity="0.35" />
      <circle r="14" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
      <circle cx="-5" cy="-5" r="3.5" fill="#fff" />
    </>
  ),
  iceCream: () => (
    <>
      <polygon points="-22,16 22,16 0,86" fill="#E8B26A" />
      <path d="M -14 28 L 14 28 M -9 44 L 9 44 M -5 60 L 5 60" stroke="#C98F45" strokeWidth="2" fill="none" />
      <circle cy="6" r="29" fill="#FF8FC0" />
      <circle cx="-4" cy="-24" r="24" fill="#8CE99A" />
      <circle cx="3" cy="-46" r="18" fill="#FFF1B8" />
      <circle cx="6" cy="-66" r="6" fill="#FF4D6D" />
      <g fill="#fff" opacity="0.8">
        <rect x="-16" y="-4" width="7" height="3" rx="1.5" transform="rotate(25 -12 -2)" />
        <rect x="8" y="14" width="7" height="3" rx="1.5" transform="rotate(-20 12 16)" />
        <rect x="-4" y="-34" width="7" height="3" rx="1.5" transform="rotate(10 0 -32)" />
        <rect x="6" y="-54" width="6" height="3" rx="1.5" transform="rotate(-30 8 -52)" />
      </g>
    </>
  ),
  unicorn: () => (
    <>
      <path d="M -34 6 q -22 -2 -26 22 q 12 -10 26 -4 Z" fill="#B79CFF" />
      <rect x="-26" y="22" width="9" height="30" rx="4" fill="#fff" />
      <rect x="-12" y="22" width="9" height="30" rx="4" fill="#EDEBFA" />
      <rect x="12" y="22" width="9" height="30" rx="4" fill="#EDEBFA" />
      <rect x="26" y="22" width="9" height="30" rx="4" fill="#fff" />
      <ellipse cy="10" rx="38" ry="24" fill="#FFFFFF" />
      <path d="M 24 -4 L 44 -34 L 56 -22 L 40 6 Z" fill="#fff" />
      <ellipse cx="54" cy="-20" rx="18" ry="14" fill="#fff" />
      <polygon points="52,-30 60,-30 58,-62" fill="#FFD166" />
      <path d="M 46 -30 q -10 -2 -14 14 M 36 -24 q -12 6 -10 20 M 30 -14 q -12 10 -6 24" fill="none" stroke="#FF8FC0" strokeWidth="6" strokeLinecap="round" />
      <path d="M 40 -22 q -10 4 -10 16" fill="none" stroke="#74C0FC" strokeWidth="5" strokeLinecap="round" />
      <circle cx="58" cy="-22" r="2.8" fill={INK} />
      <circle cx="49" cy="-14" r="4" fill="#FFA0C0" opacity="0.8" />
    </>
  ),
  bunny: () => (
    <>
      <ellipse cx="-8" cy="-44" rx="8" ry="22" fill="#F5F0FF" transform="rotate(-8 -8 -44)" />
      <ellipse cx="10" cy="-44" rx="8" ry="22" fill="#F5F0FF" transform="rotate(8 10 -44)" />
      <ellipse cx="-8" cy="-44" rx="4" ry="15" fill="#FFB3D4" transform="rotate(-8 -8 -44)" />
      <ellipse cx="10" cy="-44" rx="4" ry="15" fill="#FFB3D4" transform="rotate(8 10 -44)" />
      <ellipse cy="26" rx="28" ry="26" fill="#F5F0FF" />
      <circle cy="-8" r="22" fill="#F5F0FF" />
      <Eyes x={0} y={-10} gap={8} />
      <ellipse cy="-2" rx="4" ry="3" fill="#FF8FC0" />
      <circle cx="-14" cy="-2" r="4" fill="#FFA0C0" opacity="0.7" />
      <circle cx="14" cy="-2" r="4" fill="#FFA0C0" opacity="0.7" />
    </>
  ),
  heart: (p) => <path d="M 0 22 C -34 -4 -22 -30 0 -12 C 22 -30 34 -4 0 22 Z" fill={p.color ?? '#FF6B9A'} />,
  flower: (p) => (
    <>
      <rect x="-3" y="0" width="6" height="60" rx="3" fill="#4FBF8A" />
      <ellipse cx="-14" cy="34" rx="12" ry="5" fill="#4FBF8A" transform="rotate(-25 -14 34)" />
      <ellipse cx="14" cy="22" rx="12" ry="5" fill="#4FBF8A" transform="rotate(25 14 22)" />
      <g fill={p.color ?? '#FF8FC0'}>
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={Math.cos((i * Math.PI) / 3) * 20} cy={Math.sin((i * Math.PI) / 3) * 20 - 8} r="13" />
        ))}
      </g>
      <circle cy="-8" r="11" fill="#FFD166" />
      <circle cx="-3" cy="-11" r="2" fill="#fff" opacity="0.6" />
    </>
  ),
  donutTree: () => (
    <>
      <rect x="-9" y="10" width="18" height="70" rx="6" fill="#9E6B45" />
      <path fillRule="evenodd" d="M -52 -20 a 52 40 0 1 0 104 0 a 52 40 0 1 0 -104 0 Z M -14 -20 a 14 11 0 1 1 28 0 a 14 11 0 1 1 -28 0 Z" fill="#F4B6D0" />
      <path fillRule="evenodd" d="M -46 -24 a 46 32 0 1 0 92 0 a 46 32 0 1 0 -92 0 Z M -14 -24 a 14 10 0 1 1 28 0 a 14 10 0 1 1 -28 0 Z" fill="#FF8FC0" />
      <g>
        <rect x="-34" y="-40" width="9" height="3.5" rx="1.7" fill="#FFE066" transform="rotate(20 -30 -38)" />
        <rect x="18" y="-42" width="9" height="3.5" rx="1.7" fill="#74C0FC" transform="rotate(-25 22 -40)" />
        <rect x="-8" y="-52" width="9" height="3.5" rx="1.7" fill="#8CE99A" transform="rotate(8 -4 -50)" />
        <rect x="26" y="-22" width="9" height="3.5" rx="1.7" fill="#FFE066" transform="rotate(40 30 -20)" />
        <rect x="-40" y="-14" width="9" height="3.5" rx="1.7" fill="#B79CFF" transform="rotate(-35 -36 -12)" />
        <rect x="-18" y="-8" width="9" height="3.5" rx="1.7" fill="#fff" transform="rotate(15 -14 -6)" />
        <rect x="8" y="-6" width="9" height="3.5" rx="1.7" fill="#FFE066" transform="rotate(-10 12 -4)" />
      </g>
    </>
  ),
  girl: (p) => (
    <>
      <rect x="-14" y="30" width="10" height="34" rx="5" fill="#2F6DB5" />
      <rect x="4" y="30" width="10" height="34" rx="5" fill="#2F6DB5" />
      <ellipse cx="-9" cy="66" rx="9" ry="5" fill="#FFB3D4" />
      <ellipse cx="9" cy="66" rx="9" ry="5" fill="#FFB3D4" />
      <path d="M -24 36 q -4 -34 6 -42 h 36 q 10 8 6 42 Z" fill="#FFB3D4" />
      <circle cx="-4" cy="14" r="5" fill="#FF8FC0" opacity="0.7" />
      <circle cx="9" cy="22" r="4" fill="#9775FA" opacity="0.5" />
      {p.mood === 'up' ? (
        <path d="M -22 -2 q -22 -8 -20 -34" fill="none" stroke="#FFD9B8" strokeWidth="8" strokeLinecap="round" />
      ) : null}
      <circle cy="-24" r="22" fill="#8B5A2B" />
      <circle cy="-48" r="9" fill="#8B5A2B" />
      <circle cy="-20" r="19" fill="#FFD9B8" />
      <path d="M -19 -26 q 19 -16 38 0 q -6 -12 -19 -12 q -13 0 -19 12 Z" fill="#8B5A2B" />
      {p.mood === 'up' ? (
        <g fill={INK}>
          <circle cx="-7" cy="-24" r="2.6" />
          <circle cx="7" cy="-24" r="2.6" />
          <circle cx="-6" cy="-25.2" r="0.9" fill="#fff" />
          <circle cx="8" cy="-25.2" r="0.9" fill="#fff" />
        </g>
      ) : (
        <Eyes x={0} y={-20} gap={7} />
      )}
      <path d="M -5 -9 q 5 5 10 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="-12" cy="-12" r="3.5" fill="#FFA0C0" opacity="0.8" />
      <circle cx="12" cy="-12" r="3.5" fill="#FFA0C0" opacity="0.8" />
    </>
  ),
  zzz: () => (
    <g fill="#fff" fontFamily="sans-serif" fontWeight="700" opacity="0.92">
      <text x="-22" y="14" fontSize="16">z</text>
      <text x="-6" y="-4" fontSize="24">z</text>
      <text x="14" y="-28" fontSize="32">Z</text>
    </g>
  ),
  number: (p) => (
    <text textAnchor="middle" dominantBaseline="central" fontFamily="'Fredoka', 'Baloo 2', sans-serif" fontWeight="700" fontSize="34" fill="#fff" stroke="#6B4FD8" strokeWidth="1.5">
      {p.text}
    </text>
  ),
}

/**
 * The picture of a page: the sky, the ground and the things of the scene (see `bookArt.ts`). A drawing for the eyes
 * only: the words are on the other page, so it is hidden from screen readers.
 */
export function BookPicture({ scene }: { scene: Scene }) {
  const id = useId()
  return (
    <svg className="book-picture" viewBox={`0 0 ${PAGE_SIZE} ${PAGE_SIZE}`} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.sky[0]} />
          <stop offset="1" stopColor={scene.sky[1]} />
        </linearGradient>
      </defs>
      <rect width={PAGE_SIZE} height={PAGE_SIZE} fill={`url(#${id}-sky)`} />
      {scene.ground && <ellipse cx={PAGE_SIZE / 2} cy={scene.ground.y + 140} rx="190" ry="140" fill={scene.ground.color} />}
      {scene.props.map((p, i) => (
        <g key={i} data-kind={p.kind} transform={`translate(${p.x} ${p.y}) scale(${(p.flip ? -1 : 1) * (p.s ?? 1)} ${p.s ?? 1})`}>
          {DRAW[p.kind](p)}
        </g>
      ))}
    </svg>
  )
}
