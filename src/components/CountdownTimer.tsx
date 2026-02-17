interface GameClockProps {
  gameStartHour: number;
  gameEndHour: number;
  gameMinutesUsed: number;
  currentGameTime: string;
}

export function GameClock({ gameStartHour, gameEndHour, gameMinutesUsed, currentGameTime }: GameClockProps) {
  const totalMinutes = (gameEndHour - gameStartHour) * 60;
  const remaining = totalMinutes - gameMinutesUsed;
  const isUrgent = remaining <= 60;

  const endHour = gameEndHour <= 12 ? gameEndHour : gameEndHour - 12;
  const endPeriod = gameEndHour < 12 ? '오전' : '오후';

  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${isUrgent ? 'text-red-400' : 'text-gray-300'}`}>
      <span className="text-base">🕐</span>
      <span className="font-bold">{currentGameTime}</span>
      <span className="text-gray-500 text-xs">/ {endPeriod} {endHour}:00</span>
    </div>
  );
}
