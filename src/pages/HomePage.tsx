import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCases, listPublishedUserCases } from '../api/client';
import type { CaseTemplateSummary, UserCaseDraftResponse } from '../api/types';
import { CaseCard } from '../components/CaseCard';
import { CaseDetailPanel } from '../components/CaseDetailPanel';

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

function ScrollArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full text-white text-sm transition-colors"
      style={{ [direction]: -4 }}
      aria-label={direction === 'left' ? '왼쪽으로 스크롤' : '오른쪽으로 스크롤'}
    >
      {direction === 'left' ? '<' : '>'}
    </button>
  );
}

function ScrollSection({
  title,
  accent,
  linkText = '더보기',
  children,
}: {
  title: string;
  accent?: string;
  linkText?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-10">
      <div className="section-header">
        <h2 className="section-title">
          {title} {accent && <span className="text-accent-pink">{accent}</span>}
        </h2>
        <span className="section-link">{linkText}</span>
      </div>
      <div className="relative">
        <ScrollArrow direction="left" onClick={() => scroll('left')} />
        <div ref={scrollRef} className="scroll-row">
          {children}
        </div>
        <ScrollArrow direction="right" onClick={() => scroll('right')} />
      </div>
    </section>
  );
}

function CreateCaseCard() {
  return (
    <Link to="/create" className="block group flex-shrink-0">
      <div className="w-[220px] md:w-[260px]">
        {/* 썸네일 — CaseCard와 동일 비율 */}
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden border-2 border-dashed border-zinc-600 group-hover:border-accent-pink bg-zinc-900 mb-2 transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="text-3xl text-zinc-500 group-hover:text-accent-pink transition-colors leading-none">
              ＋
            </span>
            <span className="text-xs text-zinc-500 group-hover:text-accent-pink transition-colors font-medium">
              새 사건 만들기
            </span>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-zinc-400 group-hover:text-accent-pink transition-colors">
          직접 만들기
        </h3>
        <p className="text-xs text-gray-600 mt-0.5">나만의 사건을 설계하고 게시하세요</p>
      </div>
    </Link>
  );
}

function ModeCard({ icon, name, to }: { icon: string; name: string; to?: string }) {
  const inner = (
    <div className="flex flex-col items-center gap-2 w-[100px] group cursor-pointer">
      <div className="w-16 h-16 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center text-2xl group-hover:border-accent-pink transition-colors">
        {icon}
      </div>
      <span className="text-xs text-gray-300 group-hover:text-accent-pink transition-colors text-center">
        {name}
      </span>
    </div>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}

function CommunityCaseCard({
  c,
  onClick,
}: {
  c: UserCaseDraftResponse;
  onClick: (id: number) => void;
}) {
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
        <div
          className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${colors[colorIdx]} mb-2`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-50">사건</span>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        </div>
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">
          {c.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.summary}</p>
      </div>
    </div>
  );
}

export function HomePage() {
  const [cases, setCases] = useState<CaseTemplateSummary[]>([]);
  const [communityCases, setCommunityCases] = useState<UserCaseDraftResponse[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  // 패널 상태
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
        <div
          className={`bg-gradient-to-r ${banner.gradient} px-8 md:px-16 py-16 md:py-24 transition-all duration-700`}
        >
          <p className="text-gray-300 text-sm mb-2">AI Murder Mystery</p>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{banner.title}</h1>
          <p className="mt-3 text-lg text-gray-200">{banner.subtitle}</p>
        </div>
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === bannerIdx ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`배너 ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 기본 사건 — CreateCaseCard 맨 앞 */}
      {cases.length > 0 && (
        <ScrollSection title="기본 사건" accent="추천">
          <CreateCaseCard />
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} onClick={openBasicCase} />
          ))}
        </ScrollSection>
      )}

      {/* 게임 모드 */}
      <section className="mb-10">
        <div className="section-header">
          <h2 className="section-title">
            추천 <span className="text-accent-pink">게임 모드</span>
          </h2>
          <span className="section-link">더보기</span>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2">
          <ModeCard icon="B" name="BASIC" />
          <ModeCard icon="A" name="AI" to="/ai" />
          <ModeCard icon="U" name="USER" />
        </div>
      </section>

      {/* 커뮤니티 사건 */}
      {communityCases.length > 0 && (
        <ScrollSection title="커뮤니티" accent="사건">
          {communityCases.map((c) => (
            <CommunityCaseCard key={c.id} c={c} onClick={openUserCase} />
          ))}
        </ScrollSection>
      )}

      {/* 사건 상세 패널 */}
      <CaseDetailPanel
        caseId={selectedCaseId}
        source={selectedSource}
        onClose={() => setSelectedCaseId(null)}
      />
    </div>
  );
}