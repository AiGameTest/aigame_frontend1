import { create } from 'zustand';
import { askQuestion, accuse, getSession, startSession } from '../api/client';
import type { AccuseResponse, GameSessionResponse, StartSessionRequest } from '../api/types';

type SessionState = {
  current: GameSessionResponse | null;
  result: AccuseResponse | null;
  start: (payload: StartSessionRequest) => Promise<GameSessionResponse>;
  load: (sessionId: number) => Promise<void>;
  ask: (sessionId: number, question: string) => Promise<void>;
  accuse: (sessionId: number, suspectName: string) => Promise<AccuseResponse>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  current: null,
  result: null,

  start: async (payload) => {
    const data = await startSession(payload);
    set({ current: data, result: null });
    return data;
  },

  load: async (sessionId) => {
    const data = await getSession(sessionId);
    set({ current: data });
  },

  ask: async (sessionId, question) => {
    await askQuestion(sessionId, { question });
    const updated = await getSession(sessionId);
    set({ current: updated });
  },

  accuse: async (sessionId, suspectName) => {
    const res = await accuse(sessionId, { suspectName });
    const updated = await getSession(sessionId);
    set({ current: updated, result: res });
    return res;
  }
}));
