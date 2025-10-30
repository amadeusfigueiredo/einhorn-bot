export default function QuestionOverlay({
  prompt,
  choices,
  onPick,
}: {
  prompt: string
  choices: string[]
  onPick: (i: number) => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          width: 'min(560px,92vw)',
          background: '#fff',
          color: '#111',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>{prompt.toUpperCase()}</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {choices.map((c, i) => (
            <button
              key={i}
              onClick={() => onPick(i)}
              style={{
                font: 'inherit',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #ddd',
                background: '#f7f7f8',
                cursor: 'pointer',
                textTransform: 'uppercase',
                color: 'black',
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
