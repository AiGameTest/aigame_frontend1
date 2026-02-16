import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AccuseModal } from '../components/AccuseModal';
import { SuspectAvatar } from '../components/SuspectAvatar';
import { useSessionStore } from '../store/sessionStore';

interface SuspectProfile {
  name: string;
  age?: number;
  personality?: string;
  background?: string;
}

function parseSuspects(storyJson: string): SuspectProfile[] {
  try {
    const parsed = JSON.parse(storyJson) as { suspects?: SuspectProfile[] };
    return parsed.suspects ?? [];
  } catch {
    return [];
  }
}

export function PlayPage() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const navigate = useNavigate();
  const current = useSessionStore((s) => s.current);
  const load = useSessionStore((s) => s.load);
  const ask = useSessionStore((s) => s.ask);
  const accuse = useSessionStore((s) => s.accuse);

  const [question, setQuestion] = useState('');
  const [accuseOpen, setAccuseOpen] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void load(id); }, [id, load]);

  const suspectProfiles = useMemo(() => current ? parseSuspects(current.generatedStoryJson) : [], [current]);
  const suspectNames = useMemo(() => suspectProfiles.map(s => s.name), [suspectProfiles]);

  // Auto-select first suspect
  useEffect(() => {
    if (suspectNames.length > 0 && !selectedSuspect) {
      setSelectedSuspect(suspectNames[0]);
    }
  }, [suspectNames, selectedSuspect]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [current?.messages]);

  const selectedProfile = useMemo(
    () => suspectProfiles.find(s => s.name === selectedSuspect),
    [suspectProfiles, selectedSuspect]
  );

  async function submitAsk(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || !selectedSuspect || loading) return;
    setLoading(true);
    try {
      await ask(id, question, selectedSuspect);
    } finally {
      setLoading(false);
    }
    setQuestion('');
  }

  async function submitAccuse(name: string) {
    await accuse(id, name);
    navigate(`/result/${id}`);
  }

  if (!current) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        세션을 불러오는 중...
      </div>
    );
  }

  // Parse case title from story JSON
  let caseTitle = `사건 #${current.id}`;
  try {
    const story = JSON.parse(current.generatedStoryJson) as { title?: string };
    if (story.title) caseTitle = story.title;
  } catch { /* ignore */ }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-gradient-to-b from-[#0a0a12] to-[#111118]">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-dark-border bg-dark-bg/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h1 className="font-bold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-none">{caseTitle}</h1>
        </div>
        <div className="text-sm text-gray-400">
          남은 질문: <span className="font-bold text-white">{current.remainingQuestions}</span>
          <span className="text-gray-600">/{current.questionLimit}</span>
        </div>
      </div>

      {/* ── Suspect Avatars ── */}
      <div className="flex gap-2 md:gap-4 px-4 md:px-6 py-4 overflow-x-auto border-b border-dark-border/50 bg-dark-bg/40">
        {suspectProfiles.map((s) => (
          <SuspectAvatar
            key={s.name}
            name={s.name}
            selected={selectedSuspect === s.name}
            onClick={() => setSelectedSuspect(s.name)}
          />
        ))}
      </div>

      {/* ── Chat Panel ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
        {selectedProfile && (
          <div className="text-center mb-4">
            <div className="text-sm text-gray-500">── {selectedProfile.name} 와의 대화 ──</div>
            <div className="text-xs text-gray-600 mt-1">
              {selectedProfile.age && `${selectedProfile.age}세`}
              {selectedProfile.personality && ` · ${selectedProfile.personality}`}
            </div>
          </div>
        )}

        {current.messages.map((m) => {
          if (m.role === 'SYSTEM') {
            return (
              <div key={m.id} className="text-center text-sm text-gray-500 italic py-1">
                {m.content}
              </div>
            );
          }

          const isPlayer = m.role === 'PLAYER';
          // Extract suspect name from "[name에게]" prefix in player messages
          const suspectMatch = m.content.match(/^\[(.+?)에게\]\s*/);
          const displayContent = isPlayer && suspectMatch ? m.content.slice(suspectMatch[0].length) : m.content;
          const messageSuspect = suspectMatch?.[1];

          return (
            <div key={m.id} className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isPlayer
                    ? 'bg-blue-900/60 text-blue-100 rounded-br-sm'
                    : 'bg-dark-surface text-gray-200 rounded-bl-sm'
                }`}
              >
                <div className="text-[10px] mb-1 opacity-60">
                  {isPlayer
                    ? `🕵️ 탐정 → ${messageSuspect ?? '용의자'}`
                    : `👤 ${messageSuspect ?? selectedSuspect ?? '용의자'}`}
                </div>
                {displayContent}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-surface text-gray-400 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
              답변을 생성하는 중...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="border-t border-dark-border bg-dark-bg/80 backdrop-blur px-4 md:px-6 py-3">
        <form className="flex gap-2" onSubmit={submitAsk}>
          <input
            className="input flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={selectedSuspect ? `${selectedSuspect}에게 질문하기...` : '용의자를 선택하세요'}
            disabled={!selectedSuspect || loading}
          />
          <button className="btn" type="submit" disabled={!selectedSuspect || !question.trim() || loading}>
            {loading ? '...' : '보내기'}
          </button>
        </form>

        {/* ── Bottom Actions ── */}
        <div className="flex gap-3 mt-3">
          <button
            className="flex-1 px-4 py-2 rounded-full bg-accent-red text-white font-semibold hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-1"
            onClick={() => setAccuseOpen(true)}
          >
            ⚖️ 범인 지목
          </button>
        </div>
      </div>

      <AccuseModal open={accuseOpen} onClose={() => setAccuseOpen(false)} suspects={suspectNames} onSubmit={submitAccuse} />
    </div>
  );
}
