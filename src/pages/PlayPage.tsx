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

function statusLabel(status: string): string {
  if (status === 'ACTIVE') return '진행 중';
  if (status === 'WON') return '해결';
  if (status === 'LOST') return '실패';
  return '종료';
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

  useEffect(() => {
    void load(id);
  }, [id, load]);

  const story = useMemo(() => (current ? parseStory(current.generatedStoryJson) : {}), [current]);
  const locations = useMemo(() => extractLocations(story), [story]);
  const suspectNames = useMemo(() => (story.suspects ?? []).map((s) => s.name), [story]);
  const currentLocation = current?.currentLocation ?? null;
  const suspectMap = useMemo(() => buildSuspectLocationMap(story), [story]);
  const suspectsHere = useMemo(() => getSuspectsAtLocation(suspectMap, currentLocation), [suspectMap, currentLocation]);

  const totalMinutes = current ? (current.gameEndHour - current.gameStartHour) * 60 : 0;
  const remainingMinutes = current ? Math.max(0, totalMinutes - current.gameMinutesUsed) : 0;
  const isTimeUp = current ? current.gameMinutesUsed >= totalMinutes : false;
  const isActive = current?.status === 'ACTIVE';

  useEffect(() => {
    if (current && current.status !== 'ACTIVE') {
      navigate(`/result/${id}`);
    }
  }, [current?.status, id, navigate]);

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
    return <div className="min-h-[60vh] grid place-items-center text-gray-400">세션 불러오는 중...</div>;
  }

  const caseTitle = story.title ?? `Case #${current.id}`;

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
              <span className={`px-2 py-1 rounded-md text-xs font-bold border ${isActive ? 'border-emerald-400/60 text-emerald-300 bg-emerald-900/20' : 'border-red-400/60 text-red-300 bg-red-900/20'}`}>
                {statusLabel(current.status)}
              </span>
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
                  <h2 className="text-sm font-semibold text-gray-100">수사 컨트롤</h2>
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-500/60 text-gray-200 hover:bg-white/10 transition-colors"
                    disabled={!isActive}
                  >
                    위치 이동
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                  장소를 이동하고 용의자를 심문해 단서를 확보한 뒤, 시간이 끝나기 전에 범인을 지목하세요.
                </p>
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-100">{s.name}</p>
                          <span className="text-[10px] uppercase tracking-wide text-gray-300">대화</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          {s.age ? `${s.age}세` : '나이 미상'}{s.personality ? ` / ${s.personality}` : ''}
                        </p>
                        {s.background && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{s.background}</p>}
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

