/** The game plays all its sound (chimes and voices) through one Web Audio context. */
let audioContext: AudioContext | null = null

/** The one audio context of the game (made on first use); null where there is no Web Audio. */
export function sharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  audioContext ??= new Ctor()
  return audioContext
}
