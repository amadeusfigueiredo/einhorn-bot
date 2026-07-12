/**
 * Picks which track key to play for a stage. If the stage has its own
 * dedicated track, use it; otherwise deterministically cycle through the
 * tracks that do exist, keyed off the stage's position, so stages without
 * their own music don't all silently play the same one track.
 */
export function resolveStageAudioKey(
  stageIndex: number,
  stageName: string,
  availableTrackKeys: string[]
): string | undefined {
  if (availableTrackKeys.length === 0) return undefined
  if (availableTrackKeys.includes(stageName)) return stageName
  return availableTrackKeys[stageIndex % availableTrackKeys.length]
}
