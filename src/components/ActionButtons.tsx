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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-3 bg-void border-t border-ghost">
      <ActionBtn label="이동하기" onClick={onMove} disabled={disabled} />
      <ActionBtn label={investigating ? '조사 중...' : '조사하기'} onClick={onInvestigate} disabled={disabled || investigating} />
      <ActionBtn label="대화하기" onClick={onTalk} disabled={disabled} />
      <ActionBtn label="범인 지목" onClick={onAccuse} disabled={disabled} accent />
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, accent }: { label: string; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center px-3 py-4 border text-base font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
        accent
          ? 'border-crimson/60 bg-crimson/10 text-crimson hover:bg-crimson/20 hover:border-crimson'
          : 'border-ghost bg-shadow text-sepia hover:border-gold-dim hover:text-amber hover:bg-paper'
      }`}
      style={{ fontFamily: "'Noto Serif KR', serif", letterSpacing: '0.02em' }}
    >
      {label}
    </button>
  );
}
