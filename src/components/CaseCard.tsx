import type { CaseTemplateSummary } from '../api/types';
import { CroppedThumbnail } from './CroppedThumbnail';

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '입문',
  MEDIUM: '일반',
  HARD: '고급',
};
const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'badge-easy',
  MEDIUM: 'badge-medium',
  HARD: 'badge-hard',
};

const THUMBNAIL_GRADIENTS = [
  'from-[#0d0b09] to-[#1a1410]',
  'from-[#090d0b] to-[#101a14]',
  'from-[#0d0909] to-[#1a1010]',
  'from-[#0b0d09] to-[#141a10]',
  'from-[#09090d] to-[#10101a]',
  'from-[#0d090b] to-[#1a1014]',
];

interface CaseCardProps {
  c: CaseTemplateSummary;
  onClick: (id: number) => void;
}

export function CaseCard({ c, onClick }: CaseCardProps) {
  const colorIdx = c.id % THUMBNAIL_GRADIENTS.length;
  const hasCrop =
    c.thumbnailUrl != null &&
    c.thumbnailCropX != null &&
    c.thumbnailCropY != null &&
    c.thumbnailCropWidth != null;
  const diffBadge = c.difficulty ? DIFFICULTY_BADGE[c.difficulty] : null;
  const diffLabel = c.difficulty ? DIFFICULTY_LABEL[c.difficulty] : null;

  return (
    <div className="clue-card group" onClick={() => onClick(c.id)}>
      {/* 썸네일 */}
      <div
        className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${THUMBNAIL_GRADIENTS[colorIdx]} mb-4 -mx-5 -mt-5`}
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
            <img
              src={c.thumbnailUrl}
              alt={c.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'sepia(0.3) brightness(0.8)' }}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-detail text-gold-dim/30 text-5xl tracking-widest">?</span>
          </div>
        )}
        {/* hover overlay */}
        <div className="absolute inset-0 bg-void/0 group-hover:bg-void/25 transition-colors flex items-end justify-end p-2.5">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity font-label text-[9px] tracking-[0.2em] uppercase text-amber">
            수사 열람 →
          </span>
        </div>
      </div>

      {/* 파일 번호 + 난이도 */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="badge-file">FILE #{String(c.id).padStart(3, '0')}</span>
        {diffBadge && diffLabel && (
          <span className={diffBadge}>{diffLabel}</span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="font-headline text-lg text-amber leading-snug truncate group-hover:text-gold transition-colors mb-2">
        {c.title}
      </h3>

      {/* 설명 */}
      <p className="font-body text-sm text-sepia/70 leading-relaxed line-clamp-2 italic mb-3">
        {c.description}
      </p>

      {/* 메타 */}
      <div className="flex items-center gap-3 pt-3 border-t border-ghost/60">
        <span className="font-detail text-xs text-faded tracking-wide">▶ {c.playCount ?? 0}</span>
        <span className="font-detail text-xs text-faded tracking-wide">♥ {c.recommendCount ?? 0}</span>
      </div>
    </div>
  );
}
