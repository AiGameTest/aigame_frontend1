interface SuspectInfo {
  name: string;
  age?: number;
  personality?: string;
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-white mb-1">🗣 대화할 용의자 선택</h3>
        <p className="text-sm text-gray-400 mb-4">이 장소에 있는 용의자를 선택하세요.</p>
        <div className="space-y-2">
          {suspects.length === 0 ? (
            <p className="text-gray-500 text-center py-4">이 장소에 용의자가 없습니다.</p>
          ) : (
            suspects.map((s) => (
              <button
                key={s.name}
                onClick={() => onSelect(s.name)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-dark-surface border border-dark-border text-gray-200 hover:bg-dark-card hover:border-gray-500 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-dark-card flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                    <circle cx="40" cy="28" r="14" fill="#555" />
                    <path d="M16 72 C16 52 28 44 40 44 C52 44 64 52 64 72" fill="#555" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-gray-400">
                    {s.age && `${s.age}세`}
                    {s.personality && ` · ${s.personality}`}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <button className="btn-outline w-full mt-4" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
