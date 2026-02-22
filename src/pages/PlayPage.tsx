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
  openingNarration?: string;
  suspects?: SuspectProfile[];
  evidence?: { title: string; detail: string; linkedTo: string; location: string }[];
}

interface SuspectChatItem {
  id: number;
  role: 'PLAYER' | 'SUSPECT';
  content: string;
  createdAt: string;
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

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractSuspectNameFromPlayerMessage(content: string, suspectNames: string[]): string | null {
  for (const name of suspectNames) {
    if (content.startsWith(`[${name}`)) {
      return name;
    }
  }
  return null;
}

function stripPlayerPrefix(content: string): string {
  const match = content.match(/^\[[^\]]+\]\s*/);
  if (!match) return content;
  return content.substring(match[0].length);
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
  const [chatLogSuspect, setChatLogSuspect] = useState<string | null>(null);
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

  const suspectChatMap = useMemo(() => {
    const map = new Map<string, SuspectChatItem[]>();
    if (!current) return map;

    let pendingSuspect: string | null = null;

    for (const msg of current.messages) {
      if (msg.role === 'SYSTEM') continue;

      if (msg.role === 'PLAYER') {
        const suspectName = extractSuspectNameFromPlayerMessage(msg.content, suspectNames);
        if (suspectName) {
          if (!map.has(suspectName)) map.set(suspectName, []);
          map.get(suspectName)!.push({
            id: msg.id,
            role: 'PLAYER',
            content: msg.content,
            createdAt: msg.createdAt,
          });
          pendingSuspect = suspectName;
        } else {
          pendingSuspect = null;
        }
        continue;
      }

      if (msg.role === 'SUSPECT' && pendingSuspect) {
        if (!map.has(pendingSuspect)) map.set(pendingSuspect, []);
        map.get(pendingSuspect)!.push({
          id: msg.id,
          role: 'SUSPECT',
          content: msg.content,
          createdAt: msg.createdAt,
        });
      }
      pendingSuspect = null;
    }

    return map;
  }, [current, suspectNames]);

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
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <div className="w-5 h-5 border border-gold-dim border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-detail text-xs tracking-[0.2em] uppercase text-faded">수사 파일 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const caseTitle = story.title ?? `Case #${current.id}`;
  const openingNarration = current.openingNarration ?? story.openingNarration ?? '';

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
    <div className="relative h-[calc(100vh-56px)] overflow-hidden border border-ghost bg-void">
      <div className="relative z-10 flex h-full flex-col">

        {/* Case Header */}
        <header className="border-b border-ghost bg-void/98 px-4 md:px-6 py-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-detail text-xs tracking-[0.2em] uppercase text-gold-dim">ACTIVE INVESTIGATION</span>
              <h1 className="font-headline text-lg md:text-xl text-sepia mt-0.5">{caseTitle}</h1>
            </div>
            <GameClock
              gameStartHour={current.gameStartHour}
              gameEndHour={current.gameEndHour}
              gameMinutesUsed={current.gameMinutesUsed}
              currentGameTime={current.currentGameTime}
            />
          </div>
        </header>

        {/* Stat Bar */}
        <div className="border-b border-ghost bg-shadow/80 px-4 md:px-6 py-2.5 shrink-0">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <StatCard label="현재 위치" value={currentLocation ?? '알 수 없음'} />
            <StatCard
              label="남은 시간"
              value={`${Math.floor(remainingMinutes / 60)}h ${String(remainingMinutes % 60).padStart(2, '0')}m`}
              urgent={isTimeUp}
            />
            <StatCard label="수집 단서" value={`${current.evidence.length}개`} highlight />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-20">
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-4">

            {/* Left Column */}
            <section className="space-y-4">

              {/* Opening narration */}
              {openingNarration && (
                <div className="border border-ghost bg-paper p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-file">사건 개요</span>
                  </div>
                  <p className="font-body italic text-sm text-sepia/80 leading-relaxed whitespace-pre-line">
                    {openingNarration}
                  </p>
                </div>
              )}

              {/* Locations */}
              <div className="border border-ghost bg-paper p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-sepia font-medium" style={{ fontFamily: "'Noto Serif KR', serif" }}>장소</span>
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="text-sm text-gold-dim border border-gold-dim/40 px-3 py-1.5 hover:border-gold-dim hover:text-amber transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                    disabled={!isActive}
                  >
                    위치 이동
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <span
                      key={loc}
                      className={`text-sm px-3 py-1.5 border transition-colors ${
                        loc === currentLocation
                          ? 'border-gold-dim/60 bg-gold/10 text-amber'
                          : 'border-ghost text-sepia/70'
                      }`}
                      style={{ fontFamily: "'Noto Serif KR', serif" }}
                    >
                      {loc === currentLocation && <span className="mr-1.5 text-gold-dim">◆</span>}
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suspects at current location */}
              <div className="border border-ghost bg-paper p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-sepia font-medium" style={{ fontFamily: "'Noto Serif KR', serif" }}>현재 장소의 용의자</span>
                  <span className="text-sm text-faded" style={{ fontFamily: "'Noto Serif KR', serif" }}>{suspectsHere.length}명</span>
                </div>

                {suspectsHere.length === 0 ? (
                  <p className="text-sm text-faded py-3 italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>이 장소에는 용의자가 없습니다.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {suspectsHere.map((s) => (
                      <button
                        key={s.name}
                        className="text-left border border-ghost bg-shadow hover:border-gold-dim hover:-translate-y-0.5 transition-all group p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleCharacterSelect(s.name)}
                        disabled={!isActive}
                      >
                        <div className="flex items-start gap-3">
                          {s.imageUrl ? (
                            <img
                              src={s.imageUrl}
                              alt={s.name}
                              className="w-12 h-14 object-cover border border-ghost flex-shrink-0"
                              style={{ filter: 'sepia(0.4) brightness(0.85)' }}
                            />
                          ) : (
                            <div className="w-12 h-14 bg-void border border-ghost flex-shrink-0 flex items-center justify-center">
                              <svg viewBox="0 0 48 64" className="w-8 h-10" fill="none">
                                <circle cx="24" cy="18" r="9" fill="#3d3428" />
                                <path d="M8 56 C8 38 16 30 24 30 C32 30 40 38 40 56" fill="#3d3428" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-headline text-base text-amber group-hover:text-gold transition-colors truncate">{s.name}</p>
                            <p className="text-sm text-sepia/70 mt-0.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                              {s.age ? `${s.age}세` : '나이 미상'}{s.personality ? ` / ${s.personality}` : ''}
                            </p>
                            {s.background && (
                              <p className="text-sm text-sepia/80 mt-1 line-clamp-2 italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>{s.background}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-ghost/50 flex justify-end">
                          <span className="font-label text-[13px] tracking-[0.2em] uppercase text-gold-dim group-hover:text-gold transition-colors">
                            심문하기 →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Found evidence result */}
              {foundEvidence !== null && (
                <div className={`border p-4 ${
                  foundEvidence.length > 0
                    ? 'border-gold-dim/50 bg-gold/5'
                    : 'border-ghost bg-shadow'
                }`}>
                  {foundEvidence.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge-open">새 단서 발견</span>
                      </div>
                      {foundEvidence.map((e) => (
                        <div key={e.id} className="mt-2">
                          <p className="font-label text-xs text-amber">{e.title}</p>
                          <p className="font-body italic text-sm text-sepia/80 mt-0.5">{e.detail}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="font-body italic text-sm text-faded text-center py-1">
                      이 장소에서 추가 단서를 찾지 못했습니다.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Right Sidebar */}
            <aside className="space-y-4">

              {/* Evidence Notebook */}
              <div className="border border-ghost bg-paper p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-sepia font-medium" style={{ fontFamily: "'Noto Serif KR', serif" }}>증거 수첩</span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
                  {current.evidence.length === 0 ? (
                    <p className="text-sm text-faded italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>아직 발견한 증거가 없습니다.</p>
                  ) : (
                    current.evidence.map((item) => (
                      <div key={item.id} className="border border-ghost/60 bg-shadow p-2.5">
                        <p className="text-sm text-amber font-medium" style={{ fontFamily: "'Noto Serif KR', 'Playfair Display', serif" }}>{item.title}</p>
                        <p className="text-sm text-sepia/85 mt-1 leading-relaxed line-clamp-3 italic" style={{ fontFamily: "'Noto Serif KR', 'IM Fell English', serif" }}>{item.detail}</p>
                        <p className="font-detail text-xs text-faded mt-1">{formatDateTime(item.discoveredAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-3 text-xs text-faded border-t border-ghost/40 pt-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  수집한 증거는 수사 종료 전까지 보관됩니다.
                </p>
              </div>

              {/* Interrogation Log */}
              <div className="border border-ghost bg-paper p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-sepia font-medium" style={{ fontFamily: "'Noto Serif KR', serif" }}>심문 기록</span>
                </div>
                <div className="space-y-2 max-h-[250px] overflow-auto pr-1">
                  {suspectNames.length === 0 ? (
                    <p className="text-sm text-faded italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>용의자 정보가 없습니다.</p>
                  ) : (
                    suspectNames.map((name) => {
                      const logs = suspectChatMap.get(name) ?? [];
                      const questionCount = logs.filter((l) => l.role === 'PLAYER').length;
                      const lastAt = logs.length > 0 ? logs[logs.length - 1].createdAt : null;
                      return (
                        <div key={name} className="border border-ghost/60 bg-shadow p-2.5 hover:border-gold-dim/40 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm text-sepia font-medium truncate" style={{ fontFamily: "'Noto Serif KR', serif" }}>{name}</p>
                              <p className="text-xs text-faded mt-0.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                                대화 {questionCount}회
                                {lastAt ? ` · ${formatDateTime(lastAt)}` : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setChatLogSuspect(name)}
                              disabled={logs.length === 0}
                              className="text-xs text-faded border border-ghost hover:border-gold-dim hover:text-gold-dim px-2.5 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ fontFamily: "'Noto Serif KR', serif" }}
                            >
                              보기
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="mt-3 text-xs text-faded border-t border-ghost/40 pt-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  용의자별 심문 기록을 확인할 수 있습니다.
                </p>
              </div>
            </aside>
          </div>
        </main>

        {/* Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 shrink-0">
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

      {/* Chat Log Modal */}
      {chatLogSuspect && (
        <div
          className="fixed inset-0 z-[70] bg-void/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setChatLogSuspect(null)}
        >
          <div
            className="w-full max-w-2xl border border-ghost bg-shadow overflow-hidden"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[1px] w-full bg-gold-dim" />
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-ghost">
              <div>
                <span className="font-detail text-xs tracking-[0.2em] uppercase text-gold-dim">TRANSCRIPT</span>
                <h3 className="font-headline text-lg text-sepia mt-0.5">{chatLogSuspect} 심문 기록</h3>
              </div>
              <button
                type="button"
                onClick={() => setChatLogSuspect(null)}
                className="text-sm text-faded border border-ghost hover:border-gold-dim hover:text-sepia px-3 py-1.5 transition-colors"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                닫기
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
              {(suspectChatMap.get(chatLogSuspect) ?? []).length === 0 ? (
                <p className="font-body italic text-sm text-faded text-center py-6">아직 기록이 없습니다.</p>
              ) : (
                (suspectChatMap.get(chatLogSuspect) ?? []).map((item) => (
                  <div
                    key={item.id}
                    className={`border p-3 ${
                      item.role === 'PLAYER'
                        ? 'border-gold-dim/30 bg-gold/5'
                        : 'border-ghost bg-paper'
                    }`}
                  >
                    <p className="text-xs text-faded mb-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      {item.role === 'PLAYER' ? '▶ 질문' : `◀ ${chatLogSuspect}`}
                    </p>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      item.role === 'PLAYER' ? 'text-sepia' : 'italic text-sepia/85'
                    }`} style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      {item.role === 'PLAYER' ? stripPlayerPrefix(item.content) : item.content}
                    </p>
                    <p className="font-detail text-xs text-faded mt-1.5">{formatDateTime(item.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, urgent, highlight }: { label: string; value: string; urgent?: boolean; highlight?: boolean }) {
  return (
    <div className={`border px-3 py-2.5 ${
      urgent ? 'border-crimson/40 bg-crimson/5' :
      highlight ? 'border-gold-dim/30 bg-gold/5' :
      'border-ghost bg-shadow'
    }`}>
      <p className="text-xs text-faded" style={{ fontFamily: "'Noto Serif KR', serif" }}>{label}</p>
      <p className={`text-base font-medium mt-0.5 truncate ${
        urgent ? 'text-crimson' :
        highlight ? 'text-amber' :
        'text-sepia'
      }`} style={{ fontFamily: "'Noto Serif KR', 'Playfair Display', serif" }}>{value}</p>
    </div>
  );
}
