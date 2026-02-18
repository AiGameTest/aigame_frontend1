import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCases, listPublishedUserCases } from '../api/client';
import type { CaseTemplateSummary, UserCaseDraftResponse } from '../api/types';
import { CaseCard } from '../components/CaseCard';
import { CaseDetailPanel } from '../components/CaseDetailPanel';
import { useSessionStore } from '../store/sessionStore';

const BANNERS = [
  {
    title: 'AI 추리 게임',
    subtitle: '용의자를 심문하고 진실을 찾아보세요.',
    gradient: 'from-slate-900 via-zinc-900 to-gray-900',
  },
  {
    title: 'BASIC 모드',
    subtitle: '준비된 사건으로 바로 플레이할 수 있습니다.',
    gradient: 'from-slate-900 via-blue-900/60 to-zinc-900',
  },
  {
    title: 'AI 모드',
    subtitle: 'AI가 매번 새로운 사건을 생성합니다.',
    gradient: 'from-zinc-900 via-teal-900/60 to-slate-900',
  },
];

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}

// ── AI 모드 모달 ──────────────────────────────────────────
function AiModeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const start = useSessionStore((s) => s.start);

  const [setting, setSetting] = useState('');
  const [victimProfile, setVictimProfile] = useState('');
  const [suspectCount, setSuspectCount] = useState(4);
  const [gameStartHour, setGameStartHour] = useState(12);
  const [gameEndHour, setGameEndHour] = useState(18);
  const [loading, setLoading] = useState(false);

  const totalHours = gameEndHour - gameStartHour;

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
    if (loading) return;
    setLoading(true);
    try {
      const session = await start({
        mode: 'AI',
        aiPrompt: {
          setting: setting || undefined,
          victimProfile: victimProfile || undefined,
          suspectCount,
        },
        gameStartHour,
        gameEndHour,
      });
      navigate(`/play/${session.publicId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10">

          {/* 헤더 — 그라디언트 배경 */}
          <div className="relative bg-gradient-to-br from-[#0d1f2d] via-[#0a1628] to-[#110d1f] px-6 pt-8 pb-6 overflow-hidden">
            {/* 배경 장식 원 */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

            {/* 닫기 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🤖</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-teal-400 font-semibold">AI Murder Mystery</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">
                AI 사건 생성
              </h2>
              <p className="text-sm text-gray-400 mt-1.5">
                원하는 설정을 입력하면 AI가 독창적인 사건을 만들어줍니다.
              </p>
            </div>
          </div>

          {/* 폼 영역 */}
          <div className="bg-[#0c0e14] px-6 py-5 max-h-[60vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* 장소 / 배경 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span className="text-teal-400">01</span> 장소 / 배경
                </label>
                <input
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-600"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  placeholder="예: 외딴 산장, 호화 유람선, 대학 캠퍼스..."
                />
              </div>

              {/* 피해자 설정 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span className="text-teal-400">02</span> 피해자 설정
                </label>
                <input
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/20 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-600"
                  value={victimProfile}
                  onChange={(e) => setVictimProfile(e.target.value)}
                  placeholder="예: 유명 미술품 수집가, 은퇴한 교수..."
                />
              </div>

              {/* 용의자 수 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span className="text-teal-400">03</span> 용의자 수
                </label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSuspectCount(n)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        suspectCount === n
                          ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
                      }`}
                    >
                      {n}명
                    </button>
                  ))}
                </div>
              </div>

              {/* 수사 시간 설정 */}
              <div className="space-y-2 rounded-xl bg-white/[0.03] border border-white/8 p-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span className="text-teal-400">04</span> 수사 시간 설정
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">시작 시각</p>
                    <select
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/60 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                      value={gameStartHour}
                      onChange={(e) => setGameStartHour(Number(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} className="bg-[#0c0e14]">{formatHour(i)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">종료 시각</p>
                    <select
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-teal-500/60 text-white rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                      value={gameEndHour}
                      onChange={(e) => setGameEndHour(Number(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).filter(h => h > gameStartHour).map(h => (
                        <option key={h} value={h} className="bg-[#0c0e14]">{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  총 {totalHours}시간 ({totalHours * 60}분) · 행동당 15분 소모 · 최대 {Math.floor(totalHours * 60 / 15)}회 행동 가능
                </p>
              </div>

              {/* 생성 버튼 */}
              <button
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all
                  ${loading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:opacity-90 shadow-[0_0_24px_rgba(20,184,166,0.35)] hover:shadow-[0_0_32px_rgba(20,184,166,0.5)]'
                  }`}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-300 rounded-full animate-spin" />
                    AI가 사건을 생성하는 중...
                  </span>
                ) : (
                  '🔮 AI 사건 생성하기'
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 공통 컴포넌트 ─────────────────────────────────────────
function ScrollSectionPlain({
  title,
  accent,
  linkText = '더보기',
  to,
  children,
}: {
  title: string;
  accent?: string;
  linkText?: string;
  to?: string;
  children: React.ReactNode;
}) {
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
      <div className="scroll-row">
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

  return (
    <div className="block group cursor-pointer" onClick={() => onClick(c.id)}>
      <div className="w-[220px] md:w-[260px]">
        <div className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${colors[colorIdx]} mb-2`}>
          {c.thumbnailUrl ? (
            <img src={c.thumbnailUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
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
  const [cases, setCases] = useState<CaseTemplateSummary[]>([]);
  const [communityCases, setCommunityCases] = useState<UserCaseDraftResponse[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);

  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'basic' | 'user'>('basic');

  useEffect(() => {
    void listCases().then(setCases).catch(() => setCases([]));
    void listPublishedUserCases().then(setCommunityCases).catch(() => setCommunityCases([]));
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

  const banner = BANNERS[bannerIdx];

  return (
    <div className="space-y-8">
      {/* 배너 */}
      <section className="relative rounded-2xl overflow-hidden">
        <div className={`bg-gradient-to-r ${banner.gradient} px-8 md:px-16 py-16 md:py-24 transition-all duration-700`}>
          <p className="text-gray-300 text-sm mb-2">AI Murder Mystery</p>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{banner.title}</h1>
          <p className="mt-3 text-lg text-gray-200">{banner.subtitle}</p>
        </div>
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === bannerIdx ? 'bg-white' : 'bg-white/40'}`}
              aria-label={`배너 ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 직접 만들기 */}
      <ScrollSectionPlain title="직접" accent="만들기">
        <DirectMakeCard />
        <AiMakeCard onClick={() => setShowAiModal(true)} />
      </ScrollSectionPlain>

      {/* 기본 사건 */}
      {cases.length > 0 && (
        <ScrollSectionPlain title="기본 사건" accent="추천" to="/cases?tab=basic">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} onClick={openBasicCase} />
          ))}
        </ScrollSectionPlain>
      )}

      {/* 커스텀 사건 */}
      <ScrollSectionPlain title="커스텀" accent="사건" to="/cases?tab=custom">
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
