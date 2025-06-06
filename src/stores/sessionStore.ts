import { create } from 'zustand';

interface SessionState {
  hasShownWelcomeModal: boolean;
  setHasShownWelcomeModal: (hasShown: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  hasShownWelcomeModal: false, // O valor inicial é sempre falso quando o app carrega
  setHasShownWelcomeModal: (hasShown) => set({ hasShownWelcomeModal: hasShown }),
}));