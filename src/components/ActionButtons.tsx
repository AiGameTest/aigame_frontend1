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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
      <ActionBtn icon="🚶" label="이동하기" onClick={onMove} disabled={disabled} />
      <ActionBtn icon="🔍" label={investigating ? '조사 중...' : '조사하기'} onClick={onInvestigate} disabled={disabled || investigating} />
      <ActionBtn icon="🗣" label="대화하기" onClick={onTalk} disabled={disabled} />
      <ActionBtn icon="⚖" label="범인 지목" onClick={onAccuse} disabled={disabled} accent />
    </div>
  );
}

function ActionBtn({ icon, label, onClick, disabled, accent }: { icon: string; label: string; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all
        ${accent
          ? 'bg-accent-red/80 text-white hover:bg-accent-red'
          : 'bg-dark-surface text-gray-200 hover:bg-dark-card border border-dark-border'
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}
