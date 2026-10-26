import type { UnicornLook } from '../../data/unicornLooks'

/** The friends of the yard and the library: each their own colours, so they are told apart at a glance. */
export const FRIEND_LOOKS: Record<'friendDay' | 'friendPlay' | 'readingUnicorn', UnicornLook> = {
  /** Pink, with a curly horn and a bow; she plays with the ball. */
  friendDay: { coat: '#FFD9EC', mane: ['#FF7EC7', '#FFB3DF', '#FF4FAE'], horn: '#FFD166', hornType: 'curly', hooves: ['#FF7EC7'], accessory: 'bow', accessoryColor: '#FFFFFF', personality: 'bouncy', build: 0.95, hornLength: 1.1 },
  /** Mint, by the sandbox, with flowers. */
  friendPlay: { coat: '#D9FFF0', mane: ['#3FC9A6', '#8FE6CF'], horn: '#FFF4E1', hornType: 'star', hooves: ['#3FC9A6'], accessory: 'flowers', accessoryColor: '#FFD166', personality: 'curious', build: 0.9, hornLength: 1 },
  /** Lilac, reading in the nook, with round glasses. */
  readingUnicorn: { coat: '#EADFFF', mane: ['#8E6BE0', '#C9A7FF'], horn: '#FFD166', hornType: 'curved', hooves: ['#8E6BE0'], accessory: 'glasses', accessoryColor: '#2A1A52', personality: 'sleepy', build: 1, hornLength: 0.95 },
}
