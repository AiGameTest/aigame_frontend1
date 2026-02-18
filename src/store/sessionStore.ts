import { create } from 'zustand';
import { askQuestion, accuse, getSession, startSession, moveToLocation, investigate } from '../api/client';
import type { AccuseResponse, GameSessionResponse, InvestigateResponse, MoveResponse, StartSessionRequest } from '../api/types';

type SessionState = {
  current: GameSessionResponse | null;
  result: AccuseResponse | null;
  start: (payload: StartSessionRequest) => Promise<GameSessionResponse>;
  load: (sessionPublicId: string) => Promise<void>;
  ask: (sessionPublicId: string, question: string, suspectName: string) => Promise<void>;
  accuse: (sessionPublicId: string, suspectName: string) => Promise<AccuseResponse>;
  move: (sessionPublicId: string, location: string) => Promise<MoveResponse>;
  investigate: (sessionPublicId: string) => Promise<InvestigateResponse>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  current: null,
  result: null,

  start: async (payload) => {
    const data = await startSession(payload);
    set({ current: data, result: null });
    return data;
  },

  load: async (sessionPublicId) => {
    const data = await getSession(sessionPublicId);
    set({ current: data });
  },

  ask: async (sessionPublicId, question, suspectName) => {
    await askQuestion(sessionPublicId, { question, suspectName });
    const updated = await getSession(sessionPublicId);
    set({ current: updated });
  },

  accuse: async (sessionPublicId, suspectName) => {
    const res = await accuse(sessionPublicId, { suspectName });
    const updated = await getSession(sessionPublicId);
    set({ current: updated, result: res });
    return res;
  },

  move: async (sessionPublicId, location) => {
    const res = await moveToLocation(sessionPublicId, { location });
    const updated = await getSession(sessionPublicId);
    set({ current: updated });
    return res;
  },

  investigate: async (sessionPublicId) => {
    const res = await investigate(sessionPublicId);
    const updated = await getSession(sessionPublicId);
    set({ current: updated });
    return res;
  }
}));
