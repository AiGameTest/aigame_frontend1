import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listCases, listPublishedUserCases } from '../api/client';
import type { CaseTemplateSummary } from '../api/types';
import type { UserCaseDraftResponse } from '../api/types';
import { CaseCard } from '../components/CaseCard';

/* ─── Hero Banner Slides ─── */
const BANNERS = [
  {
    title: 'AI 심문 추리 게임',
    subtitle: '용의자를 심문하고, 진범을 찾아내세요.',
    gradient: 'from-purple-900 via-pink-900 to-red-900',
  },
  {
    title: 'BASIC 모드',
    subtitle: '준비된 시나리오로 바로 플레이하세요.',
    gradient: 'from-blue-900 via-indigo-900 to-purple-900',
  },
  {
    title: 'AI 모드',
    subtitle: 'AI가 생성한 사건을 풀어보세요.',
    gradient: 'from-emerald-900 via-teal-900 to-cyan-900',
  },
];

/* ─── Scroll Arrow Button ─── */
function ScrollArrow({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center
                 bg-black/60 hover:bg-black/80 rounded-full text-white text-sm transition-colors"
      style={{ [direction]: -4 }}
    >
      {direction === 'left' ? '<' : '>'}
    </button>
  );
}

/* ─── Horizontal Scroll Section ─── */
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
          {title}{' '}
          {accent && <span className="text-accent-pink">{accent}</span>}
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

/* ─── Mode Card ─── */
function ModeCard({
  icon,
  name,
  desc,
  to,
}: {
  icon: string;
  name: string;
  desc: string;
  to?: string;
}) {
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

/* ─── Community Case Card ─── */
function CommunityCaseCard({ c }: { c: UserCaseDraftResponse }) {
  const colors = [
    'from-violet-900 to-fuchsia-800',
    'from-sky-900 to-blue-800',
    'from-amber-900 to-orange-800',
    'from-lime-900 to-green-800',
  ];
  const colorIdx = c.id % colors.length;

  return (
    <Link to={`/case/${c.id}`} className="block group">
      <div className="w-[220px] md:w-[260px]">
        <div
          className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${colors[colorIdx]} mb-2`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-50">📝</span>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        </div>
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">
          {c.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {c.summary}
        </p>
      </div>
    </Link>
  );
}

/* ─── Main Page ─── */
export function HomePage() {
  const [cases, setCases] = useState<CaseTemplateSummary[]>([]);
  const [communityCases, setCommunityCases] = useState<UserCaseDraftResponse[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    void listCases().then(setCases).catch(() => setCases([]));
    void listPublishedUserCases().then(setCommunityCases).catch(() => setCommunityCases([]));
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <section className="relative rounded-2xl overflow-hidden">
        <div
          className={`bg-gradient-to-r ${banner.gradient} px-8 md:px-16 py-16 md:py-24 transition-all duration-700`}
        >
          <p className="text-gray-300 text-sm mb-2">AI Murder Mystery</p>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {banner.title}
          </h1>
          <p className="mt-3 text-lg text-gray-200">{banner.subtitle}</p>
        </div>

        {/* Banner dots */}
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === bannerIdx ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Banner arrows */}
        <button
          onClick={() =>
            setBannerIdx((prev) => (prev - 1 + BANNERS.length) % BANNERS.length)
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-lg transition-colors"
        >
          ‹
        </button>
        <button
          onClick={() =>
            setBannerIdx((prev) => (prev + 1) % BANNERS.length)
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-lg transition-colors"
        >
          ›
        </button>
      </section>

      {/* ── Case Templates (Main content) ── */}
      {cases.length > 0 && (
        <ScrollSection title="인기 사건" accent="추천">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </ScrollSection>
      )}

      {/* ── Game Modes ── */}
      <section className="mb-10">
        <div className="section-header">
          <h2 className="section-title">
            추천 <span className="text-accent-pink">게임 모드</span>
          </h2>
          <span className="section-link">더보기</span>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2">
          <ModeCard icon="📋" name="BASIC" desc="준비된 시나리오" />
          <ModeCard icon="🤖" name="AI" desc="AI 생성 사건" to="/ai" />
          <ModeCard icon="👥" name="USER" desc="커뮤니티 사건" />
          <ModeCard icon="🏆" name="랭킹" desc="TOP 100" />
        </div>
      </section>

      {/* ── New Cases ── */}
      {cases.length > 0 && (
        <ScrollSection title="따끈따끈" accent="신작">
          {[...cases].reverse().map((c) => (
            <CaseCard key={`new-${c.id}`} c={c} />
          ))}
        </ScrollSection>
      )}

      {/* ── Community Cases ── */}
      {communityCases.length > 0 && (
        <ScrollSection title="커뮤니티" accent="사건">
          {communityCases.map((c) => (
            <CommunityCaseCard key={c.id} c={c} />
          ))}
        </ScrollSection>
      )}
    </div>
  );
}
