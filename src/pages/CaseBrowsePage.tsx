import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listCases, listPublishedUserCases } from '../api/client';
import type { CaseTemplateSummary, UserCaseDraftResponse } from '../api/types';
import { CaseDetailPanel } from '../components/CaseDetailPanel';

type Tab = 'basic' | 'custom';
type SortOrder = 'popular' | 'recent';

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'badge-easy',
  MEDIUM: 'badge-medium',
  HARD: 'badge-hard',
};

const BASIC_COLORS = [
  'from-purple-900 to-pink-800',
  'from-blue-900 to-cyan-800',
  'from-red-900 to-orange-800',
  'from-emerald-900 to-teal-800',
  'from-indigo-900 to-violet-800',
  'from-rose-900 to-red-800',
];

const CUSTOM_COLORS = [
  'from-violet-900 to-fuchsia-800',
  'from-sky-900 to-blue-800',
  'from-amber-900 to-orange-800',
  'from-lime-900 to-green-800',
];

function BasicCaseGridCard({ c, onClick }: { c: CaseTemplateSummary; onClick: (id: number) => void }) {
  const colorIdx = c.id % BASIC_COLORS.length;
  return (
    <div className="group cursor-pointer" onClick={() => onClick(c.id)}>
      <div className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${BASIC_COLORS[colorIdx]} mb-2`}>
        {c.thumbnailUrl ? (
          <img src={c.thumbnailUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-60">🔎</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`badge ${DIFFICULTY_BADGE[c.difficulty?.toUpperCase()] ?? 'badge-medium'}`}>
            {c.difficulty}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold">
            사건 보기
          </span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">
        {c.title}
      </h3>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
        <span>▶ {c.playCount ?? 0}</span>
        <span>♥ {c.recommendCount ?? 0}</span>
      </div>
    </div>
  );
}

function CustomCaseGridCard({ c, onClick }: { c: UserCaseDraftResponse; onClick: (id: number) => void }) {
  const colorIdx = c.id % CUSTOM_COLORS.length;
  return (
    <div className="group cursor-pointer" onClick={() => onClick(c.id)}>
      <div className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${CUSTOM_COLORS[colorIdx]} mb-2`}>
        {c.thumbnailUrl ? (
          <img src={c.thumbnailUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-60">🔎</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      </div>
      <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">
        {c.title}
      </h3>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.summary}</p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
        <span>▶ {c.playCount ?? 0}</span>
        <span>♥ {c.recommendCount ?? 0}</span>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="rounded-lg bg-white/[0.04] aspect-[16/10] animate-pulse" />
          <div className="h-3 bg-white/[0.04] rounded animate-pulse w-3/4" />
          <div className="h-2 bg-white/[0.03] rounded animate-pulse w-full" />
          <div className="h-2 bg-white/[0.03] rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CaseBrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'custom' ? 'custom' : 'basic'
  );
  const [sort, setSort] = useState<SortOrder>('popular');
  const [basicCases, setBasicCases] = useState<CaseTemplateSummary[]>([]);
  const [customCases, setCustomCases] = useState<UserCaseDraftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'basic' | 'user'>('basic');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listCases().catch(() => [] as CaseTemplateSummary[]),
      listPublishedUserCases().catch(() => [] as UserCaseDraftResponse[]),
    ]).then(([basic, custom]) => {
      setBasicCases(basic);
      setCustomCases(custom);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setSearchParams({ tab }, { replace: true });
  }, [tab, setSearchParams]);

  function switchTab(t: Tab) {
    setTab(t);
    setSort('popular');
  }

  const sortedBasic = [...basicCases].sort((a, b) =>
    sort === 'popular' ? b.recommendCount - a.recommendCount : b.id - a.id
  );

  const sortedCustom = [...customCases].sort((a, b) =>
    sort === 'popular'
      ? b.recommendCount - a.recommendCount
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function openBasicCase(id: number) {
    setSelectedSource('basic');
    setSelectedCaseId(id);
  }

  function openUserCase(id: number) {
    setSelectedSource('user');
    setSelectedCaseId(id);
  }

  const count = loading ? null : tab === 'basic' ? sortedBasic.length : sortedCustom.length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">

      {/* 헤더 */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent-pink/70 font-semibold mb-1">Case Library</p>
        <h1 className="text-2xl font-black text-white">사건 목록</h1>
      </div>

      {/* 탭 + 정렬 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* 탭 */}
        <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/8">
          {(['basic', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'basic' ? '🔎 기본 사건' : '✏️ 커스텀 사건'}
            </button>
          ))}
        </div>

        {/* 개수 + 정렬 */}
        <div className="flex items-center gap-3">
          {count !== null && (
            <span className="text-xs text-gray-600">{count.toLocaleString()}개</span>
          )}
          <div className="flex gap-1.5">
            {(['popular', 'recent'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  sort === s
                    ? 'bg-accent-pink/15 border-accent-pink/40 text-accent-pink'
                    : 'bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                {s === 'popular' ? '🔥 인기순' : '🕐 최신순'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 카드 그리드 */}
      {loading ? (
        <SkeletonGrid />
      ) : tab === 'basic' ? (
        sortedBasic.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">기본 사건이 없습니다.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {sortedBasic.map((c) => (
              <BasicCaseGridCard key={c.id} c={c} onClick={openBasicCase} />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
          {/* 새 사건 만들기 카드 */}
          <Link to="/create" className="block group">
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden border-2 border-dashed border-zinc-600 group-hover:border-accent-pink bg-zinc-900 mb-2 transition-colors">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <span className="text-2xl text-zinc-500 group-hover:text-accent-pink transition-colors leading-none">＋</span>
                <span className="text-xs text-zinc-500 group-hover:text-accent-pink transition-colors font-medium">새 사건 만들기</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-zinc-400 group-hover:text-accent-pink transition-colors">직접 만들기</h3>
            <p className="text-xs text-gray-600 mt-0.5">나만의 사건을 설계하고 게시하세요</p>
          </Link>

          {sortedCustom.map((c) => (
            <CustomCaseGridCard key={c.id} c={c} onClick={openUserCase} />
          ))}

          {sortedCustom.length === 0 && (
            <p className="col-span-full text-center py-12 text-gray-600 text-sm">
              아직 게시된 커스텀 사건이 없습니다.
            </p>
          )}
        </div>
      )}

      <CaseDetailPanel
        caseId={selectedCaseId}
        source={selectedSource}
        onClose={() => setSelectedCaseId(null)}
      />
    </div>
  );
}