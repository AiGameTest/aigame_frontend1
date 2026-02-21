import { create } from 'zustand';
import { connectGenerationStream, startSessionAsync } from '../api/client';
import type { StartSessionRequest } from '../api/types';

export type GenerationStatus = 'idle' | 'story' | 'images' | 'complete' | 'error';

type GenerationState = {
  status: GenerationStatus;
  publicId: string | null;
  errorMessage: string | null;
  _eventSource: EventSource | null;

  startGeneration: (payload: StartSessionRequest) => Promise<void>;
  restore: (publicId: string) => void;
  clear: () => void;
};

export const useGenerationStore = create<GenerationState>((set, get) => ({
  status: 'idle',
  publicId: null,
  errorMessage: null,
  _eventSource: null,

  startGeneration: async (payload) => {
    // 이미 생성 중이면 무시 (이중 방어)
    if (get().status !== 'idle') return;

    set({ status: 'story', publicId: null, errorMessage: null });

    try {
      const { publicId } = await startSessionAsync(payload);
      set({ publicId });
      _subscribeToStream(set, get, publicId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '사건 생성 요청에 실패했습니다.';
      set({ status: 'error', errorMessage: message });
    }
  },

  restore: (publicId: string) => {
    const current = get();
    if (current.status !== 'idle') return;
    set({ status: 'story', publicId, errorMessage: null });
    _subscribeToStream(set, get, publicId);
  },

  clear: () => {
    const { _eventSource } = get();
    if (_eventSource) {
      _eventSource.close();
    }
    set({ status: 'idle', publicId: null, errorMessage: null, _eventSource: null });
  },
}));

function _subscribeToStream(
  set: (partial: Partial<GenerationState>) => void,
  get: () => GenerationState,
  _publicId: string
) {
  // 기존 연결 정리
  const existing = get()._eventSource;
  if (existing) existing.close();

  const es = connectGenerationStream();
  set({ _eventSource: es });

  es.addEventListener('progress', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { stage: string; message: string };
      set({ status: data.stage as GenerationStatus });
    } catch {
      // ignore parse errors
    }
  });

  es.addEventListener('complete', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { publicId: string };
      es.close();
      set({ status: 'complete', publicId: data.publicId, _eventSource: null });
      // 60초 후 자동으로 idle로 전환 (navigate 없이 닫힌 경우)
      setTimeout(() => {
        if (get().status === 'complete') {
          set({ status: 'idle', publicId: null });
        }
      }, 60000);
    } catch {
      // ignore parse errors
    }
  });

  es.addEventListener('error', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { message: string };
      es.close();
      set({ status: 'error', errorMessage: data.message, _eventSource: null });
    } catch {
      // SSE connection error (not a data error event)
      // keep state as-is to allow reconnect
    }
  });

  es.onerror = () => {
    // Connection dropped — browser will auto-reconnect via EventSource
    // We don't change status here
  };
}
