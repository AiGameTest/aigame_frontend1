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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-white mb-1">🚶 장소 이동</h3>
        <p className="text-sm text-gray-400 mb-4">이동할 장소를 선택하세요. <span className="text-xs opacity-60">(15분 소모)</span></p>
        <div className="space-y-2">
          {locations.map((loc) => {
            const isCurrent = loc === currentLocation;
            const suspects = suspectsByLocation?.get(loc) ?? [];
            return (
              <button
                key={loc}
                onClick={() => { if (!isCurrent) onSelect(loc); }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-blue-600/30 border border-blue-500 text-blue-300 cursor-default'
                    : 'bg-dark-surface border border-dark-border text-gray-200 hover:bg-dark-card hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="mr-2">{isCurrent ? '📍' : '📌'}</span>
                    {loc}
                    {isCurrent && <span className="ml-2 text-xs opacity-60">(현재 위치)</span>}
                  </div>
                </div>
                {suspects.length > 0 && (
                  <div className="mt-1 ml-6 text-xs text-gray-400">
                    👤 {suspects.map(s => s.name).join(', ')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button className="btn-outline w-full mt-4" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
