interface GameClockProps {
  gameStartHour: number;
  gameEndHour: number;
  gameMinutesUsed: number;
  currentGameTime: string;
}

export function GameClock({ gameStartHour, gameEndHour, gameMinutesUsed, currentGameTime }: GameClockProps) {
  const totalMinutes = (gameEndHour - gameStartHour) * 60;
  const remaining = Math.max(0, totalMinutes - gameMinutesUsed);
  const progress = totalMinutes > 0 ? Math.min(100, (gameMinutesUsed / totalMinutes) * 100) : 0;
  const isUrgent = remaining <= 60;

  const endHour = gameEndHour <= 12 ? gameEndHour : gameEndHour - 12;
  const endPeriod = gameEndHour < 12 ? '오전' : '오후';
  const hrs = Math.floor(remaining / 60);
  const mins = remaining % 60;

  return (
    <div className="border border-ghost bg-shadow px-4 py-2.5 min-w-[200px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-headline text-[10px] text-base text-sepia">게임 시간</span>
        <span className="font-headline text-[10px] text-base text-sepia">/</span>
        <span className={`font-headline text-[10px] text-base text-sepia ${isUrgent ? 'text-crimson' : 'text-amber'}`}>
           {hrs} : {mins.toString().padStart(2, '0')} 남음
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-headline text-[10px] text-base text-sepia">{currentGameTime}</span>
        <span className="font-headline text-[10px] text-base text-sepia">/ {endPeriod} {endHour}:00</span>
      </div>
      <div className="mt-2 h-[2px] bg-ghost overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isUrgent ? 'bg-crimson' : 'bg-gold-dim'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
