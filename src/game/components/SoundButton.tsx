export function SoundButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="sound-button">
      🔊 sound
    </button>
  )
}
