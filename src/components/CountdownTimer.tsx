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
    <div className="rounded-xl border border-dark-border bg-black/30 px-3 py-2 min-w-[180px]">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
        <span className="text-gray-400">게임 시간</span>
        <span className={isUrgent ? 'text-red-400' : 'text-emerald-300'}>
          {hrs}시간 {mins.toString().padStart(2, '0')}분
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-sm font-bold text-white">{currentGameTime}</span>
        <span className="text-[11px] text-gray-500">/ {endPeriod} {endHour}:00</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isUrgent ? 'bg-red-500' : 'bg-emerald-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
