import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export function ResultPage() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const result = useSessionStore((s) => s.result);
  const current = useSessionStore((s) => s.current);
  const load = useSessionStore((s) => s.load);

  useEffect(() => {
    if (!current || current.id !== id) void load(id);
  }, [current, id, load]);

  const status = result?.status ?? current?.status ?? 'CLOSED';
  const isWon = status === 'WON';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 space-y-5">
        <h1 className="text-2xl font-black text-white">🔎 수사 결과</h1>

        <div className={`text-center py-4 rounded-xl ${isWon ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
          <p className="text-3xl mb-1">{isWon ? '🎉' : '😔'}</p>
          <p className={`text-lg font-bold ${isWon ? 'text-green-400' : 'text-red-400'}`}>
            {isWon ? '정답입니다!' : '오답입니다...'}
          </p>
          <p className="text-sm text-gray-400 mt-1">상태: {status}</p>
        </div>

        {result ? (
          <>
            <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
              <p className="text-sm text-gray-400">진범</p>
              <p className="text-lg font-bold text-white mt-1">{result.actualKiller}</p>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
              <p className="text-sm text-gray-400">사건 해설</p>
              <p className="text-gray-300 mt-1 leading-relaxed">{result.explanation}</p>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">핵심 단서</p>
              <ul className="space-y-1">
                {result.keyClues.map((c) => (
                  <li key={c} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-accent-pink mt-0.5">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">
            플레이 화면에서 범인을 지목한 후 결과가 표시됩니다.
          </p>
        )}

        <Link
          to="/"
          className="block text-center py-3 rounded-xl bg-accent-pink text-white font-bold hover:opacity-90 transition-opacity"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
