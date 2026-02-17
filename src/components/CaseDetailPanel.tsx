import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCase, listMySessions, listPublishedUserCases } from '../api/client';
import type { SessionSummaryResponse } from '../api/types';
import { useSessionStore } from '../store/sessionStore';

type CaseSource = 'basic' | 'user';

interface PanelCase {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  previewNarrative: string;
  suspectNames: string[];
  source: CaseSource;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '쉬움', MEDIUM: '보통', HARD: '어려움', USER: '커스텀',
};
const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'badge-easy', MEDIUM: 'badge-medium', HARD: 'badge-hard', USER: 'badge-medium',
};
const THUMBNAIL_COLORS = [
  'from-purple-900 to-pink-800',
  'from-blue-900 to-cyan-800',
  'from-red-900 to-orange-800',
  'from-emerald-900 to-teal-800',
  'from-indigo-900 to-violet-800',
  'from-rose-900 to-red-800',
];

interface CaseDetailPanelProps {
  caseId: number | null;
  source: CaseSource;
  onClose: () => void;
}

export function CaseDetailPanel({ caseId, source, onClose }: CaseDetailPanelProps) {
  const navigate = useNavigate();
  const start = useSessionStore((s) => s.start);

  const [detail, setDetail] = useState<PanelCase | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const isOpen = caseId !== null;

  // ESC 키로 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!caseId) { setDetail(null); setActiveSession(null); return; }
    setLoading(true);
    setDetail(null);

    if (source === 'user') {
      listPublishedUserCases()
        .then((cases) => {
          const found = cases.find((c) => c.id === caseId);
          if (!found) return;
          let narrative = found.summary;
          let suspectNames: string[] = [];
          try {
            const parsed = JSON.parse(found.scenarioPrompt);
            if (parsed?.setting) narrative = parsed.setting;
            if (Array.isArray(parsed?.suspects)) {
              suspectNames = parsed.suspects.map((s: any) => s?.name ?? '').filter(Boolean);
            }
          } catch {}
          setDetail({
            id: found.id, title: found.title, description: found.summary,
            difficulty: 'USER', previewNarrative: narrative,
            suspectNames, source: 'user',
          });
        })
        .finally(() => setLoading(false));

      listMySessions().then((sessions) => {
        const active = sessions.find(
          (s) => s.status === 'ACTIVE' && s.caseSourceType === 'USER_PUBLISHED' && s.sourceRefId === caseId
        );
        setActiveSession(active ?? null);
      });
    } else {
      getCase(caseId)
        .then((d) => {
          setDetail({
            id: d.id, title: d.title, description: d.description,
            difficulty: d.difficulty, previewNarrative: d.previewNarrative,
            suspectNames: d.suspectNames, source: 'basic',
          });
        })
        .finally(() => setLoading(false));

      listMySessions().then((sessions) => {
        const active = sessions.find(
          (s) => s.status === 'ACTIVE' && s.caseSourceType === 'BASIC_TEMPLATE' && s.sourceRefId === caseId
        );
        setActiveSession(active ?? null);
      });
    }
  }, [caseId, source]);

  async function handleStart() {
    if (!detail || starting) return;
    setStarting(true);
    try {
      const session = detail.source === 'user'
        ? await start({ mode: 'USER', publishedUserCaseId: detail.id })
        : await start({ mode: 'BASIC', basicCaseTemplateId: detail.id });
      navigate(`/play/${session.id}`);
    } finally {
      setStarting(false);
    }
  }

  function handleContinue() {
    if (activeSession) navigate(`/play/${activeSession.id}`);
  }

  const colorIdx = detail ? detail.id % THUMBNAIL_COLORS.length : 0;
  const diffKey = detail?.difficulty?.toUpperCase() ?? 'MEDIUM';

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 가운데 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors z-10"
          >
            ✕
          </button>

          {loading || !detail ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 py-20">
              {loading ? '불러오는 중...' : ''}
            </div>
          ) : (
            <div className="overflow-y-auto">
              {/* 썸네일 */}
              <div className={`w-full h-48 bg-gradient-to-br ${THUMBNAIL_COLORS[colorIdx]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-7xl opacity-30">🔎</span>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6 space-y-4">
                {/* 난이도 + 제목 */}
                <div>
                  <span className={`badge ${DIFFICULTY_STYLE[diffKey] ?? 'badge-medium'}`}>
                    {DIFFICULTY_LABEL[diffKey] ?? detail.difficulty}
                  </span>
                  <h2 className="mt-2 text-2xl font-black text-white leading-tight">{detail.title}</h2>
                </div>

                {/* 게임 설명 */}
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">게임 설명</p>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {detail.previewNarrative}
                  </p>
                </div>

                {/* 용의자 목록 */}
                {detail.suspectNames.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">용의자</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.suspectNames.map((name) => (
                        <span
                          key={name}
                          className="px-2.5 py-1 bg-dark-surface border border-dark-border rounded-full text-xs text-gray-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 버튼 영역 */}
                <div className="flex gap-2 pt-1">
                  {activeSession && (
                    <button
                      className="flex-1 py-3 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                      onClick={handleContinue}
                    >
                      ▶ 이어하기
                    </button>
                  )}
                  <button
                    className="flex-1 py-3 rounded-xl bg-accent-pink text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    onClick={handleStart}
                    disabled={starting}
                  >
                    {starting ? '세션 생성 중...' : activeSession ? '새로 시작하기' : '▶ 시작하기'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}