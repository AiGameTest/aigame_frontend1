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
  imageUrl?: string;
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

/** 백엔드 suspectLocationIndex 와 동일한 결정론적 해시 */
function suspectLocationIndex(sessionId: number, suspectName: string, timeSlot: number, locationCount: number): number {
  let h = sessionId % 101;
  for (let i = 0; i < suspectName.length; i++) {
    h = (h * 31 + (suspectName.charCodeAt(i) % 97)) % 10007;
  }
  h = (h + timeSlot * 37) % 10007;
  return ((h % locationCount) + locationCount) % locationCount;
}

/** 타임라인 고유 장소 목록 + 해시로 현재 수사 위치 결정 (1시간마다 이동) */
function resolveSuspectLocation(
  sessionId: number,
  suspectName: string,
  timeline: { time: string; location: string }[],
  currentTotalMinutes: number
): string | null {
  const locations = [...new Set(timeline.map((t) => t.location).filter(Boolean))];
  if (!locations.length) return null;
  if (locations.length === 1) return locations[0];
  const timeSlot = Math.floor(currentTotalMinutes / 60);
  return locations[suspectLocationIndex(sessionId, suspectName, timeSlot, locations.length)];
}

function buildSuspectLocationMap(story: StoryData, sessionId: number, gameStartHour: number, gameMinutesUsed: number): Map<string, SuspectProfile[]> {
  const map = new Map<string, SuspectProfile[]>();
  const currentTotalMinutes = gameStartHour * 60 + gameMinutesUsed;
  for (const s of story.suspects ?? []) {
    const loc = resolveSuspectLocation(sessionId, s.name, s.timeline ?? [], currentTotalMinutes);
    if (!loc) continue;
    if (!map.has(loc)) map.set(loc, []);
    map.get(loc)!.push(s);
  }
  return map;
}

function getSuspectsAtLocation(suspectMap: Map<string, SuspectProfile[]>, location: string | null): SuspectProfile[] {
  if (!location) return [];
  return suspectMap.get(location) ?? [];
}

function statusLabel(status: string): string {
  if (status === 'ACTIVE') return '진행 중';
  if (status === 'WON') return '해결';
  if (status === 'LOST') return '실패';
  return '종료';
}

export function PlayPage() {
  const { sessionId: sessionPublicId } = useParams();
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

  useEffect(() => {
    if (!sessionPublicId) return;
    void load(sessionPublicId);
  }, [sessionPublicId, load]);

  const story = useMemo(() => (current ? parseStory(current.generatedStoryJson) : {}), [current]);
  const locations = useMemo(() => extractLocations(story), [story]);
  const suspectNames = useMemo(() => (story.suspects ?? []).map((s) => s.name), [story]);
  const currentLocation = current?.currentLocation ?? null;
  const suspectMap = useMemo(
    () => buildSuspectLocationMap(story, current?.id ?? 0, current?.gameStartHour ?? 0, current?.gameMinutesUsed ?? 0),
    [story, current?.id, current?.gameStartHour, current?.gameMinutesUsed]
  );
  const suspectsHere = useMemo(() => getSuspectsAtLocation(suspectMap, currentLocation), [suspectMap, currentLocation]);

  const totalMinutes = current ? (current.gameEndHour - current.gameStartHour) * 60 : 0;
  const remainingMinutes = current ? Math.max(0, totalMinutes - current.gameMinutesUsed) : 0;
  const isTimeUp = current ? current.gameMinutesUsed >= totalMinutes : false;
  const isActive = current?.status === 'ACTIVE';

  useEffect(() => {
    if (current && current.status !== 'ACTIVE') {
      navigate(`/result/${sessionPublicId}`);
    }
  }, [current?.status, sessionPublicId, navigate]);

  useEffect(() => {
    setFoundEvidence(null);
  }, [currentLocation]);

  const filteredMessages = useMemo(() => {
    if (!current || !selectedSuspect) return [];
    const msgs = current.messages;
    const result: typeof msgs = [];
    const prefix = `[${selectedSuspect}`;

    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.role === 'SYSTEM') continue;
      if (m.role === 'PLAYER' && m.content.startsWith(prefix)) {
        result.push(m);
        if (i + 1 < msgs.length && msgs[i + 1].role === 'SUSPECT') {
          result.push(msgs[i + 1]);
          i++;
        }
      }
    }
    return result;
  }, [current?.messages, selectedSuspect]);

  const selectedProfile = useMemo(() => (story.suspects ?? []).find((s) => s.name === selectedSuspect), [story, selectedSuspect]);

  const recentEvents = useMemo(() => {
    if (!current) return [] as { id: string; label: string; detail: string }[];
    const entries = current.messages
      .filter((m) => m.role !== 'SYSTEM')
      .slice(-5)
      .map((m) => ({
        id: `msg-${m.id}`,
        label: m.role === 'PLAYER' ? '플레이어 질문' : '용의자 답변',
        detail: m.content,
      }));

    const evidenceEntries = current.evidence.slice(-2).map((e) => ({
      id: `ev-${e.id}`,
      label: '증거 확보',
      detail: `${e.title}: ${e.detail}`,
    }));

    return [...entries, ...evidenceEntries].slice(-6).reverse();
  }, [current]);

  async function handleMove(location: string) {
    if (!sessionPublicId) return;
    try {
      await moveFn(sessionPublicId, location);
    } finally {
      setShowLocationModal(false);
    }
  }

  async function handleInvestigate() {
    if (!sessionPublicId) return;
    if (investigating) return;
    setInvestigating(true);
    try {
      const res = await investigateFn(sessionPublicId);
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
      return;
    }
    setShowCharacterModal(true);
  }

  function handleCharacterSelect(name: string) {
    setSelectedSuspect(name);
    setShowCharacterModal(false);
    setViewMode('conversation');
  }

  async function handleSendQuestion(question: string) {
    if (!sessionPublicId) return;
    if (!selectedSuspect || loading) return;
    setLoading(true);
    try {
      await ask(sessionPublicId, question, selectedSuspect);
    } finally {
      setLoading(false);
    }
  }

  async function submitAccuse(name: string) {
    if (!sessionPublicId) return;
    await accuseFn(sessionPublicId, name);
    navigate(`/result/${sessionPublicId}`);
  }

  if (!current) {
    return <div className="min-h-[60vh] grid place-items-center text-gray-400">세션 불러오는 중...</div>;
  }

  const caseTitle = story.title ?? `Case #${current.id}`;

  const suspectHasLeft =
    viewMode === 'conversation' &&
    selectedSuspect !== null &&
    !suspectsHere.some((s) => s.name === selectedSuspect);

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
        suspectLeft={suspectHasLeft}
        onSend={handleSendQuestion}
        onBack={() => setViewMode('main')}
      />
    );
  }

  return (
    <div className="relative h-[calc(100vh-72px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f14]">
      <div className="relative z-10 flex h-full flex-col">
        <header className="border-b border-white/10 bg-black/40 px-4 md:px-6 py-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">진행 중인 수사</p>
              <h1 className="text-lg md:text-xl font-extrabold text-white">{caseTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <GameClock
                gameStartHour={current.gameStartHour}
                gameEndHour={current.gameEndHour}
                gameMinutesUsed={current.gameMinutesUsed}
                currentGameTime={current.currentGameTime}
              />
            </div>
          </div>
        </header>

        <div className="border-b border-white/10 bg-black/30 px-4 md:px-6 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
            <StatCard label="현재 위치" value={currentLocation ?? '알 수 없음'} tone="cyan" />
            <StatCard
              label="남은 시간"
              value={`${Math.floor(remainingMinutes / 60)}시간 ${String(remainingMinutes % 60).padStart(2, '0')}분`}
              tone={isTimeUp ? 'rose' : 'amber'}
            />
            <StatCard label="수집 단서" value={`${current.evidence.length}개`} tone="emerald" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-24">
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
            <section className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-100">장소</h2>
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-500/60 text-gray-200 hover:bg-white/10 transition-colors"
                    disabled={!isActive}
                  >
                    위치 이동
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <span
                      key={loc}
                      className={`px-2 py-1 rounded-full text-xs border ${loc === currentLocation ? 'border-gray-300/70 bg-white/10 text-gray-100' : 'border-white/15 text-gray-300'}`}
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">현재 장소의 용의자</h2>
                  <span className="text-xs text-gray-400">{suspectsHere.length}명</span>
                </div>

                {suspectsHere.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">이 장소에는 용의자가 없습니다.</p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {suspectsHere.map((s) => (
                      <button
                        key={s.name}
                        className="text-left rounded-xl border border-white/10 bg-zinc-900/70 p-3 hover:border-gray-300/40 hover:-translate-y-0.5 transition-all"
                        onClick={() => handleCharacterSelect(s.name)}
                        disabled={!isActive}
                      >
                        <div className="flex items-start gap-3">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt={s.name} className="w-12 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                              <svg viewBox="0 0 80 80" className="w-8 h-8" fill="none">
                                <circle cx="40" cy="28" r="14" fill="#555" />
                                <path d="M16 72 C16 52 28 44 40 44 C52 44 64 52 64 72" fill="#555" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-100">{s.name}</p>
                              <span className="text-[10px] uppercase tracking-wide text-gray-300">대화</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              {s.age ? `${s.age}세` : '나이 미상'}{s.personality ? ` / ${s.personality}` : ''}
                            </p>
                            {s.background && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{s.background}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {foundEvidence !== null && (
                <div className={`rounded-xl p-3 border ${foundEvidence.length > 0 ? 'bg-amber-900/30 border-amber-700/40' : 'bg-gray-800/50 border-dark-border'}`}>
                  {foundEvidence.length > 0 ? (
                    <>
                      <div className="text-xs text-amber-300 font-medium mb-1">새 단서 발견</div>
                      {foundEvidence.map((e) => (
                        <div key={e.id} className="text-xs text-amber-200 ml-2">
                          - <strong>{e.title}</strong> : {e.detail}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-1">이 장소에서 추가 단서를 찾지 못했습니다.</div>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <h3 className="text-sm font-semibold text-white">수사 로그</h3>
                <div className="mt-3 space-y-2 max-h-[330px] overflow-auto pr-1">
                  {recentEvents.length === 0 ? (
                    <p className="text-xs text-gray-500">아직 기록이 없습니다.</p>
                  ) : (
                    recentEvents.map((item) => (
                      <div key={item.id} className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-gray-300">{item.label}</p>
                        <p className="mt-1 text-xs text-gray-300 line-clamp-3">{item.detail}</p>
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-3 text-[11px] text-gray-500">
                  최근 질문, 답변, 단서 확보 기록을 시간 순으로 보여줍니다.
                </p>
              </div>
            </aside>
          </div>
        </main>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/60 backdrop-blur-md">
          <ActionButtons
            onMove={() => setShowLocationModal(true)}
            onInvestigate={handleInvestigate}
            onTalk={handleTalk}
            onAccuse={() => setAccuseOpen(true)}
            disabled={!isActive}
            investigating={investigating}
          />
        </div>
      </div>

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

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' }) {
  const toneMap: Record<string, string> = {
    cyan: 'bg-slate-800/70 border-slate-500/40 text-slate-100',
    violet: 'bg-slate-800/70 border-slate-500/40 text-slate-100',
    emerald: 'bg-slate-800/70 border-slate-500/40 text-slate-100',
    amber: 'bg-zinc-800/80 border-zinc-500/40 text-zinc-100',
    rose: 'bg-red-950/40 border-red-500/40 text-red-100',
  };

  return (
    <div className={`rounded-xl border p-2.5 ${toneMap[tone]}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white truncate">{value}</p>
    </div>
  );
}

