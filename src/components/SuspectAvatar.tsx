interface SuspectAvatarProps {
  name: string;
  imageUrl?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function SuspectAvatar({ name, imageUrl, selected, onClick }: SuspectAvatarProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all cursor-pointer
        ${selected
          ? 'bg-accent-pink/20 border-2 border-accent-pink shadow-[0_0_16px_rgba(255,77,109,0.4)]'
          : 'bg-dark-surface border-2 border-transparent hover:border-dark-border hover:bg-dark-card'
        }`}
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-dark-card flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
            {/* Head */}
            <circle cx="40" cy="28" r="14" fill="#555" />
            {/* Body */}
            <path
              d="M16 72 C16 52 28 44 40 44 C52 44 64 52 64 72"
              fill="#555"
            />
          </svg>
        )}
      </div>
      <span className={`text-xs md:text-sm font-semibold truncate max-w-[80px] ${selected ? 'text-accent-pink' : 'text-gray-300'}`}>
        {name}
      </span>
      {selected && <span className="text-[10px] text-accent-pink">&#9733;</span>}
    </button>
  );
}
