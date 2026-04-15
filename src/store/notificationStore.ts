import { create } from 'zustand'

interface NotificationState {
  pendingOrdersCount: number
  newMessagesCount: number
  setPendingOrders: (count: number) => void
  incrementPendingOrders: () => void
  resetPendingOrders: () => void
  setNewMessages: (count: number) => void
  incrementNewMessages: () => void
  resetNewMessages: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  pendingOrdersCount: 0,
  newMessagesCount: 0,
  setPendingOrders: (count) => set({ pendingOrdersCount: count }),
  incrementPendingOrders: () => set((state) => ({ pendingOrdersCount: state.pendingOrdersCount + 1 })),
  resetPendingOrders: () => set({ pendingOrdersCount: 0 }),
  setNewMessages: (count) => set({ newMessagesCount: count }),
  incrementNewMessages: () => set((state) => ({ newMessagesCount: state.newMessagesCount + 1 })),
  resetNewMessages: () => set({ newMessagesCount: 0 }),
}))
