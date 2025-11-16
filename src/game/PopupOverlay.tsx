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

  // Regenbogen-Gradienten-Stile für Konsistenz
  const rainbowGradient =
    'linear-gradient(to right, #FF00A0 0%, #FFD700 20%, #ADFF2F 40%, #00FFFF 60%, #5D3FD3 80%, #FF69B4 100%)'
  const borderRadius = '16px'
  const borderThickness = '4px'

  // Bestimmt, ob ein Schließen-Button benötigt wird (nur für GAME_END)
  const needsCloseButton = config.durationMs === null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.6)', // Dunklerer Hintergrund für Fokus
        zIndex: 1000,
        borderRadius: borderRadius,
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <div
        style={{
          padding: '2rem',
          background: '#fff',
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
            style={{
              marginTop: '1.5rem',
              padding: '12px 24px',
              borderRadius: '12px',
              border: '2px solid #5D3FD3', // Lila Button-Rand
              background: '#f0f8ff',
              color: '#5D3FD3',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}
          >
            Abschließen
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
