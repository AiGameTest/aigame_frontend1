import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCase, listMySessions, listPublishedUserCases } from '../api/client';
import type { SessionSummaryResponse } from '../api/types';
import { useSessionStore } from '../store/sessionStore';

type CaseSource = 'basic' | 'user';
type TabType = '소개' | '댓글';

interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
}

interface PanelCase {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  previewNarrative: string;
  suspectNames: string[];
  source: CaseSource;
  playCount: number;
  recommendCount: number;
  thumbnailUrl?: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '쉬움', MEDIUM: '보통', HARD: '어려움', USER: '커스텀',
};
const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  HARD: 'bg-red-500/20 text-red-300 border-red-500/30',
  USER: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const THUMBNAIL_COLORS = [
  'from-purple-900 via-pink-900 to-rose-900',
  'from-blue-900 via-cyan-900 to-teal-900',
  'from-red-900 via-orange-900 to-amber-900',
  'from-emerald-900 via-teal-900 to-cyan-900',
  'from-indigo-900 via-violet-900 to-purple-900',
  'from-rose-900 via-pink-900 to-fuchsia-900',
];

const DUMMY_COMMENTS: Comment[] = [
  { id: 1, author: '탐정마스터', content: '정말 재밌는 사건이에요! 범인을 찾는 데 꽤 오래 걸렸지만 결국 성공했습니다 🎉', createdAt: '2026-02-10', likes: 12 },
  { id: 2, author: '추리왕', content: '용의자들의 알리바이가 정말 치밀하게 짜여 있어서 놀랐어요. 강추!', createdAt: '2026-02-12', likes: 7 },
  { id: 3, author: '미스테리러버', content: '시계탑이라는 배경이 분위기를 완벽하게 살려줬네요. 몰입감 최고!', createdAt: '2026-02-14', likes: 5 },
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
  const [activeTab, setActiveTab] = useState<TabType>('소개');
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>(DUMMY_COMMENTS);
  const [commentInput, setCommentInput] = useState('');
  const [commentLikes, setCommentLikes] = useState<Record<number, boolean>>({});
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOpen = caseId !== null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!caseId) {
      setDetail(null);
      setActiveSession(null);
      setLiked(false);
      setActiveTab('소개');
      return;
    }
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
            playCount: found.playCount ?? 0,
            recommendCount: found.recommendCount ?? 0,
            thumbnailUrl: found.thumbnailUrl,
          });
          setLocalLikes(found.recommendCount ?? 0);
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
            playCount: d.playCount ?? 0,
            recommendCount: d.recommendCount ?? 0,
          });
          setLocalLikes(d.recommendCount ?? 0);
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

  function handleLike() {
    if (liked) {
      setLiked(false);
      setLocalLikes((n) => n - 1);
    } else {
      setLiked(true);
      setLocalLikes((n) => n + 1);
    }
  }

  function handleAddComment() {
    if (!commentInput.trim()) return;
    const newComment: Comment = {
      id: Date.now(),
      author: '나',
      content: commentInput.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      likes: 0,
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentInput('');
  }

  function handleCommentLike(commentId: number) {
    setCommentLikes((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes: commentLikes[commentId] ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  }

  const colorIdx = detail ? detail.id % THUMBNAIL_COLORS.length : 0;
  const diffKey = detail?.difficulty?.toUpperCase() ?? 'MEDIUM';

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 — 고정 크기 (탭 전환해도 크기 불변) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-[#0f1117] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] flex overflow-hidden"
          style={{ height: 'min(84vh, 800px)', minHeight: '500px' }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ══ 왼쪽: 이미지 패널 ══ */}
          <div className="hidden md:flex w-[300px] flex-shrink-0 flex-col" style={{ height: '100%' }}>

            {/* 이미지 — flex-1으로 나머지 공간 전부 차지 */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              {loading || !detail ? (
                <div className={`absolute inset-0 bg-gradient-to-br ${THUMBNAIL_COLORS[colorIdx]}`} />
              ) : detail.thumbnailUrl ? (
                <img
                  src={detail.thumbnailUrl}
                  alt={detail.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${THUMBNAIL_COLORS[colorIdx]} flex flex-col items-center justify-center gap-4`}>
                  <div className="absolute top-8 left-8 w-28 h-28 rounded-full bg-white/5 blur-2xl" />
                  <div className="absolute bottom-16 right-4 w-20 h-20 rounded-full bg-white/5 blur-2xl" />
                  <span className="relative text-8xl opacity-25">🔎</span>
                  {detail && (
                    <div className="relative text-center px-5">
                      <p className="text-white/40 text-[11px] uppercase tracking-widest">Murder Mystery</p>
                      <p className="text-white font-black text-xl mt-2 leading-tight">{detail.title}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 통계 바 — 고정 높이 */}
            <div className="flex-shrink-0 bg-black/70 border-t border-white/10 px-4 py-3 flex items-center justify-around">
              <div className="text-center">
                <p className="text-white font-bold text-base">{(detail?.playCount ?? 0).toLocaleString()}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">플레이</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <button className="text-center group" onClick={handleLike}>
                <p className={`font-bold text-base transition-colors ${liked ? 'text-red-400' : 'text-white group-hover:text-red-300'}`}>
                  {localLikes.toLocaleString()}
                </p>
                <p className="text-gray-500 text-[11px] mt-0.5 group-hover:text-red-400 transition-colors">
                  {liked ? '❤️ 좋아요' : '🤍 좋아요'}
                </p>
              </button>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-white font-bold text-base">{comments.length}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">댓글</p>
              </div>
            </div>
          </div>

          {/* ══ 오른쪽: 정보 패널 — flex col 고정 ══ */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ height: '100%' }}>

            {/* 헤더 (shrink 안 함) */}
            <div className="flex-shrink-0 px-5 pt-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-3 pb-3">
                <div className="min-w-0">
                  {loading || !detail ? (
                    <div className="space-y-2">
                      <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
                      <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DIFFICULTY_STYLE[diffKey] ?? DIFFICULTY_STYLE['MEDIUM']}`}>
                          {DIFFICULTY_LABEL[diffKey] ?? detail.difficulty}
                        </span>
                        {/* 모바일용 통계 */}
                        <div className="md:hidden flex items-center gap-2 text-xs text-gray-400">
                          <span>▶ {detail.playCount}</span>
                          <button onClick={handleLike} className={`transition-colors ${liked ? 'text-red-400' : ''}`}>
                            {liked ? '❤️' : '🤍'} {localLikes}
                          </button>
                        </div>
                      </div>
                      <h2 className="text-xl font-black text-white leading-tight">{detail.title}</h2>
                    </>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 탭 — 항상 렌더 (크기 고정의 핵심) */}
              <div className={`flex gap-0 transition-opacity duration-150 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {(['소개', '댓글'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === tab
                        ? 'border-white text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                    {tab === '댓글' && (
                      <span className="ml-1.5 text-xs text-gray-500">{comments.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 영역 — flex-1, 내부에서 position absolute로 스크롤 제어 */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  불러오는 중...
                </div>
              ) : !detail ? null : activeTab === '소개' ? (

                /* ── 소개 탭 전체 스크롤 ── */
                <div className="absolute inset-0 overflow-y-auto">
                  <div className="p-5 space-y-4">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">게임 설명</p>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {detail.previewNarrative}
                      </p>
                    </div>

                    {detail.suspectNames.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">용의자</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.suspectNames.map((name) => (
                            <span
                              key={name}
                              className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:border-white/25 transition-colors"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">비슷한 사건들</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex-shrink-0 w-20 h-14 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              ) : (

                /* ── 댓글 탭: 입력창 고정 + 목록만 스크롤 ── */
                <div className="absolute inset-0 flex flex-col">
                  {/* 댓글 입력창 — 고정 */}
                  <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/8 bg-[#0f1117]">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-accent-pink/20 border border-accent-pink/30 flex items-center justify-center text-xs font-bold text-accent-pink">
                        나
                      </div>
                      <input
                        ref={commentInputRef}
                        className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 text-white rounded-xl px-3 py-2 text-sm outline-none transition-all placeholder:text-gray-600"
                        placeholder="댓글을 입력하세요..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!commentInput.trim()}
                        className="flex-shrink-0 px-3 py-2 rounded-xl bg-accent-pink text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                      >
                        등록
                      </button>
                    </div>
                  </div>

                  {/* 댓글 목록 — 이 영역만 스크롤 */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-8">첫 댓글을 남겨보세요!</p>
                    ) : (
                      <div className="space-y-5">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-gray-300">
                              {comment.author[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-200">{comment.author}</span>
                                <span className="text-[11px] text-gray-600">{comment.createdAt}</span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => handleCommentLike(comment.id)}
                                  className={`flex items-center gap-1 text-[11px] transition-colors ${
                                    commentLikes[comment.id] ? 'text-red-400' : 'text-gray-600 hover:text-gray-400'
                                  }`}
                                >
                                  {commentLikes[comment.id] ? '❤️' : '🤍'}
                                  <span>{comment.likes}</span>
                                </button>
                                <button className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
                                  답글
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 버튼 — 항상 하단 고정 */}
            {!loading && detail && (
              <div className="flex-shrink-0 border-t border-white/10 p-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      liked
                        ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                        : 'bg-white/5 border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span>{liked ? '❤️' : '🤍'}</span>
                    <span>{localLikes}</span>
                  </button>

                  {activeSession && (
                    <button
                      className="flex-1 py-2.5 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                      onClick={handleContinue}
                    >
                      ▶ 이어하기
                    </button>
                  )}
                  <button
                    className="flex-1 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    onClick={handleStart}
                    disabled={starting}
                  >
                    {starting ? '세션 생성 중...' : activeSession ? '새로 시작하기' : '▶ 시작하기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}