import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCasesPaged, listPublishedUserCasesPaged } from '../api/client';
import type { CaseTemplateSummary, UserCaseDraftResponse } from '../api/types';
import { CaseCard } from '../components/CaseCard';
import { CaseDetailPanel } from '../components/CaseDetailPanel';
import { CroppedThumbnail } from '../components/CroppedThumbnail';
import { useAuthStore } from '../store/authStore';
import { useGenerationStore } from '../store/generationStore';
import { useTypewriter } from '../hooks/useTypewriter';

const TYPEWRITER_LINES = [
  '용의자를 심문하라.',
  '단서를 수집하라.',
  '진실은 하나다.',
  '범인을 찾아라.',
];

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}

/* ── AI 모드 모달 ─────────────────────────────────────────── */
function AiModeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const genStatus = useGenerationStore((s) => s.status);
  const genPublicId = useGenerationStore((s) => s.publicId);
  const genErrorMessage = useGenerationStore((s) => s.errorMessage);
  const startGeneration = useGenerationStore((s) => s.startGeneration);
  const clearGeneration = useGenerationStore((s) => s.clear);

  const [setting, setSetting] = useState('');
  const [victimProfile, setVictimProfile] = useState('');
  const [suspectCount, setSuspectCount] = useState(4);
  const [gameStartHour, setGameStartHour] = useState(12);
  const [gameEndHour, setGameEndHour] = useState(18);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    await startGeneration({
      mode: 'AI',
      aiPrompt: { setting: setting || undefined, victimProfile: victimProfile || undefined, suspectCount },
      gameStartHour,
      gameEndHour,
    });
  }

  function handlePlayNow() {
    if (genPublicId) { clearGeneration(); navigate(`/play/${genPublicId}`); }
  }

  const isGenerating = genStatus === 'story' || genStatus === 'images';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-void/90 backdrop-blur-sm"
        onClick={isGenerating ? undefined : onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-[500px] border border-ghost bg-shadow pointer-events-auto"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(61,52,40,0.3)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 상단 골드 바 */}
          <div className="h-[1px] w-full bg-gold-dim" />

          {/* 닫기 */}
          {!isGenerating && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 font-detail text-xs text-ghost hover:text-faded transition-colors"
            >
              ✕
            </button>
          )}

          <div className="px-8 pt-7 pb-7">
            {/* 헤더 */}
            <div className="mb-6">
              <p className="badge-file mb-3">사건 생성 · AI MODE</p>
              <h2 className="font-headline text-3xl text-amber leading-tight">
                사건을 설계하라
              </h2>
              {genStatus === 'idle' && (
                <p className="font-body text-sm text-faded mt-2 italic">
                  설정을 입력하면 AI가 새로운 사건을 만들어드립니다.
                </p>
              )}
            </div>

            <div className="h-px bg-ghost/50 -mx-8 mb-6" />

            {/* 폼 */}
            {genStatus === 'idle' && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="font-label text-[9px] tracking-[0.25em] uppercase text-faded block mb-1.5">
                    장소 / 배경
                  </label>
                  <input
                    className="noir-input"
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder="예: 외딴 산장, 호화 유람선, 대학 캠퍼스..."
                  />
                </div>

                <div>
                  <label className="font-label text-[9px] tracking-[0.25em] uppercase text-faded block mb-1.5">
                    피해자 설정
                  </label>
                  <input
                    className="noir-input"
                    value={victimProfile}
                    onChange={(e) => setVictimProfile(e.target.value)}
                    placeholder="예: 유명 미술품 수집가, 은퇴한 교수..."
                  />
                </div>

                <div>
                  <label className="font-label text-[9px] tracking-[0.25em] uppercase text-faded block mb-1.5">
                    용의자 수
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSuspectCount(n)}
                        className={`py-2.5 border font-label text-xs tracking-wider transition-all ${
                          suspectCount === n
                            ? 'border-gold-dim bg-gold/8 text-gold'
                            : 'border-ghost bg-transparent text-ghost hover:border-gold-dim/50 hover:text-faded'
                        }`}
                      >
                        {n}명
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-label text-[9px] tracking-[0.25em] uppercase text-faded block mb-1.5">
                    수사 시간
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-detail text-[9px] text-ghost mb-1 tracking-wide">시작</p>
                      <select
                        className="noir-select"
                        value={gameStartHour}
                        onChange={(e) => setGameStartHour(Number(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i} style={{ background: '#0d0b09' }}>{formatHour(i)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="font-detail text-[9px] text-ghost mb-1 tracking-wide">종료</p>
                      <select
                        className="noir-select"
                        value={gameEndHour}
                        onChange={(e) => setGameEndHour(Number(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1)
                          .filter((h) => h > gameStartHour)
                          .map((h) => (
                            <option key={h} value={h} style={{ background: '#0d0b09' }}>{formatHour(h)}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <p className="font-detail text-[9px] text-ghost mt-2 tracking-wide">
                    행동 1회당 15분 소모 · 최대 {Math.floor(((gameEndHour - gameStartHour) * 60) / 15)}회 행동 가능
                  </p>
                </div>

                <button type="submit" className="btn-primary w-full py-3.5 mt-1">
                  사건 생성하기
                </button>
              </form>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center py-10 gap-5">
                <div className="w-10 h-10 border border-gold-dim border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-body text-sepia text-sm">
                    {genStatus === 'story' ? '스토리를 구성하고 있습니다...' : '캐릭터 이미지를 생성하고 있습니다...'}
                  </p>
                  <p className="font-detail text-[10px] text-faded mt-2 tracking-wide">모달을 닫아도 백그라운드에서 계속 생성됩니다</p>
                </div>
                <button onClick={onClose} className="font-detail text-[10px] text-ghost hover:text-faded transition-colors tracking-widest underline underline-offset-2">
                  백그라운드에서 계속하기
                </button>
              </div>
            )}

            {genStatus === 'complete' && (
              <div className="flex flex-col items-center py-10 gap-5">
                <div className="w-12 h-12 border border-amber/40 flex items-center justify-center">
                  <span className="text-amber text-lg">✓</span>
                </div>
                <div className="text-center">
                  <p className="font-headline text-lg text-amber">사건이 준비되었습니다.</p>
                  <p className="font-detail text-[10px] text-faded mt-2 tracking-wide">지금 바로 수사를 시작하세요</p>
                </div>
                <button onClick={handlePlayNow} className="btn-primary w-full py-3.5">
                  플레이 시작
                </button>
              </div>
            )}

            {genStatus === 'error' && (
              <div className="flex flex-col items-center py-10 gap-5">
                <div className="w-12 h-12 border border-crimson/40 flex items-center justify-center">
                  <span className="text-crimson text-lg">✕</span>
                </div>
                <div className="text-center">
                  <p className="font-headline text-lg text-sepia">생성에 실패했습니다.</p>
                  <p className="font-detail text-[10px] text-crimson/60 mt-2">{genErrorMessage ?? '알 수 없는 오류가 발생했습니다.'}</p>
                </div>
                <button onClick={clearGeneration} className="btn-danger w-full py-3.5">
                  다시 시도
                </button>
              </div>
            )}
          </div>

          {/* 하단 골드 바 */}
          <div className="h-[1px] w-full bg-ghost" />
        </div>
      </div>
    </>
  );
}

/* ── 섹션 컴포넌트 ─────────────────────────────────────────── */
function ScrollSection({
  title,
  accent,
  linkText = '더보기',
  to,
  layout = 'scroll',
  children,
}: {
  title: string;
  accent?: string;
  linkText?: string;
  to?: string;
  layout?: 'scroll' | 'grid';
  children: React.ReactNode;
}) {
  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-2 md:grid-cols-4 gap-5'
      : 'scroll-row';

  return (
    <section className="mb-14">
      <div className="section-header">
        <h2 className="section-title">
          {title}{accent && <span className="text-gold"> {accent}</span>}
        </h2>
        {to ? (
          <Link to={to} className="section-link">{linkText} →</Link>
        ) : (
          <span className="section-link opacity-40 cursor-default">{linkText}</span>
        )}
      </div>
      <div className={containerClass}>{children}</div>
    </section>
  );
}

function DirectMakeCard() {
  return (
    <Link to="/create" className="block group flex-shrink-0">
      <div className="w-[220px] md:w-[250px]">
        <div className="relative aspect-[16/10] overflow-hidden border border-dashed border-ghost group-hover:border-gold-dim bg-shadow mb-3 transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-label text-2xl text-ghost group-hover:text-gold-dim transition-colors">＋</span>
            <span className="font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-faded transition-colors">
              새 사건 만들기
            </span>
          </div>
        </div>
        <h3 className="font-headline text-sm text-faded group-hover:text-sepia transition-colors">직접 만들기</h3>
        <p className="font-detail text-[10px] text-ghost mt-0.5 tracking-wide">나만의 사건을 설계하고 게시하세요</p>
      </div>
    </Link>
  );
}

function AiMakeCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="block group flex-shrink-0 text-left">
      <div className="w-[220px] md:w-[250px]">
        <div className="relative aspect-[16/10] overflow-hidden border border-dashed border-ghost group-hover:border-gold-dim bg-shadow mb-3 transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-label text-2xl text-ghost group-hover:text-gold-dim transition-colors">✦</span>
            <span className="font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-faded transition-colors">
              AI 사건 만들기
            </span>
          </div>
        </div>
        <h3 className="font-headline text-sm text-faded group-hover:text-sepia transition-colors">AI 직접 만들기</h3>
        <p className="font-detail text-[10px] text-ghost mt-0.5 tracking-wide">AI가 설정을 바탕으로 새로운 사건을 생성합니다</p>
      </div>
    </button>
  );
}

function CommunityCaseCard({ c, onClick }: { c: UserCaseDraftResponse; onClick: (id: number) => void }) {
  const hasCrop =
    c.thumbnailUrl != null &&
    c.thumbnailCropX != null &&
    c.thumbnailCropY != null &&
    c.thumbnailCropWidth != null;

  return (
    <div className="clue-card group" onClick={() => onClick(c.id)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-shadow mb-4 -mx-5 -mt-5">
        {c.thumbnailUrl ? (
          hasCrop ? (
            <CroppedThumbnail
              src={c.thumbnailUrl}
              alt={c.title}
              cropX={c.thumbnailCropX!}
              cropY={c.thumbnailCropY!}
              cropWidth={c.thumbnailCropWidth!}
            />
          ) : (
            <img
              src={c.thumbnailUrl}
              alt={c.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'sepia(0.3) brightness(0.8)' }}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-detail text-ghost/40 text-4xl">?</span>
          </div>
        )}
        <div className="absolute inset-0 bg-void/0 group-hover:bg-void/20 transition-colors flex items-end justify-end p-2.5">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity font-label text-[9px] tracking-[0.2em] uppercase text-amber">
            열람 →
          </span>
        </div>
      </div>

      <div className="mb-2">
        <span className="badge-file">COMMUNITY</span>
      </div>
      <h3 className="font-headline text-base text-amber leading-snug truncate group-hover:text-gold transition-colors mb-1.5">
        {c.title}
      </h3>
      <p className="font-body text-xs text-sepia/70 leading-relaxed line-clamp-2 italic mb-3">
        {c.summary}
      </p>
      <div className="flex items-center gap-3 pt-2.5 border-t border-ghost/60">
        <span className="font-detail text-[10px] text-faded">▶ {c.playCount ?? 0}</span>
        <span className="font-detail text-[10px] text-faded">♥ {c.recommendCount ?? 0}</span>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ──────────────────────────────────────────── */
export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [cases, setCases] = useState<CaseTemplateSummary[]>([]);
  const [communityCases, setCommunityCases] = useState<UserCaseDraftResponse[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'basic' | 'user'>('basic');
  const [mounted, setMounted] = useState(false);

  const typewriterText = useTypewriter(TYPEWRITER_LINES);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      listCasesPaged({ sort: 'recommended', page: 0, size: 8 }).catch(() => ({ content: [] as CaseTemplateSummary[] })),
      listPublishedUserCasesPaged({ sort: 'recommended', page: 0, size: 8 }).catch(() => ({ content: [] as UserCaseDraftResponse[] })),
    ]).then(([basicPage, customPage]) => {
      setCases(basicPage.content);
      setCommunityCases(customPage.content);
    });
  }, []);

  function openBasicCase(id: number) { setSelectedSource('basic'); setSelectedCaseId(id); }
  function openUserCase(id: number) { setSelectedSource('user'); setSelectedCaseId(id); }

  return (
    <div>
      {/* 히어로 */}
      <section className="py-16 md:py-24 mb-16">
        <div className="max-w-2xl">
          {/* 분류 배지 */}
          <p
            className="badge-file mb-6 inline-block"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.2s' }}
          >
            CASE FILE — OPEN CLUE
          </p>

          {/* 타이틀 */}
          <h1
            className="font-display text-amber leading-none mb-6"
            style={{
              fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
              animation: mounted ? 'title-in 1.4s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
              opacity: 0,
            }}
          >
            수사를<br />시작하라
          </h1>

          {/* 타이핑 */}
          <div
            className="flex items-baseline gap-1 mb-10"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.8s' }}
          >
            <p className="font-body italic text-sepia/80 text-lg md:text-xl min-h-[1.8rem]">
              {typewriterText}
            </p>
            <span className="font-detail text-gold text-lg animate-cursor-blink">_</span>
          </div>

          {/* 버튼 */}
          <div
            className="flex flex-wrap gap-3"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 1.1s' }}
          >
            <Link to="/cases?tab=basic" className="btn-primary">
              사건 목록 열람
            </Link>
            <button onClick={() => setShowAiModal(true)} className="btn-secondary">
              AI 사건 생성
            </button>
            {!user && (
              <Link to="/login" className="btn-ghost">
                로그인
              </Link>
            )}
          </div>
        </div>

        {/* 장식 구분선 */}
        <div className="divider-ornate mt-16">
          <span>✦</span>
        </div>
      </section>

      {/* 직접 만들기 */}
      <ScrollSection title="직접" accent="만들기">
        <DirectMakeCard />
        <AiMakeCard onClick={() => setShowAiModal(true)} />
      </ScrollSection>

      {/* 기본 사건 */}
      {cases.length > 0 && (
        <ScrollSection title="기본 사건" accent="추천" to="/cases?tab=basic" layout="grid">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} onClick={openBasicCase} />
          ))}
        </ScrollSection>
      )}

      {/* 커스텀 사건 */}
      {communityCases.length > 0 && (
        <ScrollSection title="커스텀" accent="사건" to="/cases?tab=custom" layout="grid">
          {communityCases.map((c) => (
            <CommunityCaseCard key={c.id} c={c} onClick={openUserCase} />
          ))}
        </ScrollSection>
      )}

      <CaseDetailPanel
        caseId={selectedCaseId}
        source={selectedSource}
        onClose={() => setSelectedCaseId(null)}
      />

      {showAiModal && <AiModeModal onClose={() => setShowAiModal(false)} />}
    </div>
  );
}
