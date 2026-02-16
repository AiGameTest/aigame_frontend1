import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AccuseModal } from '../components/AccuseModal';
import { SuspectAvatar } from '../components/SuspectAvatar';
import { useSessionStore } from '../store/sessionStore';
import type { EvidenceItem } from '../api/types';

interface SuspectProfile {
  name: string;
  age?: number;
  personality?: string;
  background?: string;
  timeline?: { time: string; location: string; action: string }[];
}

interface StoryData {
  title?: string;
  suspects?: SuspectProfile[];
  evidence?: { title: string; detail: string; linkedTo: string; location: string }[];
}

function parseStory(storyJson: string): StoryData {
  try {
    return JSON.parse(storyJson) as StoryData;
  } catch {
    return {};
  }
}

function extractLocations(story: StoryData): string[] {
  const locationSet = new Set<string>();
  for (const s of story.suspects ?? []) {
    for (const t of s.timeline ?? []) {
      if (t.location) locationSet.add(t.location);
    }
  }
  return Array.from(locationSet);
}

function getSuspectsAtLocation(story: StoryData, location: string | null): SuspectProfile[] {
  if (!location) return [];
  return (story.suspects ?? []).filter(s =>
    (s.timeline ?? []).some(t => t.location === location)
  );
}

export function PlayPage() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const navigate = useNavigate();
  const current = useSessionStore((s) => s.current);
  const load = useSessionStore((s) => s.load);
  const ask = useSessionStore((s) => s.ask);
  const accuseFn = useSessionStore((s) => s.accuse);
  const moveFn = useSessionStore((s) => s.move);
  const investigateFn = useSessionStore((s) => s.investigate);

  const [question, setQuestion] = useState('');
  const [accuseOpen, setAccuseOpen] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [moving, setMoving] = useState(false);
  const [foundEvidence, setFoundEvidence] = useState<EvidenceItem[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void load(id); }, [id, load]);

  const story = useMemo(() => current ? parseStory(current.generatedStoryJson) : {}, [current]);
  const locations = useMemo(() => extractLocations(story), [story]);
  const suspectNames = useMemo(() => (story.suspects ?? []).map(s => s.name), [story]);

  const currentLocation = current?.currentLocation ?? null;
  const suspectsHere = useMemo(() => getSuspectsAtLocation(story, currentLocation), [story, currentLocation]);

  // Auto-select first suspect at current location
  useEffect(() => {
    if (suspectsHere.length > 0) {
      if (!selectedSuspect || !suspectsHere.some(s => s.name === selectedSuspect)) {
        setSelectedSuspect(suspectsHere[0].name);
      }
    } else {
      setSelectedSuspect(null);
    }
  }, [suspectsHere, selectedSuspect]);

  // Clear found evidence when location changes
  useEffect(() => {
    setFoundEvidence([]);
  }, [currentLocation]);

  // Filter messages for selected suspect
  const filteredMessages = useMemo(() => {
    if (!current || !selectedSuspect) return [];
    const msgs = current.messages;
    const result: typeof msgs = [];
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.role === 'SYSTEM') {
        result.push(m);
        continue;
      }
      if (m.role === 'PLAYER') {
        const match = m.content.match(/^\[(.+?)에게\]\s*/);
        if (match?.[1] === selectedSuspect) {
          result.push(m);
          if (i + 1 < msgs.length && msgs[i + 1].role === 'SUSPECT') {
            result.push(msgs[i + 1]);
            i++;
          }
        } else if (!match) {
          result.push(m);
        }
      }
    }
    return result;
  }, [current?.messages, selectedSuspect]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const selectedProfile = useMemo(
    () => (story.suspects ?? []).find(s => s.name === selectedSuspect),
    [story, selectedSuspect]
  );

  async function handleMove(location: string) {
    if (moving || location === currentLocation) return;
    setMoving(true);
    try {
      await moveFn(id, location);
    } finally {
      setMoving(false);
    }
  }

  async function handleInvestigate() {
    if (investigating) return;
    setInvestigating(true);
    try {
      const res = await investigateFn(id);
      setFoundEvidence(res.evidenceFound);
    } finally {
      setInvestigating(false);
    }
  }

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
    await accuseFn(id, name);
    navigate(`/result/${id}`);
  }

  if (!current) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        세션을 불러오는 중...
      </div>
    );
  }

  const caseTitle = story.title ?? `사건 #${current.id}`;
  const isActive = current.status === 'ACTIVE';
  const noAP = current.remainingActions <= 0;

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-gradient-to-b from-[#0a0a12] to-[#111118]">
      {/* Top Bar — AP Counter */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-dark-border bg-dark-bg/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h1 className="font-bold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-none">{caseTitle}</h1>
        </div>
        <div className="text-sm text-gray-400">
          AP: <span className="font-bold text-white">{current.remainingActions}</span>
          <span className="text-gray-600">/{current.actionLimit}</span>
        </div>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-1 px-4 md:px-6 py-2 overflow-x-auto border-b border-dark-border/50 bg-dark-bg/40">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => handleMove(loc)}
            disabled={moving || !isActive || (noAP && loc !== currentLocation)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              loc === currentLocation
                ? 'bg-blue-600 text-white'
                : 'bg-dark-surface text-gray-400 hover:bg-dark-surface/80 hover:text-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            📍 {loc}
            {loc !== currentLocation && <span className="ml-1 text-[10px] opacity-60">1AP</span>}
          </button>
        ))}
      </div>

      {/* Suspects at Location + Investigate */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-dark-border/50 bg-dark-bg/30">
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {suspectsHere.length > 0 ? (
            suspectsHere.map((s) => (
              <SuspectAvatar
                key={s.name}
                name={s.name}
                selected={selectedSuspect === s.name}
                onClick={() => setSelectedSuspect(s.name)}
              />
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">이 장소에 용의자가 없습니다</span>
          )}
        </div>
        <button
          onClick={handleInvestigate}
          disabled={investigating || !isActive || noAP}
          className="px-3 py-1.5 rounded-lg bg-amber-700/60 text-amber-200 text-xs font-medium hover:bg-amber-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {investigating ? '조사 중...' : '🔍 장소 조사'} <span className="text-[10px] opacity-60">1AP</span>
        </button>
      </div>

      {/* Found Evidence Banner */}
      {foundEvidence.length > 0 && (
        <div className="px-4 md:px-6 py-2 bg-amber-900/30 border-b border-amber-700/40">
          <div className="text-xs text-amber-300 font-medium mb-1">발견된 증거:</div>
          {foundEvidence.map((e) => (
            <div key={e.id} className="text-xs text-amber-200 ml-2">
              • <strong>{e.title}</strong> — {e.detail}
            </div>
          ))}
        </div>
      )}

      {/* Chat Panel */}
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

        {filteredMessages.map((m) => {
          if (m.role === 'SYSTEM') {
            return (
              <div key={m.id} className="text-center text-sm text-gray-500 italic py-1">
                {m.content}
              </div>
            );
          }

          const isPlayer = m.role === 'PLAYER';
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

      {/* Input Bar */}
      <div className="border-t border-dark-border bg-dark-bg/80 backdrop-blur px-4 md:px-6 py-3">
        <form className="flex gap-2" onSubmit={submitAsk}>
          <input
            className="input flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              !isActive ? '게임이 종료되었습니다'
              : noAP ? '행동 포인트를 모두 사용했습니다'
              : selectedSuspect ? `${selectedSuspect}에게 질문하기... (1AP)`
              : '이 장소에 용의자가 없습니다'
            }
            disabled={!selectedSuspect || loading || !isActive || noAP}
          />
          <button className="btn" type="submit" disabled={!selectedSuspect || !question.trim() || loading || !isActive || noAP}>
            {loading ? '...' : '보내기'}
          </button>
        </form>

        {/* Bottom Actions */}
        <div className="flex gap-3 mt-3">
          <button
            className="flex-1 px-4 py-2 rounded-full bg-accent-red text-white font-semibold hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-1"
            onClick={() => setAccuseOpen(true)}
            disabled={!isActive}
          >
            ⚖️ 범인 지목
          </button>
        </div>
      </div>

      <AccuseModal open={accuseOpen} onClose={() => setAccuseOpen(false)} suspects={suspectNames} onSubmit={submitAccuse} />
    </div>
  );
}
