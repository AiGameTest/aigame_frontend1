import type { CaseTemplateSummary } from '../api/types';
import { CroppedThumbnail } from './CroppedThumbnail';

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'badge-easy',
  MEDIUM: 'badge-medium',
  HARD: 'badge-hard',
};

const THUMBNAIL_COLORS = [
  'from-purple-900 to-pink-800',
  'from-blue-900 to-cyan-800',
  'from-red-900 to-orange-800',
  'from-emerald-900 to-teal-800',
  'from-indigo-900 to-violet-800',
  'from-rose-900 to-red-800',
];

interface CaseCardProps {
  c: CaseTemplateSummary;
  onClick: (id: number) => void;
}

export function CaseCard({ c, onClick }: CaseCardProps) {
  const colorIdx = c.id % THUMBNAIL_COLORS.length;
  const hasCrop =
    c.thumbnailUrl != null &&
    c.thumbnailCropX != null &&
    c.thumbnailCropY != null &&
    c.thumbnailCropWidth != null;

  return (
    <div className="block group cursor-pointer" onClick={() => onClick(c.id)}>
      <div className="w-[220px] md:w-[260px]">
        {/* 썸네일 */}
        <div
          className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${THUMBNAIL_COLORS[colorIdx]} mb-2`}
        >
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold">
              사건 보기
            </span>
          </div>
        </div>
        {/* 정보 */}
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">
          {c.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
          <span>▶ {c.playCount ?? 0}</span>
          <span>♥ {c.recommendCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
