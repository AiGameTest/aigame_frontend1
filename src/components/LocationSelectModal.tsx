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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10131a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="font-bold text-lg text-white">이동할 장소 선택</h3>
          <p className="text-sm text-gray-400 mt-1">
            장소를 이동하면 게임 시간이 15분 경과합니다.
          </p>
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
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                  isCurrent
                    ? 'border-emerald-500/40 bg-emerald-900/20 text-emerald-200 cursor-default'
                    : 'border-white/10 bg-zinc-900/70 text-gray-100 hover:border-gray-400/50 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{loc}</div>
                  {isCurrent && <span className="text-[11px] text-emerald-300">현재 위치</span>}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  {suspects.length > 0 ? `용의자: ${suspects.map((s) => s.name).join(', ')}` : '용의자 없음'}
                </div>
              </button>
            );
          })}

          {locations.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-6">이동 가능한 장소가 없습니다.</div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-white/10">
          <button className="w-full px-4 py-2 rounded-md border border-white/15 text-gray-300 hover:text-white hover:border-white/30" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}