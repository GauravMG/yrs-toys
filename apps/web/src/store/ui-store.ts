import { create } from "zustand";

interface UiState {
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  setCartDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCartDrawerOpen: false,
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),
}));
