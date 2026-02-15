import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AccuseRequest,
  AccuseResponse,
  AdminAddCoinsRequest,
  AskQuestionRequest,
  AskQuestionResponse,
  AuthTokenResponse,
  CaseTemplateDetail,
  CaseTemplateSummary,
  CreateUserCaseDraftRequest,
  GameSessionResponse,
  SessionSummaryResponse,
  StartSessionRequest,
  UpdateNicknameRequest,
  UpdateUserCaseDraftRequest,
  UserCaseDraftResponse,
  UserMeResponse
} from './types';

let onAuthFailed: (() => void) | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  withCredentials: true
});

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailed = handler;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        await refresh();
        return api(original);
      } catch {
        onAuthFailed?.();
      }
    }
    throw error;
  }
);

export async function oauthLogin(provider: string, code: string): Promise<AuthTokenResponse> {
  const { data } = await api.post<AuthTokenResponse>(`/auth/oauth/${provider}`, { code });
  return data;
}

export async function refresh(): Promise<AuthTokenResponse> {
  const { data } = await api.post<AuthTokenResponse>('/auth/refresh');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<UserMeResponse> {
  const { data } = await api.get<UserMeResponse>('/users/me');
  return data;
}

export async function updateNickname(payload: UpdateNicknameRequest): Promise<UserMeResponse> {
  const { data } = await api.patch<UserMeResponse>('/users/me/nickname', payload);
  return data;
}

export async function adminAddCoins(userId: number, payload: AdminAddCoinsRequest): Promise<UserMeResponse> {
  const { data } = await api.post<UserMeResponse>(`/admin/users/${userId}/coins`, payload);
  return data;
}

export async function listCases(): Promise<CaseTemplateSummary[]> {
  const { data } = await api.get<CaseTemplateSummary[]>('/cases');
  return data;
}

export async function getCase(caseId: number): Promise<CaseTemplateDetail> {
  const { data } = await api.get<CaseTemplateDetail>(`/cases/${caseId}`);
  return data;
}

export async function createUserCase(payload: CreateUserCaseDraftRequest): Promise<UserCaseDraftResponse> {
  const { data } = await api.post<UserCaseDraftResponse>('/user-cases', payload);
  return data;
}

export async function updateUserCase(draftId: number, payload: UpdateUserCaseDraftRequest): Promise<UserCaseDraftResponse> {
  const { data } = await api.put<UserCaseDraftResponse>(`/user-cases/${draftId}`, payload);
  return data;
}

export async function publishUserCase(draftId: number): Promise<UserCaseDraftResponse> {
  const { data } = await api.post<UserCaseDraftResponse>(`/user-cases/${draftId}/publish`);
  return data;
}

export async function listMyCases(): Promise<UserCaseDraftResponse[]> {
  const { data } = await api.get<UserCaseDraftResponse[]>('/user-cases/mine');
  return data;
}

export async function listPublishedUserCases(): Promise<UserCaseDraftResponse[]> {
  const { data } = await api.get<UserCaseDraftResponse[]>('/user-cases/published');
  return data;
}

export async function listMySessions(): Promise<SessionSummaryResponse[]> {
  const { data } = await api.get<SessionSummaryResponse[]>('/sessions');
  return data;
}

export async function startSession(payload: StartSessionRequest): Promise<GameSessionResponse> {
  const { data } = await api.post<GameSessionResponse>('/sessions', payload);
  return data;
}

export async function getSession(sessionId: number): Promise<GameSessionResponse> {
  const { data } = await api.get<GameSessionResponse>(`/sessions/${sessionId}`);
  return data;
}

export async function askQuestion(sessionId: number, payload: AskQuestionRequest): Promise<AskQuestionResponse> {
  const { data } = await api.post<AskQuestionResponse>(`/sessions/${sessionId}/chat`, payload);
  return data;
}

export async function accuse(sessionId: number, payload: AccuseRequest): Promise<AccuseResponse> {
  const { data } = await api.post<AccuseResponse>(`/sessions/${sessionId}/accuse`, payload);
  return data;
}
