import { create } from 'zustand';
import { getMe, listMySessions, logout, oauthLogin, setAuthFailureHandler } from '../api/client';
import type { UserMeResponse } from '../api/types';

type AuthState = {
  user: UserMeResponse | null;
  bootstrapping: boolean;
  bootstrap: () => Promise<void>;
  oauthLogin: (provider: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  bootstrapping: true,

  bootstrap: async () => {
    setAuthFailureHandler(() => {
      const wasLoggedIn = get().user !== null;
      set({ user: null });
      if (wasLoggedIn && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    });
    try {
      const me = await getMe();
      set({ user: me });

      // GENERATING 세션 감지 → generationStore 복원 (순환 import 방지를 위해 동적 import)
      try {
        const sessions = await listMySessions();
        const generating = sessions.find((s) => s.status === 'GENERATING');
        if (generating) {
          const { useGenerationStore } = await import('./generationStore');
          useGenerationStore.getState().restore(generating.publicId);
        }
      } catch {
        // non-critical — ignore errors
      }
    } catch {
      set({ user: null });
    } finally {
      set({ bootstrapping: false });
    }
  },

  oauthLogin: async (provider, code) => {
    await oauthLogin(provider, code);
    const me = await getMe();
    set({ user: me });
  },

  logout: async () => {
    try {
      await logout();
    } catch {
      // best effort
    }
    set({ user: null });
  }
}));
