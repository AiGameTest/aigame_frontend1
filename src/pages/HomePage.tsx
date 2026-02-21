import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCasesPaged, listPublishedUserCasesPaged } from '../api/client';
import type { CaseTemplateSummary, UserCaseDraftResponse } from '../api/types';
import { CaseCard } from '../components/CaseCard';
import { CaseDetailPanel } from '../components/CaseDetailPanel';
import { CroppedThumbnail } from '../components/CroppedThumbnail';
import { useAuthStore } from '../store/authStore';
import { useGenerationStore } from '../store/generationStore';

const BANNERS = [
  {
    title: 'AI 추리 게임',
    subtitle: '용의자를 심문하고 진실을 찾아보세요.',
    gradient: 'from-indigo-600 via-purple-500 to-pink-400',
  },
  {
    title: 'BASIC 모드',
    subtitle: '준비된 사건으로 바로 플레이할 수 있습니다.',
    gradient: 'from-sky-400 via-blue-500 to-violet-500',
  },
  {
    title: 'AI 모드',
    subtitle: 'AI가 매번 새로운 사건을 생성합니다.',
    gradient: 'from-green-400 via-emerald-500 to-sky-500',
  },
];

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}

// ── AI 모드 모달 ───────────────────────────────────────────
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
    if (!user) {
      navigate('/login');
      return;
    }
    await startGeneration({
      mode: 'AI',
      aiPrompt: {
        setting: setting || undefined,
        victimProfile: victimProfile || undefined,
        suspectCount,
      },
      gameStartHour,
      gameEndHour,
    });
  }

  function handlePlayNow() {
    if (genPublicId) {
      clearGeneration();
      navigate(`/play/${genPublicId}`);
    }
  }

  function handleRetry() {
    clearGeneration();
  }

  const isGenerating = genStatus === 'story' || genStatus === 'images';

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
        onClick={isGenerating ? undefined : onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-[520px] rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.04)] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── 배경 레이어 ── */}
          <div className="absolute inset-0 bg-[#06080d] pointer-events-none overflow-hidden">
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 320, height: 320,
                top: -80, left: -80,
                background: 'radial-gradient(circle, rgba(255,77,109,0.45), transparent 65%)',
                filter: 'blur(55px)',
              }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 260, height: 260,
                bottom: -60, right: -40,
                background: 'radial-gradient(circle, rgba(20,184,166,0.3), transparent 65%)',
                filter: 'blur(55px)',
              }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 180, height: 180,
                top: '40%', left: '55%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 65%)',
                filter: 'blur(55px)',
              }}
            />
          </div>

          {/* ── 닫기 버튼 (생성 중에는 숨김) ── */}
          {!isGenerating && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full border border-white/10 bg-white/[0.06] text-white/40 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-all flex items-center justify-center text-sm"
            >
              ✕
            </button>
          )}

          {/* ── 콘텐츠 ── */}
          <div className="relative z-[1] px-8 pt-8 pb-7">

            {/* 헤더 */}
            <div className="mb-6">
              <p className="text-[10px] tracking-[0.28em] uppercase font-bold mb-2.5" style={{ color: 'rgba(255,77,109,0.75)' }}>
                AI Murder Mystery Generator
              </p>
              <h2
                className="leading-[0.92] text-white"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(38px, 7vw, 48px)', letterSpacing: '0.04em' }}
              >
                사건을<br /><span className="text-[#ff4d6d]">설계</span>하라
              </h2>
              {genStatus === 'idle' && (
                <p className="mt-2 text-xs text-white/30 leading-relaxed">
                  설정을 입력하면 AI가 매번 새로운 사건을 만들어드립니다.
                </p>
              )}
            </div>

            {/* 구분선 */}
            <div className="h-px bg-white/[0.06] -mx-8 mb-6" />

            {/* ── 상태별 화면 분기 ── */}
            {genStatus === 'idle' && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FloatField label="장소 / 배경">
                  <input
                    className="cin-input"
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder="예: 외딴 산장, 호화 유람선, 대학 캠퍼스..."
                  />
                </FloatField>

                <FloatField label="피해자 설정">
                  <input
                    className="cin-input"
                    value={victimProfile}
                    onChange={(e) => setVictimProfile(e.target.value)}
                    placeholder="예: 유명 미술품 수집가, 은퇴한 교수..."
                  />
                </FloatField>

                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase font-bold text-white/28 mb-2.5">용의자 수</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSuspectCount(n)}
                        className={`py-2.5 rounded-xl border font-bold text-sm transition-all ${
                          suspectCount === n
                            ? 'bg-[rgba(255,77,109,0.15)] border-[rgba(255,77,109,0.6)] text-white shadow-[0_0_10px_rgba(255,77,109,0.2)]'
                            : 'bg-white/[0.04] border-white/[0.09] text-white/40 hover:bg-[rgba(255,77,109,0.08)] hover:border-[rgba(255,77,109,0.3)] hover:text-white/80'
                        }`}
                      >
                        {n}명
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase font-bold text-white/28 mb-2.5">수사 시간</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatField label="시작">
                      <select
                        className="cin-input"
                        value={gameStartHour}
                        onChange={(e) => setGameStartHour(Number(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i} className="bg-[#06080d]">{formatHour(i)}</option>
                        ))}
                      </select>
                    </FloatField>
                    <FloatField label="종료">
                      <select
                        className="cin-input"
                        value={gameEndHour}
                        onChange={(e) => setGameEndHour(Number(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1)
                          .filter((h) => h > gameStartHour)
                          .map((h) => (
                            <option key={h} value={h} className="bg-[#06080d]">{formatHour(h)}</option>
                          ))}
                      </select>
                    </FloatField>
                  </div>
                  <p className="text-[11px] text-white/[0.22] mt-2 pl-0.5">
                    행동 1회당 15분 소모 · 최대 {Math.floor(((gameEndHour - gameStartHour) * 60) / 15)}회 행동 가능
                  </p>
                </div>

                <button
                  type="submit"
                  className="relative w-full py-4 rounded-2xl border-none font-black text-white text-[15px] tracking-wide cursor-pointer overflow-hidden transition-all"
                  style={{ background: '#ff4d6d', boxShadow: '0 0 28px rgba(255,77,109,0.45)' }}
                >
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}
                  />
                  사건 생성하기
                </button>
              </form>
            )}

            {(genStatus === 'story' || genStatus === 'images') && (
              <div className="flex flex-col items-center py-8 gap-5">
                <div className="w-12 h-12 border-4 border-white/20 border-t-[#ff4d6d] rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-white font-semibold text-base">
                    {genStatus === 'story' ? '스토리를 생성하고 있습니다...' : '캐릭터 이미지를 생성하고 있습니다...'}
                  </p>
                  <p className="text-white/40 text-xs mt-1.5">모달을 닫아도 백그라운드에서 계속 생성됩니다</p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  백그라운드에서 계속하기
                </button>
              </div>
            )}

            {genStatus === 'complete' && (
              <div className="flex flex-col items-center py-8 gap-5">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">사건이 준비되었습니다!</p>
                  <p className="text-white/40 text-xs mt-1.5">지금 바로 수사를 시작하세요</p>
                </div>
                <button
                  onClick={handlePlayNow}
                  className="w-full py-3.5 rounded-2xl font-black text-white text-[15px] tracking-wide"
                  style={{ background: '#ff4d6d', boxShadow: '0 0 28px rgba(255,77,109,0.45)' }}
                >
                  플레이 시작
                </button>
              </div>
            )}

            {genStatus === 'error' && (
              <div className="flex flex-col items-center py-8 gap-5">
                <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-2xl">
                  ✕
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-base">생성에 실패했습니다</p>
                  <p className="text-white/50 text-xs mt-1.5">{genErrorMessage ?? '알 수 없는 오류가 발생했습니다.'}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="w-full py-3.5 rounded-2xl font-black text-white text-[15px] tracking-wide"
                  style={{ background: 'rgba(255,77,109,0.7)' }}
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        .cin-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 13px;
          padding: 14px 16px;
          color: #fff;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .cin-input:focus {
          border-color: rgba(255,77,109,0.45);
          background: rgba(255,77,109,0.04);
          box-shadow: 0 0 0 3px rgba(255,77,109,0.08);
        }
        .cin-input::placeholder { color: rgba(255,255,255,0.18); }
        .cin-input option { background: #0c0f14; }
      `}</style>
    </>
  );
}

// ── Floating Label 래퍼 ───────────────────────────────────
function FloatField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span
        className="absolute z-10 font-semibold"
        style={{
          top: -7, left: 14,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.32)',
          background: '#06080d',
          padding: '0 5px',
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

// ── 공통 컴포넌트 ─────────────────────────────────────────
function ScrollSectionPlain({
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
  const containerClassName =
    layout === 'grid'
      ? 'grid grid-cols-2 md:grid-cols-4 gap-4'
      : 'scroll-row';

  return (
    <section className="mb-10">
      <div className="section-header">
        <h2 className="section-title">
          {title} {accent && <span className="text-accent-pink">{accent}</span>}
        </h2>
        {to ? (
          <Link to={to} className="section-link">{linkText}</Link>
        ) : (
          <span className="section-link text-gray-600 cursor-default">{linkText}</span>
        )}
      </div>
      <div className={containerClassName}>
        {children}
      </div>
    </section>
  );
}

function DirectMakeCard() {
  return (
    <Link to="/create" className="block group flex-shrink-0">
      <div className="w-[220px] md:w-[260px]">
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden border-2 border-dashed border-zinc-600 group-hover:border-accent-pink bg-zinc-900 mb-2 transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="text-3xl text-zinc-500 group-hover:text-accent-pink transition-colors leading-none">＋</span>
            <span className="text-xs text-zinc-500 group-hover:text-accent-pink transition-colors font-medium">새 사건 만들기</span>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-zinc-400 group-hover:text-accent-pink transition-colors">직접 만들기</h3>
        <p className="text-xs text-gray-600 mt-0.5">나만의 사건을 설계하고 게시하세요</p>
      </div>
    </Link>
  );
}

function AiMakeCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="block group flex-shrink-0 text-left">
      <div className="w-[220px] md:w-[260px]">
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden border-2 border-dashed border-zinc-600 group-hover:border-teal-500 bg-zinc-900 mb-2 transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="text-3xl text-zinc-500 group-hover:text-accent-pink transition-colors leading-none">＋</span>
            <span className="text-xs text-zinc-500 group-hover:text-teal-400 transition-colors font-medium">AI 사건 만들기</span>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-zinc-400 group-hover:text-accent-pink transition-colors">AI 직접 만들기</h3>
        <p className="text-xs text-gray-600 mt-0.5">AI가 설정을 바탕으로 새로운 사건을 생성합니다</p>
      </div>
    </button>
  );
}

function CommunityCaseCard({ c, onClick }: { c: UserCaseDraftResponse; onClick: (id: number) => void }) {
  const colors = [
    'from-violet-900 to-fuchsia-800',
    'from-sky-900 to-blue-800',
    'from-amber-900 to-orange-800',
    'from-lime-900 to-green-800',
  ];
  const colorIdx = c.id % colors.length;
  const hasCrop =
    c.thumbnailUrl != null &&
    c.thumbnailCropX != null &&
    c.thumbnailCropY != null &&
    c.thumbnailCropWidth != null;

  return (
    <div className="block group cursor-pointer" onClick={() => onClick(c.id)}>
      <div className="w-full">
        <div className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${colors[colorIdx]} mb-2`}>
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
              <img src={c.thumbnailUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-60">🔎</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        </div>
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">{c.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.summary}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
          <span>▶ {c.playCount ?? 0}</span>
          <span>♥ {c.recommendCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [cases, setCases] = useState<CaseTemplateSummary[]>([]);
  const [communityCases, setCommunityCases] = useState<UserCaseDraftResponse[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);

  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'basic' | 'user'>('basic');

  useEffect(() => {
    Promise.all([
      listCasesPaged({ sort: 'recommended', page: 0, size: 8 }).catch(() => ({
        content: [] as CaseTemplateSummary[],
      })),
      listPublishedUserCasesPaged({ sort: 'recommended', page: 0, size: 8 }).catch(() => ({
        content: [] as UserCaseDraftResponse[],
      })),
    ]).then(([basicPage, customPage]) => {
      setCases(basicPage.content);
      setCommunityCases(customPage.content);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx((prev) => (prev + 1) % BANNERS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  function openBasicCase(id: number) {
    setSelectedSource('basic');
    setSelectedCaseId(id);
  }

  function openUserCase(id: number) {
    setSelectedSource('user');
    setSelectedCaseId(id);
  }

  function handleAiModeClick() {
    setShowAiModal(true);
  }

  const banner = BANNERS[bannerIdx];

  return (
    <div className="space-y-8">
      {/* 배너 */}
        <section className="relative rounded-2xl overflow-hidden">
          <div
            className={[
              `bg-gradient-to-br ${banner.gradient}`,
              "px-8 md:px-16 py-16 md:py-24 transition-all duration-700",
              "relative overflow-hidden",
              "after:content-[''] after:absolute after:inset-0 after:pointer-events-none",
              "after:bg-gradient-to-tr after:from-white/25 after:via-white/10 after:to-transparent",
              "after:translate-x-[-35%] after:skew-x-[-18deg]",
            ].join(" ")}
          >
            <p className="text-white/80 text-sm mb-2">AI Murder Mystery</p>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{banner.title}</h1>
            <p className="mt-3 text-lg text-white/90">{banner.subtitle}</p>
          </div>

          <div className="absolute bottom-4 right-6 flex gap-2">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={[
                  "h-2 rounded-full transition-all duration-300",
                  i === bannerIdx ? "w-6 bg-white shadow-sm" : "w-2 bg-white/40 hover:bg-white/60",
                ].join(" ")}
                aria-label={`배너 ${i + 1}`}
              />
            ))}
          </div>
        </section>

      {/* 직접 만들기 */}
      <ScrollSectionPlain title="직접" accent="만들기">
        <DirectMakeCard />
        <AiMakeCard onClick={handleAiModeClick} />
      </ScrollSectionPlain>

      {/* 기본 사건 */}
      {cases.length > 0 && (
        <ScrollSectionPlain title="기본 사건" accent="추천" to="/cases?tab=basic" layout="grid">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} onClick={openBasicCase} />
          ))}
        </ScrollSectionPlain>
      )}

      {/* 커스텀 사건 */}
      <ScrollSectionPlain title="커스텀" accent="사건" to="/cases?tab=custom" layout="grid">
        {communityCases.map((c) => (
          <CommunityCaseCard key={c.id} c={c} onClick={openUserCase} />
        ))}
      </ScrollSectionPlain>

      {/* 사건 상세 패널 */}
      <CaseDetailPanel
        caseId={selectedCaseId}
        source={selectedSource}
        onClose={() => setSelectedCaseId(null)}
      />

      {/* AI 모드 모달 */}
      {showAiModal && <AiModeModal onClose={() => setShowAiModal(false)} />}
    </div>
  );
}

