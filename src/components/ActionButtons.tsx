interface ActionButtonsProps {
  onMove: () => void;
  onInvestigate: () => void;
  onTalk: () => void;
  onAccuse: () => void;
  disabled?: boolean;
  investigating?: boolean;
}

export function ActionButtons({ onMove, onInvestigate, onTalk, onAccuse, disabled, investigating }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 md:p-4 bg-black/40">
      <ActionBtn icon="이동" label="이동하기" onClick={onMove} disabled={disabled} />
      <ActionBtn icon="조사" label={investigating ? '조사 중...' : '조사하기'} onClick={onInvestigate} disabled={disabled || investigating} />
      <ActionBtn icon="대화" label="대화하기" onClick={onTalk} disabled={disabled} />
      <ActionBtn icon="지목" label="범인 지목" onClick={onAccuse} disabled={disabled} accent />
    </div>
  );
}

function ActionBtn({ icon, label, onClick, disabled, accent }: { icon: string; label: string; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 active:scale-[0.98]
        ${accent
          ? 'bg-red-800/90 text-red-50 border border-red-600/50 hover:bg-red-700/90'
          : 'bg-zinc-800/90 text-gray-100 border border-zinc-600/60 hover:border-zinc-400/70 hover:bg-zinc-700/90'
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5" />
      <span className="relative px-1.5 h-6 rounded-md bg-black/30 border border-white/10 text-[10px] flex items-center justify-center tracking-wide">{icon}</span>
      <span className="relative">{label}</span>
    </button>
  );
}
