import { create } from 'zustand';
import { askQuestion, accuse, getSession, startSession, moveToLocation, investigate } from '../api/client';
import type { AccuseResponse, GameSessionResponse, InvestigateResponse, MoveResponse, StartSessionRequest } from '../api/types';

type SessionState = {
  current: GameSessionResponse | null;
  result: AccuseResponse | null;
  start: (payload: StartSessionRequest) => Promise<GameSessionResponse>;
  load: (sessionId: number) => Promise<void>;
  ask: (sessionId: number, question: string, suspectName: string) => Promise<void>;
  accuse: (sessionId: number, suspectName: string) => Promise<AccuseResponse>;
  move: (sessionId: number, location: string) => Promise<MoveResponse>;
  investigate: (sessionId: number) => Promise<InvestigateResponse>;
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

  ask: async (sessionId, question, suspectName) => {
    await askQuestion(sessionId, { question, suspectName });
    const updated = await getSession(sessionId);
    set({ current: updated });
  },

  accuse: async (sessionId, suspectName) => {
    const res = await accuse(sessionId, { suspectName });
    const updated = await getSession(sessionId);
    set({ current: updated, result: res });
    return res;
  },

  move: async (sessionId, location) => {
    const res = await moveToLocation(sessionId, { location });
    const updated = await getSession(sessionId);
    set({ current: updated });
    return res;
  },

  investigate: async (sessionId) => {
    const res = await investigate(sessionId);
    const updated = await getSession(sessionId);
    set({ current: updated });
    return res;
  }
}));
