import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { createUserCase, getUserCase, publishUserCase, updateUserCase, uploadFile } from '../api/client';
import { ThumbnailCropModal } from '../components/ThumbnailCropModal';
import { CroppedThumbnail } from '../components/CroppedThumbnail';

interface TimelineItem {
  time: string;
  location: string;
  action: string;
}

interface SuspectSeed {
  name: string;
  personality: string;
  background: string;
  imageUrl: string;
  timeline: TimelineItem[];
}

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}

function createTimeline(): TimelineItem {
  return { time: '20:00', location: '', action: '' };
}

function createSuspect(): SuspectSeed {
  return {
    name: '',
    personality: '',
    background: '',
    imageUrl: '',
    timeline: [createTimeline()],
  };
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-paper border border-ghost p-6 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-detail text-xs text-faded tracking-widest uppercase mb-1.5"
       style={{ fontFamily: "'Noto Serif KR', serif" }}>
      {children}
    </p>
  );
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  minRows = 1,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  return (
    <textarea
      ref={ref}
      className={`noir-input resize-none overflow-hidden ${className}`}
      style={{ minHeight: `${minRows * 2.5}rem` }}
      rows={minRows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => { onChange(e.target.value); resize(); }}
    />
  );
}

export function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('editId');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [setting, setSetting] = useState('');
  const [victimName, setVictimName] = useState('');
  const [victimDescription, setVictimDescription] = useState('');
  const [suspects, setSuspects] = useState<SuspectSeed[]>([createSuspect(), createSuspect()]);
  const [gameStartHour, setGameStartHour] = useState(12);
  const [gameEndHour, setGameEndHour] = useState(18);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailCropX, setThumbnailCropX] = useState<number | null>(null);
  const [thumbnailCropY, setThumbnailCropY] = useState<number | null>(null);
  const [thumbnailCropWidth, setThumbnailCropWidth] = useState<number | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editId) return;
    const id = Number(editId);
    if (isNaN(id)) return;
    setLoadingDraft(true);
    getUserCase(id)
      .then((draft) => {
        setDraftId(draft.id);
        setTitle(draft.title);
        setSummary(draft.summary);
        setGameStartHour(draft.gameStartHour);
        setGameEndHour(draft.gameEndHour);
        setThumbnailUrl(draft.thumbnailUrl ?? '');
        setThumbnailCropX(draft.thumbnailCropX ?? null);
        setThumbnailCropY(draft.thumbnailCropY ?? null);
        setThumbnailCropWidth(draft.thumbnailCropWidth ?? null);
        try {
          const parsed = JSON.parse(draft.scenarioPrompt);
          setSetting(parsed.setting ?? '');
          setVictimName(parsed.victim?.name ?? '');
          setVictimDescription(parsed.victim?.description ?? '');
          if (Array.isArray(parsed.suspects) && parsed.suspects.length > 0) {
            setSuspects(
              parsed.suspects.map((s: { name?: string; personality?: string; background?: string; imageUrl?: string; timeline?: TimelineItem[] }) => ({
                name: s.name ?? '',
                personality: s.personality ?? '',
                background: s.background ?? '',
                imageUrl: s.imageUrl ?? '',
                timeline: Array.isArray(s.timeline) && s.timeline.length > 0
                  ? s.timeline
                  : [createTimeline()],
              }))
            );
          }
        } catch {
          // scenarioPrompt is not JSON, leave fields as-is
        }
      })
      .catch(() => setError('사건 정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoadingDraft(false));
  }, [editId]);

  const totalHours = gameEndHour - gameStartHour;
  const hasThumbnailCrop =
    thumbnailUrl !== '' &&
    thumbnailCropX != null &&
    thumbnailCropY != null &&
    thumbnailCropWidth != null;

  const scenarioPrompt = useMemo(() => {
    const seed = {
      title,
      setting,
      victim: {
        name: victimName,
        description: victimDescription,
      },
      suspects: suspects.map((s) => ({
        name: s.name,
        personality: s.personality,
        background: s.background,
        ...(s.imageUrl ? { imageUrl: s.imageUrl } : {}),
        timeline: s.timeline,
      })),
      note: 'killer, evidence, solution are generated by AI at session start',
    };
    return JSON.stringify(seed, null, 2);
  }, [title, setting, victimName, victimDescription, suspects]);

  function validate(): boolean {
    if (!title.trim() || !summary.trim() || !setting.trim()) {
      setError('사건 제목, 요약, 배경은 필수입니다.');
      return false;
    }
    if (suspects.length < 2) {
      setError('용의자는 최소 2명 이상 필요합니다.');
      return false;
    }
    for (const s of suspects) {
      if (!s.name.trim() || !s.personality.trim()) {
        setError('모든 용의자에 이름과 성격을 입력해 주세요.');
        return false;
      }
      if (s.timeline.length === 0) {
        setError('각 용의자마다 최소 1개 이상의 동선을 입력해 주세요.');
        return false;
      }
      for (const t of s.timeline) {
        if (!t.time.trim() || !t.location.trim() || !t.action.trim()) {
          setError('동선의 시간/장소/행동을 모두 입력해 주세요.');
          return false;
        }
      }
    }
    setError('');
    return true;
  }

  async function saveAndPublish(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const saved = draftId
        ? await updateUserCase(draftId, {
            title, summary, scenarioPrompt, gameStartHour, gameEndHour,
            thumbnailUrl: thumbnailUrl || undefined,
            thumbnailCropX: thumbnailCropX ?? undefined,
            thumbnailCropY: thumbnailCropY ?? undefined,
            thumbnailCropWidth: thumbnailCropWidth ?? undefined,
          })
        : await createUserCase({
            title, summary, scenarioPrompt, gameStartHour, gameEndHour,
            thumbnailUrl: thumbnailUrl || undefined,
            thumbnailCropX: thumbnailCropX ?? undefined,
            thumbnailCropY: thumbnailCropY ?? undefined,
            thumbnailCropWidth: thumbnailCropWidth ?? undefined,
          });

      setDraftId(saved.id);
      const published = await publishUserCase(saved.id);
      setMessage(`사건 #${published.id} 게시 완료`);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const body = err.response.data as { error?: string; message?: string };
        const detail = body.error || body.message;
        setError(detail ? `오류: ${detail}` : '저장 또는 게시에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setError('저장 또는 게시에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function addSuspect() { setSuspects((prev) => [...prev, createSuspect()]); }
  function removeSuspect(index: number) { setSuspects((prev) => prev.filter((_, i) => i !== index)); }
  function updateSuspect(index: number, patch: Partial<SuspectSeed>) {
    setSuspects((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleImageUpload(suspectIndex: number, file: File) {
    setUploading((prev) => ({ ...prev, [`s${suspectIndex}`]: true }));
    try {
      const { url } = await uploadFile(file);
      updateSuspect(suspectIndex, { imageUrl: url });
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading((prev) => ({ ...prev, [`s${suspectIndex}`]: false }));
    }
  }

  async function handleThumbnailUpload(file: File) {
    setUploading((prev) => ({ ...prev, thumbnail: true }));
    try {
      const { url } = await uploadFile(file, 'thumbnails');
      setThumbnailUrl(url);
      setThumbnailCropX(null);
      setThumbnailCropY(null);
      setThumbnailCropWidth(null);
    } catch {
      setError('썸네일 업로드에 실패했습니다.');
    } finally {
      setUploading((prev) => ({ ...prev, thumbnail: false }));
    }
  }

  function addTimeline(suspectIndex: number) {
    setSuspects((prev) =>
      prev.map((s, i) =>
        i === suspectIndex ? { ...s, timeline: [...s.timeline, createTimeline()] } : s
      )
    );
  }

  function removeTimeline(suspectIndex: number, timelineIndex: number) {
    setSuspects((prev) =>
      prev.map((s, i) =>
        i === suspectIndex
          ? { ...s, timeline: s.timeline.filter((_, ti) => ti !== timelineIndex) }
          : s
      )
    );
  }

  function updateTimeline(suspectIndex: number, timelineIndex: number, patch: Partial<TimelineItem>) {
    setSuspects((prev) =>
      prev.map((s, i) => {
        if (i !== suspectIndex) return s;
        return { ...s, timeline: s.timeline.map((t, ti) => (ti === timelineIndex ? { ...t, ...patch } : t)) };
      })
    );
  }

  return (
    <>
    <form className="max-w-4xl mx-auto space-y-5 py-8" onSubmit={saveAndPublish}>

      {/* 로딩 */}
      {loadingDraft && (
        <div className="text-center py-8">
          <p className="font-detail text-xs text-faded tracking-widest" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            사건 정보를 불러오는 중...
          </p>
        </div>
      )}

      {/* 기본 정보 */}
      <SectionCard>
        <div>
          <p className="badge-file mb-3">{editId ? 'CASE EDIT' : 'NEW CASE'}</p>
          <h1 className="font-headline text-2xl text-amber">{editId ? '사건 수정' : '사건 설계'}</h1>
          <p className="font-body text-sm text-faded mt-1 italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            배경·인물·동선을 직접 작성하면, 게임 시작 시 AI가 범인과 증거를 매번 새롭게 생성합니다.
          </p>
        </div>

        <div className="h-px bg-ghost/50" />

        <div className="space-y-3">
          <div>
            <FieldLabel>사건 제목 *</FieldLabel>
            <input
              className="noir-input"
              placeholder="예: 저택의 망령"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>사건 요약 *</FieldLabel>
            <textarea
              className="noir-input resize-none"
              placeholder="사건 카드에 표시될 짧은 소개문"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <FieldLabel>사건 배경 *</FieldLabel>
            <textarea
              className="noir-input resize-none"
              placeholder="장소, 분위기, 사건 상황 등 AI가 참고할 배경 설명"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        {/* 썸네일 */}
        <div>
          <FieldLabel>썸네일 이미지 (선택)</FieldLabel>
          <div className="flex items-start gap-4">
            {thumbnailUrl ? (
              <div className="relative w-28 aspect-[16/10] overflow-hidden border border-ghost flex-shrink-0">
                {hasThumbnailCrop ? (
                  <CroppedThumbnail
                    src={thumbnailUrl} alt="썸네일"
                    cropX={thumbnailCropX!} cropY={thumbnailCropY!} cropWidth={thumbnailCropWidth!}
                  />
                ) : (
                  <img src={thumbnailUrl} alt="썸네일" className="absolute inset-0 w-full h-full object-cover"
                       style={{ filter: 'sepia(0.3) brightness(0.8)' }} />
                )}
              </div>
            ) : (
              <div className="w-28 aspect-[16/10] border border-dashed border-ghost bg-shadow flex-shrink-0 flex items-center justify-center">
                <span className="font-detail text-xs text-ghost">미리보기</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleThumbnailUpload(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="btn-secondary py-1.5 px-3 text-xs"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploading['thumbnail']}
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                {uploading['thumbnail'] ? '업로드 중...' : thumbnailUrl ? '썸네일 변경' : '썸네일 업로드'}
              </button>
              {thumbnailUrl && (
                <>
                  <button
                    type="button"
                    className="btn-ghost py-1.5 px-3 text-xs"
                    onClick={() => setShowCropModal(true)}
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                  >
                    {thumbnailCropWidth != null ? '위치 재조절' : '위치 조절'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-crimson/70 hover:text-crimson transition-colors text-left"
                    onClick={() => {
                      setThumbnailUrl('');
                      setThumbnailCropX(null);
                      setThumbnailCropY(null);
                      setThumbnailCropWidth(null);
                    }}
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                  >
                    썸네일 삭제
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 피해자 */}
      <SectionCard>
        <h2 className="font-headline text-lg text-sepia">피해자 정보 <span className="font-detail text-xs text-faded">(선택)</span></h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <FieldLabel>이름</FieldLabel>
            <input
              className="noir-input"
              placeholder="피해자 이름"
              value={victimName}
              onChange={(e) => setVictimName(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>설명</FieldLabel>
            <input
              className="noir-input"
              placeholder="피해자 설명"
              value={victimDescription}
              onChange={(e) => setVictimDescription(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* 용의자 */}
      <SectionCard className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg text-sepia">용의자 및 동선</h2>
          <button type="button" className="btn-secondary py-1.5 px-4 text-xs" onClick={addSuspect}
                  style={{ fontFamily: "'Noto Serif KR', serif" }}>
            + 용의자 추가
          </button>
        </div>

        {suspects.map((s, idx) => (
          <div key={idx} className="border border-ghost bg-shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-detail text-xs text-gold-dim tracking-widest uppercase">
                SUSPECT #{String(idx + 1).padStart(2, '0')}
              </span>
              {suspects.length > 2 && (
                <button type="button"
                  className="text-xs text-crimson/60 hover:text-crimson transition-colors"
                  onClick={() => removeSuspect(idx)}
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  삭제
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <FieldLabel>이름 *</FieldLabel>
                <input className="noir-input" placeholder="이름" value={s.name}
                  onChange={(e) => updateSuspect(idx, { name: e.target.value })} />
              </div>
              <div>
                <FieldLabel>성격 *</FieldLabel>
                <AutoResizeTextarea placeholder="성격" value={s.personality}
                  onChange={(val) => updateSuspect(idx, { personality: val })} />
              </div>
              <div>
                <FieldLabel>배경/관계</FieldLabel>
                <AutoResizeTextarea placeholder="배경/관계" value={s.background}
                  onChange={(val) => updateSuspect(idx, { background: val })} />
              </div>
            </div>

            {/* 이미지 */}
            <div className="flex items-center gap-4">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt={s.name || '용의자'}
                  className="w-16 h-16 object-cover border border-ghost flex-shrink-0"
                  style={{ filter: 'sepia(0.3) brightness(0.85)' }} />
              ) : (
                <div className="w-16 h-16 border border-ghost bg-void flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-8 h-8" fill="none">
                    <circle cx="40" cy="28" r="14" fill="#3d3428" />
                    <path d="M16 72 C16 52 28 44 40 44 C52 44 64 52 64 72" fill="#3d3428" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <input
                  ref={(el) => { fileInputRefs.current[idx] = el; }}
                  type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(idx, file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost py-1.5 px-3 text-xs"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  disabled={uploading[`s${idx}`]}
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  {uploading[`s${idx}`] ? '업로드 중...' : s.imageUrl ? '사진 변경' : '사진 업로드'}
                </button>
                {s.imageUrl && (
                  <button type="button"
                    className="text-xs text-crimson/60 hover:text-crimson transition-colors text-left"
                    onClick={() => updateSuspect(idx, { imageUrl: '' })}
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                  >
                    사진 삭제
                  </button>
                )}
              </div>
            </div>

            {/* 동선 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>동선</FieldLabel>
                <button type="button"
                  className="font-detail text-xs text-gold-dim hover:text-gold transition-colors"
                  onClick={() => addTimeline(idx)}
                >
                  + 동선 추가
                </button>
              </div>
              {s.timeline.map((t, tIdx) => (
                <div key={tIdx} className="grid md:grid-cols-[130px_1fr_1fr_auto] gap-2">
                  <input className="noir-input py-2.5" placeholder="시간 (예: 20:10)" value={t.time}
                    onChange={(e) => updateTimeline(idx, tIdx, { time: e.target.value })} />
                  <AutoResizeTextarea placeholder="장소" value={t.location}
                    onChange={(val) => updateTimeline(idx, tIdx, { location: val })} />
                  <AutoResizeTextarea placeholder="행동" value={t.action}
                    onChange={(val) => updateTimeline(idx, tIdx, { action: val })} />
                  <button
                    type="button"
                    className="px-3 py-2.5 border border-ghost text-xs text-faded hover:text-crimson hover:border-crimson/40 transition-colors disabled:opacity-30"
                    onClick={() => removeTimeline(idx, tIdx)}
                    disabled={s.timeline.length <= 1}
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>

      {/* 게임 시간 */}
      <SectionCard>
        <h2 className="font-headline text-lg text-sepia">게임 시간 설정</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>시작 시간</FieldLabel>
            <select className="noir-select" value={gameStartHour}
              onChange={(e) => setGameStartHour(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{formatHour(i)}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>종료 시간</FieldLabel>
            <select className="noir-select" value={gameEndHour}
              onChange={(e) => setGameEndHour(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, i) => i + 1).filter((h) => h > gameStartHour).map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="font-detail text-xs text-faded" style={{ fontFamily: "'Noto Serif KR', serif" }}>
          총 {totalHours}시간 ({totalHours * 60}분) · 행동 1회당 15분 경과
        </p>
      </SectionCard>

      {/* 생성 규칙 안내 */}
      <div className="border border-ghost/50 bg-shadow/60 px-5 py-4">
        <p className="font-detail text-xs text-gold-dim tracking-widest uppercase mb-1.5">AI Generation Rule</p>
        <p className="font-body text-sm text-faded italic" style={{ fontFamily: "'Noto Serif KR', serif" }}>
          범인·증거·해설은 세션 시작 시 AI가 매번 새롭게 생성합니다.
        </p>
      </div>

      {/* 제출 */}
      <div className="flex flex-col gap-3">
        <button className="btn-primary py-3.5" type="submit" disabled={submitting}
                style={{ fontFamily: "'Noto Serif KR', serif" }}>
          {submitting ? '처리 중...' : '저장하고 게시하기'}
        </button>
        {error && (
          <p className="text-sm text-crimson" style={{ fontFamily: "'Noto Serif KR', serif" }}>{error}</p>
        )}
        {message && (
          <p className="text-sm text-amber" style={{ fontFamily: "'Noto Serif KR', serif" }}>{message}</p>
        )}
      </div>

    </form>

    {showCropModal && thumbnailUrl && (
      <ThumbnailCropModal
        imageUrl={thumbnailUrl}
        initialCrop={
          thumbnailCropX != null && thumbnailCropY != null && thumbnailCropWidth != null
            ? { cropX: thumbnailCropX, cropY: thumbnailCropY, cropWidth: thumbnailCropWidth }
            : undefined
        }
        onConfirm={({ cropX, cropY, cropWidth }) => {
          setThumbnailCropX(cropX);
          setThumbnailCropY(cropY);
          setThumbnailCropWidth(cropWidth);
        }}
        onClose={() => setShowCropModal(false)}
      />
    )}
    </>
  );
}
