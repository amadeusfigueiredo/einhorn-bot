import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

/** The list of the classes still to do ("What is left?") is open over the game. */
export type TodoState = {
  open: boolean
  openList: () => void
  closeList: () => void
}

export function createTodoStore() {
  return createStore<TodoState>((set) => ({
    open: false,
    openList: () => set({ open: true }),
    closeList: () => set({ open: false }),
  }))
}

/** The one list of the game. Not remembered. */
export const todoStore = createTodoStore()

export function useTodoOpen(): boolean {
  return useStore(todoStore, (s) => s.open)
}
