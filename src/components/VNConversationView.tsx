import { FormEvent, useEffect, useRef, useState } from 'react';
import { GameClock } from './CountdownTimer';
import type { MessageLogItem } from '../api/types';

interface SuspectProfile {
  name: string;
  age?: number;
  personality?: string;
  background?: string;
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
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || isTimeUp) return;
    onSend(input.trim());
    setInput('');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-gradient-to-b from-[#0a0a12] to-[#111118]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-bg/80 backdrop-blur">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
          <span>←</span> 뒤로
        </button>
        <span className="font-bold text-white text-sm">{suspect.name}</span>
        <GameClock
          gameStartHour={gameStartHour}
          gameEndHour={gameEndHour}
          gameMinutesUsed={gameMinutesUsed}
          currentGameTime={currentGameTime}
        />
      </div>

      {/* Character Profile */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-dark-border/50 bg-dark-bg/30">
        <div className="w-20 h-20 rounded-full bg-dark-card flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
            <circle cx="40" cy="28" r="14" fill="#666" />
            <path d="M16 72 C16 52 28 44 40 44 C52 44 64 52 64 72" fill="#666" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-white">{suspect.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {suspect.age && `${suspect.age}세`}
            {suspect.personality && ` · ${suspect.personality}`}
          </div>
          {suspect.background && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{suspect.background}</div>
          )}
        </div>
      </div>

      {/* Conversation Area - VN style */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          if (m.role === 'SYSTEM') return null;

          const isPlayer = m.role === 'PLAYER';
          const displayContent = isPlayer
            ? m.content.replace(/^\[.+?에게\]\s*/, '')
            : m.content;

          return (
            <div key={m.id} className="relative">
              {/* Speaker name tag */}
              <div className={`text-xs font-bold mb-1 ${isPlayer ? 'text-blue-300 text-right' : 'text-pink-400'}`}>
                {isPlayer ? '🕵️ 탐정' : suspect.name}
              </div>
              {/* VN-style dialogue box */}
              <div
                className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${
                  isPlayer
                    ? 'bg-blue-900/40 border border-blue-800/40 text-blue-100 ml-8'
                    : 'bg-dark-surface/80 border border-dark-border text-gray-200 mr-8'
                }`}
              >
                {displayContent}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="relative">
            <div className="text-xs font-bold mb-1 text-pink-400">{suspect.name}</div>
            <div className="px-4 py-3 rounded-lg bg-dark-surface/80 border border-dark-border text-gray-400 mr-8 text-sm">
              답변을 생각하는 중...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-dark-border bg-dark-bg/80 backdrop-blur px-4 py-3">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTimeUp ? '게임 시간이 종료되었습니다' : `${suspect.name}에게 질문하기... (15분 소모)`}
            disabled={loading || isTimeUp}
          />
          <button className="btn" type="submit" disabled={!input.trim() || loading || isTimeUp}>
            {loading ? '...' : '보내기'}
          </button>
        </form>
      </div>
    </div>
  );
}
