import { create } from 'zustand';
import { getMe, logout, oauthLogin, setAuthFailureHandler } from '../api/client';
import type { UserMeResponse } from '../api/types';

type AuthState = {
  user: UserMeResponse | null;
  bootstrapping: boolean;
  bootstrap: () => Promise<void>;
  oauthLogin: (provider: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  bootstrapping: true,

  bootstrap: async () => {
    setAuthFailureHandler(() => {
      set({ user: null });
      window.location.href = '/login';
    });
    try {
      const me = await getMe();
      set({ user: me });
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
