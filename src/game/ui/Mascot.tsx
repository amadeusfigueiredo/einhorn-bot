import { useT } from '../i18n/useT'

export type MascotPose = 'wave' | 'happy' | 'think' | 'proud'

const RAINBOW_MANE = ['#FF7EB6', '#B79CFF', '#8EC5FF', '#6EE7C8', '#FFD166']

/**
 * Our own unicorn mascot (no image files, no assets from the internet): a
 * small SVG with four poses. Used on the welcome card and the feedback screens.
 */
export function Mascot({ pose = 'wave', size = 200, className }: { pose?: MascotPose; size?: number; className?: string }) {
  const { t } = useT()
  const m = RAINBOW_MANE
  const tilt = pose === 'happy' ? -8 : pose === 'think' ? 6 : 0
  const cheerful = pose === 'happy' || pose === 'proud'
  return (
    <svg
      className={['mascot', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={t('mascot.label')}
      style={{ overflow: 'visible' }}
    >
      <ellipse cx="100" cy="190" rx="60" ry="8" fill="#000" opacity=".15" />
      <g className={pose === 'happy' ? 'mascot__jump' : undefined} transform={`rotate(${tilt} 100 110)`}>
        <circle cx="38" cy="118" r="13" fill={m[0]} />
        <circle cx="30" cy="134" r="12" fill={m[1]} />
        <circle cx="34" cy="149" r="11" fill={m[2]} />
        <rect x="64" y="140" width="18" height="40" rx="9" fill="#F3E6FF" />
        <rect x="120" y="140" width="18" height="40" rx="9" fill="#F3E6FF" />
        <rect x="80" y="142" width="18" height="42" rx="9" fill="#FFF7FB" />
        <rect x="136" y="142" width="18" height="42" rx="9" fill="#FFF7FB" />
        <rect x="80" y="174" width="18" height="10" rx="5" fill="#FF7EB6" />
        <rect x="136" y="174" width="18" height="10" rx="5" fill="#FF7EB6" />
        <ellipse cx="102" cy="128" rx="56" ry="38" fill="#FFF7FB" />
        <ellipse cx="96" cy="116" rx="36" ry="14" fill="#FFFFFF" opacity=".8" />
        {pose === 'wave' && <rect className="mascot__wave" x="150" y="98" width="18" height="40" rx="9" fill="#FFF7FB" transform="rotate(-40 159 130)" />}
        <circle cx="140" cy="82" r="38" fill="#FFF7FB" />
        <ellipse cx="164" cy="98" rx="20" ry="16" fill="#FFE3EF" />
        {pose === 'think' ? (
          <path d="M156 108 Q164 104 172 108" stroke="#7A4E8E" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M154 104 Q164 116 174 104" stroke="#7A4E8E" strokeWidth="3" fill={cheerful ? '#E77AA6' : 'none'} strokeLinecap="round" />
        )}
        <path d="M134 50 L150 6 L160 52 Z" fill="#FFD166" stroke="#F4B73E" strokeWidth="3" strokeLinejoin="round" />
        <path d="M140 38 L156 32 M144 26 L154 22" stroke="#F4B73E" strokeWidth="3" strokeLinecap="round" />
        <circle cx="112" cy="58" r="16" fill={m[0]} />
        <circle cx="104" cy="76" r="15" fill={m[1]} />
        <circle cx="102" cy="96" r="14" fill={m[2]} />
        <circle cx="106" cy="114" r="12" fill={m[3]} />
        <circle cx="128" cy="46" r="11" fill={m[4]} />
        {cheerful ? (
          <path d="M140 76 q8 -10 16 0" stroke="#3B2A5C" strokeWidth="5" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx="148" cy="78" rx="8" ry="10" fill="#3B2A5C" />
            <circle cx="151" cy="74" r="3.5" fill="#fff" />
            <circle cx="146" cy="82" r="1.6" fill="#fff" />
          </>
        )}
        <ellipse cx="138" cy="96" rx="8" ry="5" fill="#FF9EC4" opacity=".7" />
        {pose === 'proud' && (
          <>
            <path d="M126 46 L132 28 L142 40 L150 24 L158 40 L168 28 L172 46 Z" fill="#FFD166" stroke="#F4B73E" strokeWidth="3" strokeLinejoin="round" />
            <path d="M160 140 h36 v10 a18 18 0 0 1 -36 0 z" fill="#FFD166" />
            <rect x="174" y="166" width="8" height="14" fill="#F4B73E" />
            <rect x="166" y="178" width="24" height="8" rx="4" fill="#F4B73E" />
          </>
        )}
      </g>
      {pose === 'think' && (
        <g>
          <circle cx="62" cy="40" r="8" fill="#FFF7FB" />
          <circle cx="44" cy="22" r="14" fill="#FFF7FB" />
          <text x="44" y="29" textAnchor="middle" fontFamily="Fredoka" fontWeight="700" fontSize="18" fill="#6B4FD8">?</text>
        </g>
      )}
      {cheerful && (
        <g>
          <path className="mascot__twinkle" d="M24 40 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#FFD166" />
          <path className="mascot__twinkle mascot__twinkle--late" d="M182 24 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  )
}
