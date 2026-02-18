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
  profileImageUrl: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserMeResponse;
}

export interface UpdateNicknameRequest { nickname: string; }
export interface UpdateProfileImageRequest { profileImageUrl: string; }
export interface AdminAddCoinsRequest { amount: number; reason: string; }

export interface AdminCaseTemplateResponse {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  baseStoryJson: string;
  previewNarrative: string;
  gameStartHour: number;
  gameEndHour: number;
  thumbnailUrl?: string;
  playCount: number;
  recommendCount: number;
  createdAt: string;
}

export interface AdminUpdateCaseTemplateRequest {
  title?: string;
  description?: string;
  difficulty?: string;
  baseStoryJson?: string;
  previewNarrative?: string;
  gameStartHour?: number;
  gameEndHour?: number;
  thumbnailUrl?: string;
}

export interface AdminUpdateUserCaseRequest {
  title?: string;
  summary?: string;
  scenarioPrompt?: string;
  published?: boolean;
  gameStartHour?: number;
  gameEndHour?: number;
  thumbnailUrl?: string;
}

export interface CaseTemplateSummary {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  thumbnailUrl?: string;
  playCount: number;
  recommendCount: number;
}

export interface CaseSuspectInfo {
  name: string;
  personality?: string;
  background?: string;
  imageUrl?: string;
}

export interface CaseVictimInfo {
  name: string;
  description?: string;
}

export interface CaseTemplateDetail extends CaseTemplateSummary {
  previewNarrative: string;
  setting?: string;
  victim?: CaseVictimInfo;
  suspects: CaseSuspectInfo[];
  recommended?: boolean;
}

export interface CreateUserCaseDraftRequest { title: string; summary: string; scenarioPrompt: string; gameStartHour?: number; gameEndHour?: number; thumbnailUrl?: string; }
export interface UpdateUserCaseDraftRequest { title: string; summary: string; scenarioPrompt: string; gameStartHour?: number; gameEndHour?: number; thumbnailUrl?: string; }

export interface UserCaseDraftResponse {
  id: number;
  authorUserId: number;
  authorNickname?: string;
  authorProfileImageUrl?: string;
  title: string;
  summary: string;
  scenarioPrompt: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  gameStartHour: number;
  gameEndHour: number;
  thumbnailUrl?: string;
  playCount: number;
  recommendCount: number;
  recommended?: boolean;
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
  gameStartHour?: number;
  gameEndHour?: number;
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
  publicId: string;
  mode: GameMode;
  caseSourceType: CaseSourceType;
  sourceRefId: number | null;
  status: SessionStatus;
  generatedStoryJson: string;
  messages: MessageLogItem[];
  evidence: EvidenceItem[];
  currentLocation: string | null;
  gameStartHour: number;
  gameEndHour: number;
  gameMinutesUsed: number;
  currentGameTime: string;
}

export interface SessionSummaryResponse {
  id: number;
  publicId: string;
  mode: GameMode;
  caseSourceType: CaseSourceType;
  sourceRefId: number | null;
  status: SessionStatus;
  startedAt: string;
  title?: string;
  gameStartHour?: number;
  gameEndHour?: number;
  gameMinutesUsed?: number;
}

export interface AskQuestionRequest { question: string; suspectName: string; }
export interface AskQuestionResponse { answer: string; suspectName: string; }

export interface AccuseRequest { suspectName: string; }
export interface AccuseResponse {
  correct: boolean;
  actualKiller: string;
  explanation: string;
  keyClues: string[];
  status: SessionStatus;
}

export interface MoveRequest { location: string; }
export interface MoveResponse {
  location: string;
  availableSuspects: string[];
}

export interface InvestigateResponse {
  evidenceFound: EvidenceItem[];
}

export interface CaseCommentResponse {
  id: number;
  userId: number;
  nickname: string;
  profileImageUrl: string;
  content: string;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  replies: CaseCommentResponse[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
}
