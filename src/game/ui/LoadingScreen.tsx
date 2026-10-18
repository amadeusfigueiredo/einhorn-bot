export function LoadingScreen() {
  return (
    <div className="loading" role="status">
      <span className="loading__star" aria-hidden="true">
        ✦
      </span>
      <p className="loading__text">Die Einhörner kommen gleich …</p>
    </div>
  )
}
