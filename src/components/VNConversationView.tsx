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
  suspectLeft?: boolean;
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
  suspectLeft = false,
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
    if (!input.trim() || loading || isTimeUp || suspectLeft) return;
    onSend(input.trim());
    setInput('');
  }

  const lastReply = getLastSuspectReply(messages);

  return (
    <div className="h-[calc(100vh-56px)] border border-ghost bg-void overflow-hidden flex flex-col">

      {/* Header */}
      <header className="border-b border-ghost bg-void/98 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="text-sm text-faded border border-ghost px-3 py-1.5 hover:border-gold-dim hover:text-sepia transition-colors"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            ← 수사실
          </button>

          <div className="text-center min-w-0">
            <p className="font-detail text-xs tracking-[0.2em] uppercase text-gold-dim">INTERROGATION</p>
            <p className="font-headline text-base text-sepia truncate">{suspect.name}</p>
          </div>

          <GameClock
            gameStartHour={gameStartHour}
            gameEndHour={gameEndHour}
            gameMinutesUsed={gameMinutesUsed}
            currentGameTime={currentGameTime}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr]">

        {/* Left: Suspect File Panel */}
        <aside className="border-b lg:border-b-0 lg:border-r border-ghost bg-shadow p-4 lg:p-5 overflow-y-auto">
          <div className="flex flex-col h-full">

            {/* Portrait */}
            <div className="mx-auto w-full max-w-[200px] aspect-[3/4] border border-ghost bg-void overflow-hidden">
              {suspect.imageUrl ? (
                <img
                  src={suspect.imageUrl}
                  alt={suspect.name}
                  className="w-full h-full object-cover"
                  style={{ filter: 'sepia(0.45) brightness(0.8) contrast(1.1)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-void">
                  <svg viewBox="0 0 120 160" className="w-[75%] h-[75%]" fill="none">
                    <circle cx="60" cy="50" r="24" fill="#3d3428" />
                    <path d="M16 148 C16 100 36 80 60 80 C84 80 104 100 104 148" fill="#3d3428" />
                  </svg>
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="mt-4">
              <div className="h-[1px] bg-gold-dim/30 mb-3" />
              <p className="text-xs text-gold-dim uppercase tracking-widest" style={{ fontFamily: "'Noto Serif KR', serif" }}>용의자 파일</p>
              <h2 className="font-headline text-xl text-amber mt-1">{suspect.name}</h2>
              <p className="text-sm text-sepia/75 mt-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                {suspect.age ? `${suspect.age}세` : '나이 미상'}
                {suspect.personality ? ` · ${suspect.personality}` : ''}
              </p>
            </div>

            {/* Background */}
            <div className="mt-4 border border-ghost bg-paper/50 p-3">
              <p className="text-sm text-faded mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>배경</p>
              <p className="text-sm text-sepia leading-relaxed" style={{ fontFamily: "'Noto Serif KR', 'IM Fell English', serif" }}>
                {suspect.background ?? '배경 정보가 없습니다.'}
              </p>
            </div>

            {/* Status note */}
            <div className="mt-auto pt-4 border-t border-ghost/50">
              <p className="text-sm text-faded mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>주의사항</p>
              <p className="text-sm text-sepia/80 leading-relaxed" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                질문 1회당 게임 시간 15분이 경과합니다.
              </p>
              {isTimeUp && (
                <p className="text-sm text-crimson mt-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  시간 초과로 질문이 비활성화되었습니다.
                </p>
              )}
              {suspectLeft && !isTimeUp && (
                <p className="text-sm text-faded mt-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  {suspect.name}이(가) 자리를 떠났습니다.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Right: Transcript Panel */}
        <section className="min-h-0 flex flex-col bg-void">

          {/* Last reply preview */}
          <div className="border-b border-ghost px-5 py-3 bg-shadow/60 shrink-0">
            <div className="border border-ghost/50 bg-paper/30 px-3 py-2.5">
              <p className="text-xs text-gold-dim uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>최근 진술</p>
              <p className="text-sm text-sepia/85 leading-relaxed line-clamp-2" style={{ fontFamily: "'Noto Serif KR', 'IM Fell English', serif" }}>{lastReply}</p>
            </div>
          </div>

          {/* Alert banners */}
          {isTimeUp && (
            <div className="border-b border-crimson/30 bg-crimson/10 px-4 py-2 shrink-0">
              <p className="text-sm text-crimson text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                제한 시간 종료 — 더 이상 질문할 수 없습니다
              </p>
            </div>
          )}
          {suspectLeft && !isTimeUp && (
            <div className="border-b border-ghost bg-shadow/60 px-4 py-2 shrink-0">
              <p className="text-sm text-faded text-center" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                {suspect.name}이(가) 자리를 떠났습니다 — 다른 장소에서 만날 수 있습니다
              </p>
            </div>
          )}

          {/* Chat transcript */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-sm text-faded italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>아직 대화 기록이 없습니다.</p>
                <p className="text-sm text-faded mt-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>첫 질문을 입력해 수사를 시작하세요.</p>
              </div>
            )}

            {messages.map((m) => {
              if (m.role === 'SYSTEM') return null;

              const isPlayer = m.role === 'PLAYER';
              const displayContent = isPlayer ? stripPrefix(m.content) : m.content;

              return (
                <div key={m.id} className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                    <span className={`text-xs mb-1.5 ${isPlayer ? 'text-gold-dim' : 'text-faded'}`} style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      {isPlayer ? '▶ 질문' : `◀ ${suspect.name}`}
                    </span>
                    <div
                      className={`px-4 py-3 border text-sm leading-relaxed ${
                        isPlayer
                          ? 'border-gold-dim/40 bg-dark text-sepia'
                          : 'border-ghost bg-paper text-sepia/90'
                      }`}
                      style={{ fontFamily: "'Noto Serif KR', 'IM Fell English', serif" }}
                    >
                      {displayContent}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] flex flex-col items-start">
                  <span className="text-xs text-faded mb-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    ◀ {suspect.name}
                  </span>
                  <div className="px-4 py-3 border border-ghost bg-paper flex items-center gap-2">
                    <div className="w-2.5 h-2.5 border border-gold-dim border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span className="text-sm text-faded italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>답변을 생각하는 중...</span>
                  </div>
                </div>
              </div>
            )}

            {suspectLeft && !isTimeUp && (
              <div className="flex justify-center">
                <div className="text-sm text-faded border border-ghost px-4 py-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  {suspect.name}이(가) 자리를 떠났습니다
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <footer className="border-t border-ghost bg-void/98 px-5 py-3.5 shrink-0">
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <input
                className="noir-input flex-1 py-3"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isTimeUp
                    ? '시간이 종료되어 질문할 수 없습니다.'
                    : suspectLeft
                    ? `${suspect.name}이(가) 자리를 떠났습니다.`
                    : `${suspect.name}에게 질문하기... (행동 시 15분 경과)`
                }
                disabled={loading || isTimeUp || suspectLeft}
              />
              <button
                className="btn-primary px-6 py-3 text-sm"
                type="submit"
                disabled={!input.trim() || loading || isTimeUp || suspectLeft}
                style={{ fontFamily: "'Noto Serif KR', serif" }}
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
