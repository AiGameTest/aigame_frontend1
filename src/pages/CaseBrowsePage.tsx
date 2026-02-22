import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listCasesPaged, listPublishedUserCasesPaged } from '../api/client';
import type { CaseTemplateSummary, PagedResponse, UserCaseDraftResponse } from '../api/types';
import { CaseDetailPanel } from '../components/CaseDetailPanel';
import { CroppedThumbnail } from '../components/CroppedThumbnail';

type Tab = 'basic' | 'custom';
type SortOrder = 'popular' | 'recent';

function CaseBrowseCard({ title, description, playCount, recommendCount, thumbnailUrl, thumbnailCropX, thumbnailCropY, thumbnailCropWidth, id, onClick }: {
  title: string; description: string; playCount: number; recommendCount: number;
  thumbnailUrl?: string; thumbnailCropX?: number; thumbnailCropY?: number; thumbnailCropWidth?: number;
  id: number; onClick: () => void;
}) {
  const hasCrop = thumbnailUrl != null && thumbnailCropX != null && thumbnailCropY != null && thumbnailCropWidth != null;
  return (
    <div className="clue-card group" onClick={onClick}>
      <div className="relative aspect-[16/10] overflow-hidden bg-shadow mb-4 -mx-5 -mt-5">
        {thumbnailUrl ? (
          hasCrop ? (
            <CroppedThumbnail src={thumbnailUrl} alt={title} cropX={thumbnailCropX!} cropY={thumbnailCropY!} cropWidth={thumbnailCropWidth!} />
          ) : (
            <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'sepia(0.3) brightness(0.8)' }} />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-detail text-ghost/30 text-4xl">?</span>
          </div>
        )}
        <div className="absolute inset-0 bg-void/0 group-hover:bg-void/20 transition-colors flex items-end justify-end p-2.5">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity font-label text-[9px] tracking-[0.2em] uppercase text-amber">열람 →</span>
        </div>
      </div>
      <div className="mb-2">
        <span className="badge-file">FILE #{String(id).padStart(3, '0')}</span>
      </div>
      <h3 className="font-headline text-sm text-amber leading-snug truncate group-hover:text-gold transition-colors mb-1.5">{title}</h3>
      <p className="font-body text-xs text-sepia/70 leading-relaxed line-clamp-2 italic mb-3">{description}</p>
      <div className="flex items-center gap-3 pt-2.5 border-t border-ghost/60">
        <span className="font-detail text-[10px] text-faded">▶ {playCount}</span>
        <span className="font-detail text-[10px] text-faded">♥ {recommendCount}</span>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-shadow border border-ghost p-5">
          <div className="aspect-[16/10] bg-ghost/30 mb-4 -mx-5 -mt-5 animate-pulse" />
          <div className="h-2.5 bg-ghost/30 rounded-none mb-2 w-1/3 animate-pulse" />
          <div className="h-4 bg-ghost/20 mb-2 w-3/4 animate-pulse" />
          <div className="h-3 bg-ghost/15 w-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function CaseBrowsePage() {
  const BASIC_PAGE_SIZE = 12;
  const CUSTOM_PAGE_SIZE = 7;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => searchParams.get('tab') === 'custom' ? 'custom' : 'basic');
  const [sort, setSort] = useState<SortOrder>('popular');
  const [page, setPage] = useState(0);
  const [basicPageData, setBasicPageData] = useState<PagedResponse<CaseTemplateSummary> | null>(null);
  const [customPageData, setCustomPageData] = useState<PagedResponse<UserCaseDraftResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'basic' | 'user'>('basic');

  useEffect(() => { setPage(0); }, [tab, sort]);

  useEffect(() => {
    setLoading(true);
    const sortParam = sort === 'popular' ? 'recommended' : undefined;
    const currentPageSize = tab === 'basic' ? BASIC_PAGE_SIZE : CUSTOM_PAGE_SIZE;
    if (tab === 'basic') {
      void listCasesPaged({ sort: sortParam, page, size: currentPageSize })
        .then((data) => setBasicPageData(data))
        .catch(() => setBasicPageData({ content: [], page: 0, size: currentPageSize, totalElements: 0, totalPages: 0, last: true }))
        .finally(() => setLoading(false));
      return;
    }
    void listPublishedUserCasesPaged({ sort: sortParam, page, size: currentPageSize })
      .then((data) => setCustomPageData(data))
      .catch(() => setCustomPageData({ content: [], page: 0, size: currentPageSize, totalElements: 0, totalPages: 0, last: true }))
      .finally(() => setLoading(false));
  }, [tab, sort, page]);

  useEffect(() => { setSearchParams({ tab }, { replace: true }); }, [tab, setSearchParams]);

  function switchTab(t: Tab) { setTab(t); setSort('popular'); setPage(0); }
  function openBasicCase(id: number) { setSelectedSource('basic'); setSelectedCaseId(id); }
  function openUserCase(id: number) { setSelectedSource('user'); setSelectedCaseId(id); }

  const currentPageData = tab === 'basic' ? basicPageData : customPageData;
  const count = loading ? null : (currentPageData?.totalElements ?? 0);
  const totalPages = currentPageData?.totalPages ?? 0;
  const basicCases = basicPageData?.content ?? [];
  const customCases = customPageData?.content ?? [];

  return (
    <div className="py-8 space-y-8">
      {/* 헤더 */}
      <div>
        <p className="badge-file inline-block mb-3">CASE LIBRARY</p>
        <h1 className="font-headline text-3xl text-sepia tracking-wide">사건 목록</h1>
      </div>

      {/* 탭 + 정렬 */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-ghost pb-0">
        <div className="flex">
          {(['basic', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`px-4 py-3 -mb-px border-b font-label text-[10px] tracking-[0.2em] uppercase transition-all ${
                tab === t
                  ? 'border-gold text-gold'
                  : 'border-transparent text-ghost hover:text-faded'
              }`}
            >
              {t === 'basic' ? '기본 사건' : '커스텀 사건'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pb-3">
          {count !== null && (
            <span className="font-detail text-[10px] text-ghost tracking-widest">{count.toLocaleString()}건</span>
          )}
          <div className="flex gap-1.5">
            {(['popular', 'recent'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSort(s); setPage(0); }}
                className={`px-3 py-1.5 border font-label text-[9px] tracking-[0.15em] uppercase transition-all ${
                  sort === s
                    ? 'border-gold-dim text-gold bg-gold/6'
                    : 'border-ghost text-ghost hover:border-gold-dim/40 hover:text-faded'
                }`}
              >
                {s === 'popular' ? '인기순' : '최신순'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 카드 그리드 */}
      {loading ? (
        <SkeletonGrid />
      ) : tab === 'basic' ? (
        basicCases.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body italic text-faded text-sm">기본 사건이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {basicCases.map((c) => (
              <CaseBrowseCard
                key={c.id} id={c.id} title={c.title} description={c.description}
                playCount={c.playCount ?? 0} recommendCount={c.recommendCount ?? 0}
                thumbnailUrl={c.thumbnailUrl} thumbnailCropX={c.thumbnailCropX}
                thumbnailCropY={c.thumbnailCropY} thumbnailCropWidth={c.thumbnailCropWidth}
                onClick={() => openBasicCase(c.id)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <Link to="/create" className="clue-card group block">
            <div className="relative aspect-[16/10] overflow-hidden border border-dashed border-ghost group-hover:border-gold-dim bg-shadow -mx-5 -mt-5 mb-4 transition-colors flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="font-label text-3xl text-ghost group-hover:text-gold-dim transition-colors">＋</span>
                <span className="font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-faded transition-colors">새 사건 만들기</span>
              </div>
            </div>
            <h3 className="font-headline text-lg text-faded group-hover:text-sepia transition-colors mb-2">직접 만들기</h3>
            <p className="font-body text-sm text-sepia/50 italic leading-relaxed">나만의 사건을 설계하고 게시하세요</p>
          </Link>
          {customCases.map((c) => (
            <CaseBrowseCard
              key={c.id} id={c.id} title={c.title} description={c.summary}
              playCount={c.playCount ?? 0} recommendCount={c.recommendCount ?? 0}
              thumbnailUrl={c.thumbnailUrl} thumbnailCropX={c.thumbnailCropX}
              thumbnailCropY={c.thumbnailCropY} thumbnailCropWidth={c.thumbnailCropWidth}
              onClick={() => openUserCase(c.id)}
            />
          ))}
          {customCases.length === 0 && (
            <p className="col-span-full text-center py-12 font-body italic text-faded text-sm">아직 게시된 커스텀 사건이 없습니다.</p>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="btn-ghost py-2 px-4 text-[0.65rem] disabled:opacity-30"
          >
            ← 이전
          </button>
          <span className="font-detail text-xs text-faded tracking-widest">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="btn-ghost py-2 px-4 text-[0.65rem] disabled:opacity-30"
          >
            다음 →
          </button>
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
