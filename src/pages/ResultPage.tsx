import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export function ResultPage() {
  const { sessionId } = useParams();
  const sessionPublicId = sessionId ?? '';
  const result = useSessionStore((s) => s.result);
  const current = useSessionStore((s) => s.current);
  const load = useSessionStore((s) => s.load);

  useEffect(() => {
    if (!sessionPublicId) return;
    if (!current || current.publicId !== sessionPublicId) void load(sessionPublicId);
  }, [current, sessionPublicId, load]);

  const status = result?.status ?? current?.status ?? 'CLOSED';
  const isWon = status === 'WON';
  const isTimeout = status === 'LOST' && !result;

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      <div
        className="panel-paper space-y-6"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(61,52,40,0.25)' }}
      >
        {/* 상단 골드 선 */}
        <div className="h-[1px] bg-gold-dim -mx-6 -mt-6 mb-0" />

        {/* 헤더 */}
        <div className="pt-2">
          <p className="badge-file inline-block mb-3">CASE CLOSED</p>
          <h1 className="font-headline text-2xl text-sepia tracking-wide">수사 결과</h1>
        </div>

        <div className="h-px bg-ghost/50 -mx-6" />

        {/* 결과 배너 */}
        <div className={`border p-6 text-center ${
          isWon
            ? 'border-amber/30 bg-gold/5'
            : 'border-crimson/30 bg-crimson/5'
        }`}>
          <p className="font-display text-3xl md:text-4xl mb-3 tracking-wide" style={{
            color: isWon ? 'var(--col-amber)' : 'var(--col-crimson)',
            textShadow: isWon
              ? '0 0 30px rgba(232,201,106,0.25)'
              : '0 0 30px rgba(139,26,26,0.3)',
          }}>
            {isWon ? '사건 해결' : isTimeout ? '시간 초과' : '오판'}
          </p>
          <p className={`font-body italic text-base ${isWon ? 'text-amber/80' : 'text-crimson/70'}`}>
            {isWon
              ? '당신은 진실을 밝혀냈습니다.'
              : isTimeout
              ? '제한 시간 내에 범인을 찾지 못했습니다.'
              : '범인을 잘못 지목했습니다.'}
          </p>
        </div>

        {result ? (
          <>
            {/* 진범 */}
            <div className="border border-ghost bg-dark p-4">
              <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-2">진범</p>
              <p className="font-headline text-xl text-amber">{result.actualKiller}</p>
            </div>

            {/* 사건 해설 */}
            <div className="border border-ghost bg-dark p-4">
              <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-2">사건 해설</p>
              <p className="font-body text-sm text-sepia/80 leading-relaxed italic">{result.explanation}</p>
            </div>

            {/* 핵심 단서 */}
            {result.keyClues?.length > 0 && (
              <div className="border border-ghost bg-dark p-4">
                <p className="font-label text-[9px] tracking-[0.25em] uppercase text-ghost mb-3">핵심 단서</p>
                <ul className="space-y-2">
                  {result.keyClues.map((c) => (
                    <li key={c} className="font-body text-sm text-sepia/80 flex items-start gap-2.5 italic">
                      <span className="text-gold-dim mt-0.5 flex-shrink-0">✦</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="font-body italic text-faded text-center py-6 text-sm">
            플레이 화면에서 범인을 지목한 후 결과가 표시됩니다.
          </p>
        )}

        <div className="h-px bg-ghost/50 -mx-6" />

        <Link to="/" className="btn-primary w-full justify-center py-3.5">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
