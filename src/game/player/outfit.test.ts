import { describe, expect, it } from 'vitest'
import { PLAYER_LOOK } from '../data/unicornLooks'
import { playerLookFor } from '../data/stageLooks'
import { SWEATER_IDS } from '../views/three/amara/amaraLook'
import { COATS, COAT_IDS, DEFAULT_OUTFIT, HORNS, TRIMS, TRIM_IDS, WEARABLES, applyOutfit, isDefault, parseOutfit, type Outfit } from './outfit'

describe('the outfit the game always had', () => {
  it('is the unicorn of the design: white, a plain horn, nothing on it, gold for a trim', () => {
    expect(COATS[DEFAULT_OUTFIT.coat]).toBe(PLAYER_LOOK.coat)
    expect(DEFAULT_OUTFIT.horn).toBe(PLAYER_LOOK.hornType)
    expect(DEFAULT_OUTFIT.accessory).toBe(PLAYER_LOOK.accessory)
    expect(TRIMS[DEFAULT_OUTFIT.trim]).toBe(PLAYER_LOOK.accessoryColor)
    expect(DEFAULT_OUTFIT.sweater).toBe('rainbow')
  })

  it('leaves the look exactly as it was (the very same object)', () => {
    expect(applyOutfit(PLAYER_LOOK, DEFAULT_OUTFIT)).toBe(PLAYER_LOOK)
    expect(isDefault(DEFAULT_OUTFIT)).toBe(true)
    expect(isDefault({ ...DEFAULT_OUTFIT, coat: 'pink' })).toBe(false)
    expect(playerLookFor(3)).toBe(playerLookFor(3, DEFAULT_OUTFIT))
    expect(playerLookFor(0)).toBe(PLAYER_LOOK)
  })
})

describe('the choices', () => {
  it('have a colour for each coat and trim, and every wearable the unicorn can draw but the teacher\'s outfit and the backpack', () => {
    expect(COAT_IDS.map((c) => COATS[c])).toHaveLength(6)
    expect(new Set(COAT_IDS.map((c) => COATS[c])).size).toBe(6)
    expect(new Set(TRIM_IDS.map((c) => TRIMS[c])).size).toBe(6)
    expect(HORNS).toHaveLength(5)
    const ids = WEARABLES.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('none')
    expect(ids).not.toContain('teacher')
    expect(ids).not.toContain('backpack')
    expect(SWEATER_IDS).toHaveLength(6)
  })
})

describe('dressing the unicorn', () => {
  const chosen: Outfit = { sweater: 'ocean', coat: 'pink', horn: 'star', accessory: 'crown', trim: 'rose' }

  it('changes the coat, the horn and what it wears, with the colour of that', () => {
    const look = applyOutfit(PLAYER_LOOK, chosen)
    expect(look).toMatchObject({ coat: COATS.pink, hornType: 'star', accessory: 'crown', accessoryColor: TRIMS.rose })
  })

  it('keeps what makes it Amara\'s unicorn: the rainbow rings, the rainbow mane and the backpack', () => {
    const look = applyOutfit(PLAYER_LOOK, chosen)
    expect(look.stripes).toBe(PLAYER_LOOK.stripes)
    expect(look.mane).toBe(PLAYER_LOOK.mane)
    expect(look.extras).toBe(PLAYER_LOOK.extras)
    expect(look.personality).toBe(PLAYER_LOOK.personality)
  })

  it('keeps what the class adds (a helmet in the moon class) and does not touch the one that was passed in', () => {
    const moon = playerLookFor(2)
    expect(moon.extras!.some((e) => e.type === 'helmet')).toBe(true)
    const dressed = playerLookFor(2, chosen)
    expect(dressed.extras).toEqual(moon.extras)
    expect(dressed.coat).toBe(COATS.pink)
    expect(PLAYER_LOOK.coat).toBe('#ffffff')
    expect(PLAYER_LOOK.accessory).toBe('none')
  })
})

describe('reading what was saved', () => {
  it('gives back an outfit that was written', () => {
    const o: Outfit = { sweater: 'night', coat: 'mint', horn: 'curly', accessory: 'bow', trim: 'violet' }
    expect(parseOutfit(JSON.parse(JSON.stringify(o)))).toEqual(o)
  })

  it('refuses what is not an object, and takes the default for any field that is not one of the choices', () => {
    for (const bad of [null, 'x', 3, [], undefined]) expect(parseOutfit(bad), String(bad)).toBeNull()
    expect(parseOutfit({})).toEqual(DEFAULT_OUTFIT)
    expect(parseOutfit({ coat: 'purple', horn: 3, accessory: 'teacher', trim: null, sweater: 'gone' })).toEqual(DEFAULT_OUTFIT)
    expect(parseOutfit({ coat: 'sky', accessory: 'backpack' })).toEqual({ ...DEFAULT_OUTFIT, coat: 'sky' })
  })
})
