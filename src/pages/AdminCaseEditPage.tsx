import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminGetCase,
  adminGetUserCase,
  adminUpdateCase,
  adminUpdateUserCaseByAdmin,
  uploadFile,
} from '../api/client';
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

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}

export function AdminCaseEditPage() {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const numericId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [previewNarrative, setPreviewNarrative] = useState('');
  const [, setBaseStoryJson] = useState('');

  const [summary, setSummary] = useState('');
  const [setting, setSetting] = useState('');
  const [victimName, setVictimName] = useState('');
  const [victimDescription, setVictimDescription] = useState('');
  const [suspects, setSuspects] = useState<SuspectSeed[]>([createSuspect(), createSuspect()]);
  const [published, setPublished] = useState(false);

  const [gameStartHour, setGameStartHour] = useState(12);
  const [gameEndHour, setGameEndHour] = useState(18);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailCropX, setThumbnailCropX] = useState<number | null>(null);
  const [thumbnailCropY, setThumbnailCropY] = useState<number | null>(null);
  const [thumbnailCropWidth, setThumbnailCropWidth] = useState<number | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const isBasic = type === 'basic';
  const isUser = type === 'user';
  const hasThumbnailCrop =
    thumbnailUrl !== '' &&
    thumbnailCropX != null &&
    thumbnailCropY != null &&
    thumbnailCropWidth != null;

  useEffect(() => {
    if ((!isBasic && !isUser) || !Number.isFinite(numericId)) {
      setError('잘못된 편집 경로입니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (isBasic) {
      adminGetCase(numericId)
        .then((c) => {
          setTitle(c.title);
          setDescription(c.description);
          setDifficulty(c.difficulty);
          setPreviewNarrative(c.previewNarrative);
          setBaseStoryJson(c.baseStoryJson);
          try {
            const parsed = JSON.parse(c.baseStoryJson);
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
                  timeline: Array.isArray(s.timeline) && s.timeline.length > 0 ? s.timeline : [createTimeline()],
                }))
              );
            }
          } catch {
            // baseStoryJson이 유효한 JSON이 아니면 무시
          }
          setGameStartHour(c.gameStartHour);
          setGameEndHour(c.gameEndHour);
          setThumbnailUrl(c.thumbnailUrl ?? '');
          setThumbnailCropX(c.thumbnailCropX ?? null);
          setThumbnailCropY(c.thumbnailCropY ?? null);
          setThumbnailCropWidth(c.thumbnailCropWidth ?? null);
        })
        .catch(() => setError('기본 사건 정보를 불러오지 못했습니다.'))
        .finally(() => setLoading(false));
      return;
    }

    adminGetUserCase(numericId)
      .then((c) => {
        setTitle(c.title);
        setSummary(c.summary);
        setPublished(c.published);
        setGameStartHour(c.gameStartHour);
        setGameEndHour(c.gameEndHour);
        setThumbnailUrl(c.thumbnailUrl ?? '');
        setThumbnailCropX(c.thumbnailCropX ?? null);
        setThumbnailCropY(c.thumbnailCropY ?? null);
        setThumbnailCropWidth(c.thumbnailCropWidth ?? null);

        try {
          const parsed = JSON.parse(c.scenarioPrompt);
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
                timeline: Array.isArray(s.timeline) && s.timeline.length > 0 ? s.timeline : [createTimeline()],
              }))
            );
          }
        } catch {
          setError('기존 scenarioPrompt가 JSON 형식이 아니라 구조 편집으로 완전 복원하지 못했습니다.');
        }
      })
      .catch(() => setError('유저 사건 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [isBasic, isUser, numericId]);

  function addSuspect() {
    setSuspects((prev) => [...prev, createSuspect()]);
  }

  function removeSuspect(index: number) {
    setSuspects((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSuspect(index: number, patch: Partial<SuspectSeed>) {
    setSuspects((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addTimeline(suspectIndex: number) {
    setSuspects((prev) =>
      prev.map((s, i) => (i === suspectIndex ? { ...s, timeline: [...s.timeline, createTimeline()] } : s))
    );
  }

  function removeTimeline(suspectIndex: number, timelineIndex: number) {
    setSuspects((prev) =>
      prev.map((s, i) =>
        i === suspectIndex ? { ...s, timeline: s.timeline.filter((_, ti) => ti !== timelineIndex) } : s
      )
    );
  }

  function updateTimeline(suspectIndex: number, timelineIndex: number, patch: Partial<TimelineItem>) {
    setSuspects((prev) =>
      prev.map((s, i) => {
        if (i !== suspectIndex) return s;
        return {
          ...s,
          timeline: s.timeline.map((t, ti) => (ti === timelineIndex ? { ...t, ...patch } : t)),
        };
      })
    );
  }

  async function handleImageUpload(suspectIndex: number, file: File) {
    setUploading((prev) => ({ ...prev, [`s${suspectIndex}`]: true }));
    try {
      const { url } = await uploadFile(file, 'suspects');
      updateSuspect(suspectIndex, { imageUrl: url });
    } catch {
      setError('용의자 이미지 업로드에 실패했습니다.');
    } finally {
      setUploading((prev) => ({ ...prev, [`s${suspectIndex}`]: false }));
    }
  }

  async function handleThumbnailUpload(file: File) {
    setUploadingThumbnail(true);
    try {
      const { url } = await uploadFile(file, 'thumbnails');
      setThumbnailUrl(url);
      // 새 이미지로 교체 시 이전 크롭 좌표 초기화
      setThumbnailCropX(null);
      setThumbnailCropY(null);
      setThumbnailCropWidth(null);
    } catch {
      setError('썸네일 업로드에 실패했습니다.');
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(numericId)) return;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (isBasic) {
        const composedBaseStoryJson = JSON.stringify({
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
        }, null, 2);

        await adminUpdateCase(numericId, {
          title,
          description,
          difficulty,
          previewNarrative,
          baseStoryJson: composedBaseStoryJson,
          gameStartHour,
          gameEndHour,
          thumbnailUrl: thumbnailUrl || '',
          thumbnailCropX: thumbnailCropX ?? undefined,
          thumbnailCropY: thumbnailCropY ?? undefined,
          thumbnailCropWidth: thumbnailCropWidth ?? undefined,
        });
      } else {
        const scenarioPrompt = JSON.stringify(
          {
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
          },
          null,
          2
        );

        await adminUpdateUserCaseByAdmin(numericId, {
          title,
          summary,
          scenarioPrompt,
          published,
          gameStartHour,
          gameEndHour,
          thumbnailUrl: thumbnailUrl || '',
          thumbnailCropX: thumbnailCropX ?? undefined,
          thumbnailCropY: thumbnailCropY ?? undefined,
          thumbnailCropWidth: thumbnailCropWidth ?? undefined,
        });
      }
      setMessage('저장되었습니다.');
      navigate("/admin");
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-gray-400">편집 정보를 불러오는 중...</div>;
  }

  return (
    <>
      <form className="max-w-4xl mx-auto space-y-5" onSubmit={onSubmit}>
        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-white">{isBasic ? '기본 사건 편집' : '유저 사건 편집'}</h1>
            <button type="button" className="btn-outline" onClick={() => navigate('/admin')}>목록으로</button>
          </div>

          <input className="input" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />

          {isBasic ? (
            <>
              <textarea className="input" rows={3} placeholder="설명" value={description} onChange={(e) => setDescription(e.target.value)} />
              <input className="input" placeholder="난이도 (EASY/MEDIUM/HARD)" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
              <textarea className="input" rows={5} placeholder="미리보기 내러티브" value={previewNarrative} onChange={(e) => setPreviewNarrative(e.target.value)} />
              <textarea className="input" rows={4} placeholder="사건 배경" value={setting} onChange={(e) => setSetting(e.target.value)} />
              <div className="grid md:grid-cols-2 gap-3">
                <input className="input" placeholder="피해자 이름" value={victimName} onChange={(e) => setVictimName(e.target.value)} />
                <input className="input" placeholder="피해자 설명" value={victimDescription} onChange={(e) => setVictimDescription(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <textarea className="input" rows={3} placeholder="요약" value={summary} onChange={(e) => setSummary(e.target.value)} />
              <textarea className="input" rows={4} placeholder="사건 배경" value={setting} onChange={(e) => setSetting(e.target.value)} />
              <div className="grid md:grid-cols-2 gap-3">
                <input className="input" placeholder="피해자 이름" value={victimName} onChange={(e) => setVictimName(e.target.value)} />
                <input className="input" placeholder="피해자 설명" value={victimDescription} onChange={(e) => setVictimDescription(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                게시 상태
              </label>
            </>
          )}
        </div>

        {(isBasic || isUser) && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">용의자 및 동선</h2>
              <button type="button" className="btn-outline" onClick={addSuspect}>용의자 추가</button>
            </div>

            {suspects.map((s, idx) => (
              <div key={idx} className="rounded-xl border border-dark-border bg-dark-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-200">용의자 #{idx + 1}</p>
                  {suspects.length > 2 && (
                    <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => removeSuspect(idx)}>
                      삭제
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <input className="input" placeholder="이름" value={s.name} onChange={(e) => updateSuspect(idx, { name: e.target.value })} />
                  <input className="input" placeholder="성격" value={s.personality} onChange={(e) => updateSuspect(idx, { personality: e.target.value })} />
                  <input className="input" placeholder="배경/관계" value={s.background} onChange={(e) => updateSuspect(idx, { background: e.target.value })} />
                </div>

                <div className="flex items-center gap-3">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name || '용의자'} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-white/20 bg-zinc-900 flex items-center justify-center text-xs text-gray-500">
                      이미지
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[idx] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleImageUpload(idx, file);
                        e.currentTarget.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      disabled={uploading[`s${idx}`]}
                    >
                      {uploading[`s${idx}`] ? '업로드 중...' : s.imageUrl ? '사진 변경' : '사진 업로드'}
                    </button>
                    {s.imageUrl && (
                      <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => updateSuspect(idx, { imageUrl: '' })}>
                        사진 삭제
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">동선</p>
                    <button type="button" className="text-xs text-accent-pink hover:opacity-80" onClick={() => addTimeline(idx)}>
                      동선 추가
                    </button>
                  </div>

                  {s.timeline.map((t, tIdx) => (
                    <div key={tIdx} className="grid md:grid-cols-[120px_1fr_1fr_auto] gap-2">
                      <input className="input" placeholder="시간 (예: 20:10)" value={t.time} onChange={(e) => updateTimeline(idx, tIdx, { time: e.target.value })} />
                      <input className="input" placeholder="장소" value={t.location} onChange={(e) => updateTimeline(idx, tIdx, { location: e.target.value })} />
                      <input className="input" placeholder="행동" value={t.action} onChange={(e) => updateTimeline(idx, tIdx, { action: e.target.value })} />
                      <button
                        type="button"
                        className="px-2 py-1 rounded border border-dark-border text-gray-300 hover:text-white"
                        onClick={() => removeTimeline(idx, tIdx)}
                        disabled={s.timeline.length <= 1}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-white">시간 설정</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작 시간</label>
              <select className="input" value={gameStartHour} onChange={(e) => setGameStartHour(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{formatHour(i)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">종료 시간</label>
              <select className="input" value={gameEndHour} onChange={(e) => setGameEndHour(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => i + 1).filter((h) => h > gameStartHour).map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-white">썸네일</h2>
          <div className="flex items-center gap-3">
            {thumbnailUrl ? (
              hasThumbnailCrop ? (
                <div className="relative w-28 aspect-[16/10] rounded-lg overflow-hidden border border-white/10">
                  <CroppedThumbnail
                    src={thumbnailUrl}
                    alt="썸네일"
                    cropX={thumbnailCropX!}
                    cropY={thumbnailCropY!}
                    cropWidth={thumbnailCropWidth!}
                  />
                </div>
              ) : (
                <div className="relative w-28 aspect-[16/10] rounded-lg overflow-hidden border border-white/10">
                  <img src={thumbnailUrl} alt="썸네일" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )
            ) : (
              <div className="relative w-28 aspect-[16/10] rounded-lg border border-dashed border-white/20 bg-zinc-900">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">미리보기</div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer">
                {uploadingThumbnail ? '업로드 중...' : thumbnailUrl ? '썸네일 변경' : '썸네일 업로드'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingThumbnail}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleThumbnailUpload(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              {thumbnailUrl && (
                <>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-md border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
                    onClick={() => setShowCropModal(true)}
                  >
                    {thumbnailCropWidth != null ? '위치 재조절' : '위치 조절'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => {
                      setThumbnailUrl('');
                      setThumbnailCropX(null);
                      setThumbnailCropY(null);
                      setThumbnailCropWidth(null);
                    }}
                  >
                    썸네일 삭제
                  </button>
                </>
              )}
            </div>
          </div>
          {thumbnailCropWidth != null && (
            <p className="text-xs text-gray-500">
              크롭 위치 설정됨 (x={thumbnailCropX?.toFixed(3)}, y={thumbnailCropY?.toFixed(3)}, w={thumbnailCropWidth?.toFixed(3)})
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn" type="submit" disabled={saving}>{saving ? '저장 중...' : '저장하기'}</button>
          <button type="button" className="btn-outline" onClick={() => navigate('/admin')}>취소</button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-green-400">{message}</p>}
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
