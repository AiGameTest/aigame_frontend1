import { Link } from 'react-router-dom';
import type { CaseTemplateSummary } from '../api/types';

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

export function CaseCard({ c }: { c: CaseTemplateSummary }) {
  const colorIdx = c.id % THUMBNAIL_COLORS.length;

  return (
    <Link to={`/case/${c.id}`} className="block group">
      <div className="w-[220px] md:w-[260px]">
        {/* Thumbnail */}
        <div
          className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${THUMBNAIL_COLORS[colorIdx]} mb-2`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-60">🔎</span>
          </div>
          {/* Difficulty badge */}
          <div className="absolute top-2 left-2">
            <span className={`badge ${DIFFICULTY_BADGE[c.difficulty?.toUpperCase()] ?? 'badge-medium'}`}>
              {c.difficulty}
            </span>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold">
              사건 보기
            </span>
          </div>
        </div>
        {/* Info */}
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-pink transition-colors">
          {c.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {c.description}
        </p>
      </div>
    </Link>
  );
}
