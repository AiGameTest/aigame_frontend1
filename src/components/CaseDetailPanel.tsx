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
import { useAuthStore } from '../store/authStore';
import { useGenerationStore } from '../store/generationStore';

type CaseSource = 'basic' | 'user';
type TabType = '소개' | '댓글';

interface SuspectDetail {
  name: string;
  personality?: string;
  background?: string;
  imageUrl?: string;
}

interface VictimDetail {
  name: string;
  description?: string;
}

interface PanelCase {
  id: number;
  title: string;
  description: string;
  previewNarrative: string;
  setting?: string;
  victim?: VictimDetail;
  suspects: SuspectDetail[];
  source: CaseSource;
  authorNickname?: string;
  authorProfileImageUrl?: string;
  playCount: number;
  recommendCount: number;
  recommended: boolean;
  thumbnailUrl?: string;
}

interface CaseDetailPanelProps {
  caseId: number | null;
  source: CaseSource;
  onClose: () => void;
}

const SESSION_BUILDING_MESSAGES = [
  '사건 만드는 중...',
  '범죄 저지르는 중...',
  '범죄 현장 만드는 중...',
  '용의자 알리바이 엮는 중...',
  '단서 배치하는 중...',
  '수사 기록 봉인하는 중...',
];

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
  comment, user, onLike, onDelete, onReply,
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
        className="w-7 h-7 flex-shrink-0 rounded-full border border-ghost object-cover"
        style={{ filter: 'sepia(0.2) brightness(0.9)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-label text-[10px] tracking-wider text-sepia">{comment.nickname}</span>
          <span className="font-detail text-[9px] text-ghost">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="font-body text-xs text-sepia/80 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onLike(comment.id)}
            disabled={!user}
            className={`flex items-center gap-1 font-detail text-[9px] tracking-wide transition-colors disabled:opacity-40 ${
              comment.liked ? 'text-crimson' : 'text-ghost hover:text-faded'
            }`}
          >
            {comment.liked ? '♥' : '♡'} {comment.likeCount}
          </button>
          {comment.replies !== undefined && (
            <button
              onClick={() => onReply(comment.id)}
              disabled={!user}
              className="font-detail text-[9px] text-ghost hover:text-faded transition-colors tracking-wide disabled:opacity-40"
            >
              답글
            </button>
          )}
          {user && user.id === comment.userId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="font-detail text-[9px] text-ghost hover:text-crimson/70 transition-colors tracking-wide"
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
  const user = useAuthStore((s) => s.user);
  const startGeneration = useGenerationStore((s) => s.startGeneration);
  const genStatus = useGenerationStore((s) => s.status);

  const [detail, setDetail] = useState<PanelCase | null>(null);
  const [activeSession, setActiveSession] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('소개');
  const [recommending, setRecommending] = useState(false);
  const [startingMessageIndex, setStartingMessageIndex] = useState(0);

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
  const isStarting = genStatus === 'story' || genStatus === 'images';

  useEffect(() => {
    if (!isStarting) { setStartingMessageIndex(0); return; }
    const timer = window.setInterval(() => {
      setStartingMessageIndex((prev) => (prev + 1) % SESSION_BUILDING_MESSAGES.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isStarting]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!caseId) {
      setDetail(null); setActiveSession(null); setActiveTab('소개');
      setComments([]); setCommentCount(0); setReplyTo(null);
      return;
    }
    setLoading(true); setDetail(null);

    if (source === 'user') {
      listPublishedUserCases()
        .then((cases) => {
          const found = cases.find((c) => c.id === caseId);
          if (!found) return;
          let setting: string | undefined;
          let victim: VictimDetail | undefined;
          let suspects: SuspectDetail[] = [];
          try {
            const parsed = JSON.parse(found.scenarioPrompt);
            if (parsed?.setting) setting = parsed.setting;
            if (parsed?.victim) victim = { name: parsed.victim?.name ?? '', description: parsed.victim?.description };
            if (Array.isArray(parsed?.suspects)) {
              suspects = parsed.suspects.filter((s: any) => s?.name).map((s: any) => ({
                name: s.name, personality: s.personality, background: s.background, imageUrl: s.imageUrl,
              }));
            }
          } catch {}
          setDetail({
            id: found.id, title: found.title, description: found.summary,
            previewNarrative: found.summary, setting, victim, suspects,
            source: 'user', authorNickname: found.authorNickname,
            authorProfileImageUrl: found.authorProfileImageUrl,
            playCount: found.playCount ?? 0, recommendCount: found.recommendCount ?? 0,
            recommended: found.recommended ?? false, thumbnailUrl: found.thumbnailUrl,
          });
        })
        .finally(() => setLoading(false));
      listMySessions().then((sessions) => {
        const active = sessions.find((s) => s.status === 'ACTIVE' && s.caseSourceType === 'USER_PUBLISHED' && s.sourceRefId === caseId);
        setActiveSession(active ?? null);
      });
    } else {
      getCase(caseId)
        .then((d) => {
          setDetail({
            id: d.id, title: d.title, description: d.description,
            previewNarrative: d.previewNarrative ?? '', setting: d.setting,
            victim: d.victim, suspects: d.suspects ?? [], source: 'basic',
            playCount: d.playCount ?? 0, recommendCount: d.recommendCount ?? 0,
            recommended: d.recommended ?? false, thumbnailUrl: d.thumbnailUrl,
          });
        })
        .finally(() => setLoading(false));
      listMySessions().then((sessions) => {
        const active = sessions.find((s) => s.status === 'ACTIVE' && s.caseSourceType === 'BASIC_TEMPLATE' && s.sourceRefId === caseId);
        setActiveSession(active ?? null);
      });
    }
  }, [caseId, source]);

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
    if (!detail || genStatus !== 'idle') return;
    if (!user) { navigate('/login'); return; }
    await startGeneration(
      detail.source === 'user'
        ? { mode: 'USER', publishedUserCaseId: detail.id }
        : { mode: 'BASIC', basicCaseTemplateId: detail.id }
    );
  }

  function handleContinue() { if (activeSession) navigate(`/play/${activeSession.publicId}`); }

  async function handleLike() {
    if (!detail || recommending || !user) return;
    setRecommending(true);
    try {
      const result = detail.source === 'user'
        ? await recommendUserCase(detail.id)
        : await recommendCase(detail.id);
      setDetail((prev) => prev ? { ...prev, recommended: result.recommended, recommendCount: result.recommendCount } : prev);
    } finally { setRecommending(false); }
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
    } finally { setSubmittingComment(false); }
  }

  async function handleAddReply(parentId: number) {
    if (!replyInput.trim() || submittingReply || !user || !caseId) return;
    setSubmittingReply(true);
    try {
      const addFn = source === 'user' ? addUserCaseComment : addCaseComment;
      const newReply = await addFn(caseId, { content: replyInput.trim(), parentId });
      setComments((prev) => prev.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), newReply] } : c));
      setCommentCount((n) => n + 1);
      setReplyInput(''); setReplyTo(null);
    } finally { setSubmittingReply(false); }
  }

  async function handleCommentLike(commentId: number) {
    if (!user) return;
    try {
      const result = await toggleCommentLike(commentId);
      setComments((prev) => updateCommentLike(prev, commentId, result.liked, result.likeCount));
    } catch {}
  }

  function updateCommentLike(list: CaseCommentResponse[], commentId: number, liked: boolean, likeCount: number): CaseCommentResponse[] {
    return list.map((c) => {
      if (c.id === commentId) return { ...c, liked, likeCount };
      if (c.replies?.length) return { ...c, replies: updateCommentLike(c.replies, commentId, liked, likeCount) };
      return c;
    });
  }

  async function handleDeleteComment(commentId: number) {
    if (!user) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => {
        const filtered = prev.filter((c) => c.id !== commentId);
        if (filtered.length < prev.length) { setCommentCount((n) => n - 1); return filtered; }
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-void/85 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-shadow border border-ghost flex overflow-hidden"
          style={{
            height: 'min(72vh, 680px)', minHeight: '460px',
            boxShadow: '0 0 80px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(61,52,40,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 상단 골드 선 */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gold-dim z-10" />

          {/* 좌측 — 썸네일 */}
          <div className="hidden md:flex w-[340px] flex-shrink-0 flex-col" style={{ height: '100%' }}>
            <div className="flex-1 relative overflow-hidden min-h-0">
              {loading || !detail ? (
                <div className="absolute inset-0 bg-dark animate-pulse" />
              ) : detail.thumbnailUrl ? (
                <img
                  src={detail.thumbnailUrl}
                  alt={detail.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'sepia(0.35) brightness(0.75)' }}
                />
              ) : (
                <div className="absolute inset-0 bg-dark flex flex-col items-center justify-center gap-4">
                  <span className="font-detail text-ghost/20 text-8xl tracking-widest">?</span>
                  {detail && (
                    <div className="text-center px-5">
                      <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-2">CASE FILE</p>
                      <p className="font-headline text-xl text-faded leading-tight">{detail.title}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 통계 바 */}
            <div className="flex-shrink-0 bg-shadow border-t border-ghost px-4 py-3 flex items-center justify-around">
              {detail?.source === 'user' && detail.authorNickname && (
                <>
                  <div className="text-center min-w-0 flex-1">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      {detail.authorProfileImageUrl && (
                        <img src={detail.authorProfileImageUrl} alt={detail.authorNickname}
                          className="w-4 h-4 rounded-full object-cover border border-ghost flex-shrink-0"
                          style={{ filter: 'sepia(0.3)' }}
                        />
                      )}
                      <p className="font-label text-[9px] tracking-wider text-sepia truncate max-w-[70px]">{detail.authorNickname}</p>
                    </div>
                    <p className="font-detail text-[9px] text-ghost tracking-widest">제작자</p>
                  </div>
                  <div className="w-px h-6 bg-ghost" />
                </>
              )}
              <div className="text-center flex-1">
                <p className="font-headline text-base text-sepia">{(detail?.playCount ?? 0).toLocaleString()}</p>
                <p className="font-detail text-[9px] text-ghost tracking-widest mt-0.5">플레이</p>
              </div>
              <div className="w-px h-6 bg-ghost" />
              <div className="text-center flex-1">
                <p className="font-headline text-base text-sepia">{(detail?.recommendCount ?? 0).toLocaleString()}</p>
                <p className="font-detail text-[9px] text-ghost tracking-widest mt-0.5">추천</p>
              </div>
            </div>
          </div>

          {/* 우측 — 콘텐츠 */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ height: '100%' }}>

            {/* 헤더 */}
            <div className="flex-shrink-0 px-5 pt-5 border-b border-ghost">
              <div className="flex items-start justify-between gap-3 pb-3">
                <div className="min-w-0">
                  {loading || !detail ? (
                    <div className="space-y-2">
                      <div className="h-2.5 w-20 bg-ghost/40 animate-pulse" />
                      <div className="h-5 w-48 bg-ghost/30 animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="badge-file">FILE #{String(detail.id).padStart(3, '0')}</span>
                        <div className="md:hidden flex items-center gap-2 font-detail text-[9px] text-ghost">
                          <span>▶ {detail.playCount}</span>
                          <button
                            onClick={handleLike}
                            disabled={recommending || !user}
                            className={`transition-colors ${detail.recommended ? 'text-crimson' : ''}`}
                          >
                            {detail.recommended ? '♥' : '♡'} {detail.recommendCount}
                          </button>
                        </div>
                      </div>
                      <h2 className="font-headline text-xl text-amber leading-tight">{detail.title}</h2>
                    </>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-ghost hover:border-gold-dim text-ghost hover:text-faded transition-all font-detail text-xs"
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
                    className={`px-4 py-2.5 -mb-px border-b font-label text-[9px] tracking-[0.2em] uppercase transition-all ${
                      activeTab === tab ? 'border-gold text-gold' : 'border-transparent text-ghost hover:text-faded'
                    }`}
                  >
                    {tab}
                    {tab === '댓글' && <span className="ml-1.5 font-detail text-[9px] text-ghost">{commentCount}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border border-gold-dim border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !detail ? null : activeTab === '소개' ? (
                <div className="absolute inset-0 overflow-y-auto">
                  <div className="p-5 space-y-4">
                    {detail.previewNarrative && (
                      <div className="border border-ghost bg-dark p-4">
                        <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-2">게임 설명</p>
                        <p className="font-body text-sm text-sepia/80 leading-relaxed whitespace-pre-wrap italic">
                          {detail.previewNarrative}
                        </p>
                      </div>
                    )}
                    {detail.setting && detail.setting !== detail.previewNarrative && (
                      <div className="border border-ghost bg-dark p-4">
                        <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-2">사건 배경</p>
                        <p className="font-body text-sm text-sepia/80 leading-relaxed whitespace-pre-wrap italic">
                          {detail.setting}
                        </p>
                      </div>
                    )}
                    {detail.victim && (detail.victim.name || detail.victim.description) && (
                      <div className="border border-ghost bg-dark p-4">
                        <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-2">피해자</p>
                        {detail.victim.name && <p className="font-headline text-sm text-amber mb-1">{detail.victim.name}</p>}
                        {detail.victim.description && <p className="font-body text-xs text-sepia/70 leading-relaxed italic">{detail.victim.description}</p>}
                      </div>
                    )}
                    {detail.suspects.length > 0 && (
                      <div className="border border-ghost bg-dark p-4">
                        <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-3">용의자 {detail.suspects.length}명</p>
                        <div className="space-y-3">
                          {detail.suspects.map((s) => (
                            <div key={s.name} className="flex items-start gap-2.5">
                              {s.imageUrl ? (
                                <img src={s.imageUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-ghost" style={{ filter: 'sepia(0.3)' }} />
                              ) : (
                                <div className="w-8 h-8 border border-ghost flex items-center justify-center flex-shrink-0 bg-shadow">
                                  <span className="font-detail text-[10px] text-ghost">?</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-headline text-sm text-sepia">{s.name}</p>
                                {s.personality && <p className="font-body text-xs text-faded mt-0.5 leading-relaxed italic">{s.personality}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col">
                  {user ? (
                    <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-ghost bg-shadow">
                      <div className="flex gap-2 items-center">
                        <img src={user.profileImageUrl} alt={user.nickname}
                          className="w-7 h-7 flex-shrink-0 rounded-full border border-ghost object-cover"
                          style={{ filter: 'sepia(0.3)' }}
                        />
                        <input
                          ref={commentInputRef}
                          className="flex-1 bg-dark border border-ghost hover:border-gold-dim/50 focus:border-gold-dim text-sepia px-3 py-2 font-body text-xs outline-none transition-all placeholder:text-ghost"
                          style={{ borderRadius: 0 }}
                          placeholder="댓글을 입력해 주세요..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={!commentInput.trim() || submittingComment}
                          className="btn-secondary py-2 px-3 text-[0.6rem] disabled:opacity-40"
                        >
                          등록
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-ghost">
                      <p className="font-body italic text-xs text-faded text-center py-1">로그인 후 댓글을 작성할 수 있습니다</p>
                    </div>
                  )}

                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    {comments.length === 0 ? (
                      <p className="text-center font-body italic text-faded text-sm py-8">첫 댓글을 남겨보세요</p>
                    ) : (
                      <div className="space-y-5">
                        {comments.map((comment) => (
                          <div key={comment.id}>
                            <CommentItem comment={comment} user={user} onLike={handleCommentLike} onDelete={handleDeleteComment} onReply={handleReply} />
                            {comment.replies?.length > 0 && (
                              <div className="ml-10 mt-3 space-y-3 pl-3 border-l border-ghost/50">
                                {comment.replies.map((reply) => (
                                  <CommentItem key={reply.id} comment={reply} user={user} onLike={handleCommentLike} onDelete={handleDeleteComment} onReply={() => handleReply(comment.id)} />
                                ))}
                              </div>
                            )}
                            {replyTo === comment.id && user && (
                              <div className="ml-10 mt-3 pl-3 border-l border-ghost/50">
                                <div className="flex gap-2 items-center">
                                  <img src={user.profileImageUrl} alt={user.nickname} className="w-6 h-6 flex-shrink-0 rounded-full object-cover border border-ghost" style={{ filter: 'sepia(0.3)' }} />
                                  <input
                                    ref={replyInputRef}
                                    className="flex-1 bg-dark border border-ghost focus:border-gold-dim/50 text-sepia px-3 py-1.5 font-body text-xs outline-none transition-all placeholder:text-ghost"
                                    style={{ borderRadius: 0 }}
                                    placeholder="답글을 입력해 주세요..."
                                    value={replyInput}
                                    onChange={(e) => setReplyInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddReply(comment.id);
                                      if (e.key === 'Escape') { setReplyTo(null); setReplyInput(''); }
                                    }}
                                  />
                                  <button onClick={() => handleAddReply(comment.id)} disabled={!replyInput.trim() || submittingReply} className="btn-secondary py-1.5 px-2.5 text-[0.6rem] disabled:opacity-40">등록</button>
                                  <button onClick={() => { setReplyTo(null); setReplyInput(''); }} className="font-detail text-[9px] text-ghost hover:text-faded transition-colors">취소</button>
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

            {/* 액션 바 */}
            {!loading && detail && (
              <div className="flex-shrink-0 border-t border-ghost p-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleLike}
                    disabled={recommending || !user}
                    title={!user ? '로그인 후 추천할 수 있습니다' : undefined}
                    className={`flex items-center gap-1.5 px-4 py-2.5 border font-label text-[9px] tracking-[0.2em] uppercase transition-all disabled:opacity-40 ${
                      detail.recommended
                        ? 'border-crimson/50 text-crimson bg-crimson/10 hover:bg-crimson/15'
                        : 'border-ghost text-ghost hover:border-gold-dim/40 hover:text-faded'
                    }`}
                  >
                    <span>{detail.recommended ? '♥' : '♡'}</span>
                    <span>{detail.recommendCount}</span>
                  </button>

                  {activeSession && (
                    <button className="flex-1 btn-ghost py-2.5" onClick={handleContinue}>
                      이어하기
                    </button>
                  )}
                  <button
                    className="flex-1 btn-primary py-2.5 disabled:opacity-50"
                    onClick={handleStart}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-void/40 border-t-void/80 animate-spin" />
                        {SESSION_BUILDING_MESSAGES[startingMessageIndex]}
                      </span>
                    ) : activeSession ? '새로 시작하기' : '▶ 시작하기'}
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
