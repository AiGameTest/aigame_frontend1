import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCase, listMySessions } from '../api/client';
import type { CaseTemplateDetail, SessionSummaryResponse } from '../api/types';
import { useSessionStore } from '../store/sessionStore';

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
};

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'badge-easy',
  MEDIUM: 'badge-medium',
  HARD: 'badge-hard',
};

export function CasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<CaseTemplateDetail | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const start = useSessionStore((s) => s.start);

  useEffect(() => {
    if (!id) return;
    const caseId = Number(id);
    getCase(caseId).then(setDetail);
    listMySessions().then((sessions) => {
      const active = sessions.find(
        (s) => s.status === 'ACTIVE' && s.caseSourceType === 'BASIC_TEMPLATE' && s.sourceRefId === caseId
      );
      setActiveSession(active ?? null);
    });
  }, [id]);

  async function startBasic() {
    if (!detail || loading) return;
    setLoading(true);
    try {
      const session = await start({ mode: 'BASIC', basicCaseTemplateId: detail.id });
      navigate(`/play/${session.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        사건 정보를 불러오는 중...
      </div>
    );
  }

  const diffKey = detail.difficulty?.toUpperCase() ?? 'MEDIUM';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Difficulty Badge */}
      <div>
        <span className={`badge ${DIFFICULTY_STYLE[diffKey] ?? 'badge-medium'}`}>
          {DIFFICULTY_LABEL[diffKey] ?? detail.difficulty}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
        {detail.title}
      </h1>

      {/* Active Session Banner */}
      {activeSession && (
        <div className="bg-accent-pink/10 border border-accent-pink/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-accent-pink font-semibold">진행 중인 수사가 있습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              질문 {activeSession.questionsUsed}/{activeSession.questionLimit}회 사용
            </p>
          </div>
          <button
            className="px-5 py-2.5 rounded-lg bg-accent-pink text-white font-bold hover:opacity-90 transition-opacity"
            onClick={() => navigate(`/play/${activeSession.id}`)}
          >
            수사 이어하기
          </button>
        </div>
      )}

      {/* Preview Narrative */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <p className="text-gray-300 leading-relaxed">{detail.previewNarrative}</p>
      </div>

      {/* Suspects */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">용의자 목록</h2>
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
      </div>

      {/* Start Button */}
      <button
        className="w-full py-4 rounded-xl bg-accent-pink text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        onClick={startBasic}
        disabled={loading}
      >
        {loading ? '사건 생성 중...' : '🔍 새 수사 시작'}
      </button>
    </div>
  );
}
