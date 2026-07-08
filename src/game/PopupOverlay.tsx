import type { PopupConfig } from './config/PopupsConfig'
import type { LoaderImageAssets } from './types'

export default function PopupOverlay({
  assets,
  config,
  onClose,
}: {
  assets: LoaderImageAssets
  config: PopupConfig
  onClose: () => void
}) {
  // Verwendet config.imageKey, um sicher auf das Bild aus assets zuzugreifen
  const image = assets[config.imageKey]

  // Violet/pink-leaning rainbow gradient, matching the unicorn theme
  const rainbowGradient =
    'linear-gradient(to right, #FF4FB8 0%, #FFD166 20%, #C9A7FF 45%, #8A5CF6 70%, #FF8AD4 100%)'
  const borderRadius = '20px'
  const borderThickness = '5px'

  // Bestimmt, ob ein Schließen-Button benötigt wird (nur für GAME_END)
  const needsCloseButton = config.durationMs === null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(74, 46, 110, 0.6)', // Weicher violetter Fokus-Hintergrund
        zIndex: 1000,
        borderRadius: borderRadius,
        animation: 'fadeIn 0.5s ease-out',
        fontFamily: "'Fredoka', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: '2rem',
          background: 'linear-gradient(180deg, #fff7fd 0%, #fdf0ff 100%)',
          borderRadius: borderRadius,
          border: `${borderThickness} solid transparent`,
          borderImage: `${rainbowGradient} 1 / ${borderThickness} / 0 stretch`,
          boxShadow: '0 10px 60px rgba(0,0,0,0.7)',
          maxWidth: 'min(400px, 80vw)',
          textAlign: 'center',
          animation: 'popIn 0.3s ease-out',
        }}
      >
        {image ? (
          <img
            src={image.src}
            alt={config.fallbackText}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '8px',
            }}
            // Fallback, falls das Bild nicht geladen werden kann
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallbackDiv = document.getElementById(
                `popup-fallback-${config.id}`
              )
              if (fallbackDiv) fallbackDiv.style.display = 'block'
            }}
          />
        ) : (
          // Fallback, falls das Asset null/undefined ist
          <div
            id={`popup-fallback-${config.id}`}
            style={{ padding: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}
          >
            {config.fallbackText}
          </div>
        )}

        {needsCloseButton && (
          <button
            onClick={onClose}
            className="choice-btn"
            style={{
              marginTop: '1.5rem',
              padding: '12px 28px',
              borderRadius: '14px',
              border: 'none',
              background:
                'linear-gradient(135deg, #8A5CF6, #FF4FB8)',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 14px rgba(138, 92, 246, 0.45)',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease',
            }}
          >
            ✨ Weiter ✨
          </button>
        )}
      </div>

      {/* Grundlegendes CSS für die Animationen, inline eingebettet */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  )
}
