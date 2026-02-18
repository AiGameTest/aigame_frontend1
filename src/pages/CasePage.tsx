import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getCase, listMySessions, listPublishedUserCases, recommendCase, recommendUserCase } from '../api/client';
import type { CaseTemplateDetail, SessionSummaryResponse, UserCaseDraftResponse } from '../api/types';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';

type CaseSource = 'basic' | 'user';

interface DisplayCase {
  id: number;
  title: string;
  previewNarrative: string;
  suspectNames: string[];
  difficulty: string;
  source: CaseSource;
  playCount: number;
  recommendCount: number;
  recommended: boolean;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
  USER: '커뮤니티',
};

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'badge-easy',
  MEDIUM: 'badge-medium',
  HARD: 'badge-hard',
  USER: 'badge-medium',
};

function parseUserCase(caseData: UserCaseDraftResponse): DisplayCase {
  let setting = caseData.summary;
  let suspectNames: string[] = [];

  try {
    const parsed = JSON.parse(caseData.scenarioPrompt);
    if (typeof parsed?.setting === 'string' && parsed.setting.trim()) {
      setting = parsed.setting;
    }

    if (Array.isArray(parsed?.suspects)) {
      suspectNames = parsed.suspects
        .map((s: any) => (typeof s?.name === 'string' ? s.name.trim() : ''))
        .filter(Boolean);
    }
  } catch {
    // fallback: keep summary and empty suspects
  }

  return {
    id: caseData.id,
    title: caseData.title,
    previewNarrative: setting,
    suspectNames,
    difficulty: 'USER',
    source: 'user',
    playCount: caseData.playCount ?? 0,
    recommendCount: caseData.recommendCount ?? 0,
    recommended: caseData.recommended ?? false,
  };
}

export function CasePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const source: CaseSource = searchParams.get('source') === 'user' ? 'user' : 'basic';

  const [detail, setDetail] = useState<DisplayCase | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [loadError, setLoadError] = useState('');

  const start = useSessionStore((s) => s.start);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!id) return;
    const caseId = Number(id);
    if (!Number.isFinite(caseId)) return;

    setLoadError('');
    setDetail(null);

    if (source === 'user') {
      void listPublishedUserCases()
        .then((cases) => {
          const found = cases.find((c) => c.id === caseId);
          if (!found) {
            setLoadError('커뮤니티 사건을 찾을 수 없습니다.');
            return;
          }
          setDetail(parseUserCase(found));
        })
        .catch(() => setLoadError('커뮤니티 사건을 불러오지 못했습니다.'));

      void listMySessions().then((sessions) => {
        const active = sessions.find(
          (s) => s.status === 'ACTIVE' && s.caseSourceType === 'USER_PUBLISHED' && s.sourceRefId === caseId
        );
        setActiveSession(active ?? null);
      });
      return;
    }

    void getCase(caseId)
      .then((d: CaseTemplateDetail) => {
        setDetail({
          id: d.id,
          title: d.title,
          previewNarrative: d.previewNarrative,
          suspectNames: d.suspectNames,
          difficulty: d.difficulty,
          source: 'basic',
          playCount: d.playCount ?? 0,
          recommendCount: d.recommendCount ?? 0,
          recommended: d.recommended ?? false,
        });
      })
      .catch(() => setLoadError('기본 사건을 불러오지 못했습니다.'));

    void listMySessions().then((sessions) => {
      const active = sessions.find(
        (s) => s.status === 'ACTIVE' && s.caseSourceType === 'BASIC_TEMPLATE' && s.sourceRefId === caseId
      );
      setActiveSession(active ?? null);
    });
  }, [id, source]);

  async function startCase() {
    if (!detail || loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const session =
        detail.source === 'user'
          ? await start({ mode: 'USER', publishedUserCaseId: detail.id })
          : await start({ mode: 'BASIC', basicCaseTemplateId: detail.id });
      navigate(`/play/${session.publicId}`);
    } finally {
      setLoading(false);
    }
  }

  async function onRecommend() {
    if (!detail || recommending || !user) return;
    setRecommending(true);
    try {
      const result = detail.source === 'user'
        ? await recommendUserCase(detail.id)
        : await recommendCase(detail.id);
      setDetail((prev) =>
        prev ? { ...prev, recommended: result.recommended, recommendCount: result.recommendCount } : prev
      );
    } finally {
      setRecommending(false);
    }
  }

  const diffKey = useMemo(() => (detail?.difficulty?.toUpperCase() ?? 'MEDIUM'), [detail]);

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <p className="text-red-300">{loadError}</p>
        <button className="btn-outline" onClick={() => navigate('/')}>홈으로</button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        사건 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <span className={`badge ${DIFFICULTY_STYLE[diffKey] ?? 'badge-medium'}`}>
          {DIFFICULTY_LABEL[diffKey] ?? detail.difficulty}
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
        {detail.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-gray-300">
        <span>▶ 플레이 {detail.playCount}</span>
        <button
          type="button"
          className={`transition-colors disabled:opacity-60 ${
            detail.recommended ? 'text-red-400' : 'hover:text-red-300'
          }`}
          onClick={onRecommend}
          disabled={recommending || !user}
          title={!user ? '로그인 후 추천할 수 있습니다' : undefined}
        >
          {detail.recommended ? '♥' : '♡'} 추천 {detail.recommendCount}
        </button>
      </div>

      {activeSession && (
        <div className="bg-accent-pink/10 border border-accent-pink/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-accent-pink font-semibold">진행 중인 수사가 있습니다</p>
            <p className="text-sm text-gray-400 mt-1">세션 ID: #{activeSession.id}</p>
          </div>
          <button
            className="px-5 py-2.5 rounded-lg bg-accent-pink text-white font-bold hover:opacity-90 transition-opacity"
            onClick={() => navigate(`/play/${activeSession.publicId}`)}
          >
            이어서 플레이
          </button>
        </div>
      )}

      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{detail.previewNarrative}</p>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">용의자 목록</h2>
        {detail.suspectNames.length === 0 ? (
          <p className="text-sm text-gray-500">시드 데이터에 용의자명이 아직 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {detail.suspectNames.map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-full text-sm text-gray-200"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="w-full py-4 rounded-xl bg-accent-pink text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        onClick={startCase}
        disabled={loading}
      >
        {loading ? '세션 생성 중...' : '사건 시작하기'}
      </button>
    </div>
  );
}
