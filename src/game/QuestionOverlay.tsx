export default function QuestionOverlay({
  prompt,
  choices,
  onPick,
}: {
  prompt: string
  choices: string[]
  onPick: (i: number) => void
}) {
  // Violet/pink-leaning rainbow gradient, matching the unicorn theme
  const rainbowGradient =
    'linear-gradient(to right, #FF4FB8 0%, #FFD166 20%, #C9A7FF 45%, #8A5CF6 70%, #FF8AD4 100%)'

  // Define the radius and border thickness as variables for use in borderImageSlice
  const borderRadius = '20px'
  const borderThickness = '5px'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(74, 46, 110, 0.55)', // Soft violet overlay background
        borderRadius: borderRadius,
        fontFamily: "'Fredoka', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 'min(560px,92vw)',
          background: 'linear-gradient(180deg, #fff7fd 0%, #fdf0ff 100%)',
          color: '#4a2e6e',

          // 1. Set the border-radius
          borderRadius: borderRadius,
          padding: '2.5rem',

          // --- RAINBOW BORDER STYLES ---
          border: `${borderThickness} solid transparent`,
          borderImageSlice: '1',
          borderImage: `${rainbowGradient} 1 / ${borderThickness} / 0 stretch`,

          boxShadow: '0 16px 50px rgba(138, 92, 246, 0.45)',
        }}
      >
        <h3
          style={{
            marginTop: 0,
            fontFamily: "'Baloo 2', system-ui, sans-serif",
            fontWeight: 700,
          }}
        >
          🦄 {prompt.toUpperCase()}
        </h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 15 }}>
          {choices.map((c, i) => (
            <button
              key={i}
              className="choice-btn"
              onClick={() => onPick(i)}
              style={{
                font: 'inherit',
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: '14px',

                // --- Button Styles ---
                border: '2px solid #E0B0FF',
                background: '#fff',
                cursor: 'pointer',
                textTransform: 'uppercase',
                color: '#4a2e6e',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(138, 92, 246, 0.15)',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
            >
              {String.fromCharCode(65 + i)}. {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
