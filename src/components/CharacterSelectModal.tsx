interface SuspectInfo {
  name: string;
  age?: number;
  personality?: string;
  imageUrl?: string;
}

interface CharacterSelectModalProps {
  open: boolean;
  suspects: SuspectInfo[];
  onSelect: (name: string) => void;
  onClose: () => void;
}

export function CharacterSelectModal({ open, suspects, onSelect, onClose }: CharacterSelectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-md border border-ghost bg-shadow"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(61,52,40,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 금선 */}
        <div className="h-[1px] w-full bg-gold-dim" />

        <div className="px-5 py-4 border-b border-ghost">
          <span className="font-detail text-[10px] tracking-[0.25em] uppercase text-gold-dim">INTERROGATION</span>
          <h3 className="font-headline text-lg text-sepia mt-1">대화할 용의자 선택</h3>
          <p className="font-body italic text-xs text-faded mt-1">이 장소에 있는 용의자를 선택하세요.</p>
        </div>

        <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {suspects.length === 0 ? (
            <p className="font-body italic text-faded text-center py-6">이 장소에 용의자가 없습니다.</p>
          ) : (
            suspects.map((s) => (
              <button
                key={s.name}
                onClick={() => onSelect(s.name)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-ghost bg-paper hover:border-gold-dim hover:-translate-y-0.5 transition-all group"
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="w-12 h-14 object-cover border border-ghost flex-shrink-0"
                    style={{ filter: 'sepia(0.4) brightness(0.85)' }}
                  />
                ) : (
                  <div className="w-12 h-14 bg-shadow border border-ghost flex-shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 48 64" className="w-8 h-10" fill="none">
                      <circle cx="24" cy="18" r="9" fill="#3d3428" />
                      <path d="M8 56 C8 38 16 30 24 30 C32 30 40 38 40 56" fill="#3d3428" />
                    </svg>
                  </div>
                )}
                <div className="text-left">
                  <div className="font-headline text-base text-amber group-hover:text-gold transition-colors">{s.name}</div>
                  <div className="font-detail text-xs text-faded mt-0.5">
                    {s.age && `${s.age}세`}
                    {s.personality && ` · ${s.personality}`}
                  </div>
                </div>
                <span className="ml-auto font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-gold-dim transition-colors">
                  심문 →
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-ghost">
          <button className="btn-ghost w-full py-2.5 text-xs" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
