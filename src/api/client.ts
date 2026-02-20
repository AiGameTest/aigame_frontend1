import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AccuseRequest,
  AccuseResponse,
  AdminAddCoinsRequest,
  AdminCaseTemplateResponse,
  AdminUpdateCaseTemplateRequest,
  AdminUpdateUserCaseRequest,
  AskQuestionRequest,
  AskQuestionResponse,
  AuthTokenResponse,
  CaseCommentResponse,
  CaseTemplateDetail,
  CaseTemplateSummary,
  CreateCommentRequest,
  CreateUserCaseDraftRequest,
  GameSessionResponse,
  InvestigateResponse,
  MoveRequest,
  MoveResponse,
  PagedResponse,
  SessionSummaryResponse,
  StartSessionRequest,
  UpdateNicknameRequest,
  UpdateProfileImageRequest,
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

const REFRESH_URL = '/auth/refresh';

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isRefreshRequest = original?.url?.includes(REFRESH_URL);

    if (error.response?.status === 401 && !original?._retry && !isRefreshRequest) {
      original._retry = true;
      try {
        await refresh();
        return api(original);
      } catch (refreshError) {
        onAuthFailed?.();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
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

export async function updateProfileImage(payload: UpdateProfileImageRequest): Promise<UserMeResponse> {
  const { data } = await api.patch<UserMeResponse>('/users/me/profile-image', payload);
  return data;
}

export async function adminAddCoins(userId: number, payload: AdminAddCoinsRequest): Promise<UserMeResponse> {
  const { data } = await api.post<UserMeResponse>(`/admin/users/${userId}/coins`, payload);
  return data;
}

export async function adminListCases(): Promise<AdminCaseTemplateResponse[]> {
  const { data } = await api.get<AdminCaseTemplateResponse[]>('/admin/cases');
  return data;
}

export async function adminGetCase(caseId: number): Promise<AdminCaseTemplateResponse> {
  const { data } = await api.get<AdminCaseTemplateResponse>(`/admin/cases/${caseId}`);
  return data;
}

export async function adminUpdateCase(caseId: number, payload: AdminUpdateCaseTemplateRequest): Promise<AdminCaseTemplateResponse> {
  const { data } = await api.put<AdminCaseTemplateResponse>(`/admin/cases/${caseId}`, payload);
  return data;
}

export async function adminDeleteCase(caseId: number): Promise<void> {
  await api.delete(`/admin/cases/${caseId}`);
}

export async function adminListUserCases(): Promise<UserCaseDraftResponse[]> {
  const { data } = await api.get<UserCaseDraftResponse[]>('/admin/user-cases');
  return data;
}

export async function adminGetUserCase(draftId: number): Promise<UserCaseDraftResponse> {
  const { data } = await api.get<UserCaseDraftResponse>(`/admin/user-cases/${draftId}`);
  return data;
}

export async function adminUpdateUserCaseByAdmin(draftId: number, payload: AdminUpdateUserCaseRequest): Promise<UserCaseDraftResponse> {
  const { data } = await api.put<UserCaseDraftResponse>(`/admin/user-cases/${draftId}`, payload);
  return data;
}

export async function adminDeleteUserCase(draftId: number): Promise<void> {
  await api.delete(`/admin/user-cases/${draftId}`);
}

export async function listCases(sort?: 'recommended'): Promise<CaseTemplateSummary[]> {
  const { data } = await api.get<CaseTemplateSummary[]>('/cases', {
    params: sort ? { sort } : undefined,
  });
  return data;
}

export async function listCasesPaged(params?: {
  sort?: 'recommended';
  page?: number;
  size?: number;
}): Promise<PagedResponse<CaseTemplateSummary>> {
  const { data } = await api.get<PagedResponse<CaseTemplateSummary>>('/cases/paged', {
    params,
  });
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

export async function getUserCase(draftId: number): Promise<UserCaseDraftResponse> {
  const { data } = await api.get<UserCaseDraftResponse>(`/user-cases/${draftId}`);
  return data;
}

export async function listMyCases(): Promise<UserCaseDraftResponse[]> {
  const { data } = await api.get<UserCaseDraftResponse[]>('/user-cases/mine');
  return data;
}

export async function listPublishedUserCases(sort?: 'recommended'): Promise<UserCaseDraftResponse[]> {
  const { data } = await api.get<UserCaseDraftResponse[]>('/user-cases/published', {
    params: sort ? { sort } : undefined,
  });
  return data;
}

export async function listPublishedUserCasesPaged(params?: {
  sort?: 'recommended';
  page?: number;
  size?: number;
}): Promise<PagedResponse<UserCaseDraftResponse>> {
  const { data } = await api.get<PagedResponse<UserCaseDraftResponse>>('/user-cases/published/paged', {
    params,
  });
  return data;
}

export async function recommendCase(caseId: number): Promise<{ recommended: boolean; recommendCount: number }> {
  const { data } = await api.post<{ recommended: boolean; recommendCount: number }>(`/cases/${caseId}/recommend`);
  return data;
}

export async function recommendUserCase(draftId: number): Promise<{ recommended: boolean; recommendCount: number }> {
  const { data } = await api.post<{ recommended: boolean; recommendCount: number }>(`/user-cases/${draftId}/recommend`);
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

export async function getSession(sessionPublicId: string): Promise<GameSessionResponse> {
  const { data } = await api.get<GameSessionResponse>(`/sessions/${sessionPublicId}`);
  return data;
}

export async function askQuestion(sessionPublicId: string, payload: AskQuestionRequest): Promise<AskQuestionResponse> {
  const { data } = await api.post<AskQuestionResponse>(`/sessions/${sessionPublicId}/chat`, payload);
  return data;
}

export async function accuse(sessionPublicId: string, payload: AccuseRequest): Promise<AccuseResponse> {
  const { data } = await api.post<AccuseResponse>(`/sessions/${sessionPublicId}/accuse`, payload);
  return data;
}

export async function moveToLocation(sessionPublicId: string, payload: MoveRequest): Promise<MoveResponse> {
  const { data } = await api.post<MoveResponse>(`/sessions/${sessionPublicId}/move`, payload);
  return data;
}

export async function investigate(sessionPublicId: string): Promise<InvestigateResponse> {
  const { data } = await api.post<InvestigateResponse>(`/sessions/${sessionPublicId}/investigate`);
  return data;
}

export async function uploadFile(file: File, folder = 'suspects'): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const { data } = await api.post<{ url: string }>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Comments ──

export async function listCaseComments(caseId: number): Promise<CaseCommentResponse[]> {
  const { data } = await api.get<CaseCommentResponse[]>(`/cases/${caseId}/comments`);
  return data;
}

export async function addCaseComment(caseId: number, payload: CreateCommentRequest): Promise<CaseCommentResponse> {
  const { data } = await api.post<CaseCommentResponse>(`/cases/${caseId}/comments`, payload);
  return data;
}

export async function listUserCaseComments(draftId: number): Promise<CaseCommentResponse[]> {
  const { data } = await api.get<CaseCommentResponse[]>(`/user-cases/${draftId}/comments`);
  return data;
}

export async function addUserCaseComment(draftId: number, payload: CreateCommentRequest): Promise<CaseCommentResponse> {
  const { data } = await api.post<CaseCommentResponse>(`/user-cases/${draftId}/comments`, payload);
  return data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

export async function toggleCommentLike(commentId: number): Promise<{ liked: boolean; likeCount: number }> {
  const { data } = await api.post<{ liked: boolean; likeCount: number }>(`/comments/${commentId}/like`);
  return data;
}
