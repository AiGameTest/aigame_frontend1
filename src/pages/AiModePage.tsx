import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export function AiModePage() {
  const navigate = useNavigate();
  const start = useSessionStore((s) => s.start);

  const [setting, setSetting] = useState('');
  const [victimProfile, setVictimProfile] = useState('');
  const [suspectCount, setSuspectCount] = useState(4);
  const [gameStartHour, setGameStartHour] = useState(12);
  const [gameEndHour, setGameEndHour] = useState(18);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const session = await start({
        mode: 'AI',
        aiPrompt: {
          setting: setting || undefined,
          victimProfile: victimProfile || undefined,
          suspectCount,
        },
        gameStartHour,
        gameEndHour,
      });
      navigate(`/play/${session.publicId}`);
    } finally {
      setLoading(false);
    }
  }

  const totalHours = gameEndHour - gameStartHour;

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            🤖 AI 사건 생성
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            원하는 설정을 입력하면 AI가 독창적인 사건을 만들어줍니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">장소 / 배경</label>
            <input
              className="input"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="예: 외딴 산장, 호화 유람선, 대학 캠퍼스..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">피해자 설정</label>
            <input
              className="input"
              value={victimProfile}
              onChange={(e) => setVictimProfile(e.target.value)}
              placeholder="예: 유명 미술품 수집가, 은퇴한 교수..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">용의자 수</label>
            <select
              className="input"
              value={suspectCount}
              onChange={(e) => setSuspectCount(Number(e.target.value))}
            >
              {[3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}명</option>
              ))}
            </select>
          </div>

          {/* Game Time Settings */}
          <div className="border-t border-dark-border pt-4">
            <label className="block text-sm font-semibold text-gray-300 mb-3">수사 시간 설정</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작 시각</label>
                <select
                  className="input"
                  value={gameStartHour}
                  onChange={(e) => setGameStartHour(Number(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{formatHour(i)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료 시각</label>
                <select
                  className="input"
                  value={gameEndHour}
                  onChange={(e) => setGameEndHour(Number(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).filter(h => h > gameStartHour).map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              총 {totalHours}시간 ({totalHours * 60}분) · 행동당 15분 소모 · 최대 {Math.floor(totalHours * 60 / 15)}회 행동 가능
            </p>
          </div>

          <button
            className="w-full py-3 rounded-xl bg-accent-pink text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? 'AI가 사건을 생성하는 중...' : '🔮 AI 사건 생성하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}
