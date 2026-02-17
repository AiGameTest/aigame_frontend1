import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addCaseComment,
  addUserCaseComment,
  deleteComment,
  getCase,
  listCaseComments,
  listMySessions,
  listPublishedUserCases,
  listUserCaseComments,
  recommendCase,
  recommendUserCase,
  toggleCommentLike,
} from '../api/client';
import type { CaseCommentResponse, SessionSummaryResponse } from '../api/types';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';

type CaseSource = 'basic' | 'user';
type TabType = '소개' | '댓글';

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
  recommended: boolean;
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

interface CaseDetailPanelProps {
  caseId: number | null;
  source: CaseSource;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function CommentItem({
  comment,
  user,
  onLike,
  onDelete,
  onReply,
}: {
  comment: CaseCommentResponse;
  user: { id: number } | null;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
}) {
  return (
    <div className="flex gap-3">
      <img
        src={comment.profileImageUrl}
        alt={comment.nickname}
        className="w-8 h-8 flex-shrink-0 rounded-full bg-zinc-800 border border-white/10 object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-200">{comment.nickname}</span>
          <span className="text-[11px] text-gray-600">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onLike(comment.id)}
            disabled={!user}
            className={`flex items-center gap-1 text-[11px] transition-colors disabled:opacity-40 ${
              comment.liked ? 'text-red-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {comment.liked ? '❤️' : '🤍'}
            <span>{comment.likeCount}</span>
          </button>
          {comment.replies !== undefined && (
            <button
              onClick={() => onReply(comment.id)}
              disabled={!user}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40"
            >
              답글
            </button>
          )}
          {user && user.id === comment.userId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-[11px] text-gray-600 hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CaseDetailPanel({ caseId, source, onClose }: CaseDetailPanelProps) {
  const navigate = useNavigate();
  const start = useSessionStore((s) => s.start);
  const user = useAuthStore((s) => s.user);

  const [detail, setDetail] = useState<PanelCase | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('소개');
  const [recommending, setRecommending] = useState(false);

  const [comments, setComments] = useState<CaseCommentResponse[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

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

  // Load case detail
  useEffect(() => {
    if (!caseId) {
      setDetail(null);
      setActiveSession(null);
      setActiveTab('소개');
      setComments([]);
      setCommentCount(0);
      setReplyTo(null);
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
            recommended: found.recommended ?? false,
            thumbnailUrl: found.thumbnailUrl,
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
            playCount: d.playCount ?? 0,
            recommendCount: d.recommendCount ?? 0,
            recommended: d.recommended ?? false,
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

  // Load comments when case is loaded
  useEffect(() => {
    if (!caseId) return;
    const fetchComments = source === 'user' ? listUserCaseComments : listCaseComments;
    fetchComments(caseId).then((data) => {
      setComments(data);
      const total = data.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
      setCommentCount(total);
    }).catch(() => {});
  }, [caseId, source]);

  async function handleStart() {
    if (!detail || starting) return;
    if (!user) {
      navigate('/login');
      return;
    }
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

  async function handleLike() {
    if (!detail || recommending || !user) return;
    setRecommending(true);
    try {
      const result = detail.source === 'user'
        ? await recommendUserCase(detail.id)
        : await recommendCase(detail.id);
      setDetail((prev) => prev ? {
        ...prev,
        recommended: result.recommended,
        recommendCount: result.recommendCount,
      } : prev);
    } finally {
      setRecommending(false);
    }
  }

  async function handleAddComment() {
    if (!commentInput.trim() || submittingComment || !user || !caseId) return;
    setSubmittingComment(true);
    try {
      const addFn = source === 'user' ? addUserCaseComment : addCaseComment;
      const newComment = await addFn(caseId, { content: commentInput.trim() });
      setComments((prev) => [newComment, ...prev]);
      setCommentCount((n) => n + 1);
      setCommentInput('');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleAddReply(parentId: number) {
    if (!replyInput.trim() || submittingReply || !user || !caseId) return;
    setSubmittingReply(true);
    try {
      const addFn = source === 'user' ? addUserCaseComment : addCaseComment;
      const newReply = await addFn(caseId, { content: replyInput.trim(), parentId });
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies ?? []), newReply] }
            : c
        )
      );
      setCommentCount((n) => n + 1);
      setReplyInput('');
      setReplyTo(null);
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleCommentLike(commentId: number) {
    if (!user) return;
    try {
      const result = await toggleCommentLike(commentId);
      setComments((prev) => updateCommentLike(prev, commentId, result.liked, result.likeCount));
    } catch {}
  }

  function updateCommentLike(
    list: CaseCommentResponse[],
    commentId: number,
    liked: boolean,
    likeCount: number
  ): CaseCommentResponse[] {
    return list.map((c) => {
      if (c.id === commentId) return { ...c, liked, likeCount };
      if (c.replies?.length) {
        return { ...c, replies: updateCommentLike(c.replies, commentId, liked, likeCount) };
      }
      return c;
    });
  }

  async function handleDeleteComment(commentId: number) {
    if (!user) return;
    try {
      await deleteComment(commentId);
      // Remove from root or from replies
      setComments((prev) => {
        const filtered = prev.filter((c) => c.id !== commentId);
        if (filtered.length < prev.length) {
          setCommentCount((n) => n - 1);
          return filtered;
        }
        return prev.map((c) => {
          if (c.replies?.some((r) => r.id === commentId)) {
            setCommentCount((n) => n - 1);
            return { ...c, replies: c.replies.filter((r) => r.id !== commentId) };
          }
          return c;
        });
      });
    } catch {}
  }

  function handleReply(commentId: number) {
    setReplyTo(replyTo === commentId ? null : commentId);
    setReplyInput('');
    setTimeout(() => replyInputRef.current?.focus(), 50);
  }

  const colorIdx = detail ? detail.id % THUMBNAIL_COLORS.length : 0;
  const diffKey = detail?.difficulty?.toUpperCase() ?? 'MEDIUM';

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-[#0f1117] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] flex overflow-hidden"
          style={{ height: 'min(72vh, 680px)', minHeight: '460px' }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ══ 왼쪽: 이미지 패널 ══ */}
          <div className="hidden md:flex w-[360px] flex-shrink-0 flex-col" style={{ height: '100%' }}>

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

            {/* 통계 바 */}
            <div className="flex-shrink-0 bg-black/70 border-t border-white/10 px-4 py-3 flex items-center justify-around">
              <div className="text-center">
                <p className="text-white font-bold text-base">{(detail?.playCount ?? 0).toLocaleString()}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">플레이</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className={`font-bold
                  text-base transition-colors text-white group-hover:text-red-300`}>
                  {(detail?.recommendCount ?? 0).toLocaleString()}
                </p>
                <p className="text-gray-500 text-[11px] mt-0.5 group-hover:text-red-400 transition-colors">
                  좋아요
                </p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 정보 패널 */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ height: '100%' }}>

            {/* 헤더 */}
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
                          <button
                            onClick={handleLike}
                            disabled={recommending || !user}
                            className={`transition-colors ${detail.recommended ? 'text-red-400' : ''}`}
                          >
                            {detail.recommended ? '❤️' : '🤍'} {detail.recommendCount}
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

              {/* 탭 */}
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
                      <span className="ml-1.5 text-xs text-gray-500">{commentCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  불러오는 중...
                </div>
              ) : !detail ? null : activeTab === '소개' ? (

                /* 소개 탭 */
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
                  </div>
                </div>

              ) : (

                /* 댓글 탭 */
                <div className="absolute inset-0 flex flex-col">
                  {/* 댓글 입력 */}
                  {user ? (
                    <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/8 bg-[#0f1117]">
                      <div className="flex gap-2 items-center">
                        <img
                          src={user.profileImageUrl}
                          alt={user.nickname}
                          className="w-8 h-8 flex-shrink-0 rounded-full bg-accent-pink/20 border border-accent-pink/30 object-cover"
                        />
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
                          disabled={!commentInput.trim() || submittingComment}
                          className="flex-shrink-0 px-3 py-2 rounded-xl bg-accent-pink text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                          등록
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/8 bg-[#0f1117]">
                      <p className="text-sm text-gray-500 text-center py-1">로그인 후 댓글을 작성할 수 있습니다</p>
                    </div>
                  )}

                  {/* 댓글 목록 */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-8">첫 댓글을 남겨보세요!</p>
                    ) : (
                      <div className="space-y-5">
                        {comments.map((comment) => (
                          <div key={comment.id}>
                            <CommentItem
                              comment={comment}
                              user={user}
                              onLike={handleCommentLike}
                              onDelete={handleDeleteComment}
                              onReply={handleReply}
                            />

                            {/* 답글 목록 */}
                            {comment.replies?.length > 0 && (
                              <div className="ml-11 mt-3 space-y-3 pl-3 border-l border-white/5">
                                {comment.replies.map((reply) => (
                                  <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    user={user}
                                    onLike={handleCommentLike}
                                    onDelete={handleDeleteComment}
                                    onReply={() => handleReply(comment.id)}
                                  />
                                ))}
                              </div>
                            )}

                            {/* 답글 입력 */}
                            {replyTo === comment.id && user && (
                              <div className="ml-11 mt-3 pl-3 border-l border-white/5">
                                <div className="flex gap-2 items-center">
                                  <img
                                    src={user.profileImageUrl}
                                    alt={user.nickname}
                                    className="w-6 h-6 flex-shrink-0 rounded-full object-cover"
                                  />
                                  <input
                                    ref={replyInputRef}
                                    className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 text-white rounded-lg px-3 py-1.5 text-xs outline-none transition-all placeholder:text-gray-600"
                                    placeholder="답글을 입력하세요..."
                                    value={replyInput}
                                    onChange={(e) => setReplyInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddReply(comment.id);
                                      if (e.key === 'Escape') { setReplyTo(null); setReplyInput(''); }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleAddReply(comment.id)}
                                    disabled={!replyInput.trim() || submittingReply}
                                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-accent-pink text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                                  >
                                    등록
                                  </button>
                                  <button
                                    onClick={() => { setReplyTo(null); setReplyInput(''); }}
                                    className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            {!loading && detail && (
              <div className="flex-shrink-0 border-t border-white/10 p-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleLike}
                    disabled={recommending || !user}
                    title={!user ? '로그인 후 추천할 수 있습니다' : undefined}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                      detail.recommended
                        ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                        : 'bg-white/5 border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span>{detail.recommended ? '❤️' : '🤍'}</span>
                    <span>{detail.recommendCount}</span>
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
