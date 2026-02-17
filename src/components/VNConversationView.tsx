import { FormEvent, useEffect, useRef, useState } from 'react';
import { GameClock } from './CountdownTimer';
import type { MessageLogItem } from '../api/types';

interface SuspectProfile {
  name: string;
  age?: number;
  personality?: string;
  background?: string;
  imageUrl?: string;
}

interface VNConversationViewProps {
  suspect: SuspectProfile;
  messages: MessageLogItem[];
  gameStartHour: number;
  gameEndHour: number;
  gameMinutesUsed: number;
  currentGameTime: string;
  loading: boolean;
  isTimeUp: boolean;
  onSend: (question: string) => void;
  onBack: () => void;
}

function stripPrefix(content: string): string {
  return content.replace(/^\[[^\]]+\]\s*/, '');
}

function getLastSuspectReply(messages: MessageLogItem[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'SUSPECT');
  return last ? stripPrefix(last.content) : '아직 진술이 없습니다. 질문을 통해 단서를 확보해 보세요.';
}

export function VNConversationView({
  suspect,
  messages,
  gameStartHour,
  gameEndHour,
  gameMinutesUsed,
  currentGameTime,
  loading,
  isTimeUp,
  onSend,
  onBack,
}: VNConversationViewProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || isTimeUp) return;
    onSend(input.trim());
    setInput('');
  }

  const lastReply = getLastSuspectReply(messages);

  return (
    <div className="h-[calc(100vh-72px)] rounded-2xl border border-white/10 bg-[#0b0d12] overflow-hidden flex flex-col">
      <header className="border-b border-white/10 bg-black/45 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-md border border-white/15 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors"
          >
            메인 화면
          </button>

          <div className="text-center min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">심문</p>
            <p className="text-sm font-bold text-white truncate">{suspect.name}</p>
          </div>

          <GameClock
            gameStartHour={gameStartHour}
            gameEndHour={gameEndHour}
            gameMinutesUsed={gameMinutesUsed}
            currentGameTime={currentGameTime}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-b lg:border-b-0 lg:border-r border-white/10 bg-[#12161f] p-4 lg:p-5">
          <div className="h-full rounded-xl border border-white/10 bg-black/25 p-4 flex flex-col">
            <div className="mx-auto w-72 h-96 rounded-xl border border-white/10 bg-zinc-900 flex items-center justify-center overflow-hidden">
              {suspect.imageUrl ? (
                <img src={suspect.imageUrl} alt={suspect.name} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 288 384" className="w-[85%] h-[85%]" fill="none">
                  <circle cx="144" cy="112" r="54" fill="#737373" />
                  <path d="M50 342 C50 256 94 220 144 220 C194 220 238 256 238 342" fill="#737373" />
                </svg>
              )}
            </div>

            <div className="mt-4">
              <p className="text-lg font-bold text-white">{suspect.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {suspect.age ? `${suspect.age}세` : '나이 미상'}
                {suspect.personality ? ` / ${suspect.personality}` : ''}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">배경</p>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {suspect.background ?? '배경 정보가 없습니다.'}
              </p>
            </div>

            <div className="mt-auto pt-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">현재 상태</p>
              <p className="text-xs text-gray-300 mt-1">질문 1회당 게임 시간 15분이 경과합니다.</p>
              {isTimeUp && <p className="text-xs text-red-300 mt-1">시간 초과로 질문이 비활성화되었습니다.</p>}
            </div>
          </div>
        </aside>

        <section className="min-h-0 flex flex-col bg-[#0d1118]">
          <div className="border-b border-white/10 px-4 py-3 bg-black/25">
            <div className="rounded-lg border border-white/10 bg-zinc-900/65 p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">최근 진술</p>
              <p className="text-sm text-gray-100 mt-1 leading-relaxed line-clamp-2">{lastReply}</p>
            </div>
          </div>

          {isTimeUp && (
            <div className="border-b border-red-700/40 bg-red-900/30 px-4 py-2 text-sm text-red-200 text-center">
              제한 시간이 종료되었습니다. 더 이상 질문할 수 없습니다.
            </div>
          )}

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center text-xs text-gray-500 py-8">
                아직 대화 기록이 없습니다. 첫 질문을 입력해 보세요.
              </div>
            )}

            {messages.map((m) => {
              if (m.role === 'SYSTEM') return null;

              const isPlayer = m.role === 'PLAYER';
              const displayContent = isPlayer ? stripPrefix(m.content) : m.content;

              return (
                <div key={m.id} className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] ${isPlayer ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`text-[11px] mb-1 ${isPlayer ? 'text-gray-400' : 'text-zinc-300'}`}>
                      {isPlayer ? '플레이어' : suspect.name}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-xl text-sm leading-relaxed border ${
                        isPlayer
                          ? 'bg-slate-800 border-slate-600 text-slate-100'
                          : 'bg-zinc-900/80 border-zinc-700 text-gray-200'
                      }`}
                    >
                      {displayContent}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[88%] flex flex-col items-start">
                  <div className="text-[11px] mb-1 text-zinc-300">{suspect.name}</div>
                  <div className="px-4 py-3 rounded-xl text-sm border bg-zinc-900/80 border-zinc-700 text-gray-400">
                    답변을 생각하는 중...
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-white/10 bg-black/45 px-4 py-3">
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <input
                className="input flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isTimeUp ? '시간이 종료되어 질문할 수 없습니다.' : `${suspect.name}에게 질문하기... (행동 시 15분 경과)`}
                disabled={loading || isTimeUp}
              />
              <button
                className="px-4 py-2 rounded-md bg-accent-pink text-white font-semibold hover:opacity-90 disabled:opacity-50"
                type="submit"
                disabled={!input.trim() || loading || isTimeUp}
              >
                전송
              </button>
            </form>
          </footer>
        </section>
      </div>
    </div>
  );
}