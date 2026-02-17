import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AccuseModal } from '../components/AccuseModal';
import { ActionButtons } from '../components/ActionButtons';
import { CharacterSelectModal } from '../components/CharacterSelectModal';
import { GameClock } from '../components/CountdownTimer';
import { LocationSelectModal } from '../components/LocationSelectModal';
import { VNConversationView } from '../components/VNConversationView';
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

/** Each suspect belongs to their first timeline location only (no duplicates) */
function buildSuspectLocationMap(story: StoryData): Map<string, SuspectProfile[]> {
  const map = new Map<string, SuspectProfile[]>();
  for (const s of story.suspects ?? []) {
    const firstLoc = (s.timeline ?? [])[0]?.location;
    if (!firstLoc) continue;
    if (!map.has(firstLoc)) map.set(firstLoc, []);
    map.get(firstLoc)!.push(s);
  }
  return map;
}

function getSuspectsAtLocation(suspectMap: Map<string, SuspectProfile[]>, location: string | null): SuspectProfile[] {
  if (!location) return [];
  return suspectMap.get(location) ?? [];
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

  const [viewMode, setViewMode] = useState<'main' | 'conversation'>('main');
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [accuseOpen, setAccuseOpen] = useState(false);
  const [foundEvidence, setFoundEvidence] = useState<EvidenceItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [investigating, setInvestigating] = useState(false);

  useEffect(() => { void load(id); }, [id, load]);

  const story = useMemo(() => current ? parseStory(current.generatedStoryJson) : {}, [current]);
  const locations = useMemo(() => extractLocations(story), [story]);
  const suspectNames = useMemo(() => (story.suspects ?? []).map(s => s.name), [story]);
  const currentLocation = current?.currentLocation ?? null;
  const suspectMap = useMemo(() => buildSuspectLocationMap(story), [story]);
  const suspectsHere = useMemo(() => getSuspectsAtLocation(suspectMap, currentLocation), [suspectMap, currentLocation]);

  // Check if game time is up
  const isTimeUp = current
    ? current.gameMinutesUsed >= (current.gameEndHour - current.gameStartHour) * 60
    : false;

  // Navigate to result if status changed to non-active
  useEffect(() => {
    if (current && current.status !== 'ACTIVE') {
      navigate(`/result/${id}`);
    }
  }, [current?.status, id, navigate]);

  // Clear investigate result when location changes
  useEffect(() => {
    setFoundEvidence(null);
  }, [currentLocation]);

  // Filter messages for selected suspect
  const filteredMessages = useMemo(() => {
    if (!current || !selectedSuspect) return [];
    const msgs = current.messages;
    const result: typeof msgs = [];
    const prefix = `[${selectedSuspect}에게] `;
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.role === 'SYSTEM') continue;
      if (m.role === 'PLAYER') {
        if (m.content.startsWith(prefix)) {
          result.push(m);
          if (i + 1 < msgs.length && msgs[i + 1].role === 'SUSPECT') {
            result.push(msgs[i + 1]);
            i++;
          }
        }
      }
    }
    return result;
  }, [current?.messages, selectedSuspect]);

  const selectedProfile = useMemo(
    () => (story.suspects ?? []).find(s => s.name === selectedSuspect),
    [story, selectedSuspect]
  );

  async function handleMove(location: string) {
    try {
      await moveFn(id, location);
    } finally {
      setShowLocationModal(false);
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

  function handleTalk() {
    if (suspectsHere.length === 0) return;
    if (suspectsHere.length === 1) {
      setSelectedSuspect(suspectsHere[0].name);
      setViewMode('conversation');
    } else {
      setShowCharacterModal(true);
    }
  }

  function handleCharacterSelect(name: string) {
    setSelectedSuspect(name);
    setShowCharacterModal(false);
    setViewMode('conversation');
  }

  async function handleSendQuestion(question: string) {
    if (!selectedSuspect || loading) return;
    setLoading(true);
    try {
      await ask(id, question, selectedSuspect);
    } finally {
      setLoading(false);
    }
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

  // VN Conversation View
  if (viewMode === 'conversation' && selectedProfile) {
    return (
      <VNConversationView
        suspect={selectedProfile}
        messages={filteredMessages}
        gameStartHour={current.gameStartHour}
        gameEndHour={current.gameEndHour}
        gameMinutesUsed={current.gameMinutesUsed}
        currentGameTime={current.currentGameTime}
        loading={loading}
        isTimeUp={isTimeUp}
        onSend={handleSendQuestion}
        onBack={() => setViewMode('main')}
      />
    );
  }

  // Main View
  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-gradient-to-b from-[#0a0a12] to-[#111118]">
      {/* Header with Game Clock */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-dark-border bg-dark-bg/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h1 className="font-bold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-none">{caseTitle}</h1>
        </div>
        {isActive ? (
          <GameClock
            gameStartHour={current.gameStartHour}
            gameEndHour={current.gameEndHour}
            gameMinutesUsed={current.gameMinutesUsed}
            currentGameTime={current.currentGameTime}
          />
        ) : (
          <span className="text-sm text-gray-500 font-medium">{current.status}</span>
        )}
      </div>

      {/* Current Location Info */}
      <div className="px-4 md:px-6 py-3 border-b border-dark-border/50 bg-dark-bg/30">
        <div className="flex items-center gap-2 text-sm">
          <span>📍</span>
          <span className="text-gray-400">현재 장소:</span>
          <span className="text-white font-semibold">{currentLocation ?? '알 수 없음'}</span>
        </div>
      </div>

      {/* Time-up Banner */}
      {isTimeUp && isActive && (
        <div className="px-4 md:px-6 py-3 bg-red-900/30 border-b border-red-700/40">
          <div className="text-sm text-red-300 font-medium text-center">
            게임 시간이 종료되었습니다! 범인을 지목하세요.
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {/* Suspects at this location */}
        <div className="bg-dark-surface/50 border border-dark-border rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-2 font-medium">이 장소의 용의자</div>
          {suspectsHere.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {suspectsHere.map((s) => (
                <div key={s.name} className="flex items-center gap-2 bg-dark-card px-3 py-2 rounded-lg border border-dark-border">
                  <div className="w-8 h-8 rounded-full bg-dark-surface flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                      <circle cx="40" cy="28" r="14" fill="#555" />
                      <path d="M16 72 C16 52 28 44 40 44 C52 44 64 52 64 72" fill="#555" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-200">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.age && `${s.age}세`}
                      {s.personality && ` · ${s.personality}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">이 장소에 용의자가 없습니다</p>
          )}
        </div>

        {/* Investigate Result Banner */}
        {foundEvidence !== null && (
          <div className={`rounded-xl p-3 border ${foundEvidence.length > 0 ? 'bg-amber-900/30 border-amber-700/40' : 'bg-gray-800/50 border-dark-border'}`}>
            {foundEvidence.length > 0 ? (
              <>
                <div className="text-xs text-amber-300 font-medium mb-1">증거 발견!</div>
                {foundEvidence.map((e) => (
                  <div key={e.id} className="text-xs text-amber-200 ml-2">
                    • <strong>{e.title}</strong> — {e.detail}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-sm text-gray-400 text-center py-1">
                🔍 이 장소에서 새로운 증거를 찾지 못했습니다.
              </div>
            )}
          </div>
        )}

        {/* Discovered Evidence */}
        {current.evidence.length > 0 && (
          <div className="bg-dark-surface/50 border border-dark-border rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-2 font-medium">발견된 증거</div>
            {current.evidence.map((e) => (
              <div key={e.id} className="text-sm text-gray-300 ml-1 py-0.5">
                <span className="text-accent-pink mr-1">•</span>
                <strong>{e.title}</strong>
                <span className="text-gray-500 ml-1">— {e.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-dark-border bg-dark-bg/80 backdrop-blur">
        <ActionButtons
          onMove={() => setShowLocationModal(true)}
          onInvestigate={handleInvestigate}
          onTalk={handleTalk}
          onAccuse={() => setAccuseOpen(true)}
          disabled={!isActive}
          investigating={investigating}
        />
      </div>

      {/* Modals */}
      <LocationSelectModal
        open={showLocationModal}
        locations={locations}
        currentLocation={currentLocation}
        suspectsByLocation={suspectMap}
        onSelect={handleMove}
        onClose={() => setShowLocationModal(false)}
      />
      <CharacterSelectModal
        open={showCharacterModal}
        suspects={suspectsHere}
        onSelect={handleCharacterSelect}
        onClose={() => setShowCharacterModal(false)}
      />
      <AccuseModal
        open={accuseOpen}
        onClose={() => setAccuseOpen(false)}
        suspects={suspectNames}
        onSubmit={submitAccuse}
      />
    </div>
  );
}
