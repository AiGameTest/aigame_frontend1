export type GameMode = 'BASIC' | 'AI' | 'USER';
export type CaseSourceType = 'BASIC_TEMPLATE' | 'USER_PUBLISHED' | 'AI_PROMPT';
export type SessionStatus = 'ACTIVE' | 'WON' | 'LOST' | 'CLOSED';
export type UserRole = 'USER' | 'ADMIN';

export interface OAuthLoginRequest { code: string; }
export interface RefreshRequest { refreshToken?: string; }
export interface LogoutRequest { refreshToken?: string; }

export interface UserMeResponse {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  coins: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserMeResponse;
}

export interface UpdateNicknameRequest { nickname: string; }
export interface AdminAddCoinsRequest { amount: number; reason: string; }

export interface CaseTemplateSummary { id: number; title: string; description: string; difficulty: string; }
export interface CaseTemplateDetail extends CaseTemplateSummary { previewNarrative: string; suspectNames: string[]; }

export interface CreateUserCaseDraftRequest { title: string; summary: string; scenarioPrompt: string; }
export interface UpdateUserCaseDraftRequest { title: string; summary: string; scenarioPrompt: string; }

export interface UserCaseDraftResponse {
  id: number;
  authorUserId: number;
  title: string;
  summary: string;
  scenarioPrompt: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StartSessionRequest {
  mode: GameMode;
  basicCaseTemplateId?: number;
  publishedUserCaseId?: number;
  aiPrompt?: {
    setting?: string;
    victimProfile?: string;
    suspectCount?: number;
  };
}

export interface MessageLogItem {
  id: number;
  role: 'PLAYER' | 'SYSTEM' | 'SUSPECT';
  content: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: number;
  title: string;
  detail: string;
  discoveredAt: string;
}

export interface GameSessionResponse {
  id: number;
  mode: GameMode;
  caseSourceType: CaseSourceType;
  sourceRefId: number | null;
  questionLimit: number;
  questionsUsed: number;
  remainingQuestions: number;
  status: SessionStatus;
  generatedStoryJson: string;
  messages: MessageLogItem[];
  evidence: EvidenceItem[];
}

export interface SessionSummaryResponse {
  id: number;
  mode: GameMode;
  caseSourceType: CaseSourceType;
  sourceRefId: number | null;
  status: SessionStatus;
  questionLimit: number;
  questionsUsed: number;
  remainingQuestions: number;
  startedAt: string;
}

export interface AskQuestionRequest { question: string; }
export interface AskQuestionResponse { answer: string; remainingQuestions: number; evidenceDiscovered: EvidenceItem[]; }

export interface AccuseRequest { suspectName: string; }
export interface AccuseResponse {
  correct: boolean;
  actualKiller: string;
  explanation: string;
  keyClues: string[];
  status: SessionStatus;
}
