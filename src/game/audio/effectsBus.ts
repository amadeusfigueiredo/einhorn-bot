import { soundSettings } from './soundSettings'

const buses = new WeakMap<BaseAudioContext, GainNode>()

/**
 * Where every sound of the game (the chimes and the voices, not the music) goes: one gain in front of the speakers
 * that the sounds slider turns, live, even for notes that are already playing. Made once for each audio context.
 */
export function effectsBus(ctx: BaseAudioContext): AudioNode {
  let bus = buses.get(ctx)
  if (!bus) {
    bus = ctx.createGain()
    bus.gain.value = soundSettings.getState().effectsVolume
    bus.connect(ctx.destination)
    const made = bus
    soundSettings.subscribe((state, prev) => {
      if (state.effectsVolume !== prev.effectsVolume) made.gain.value = state.effectsVolume
    })
    buses.set(ctx, bus)
  }
  return bus
}
