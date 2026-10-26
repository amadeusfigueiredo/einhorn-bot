/** How big and how high the library's furniture is (in metres of the room; the 2D view draws from the same numbers). */

/** The height of the table top, where the five books stand. */
export const TABLE_TOP = 0.68
/** The bars of the xylophone are this high above the floor. */
export const XYLOPHONE_TOP = 0.78
/** The easel's board: the middle of its paper is this high, and it is this big. */
export const EASEL_BOARD = { y: 1.35, w: 1.3, h: 0.95 } as const
/** The books on the table: how big one is. */
export const BOOK_SIZE = { w: 0.34, h: 0.46, d: 0.1 } as const
