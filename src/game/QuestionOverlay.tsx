export default function QuestionOverlay({
  prompt,
  choices,
  onPick,
}: {
  prompt: string
  choices: string[]
  onPick: (i: number) => void
}) {
  // Define the rainbow gradient string once (same colors as the Canvas version)
  const rainbowGradient =
    'linear-gradient(to right, #FF00A0 0%, #FFD700 20%, #ADFF2F 40%, #00FFFF 60%, #5D3FD3 80%, #FF69B4 100%)'

  // Define the radius and border thickness as variables for use in borderImageSlice
  const borderRadius = '16px'
  const borderThickness = '4px'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.45)', // Dark overlay background

        // FIX 1: Apply borderRadius to the overlay background itself
        borderRadius: borderRadius,
      }}
    >
      <div
        style={{
          width: 'min(560px,92vw)',
          background: '#fff',
          color: '#111',

          // 1. Set the border-radius
          borderRadius: borderRadius,
          padding: '3rem',

          // --- RAINBOW BORDER STYLES ---
          border: `${borderThickness} solid transparent`,

          // 2. Add borderImageSlice
          borderImageSlice: '1',

          // 3. TWEAKED borderImage for better compatibility
          // Syntax: [source] [slice] / [width] / [outset] [repeat]
          borderImage: `${rainbowGradient} 1 / ${borderThickness} / 0 stretch`,

          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>{prompt.toUpperCase()}</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 15 }}>
          {choices.map((c, i) => (
            <button
              key={i}
              onClick={() => onPick(i)}
              style={{
                font: 'inherit',
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: '12px',

                // --- Button Styles ---
                border: '1px solid #E0B0FF',
                background: '#fafaff',
                cursor: 'pointer',
                textTransform: 'uppercase',
                color: 'black',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'transform 0.1s, box-shadow 0.1s',
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
