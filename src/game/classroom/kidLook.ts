/**
 * The unicorn kids of Classroom V3 (see NEXT_TASK_CLASSROOMS.md): who they are (`KidLook`), the three age groups with
 * their real heights in metres and the pose names they use. Pure data and types, no rendering.
 */
export type AgeGroup = 'little' | 'middle' | 'older'
/** The teacher is the one grown-up, 'adult'. */
export type KidAge = AgeGroup | 'adult'
export type KidPose = 'stand' | 'raise' | 'raise2' | 'clap' | 'wave' | 'think' | 'thumb' | 'whisper' | 'cross' | 'write' | 'hug' | 'cheer' | 'point'
export type KidOutfit = 'overalls' | 'dress' | 'hoodie' | 'tee' | 'sweater' | 'jacket' | 'sporty' | 'cardigan'
export type KidAccessory =
  | 'bow' | 'clips' | 'backpack' | 'plush' | 'schultuete' | 'boots' | 'glasses' | 'cap' | 'pencil' | 'ball'
  | 'headphones' | 'capBack' | 'scrunchie' | 'bag' | 'book' | 'lanyard'

export type KidLook = {
  age: KidAge
  name?: string
  body: string
  mane: string
  mane2?: string
  hornC?: string
  horn?: 'rainbow' | 'star'
  outfit: KidOutfit
  oc1: string
  oc2?: string
  acc: KidAccessory[]
  bowC?: string
  capC?: string
  hpC?: string
  bagC?: string
}

/** How tall each age group is, in metres (the real sizes of a German class: Amara is 1.22 m). */
export const HEIGHT_M: Record<KidAge, number> = { little: 1.18, middle: 1.36, older: 1.55, adult: 1.95 }

/** The classes that have the new room so far and the age group of their kids (data-driven: the owner decides the rest later). */
export const STAGE_AGE: Readonly<Partial<Record<number, AgeGroup>>> = { 1: 'little', 5: 'middle', 6: 'older' }

/** The height of a chair seat and a desk by age group, in metres (DIN sizes 3, 4 and 5). */
export const FURNITURE: Record<AgeGroup, { desk: number; seat: number }> = {
  little: { desk: 0.59, seat: 0.35 },
  middle: { desk: 0.64, seat: 0.38 },
  older: { desk: 0.71, seat: 0.43 },
}
