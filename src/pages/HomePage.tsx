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
                  <label className="font-label text-xs tracking-[0.2em] uppercase text-faded block mb-2">
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
                  <label className="font-label text-xs tracking-[0.2em] uppercase text-faded block mb-2">
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
                  <label className="font-label text-xs tracking-[0.2em] uppercase text-faded block mb-2">
                    용의자 수
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSuspectCount(n)}
                        className={`py-3 border font-label text-sm tracking-wider transition-all ${
                          suspectCount === n
                            ? 'border-gold-dim bg-gold/10 text-gold'
                            : 'border-ghost bg-transparent text-ghost hover:border-gold-dim/50 hover:text-faded'
                        }`}
                      >
                        {n}명
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-label text-xs tracking-[0.2em] uppercase text-faded block mb-2">
                    수사 시간
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-detail text-xs text-ghost mb-1.5 tracking-wide">시작</p>
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
                      <p className="font-detail text-xs text-ghost mb-1.5 tracking-wide">종료</p>
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
                  <p className="font-detail text-xs text-ghost mt-2 tracking-wide">
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
    <Link to="/create" className="clue-card group block">
      <div className="relative aspect-[16/10] overflow-hidden border border-dashed border-ghost group-hover:border-gold-dim bg-shadow -mx-5 -mt-5 mb-4 transition-colors flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-label text-3xl text-ghost group-hover:text-gold-dim transition-colors">＋</span>
          <span className="font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-faded transition-colors">
            새 사건 만들기
          </span>
        </div>
      </div>
      <h3 className="font-headline text-lg text-faded group-hover:text-sepia transition-colors mb-2">직접 만들기</h3>
      <p className="font-body text-sm text-sepia/50 italic leading-relaxed">나만의 사건을 설계하고 게시하세요</p>
    </Link>
  );
}

function AiMakeCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="clue-card group block text-left w-full">
      <div className="relative aspect-[16/10] overflow-hidden border border-dashed border-ghost group-hover:border-gold-dim bg-shadow -mx-5 -mt-5 mb-4 transition-colors flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-label text-3xl text-ghost group-hover:text-gold-dim transition-colors">✦</span>
          <span className="font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-faded transition-colors">
            AI 사건 만들기
          </span>
        </div>
      </div>
      <h3 className="font-headline text-lg text-faded group-hover:text-sepia transition-colors mb-2">AI 사건 만들기</h3>
      <p className="font-body text-sm text-sepia/50 italic leading-relaxed">AI가 설정을 바탕으로 새로운 사건을 생성합니다</p>
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
      <section className="py-16 md:py-20 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 lg:gap-16 items-center">

          {/* 왼쪽: 메인 콘텐츠 */}
          <div>
            {/* 분류 배지 */}
            <p
              className="badge-file mb-6 inline-block"
              style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.2s' }}
            >
              CASE FILE — OPEN CLUE
            </p>

            {/* 타이틀 */}
            <h1
              className="font-display leading-none mb-6"
              style={{
                fontSize: 'clamp(2.8rem, 7vw, 5rem)',
                animation: mounted ? 'title-in 1.4s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
                opacity: 0,
                background: 'linear-gradient(140deg, #7a6a4e 0%, #d4c49e 28%, #e8c96a 50%, #d4c49e 72%, #7a6a4e 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 32px rgba(201, 164, 71, 0.32))',
              }}
            >
              수사를<br />시작하라
            </h1>

            {/* 타이핑 */}
            <div
              className="mb-10"
              style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.6s 0.8s' }}
            >
              <p className="font-body italic text-sepia/80 text-lg md:text-xl min-h-[2rem]">
                {typewriterText}<span className="font-detail not-italic text-gold animate-cursor-blink ml-0.5">_</span>
              </p>
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

          {/* 오른쪽: 케이스 파일 패널 (데스크탑만) */}
          <div
            className="hidden lg:block"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s 0.5s' }}
          >
            <div
              className="border border-ghost bg-paper relative overflow-hidden"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(61,52,40,0.3), 4px 6px 24px rgba(6,5,4,0.7)' }}
            >
              {/* 상단 금선 */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold-dim to-transparent" />

              <div className="px-8 py-9 flex flex-col items-center text-center gap-5">
                {/* 기관 라벨 */}
                <p className="font-detail text-[10px] tracking-[0.35em] uppercase text-gold-dim">
                  DETECTIVE BUREAU
                </p>

                {/* 메인 브랜드 — index.html .title-main 구조와 동일 */}
                <div className="text-center">
                  {/* Open + Clue: 같은 element에 하나의 그라디언트 */}
                  <div
                    className="font-display leading-none"
                    style={{
                      fontSize: 'clamp(2.6rem, 6.5vw, 4.5rem)',
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      background: 'linear-gradient(140deg, #7a6a4e 0%, #d4c49e 28%, #e8c96a 50%, #d4c49e 72%, #7a6a4e 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 28px rgba(201, 164, 71, 0.28))',
                    }}
                  >
                    Open<br />Clue
                  </div>
                  {/* 미스터리 탐정 — index.html .line-kr 구조와 동일 */}
                  <p
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontSize: '0.88rem',
                      letterSpacing: '0.5em',
                      color: '#c9a447',
                      marginTop: '10px',
                    }}
                  >
                    미스터리&nbsp;&nbsp;탐정
                  </p>
                </div>

                {/* 케이스 메타 */}
                <div className="space-y-1.5 w-full text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-detail text-[10px] text-gold-dim tracking-widest uppercase">Genre</span>
                    <span className="font-detail text-[10px] text-faded">AI Murder Mystery</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-detail text-[10px] text-gold-dim tracking-widest uppercase">Type</span>
                    <span className="font-detail text-[10px] text-faded">Interactive Fiction</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-detail text-[10px] text-gold-dim tracking-widest uppercase">Status</span>
                    <span className="font-detail text-[10px] text-amber">● OPEN</span>
                  </div>
                </div>
              </div>

              {/* 하단 금선 */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-dim/50 to-transparent" />

              {/* 배경 워터마크 */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ opacity: 0.03 }}
              >
                <p className="font-display text-gold" style={{ fontSize: '8rem', letterSpacing: '0.1em' }}>OC</p>
              </div>
            </div>
          </div>
        </div>

        {/* 장식 구분선 */}
        <div className="divider-ornate mt-16">
          <span>✦</span>
        </div>
      </section>

      {/* 직접 만들기 */}
      <ScrollSection title="직접" accent="만들기" layout="grid">
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
