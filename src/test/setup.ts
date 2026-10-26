import { startStore } from '../game/start/startStore'

// The start menu opens every time the game opens, and the game waits behind it. Tests of the game itself
// start past it; the tests of the menu open it themselves.
startStore.getState().close()
