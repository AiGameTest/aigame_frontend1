interface SuspectInfo {
  name: string;
}

interface LocationSelectModalProps {
  open: boolean;
  locations: string[];
  currentLocation: string | null;
  suspectsByLocation?: Map<string, SuspectInfo[]>;
  onSelect: (location: string) => void;
  onClose: () => void;
}

export function LocationSelectModal({ open, locations, currentLocation, suspectsByLocation, onSelect, onClose }: LocationSelectModalProps) {
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
          <span className="font-detail text-[10px] tracking-[0.25em] uppercase text-gold-dim">MOVEMENT</span>
          <h3 className="font-headline text-lg text-sepia mt-1">이동할 장소 선택</h3>
          <p className="font-body italic text-xs text-faded mt-1">이동 시 게임 시간 15분이 경과합니다.</p>
        </div>

        <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {locations.map((loc) => {
            const isCurrent = loc === currentLocation;
            const suspects = suspectsByLocation?.get(loc) ?? [];

            return (
              <button
                key={loc}
                onClick={() => {
                  if (!isCurrent) onSelect(loc);
                }}
                disabled={isCurrent}
                className={`w-full text-left px-4 py-3 border transition-all ${
                  isCurrent
                    ? 'border-gold-dim/50 bg-gold/8 cursor-default'
                    : 'border-ghost bg-paper hover:border-gold-dim hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-headline text-base ${isCurrent ? 'text-amber' : 'text-sepia'}`}>
                    {loc}
                  </span>
                  {isCurrent && (
                    <span className="font-detail text-[9px] tracking-[0.2em] uppercase text-gold-dim border border-gold-dim/40 px-2 py-0.5">
                      현재 위치
                    </span>
                  )}
                </div>
                <div className="mt-1 font-detail text-xs text-faded">
                  {suspects.length > 0
                    ? `용의자: ${suspects.map((s) => s.name).join(', ')}`
                    : '용의자 없음'}
                </div>
              </button>
            );
          })}

          {locations.length === 0 && (
            <div className="font-body italic text-faded text-center py-6">이동 가능한 장소가 없습니다.</div>
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
