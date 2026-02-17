import { FormEvent, useState } from 'react';
import { createUserCase, publishUserCase, updateUserCase } from '../api/client';

function formatHour(h: number): string {
  const period = h < 12 ? '오전' : '오후';
  const display = h <= 12 ? h : h - 12;
  return `${period} ${display === 0 ? 12 : display}시`;
}

export function CreatePage() {
  const [draftId, setDraftId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [gameStartHour, setGameStartHour] = useState(12);
  const [gameEndHour, setGameEndHour] = useState(18);
  const [message, setMessage] = useState('');

  async function createDraft(e: FormEvent) {
    e.preventDefault();
    const draft = await createUserCase({ title, summary, scenarioPrompt, gameStartHour, gameEndHour });
    setDraftId(draft.id);
    setMessage(`초안 #${draft.id}이(가) 생성되었습니다.`);
  }

  async function saveDraft() {
    if (!draftId) return;
    const draft = await updateUserCase(draftId, { title, summary, scenarioPrompt, gameStartHour, gameEndHour });
    setMessage(`초안 #${draft.id}이(가) 저장되었습니다.`);
  }

  async function publishDraft() {
    if (!draftId) return;
    const draft = await publishUserCase(draftId);
    setMessage(`초안 #${draft.id}이(가) 게시되었습니다.`);
  }

  const totalHours = gameEndHour - gameStartHour;

  return (
    <form className="card max-w-2xl mx-auto space-y-4" onSubmit={createDraft}>
      <h1 className="text-2xl font-bold text-white">✍️ 사건 만들기</h1>
      <p className="text-sm text-gray-400">나만의 추리 사건을 작성하고 커뮤니티에 공유하세요.</p>
      <input className="input" placeholder="사건 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" placeholder="사건 요약" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <textarea className="input" placeholder="시나리오 프롬프트 (상세 설정)" value={scenarioPrompt} onChange={(e) => setScenarioPrompt(e.target.value)} rows={8} />

      {/* Game Time Settings */}
      <div className="border-t border-dark-border pt-4">
        <label className="block text-sm font-semibold text-gray-300 mb-3">수사 시간 설정</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">시작 시각</label>
            <select
              className="input"
              value={gameStartHour}
              onChange={(e) => setGameStartHour(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{formatHour(i)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">종료 시각</label>
            <select
              className="input"
              value={gameEndHour}
              onChange={(e) => setGameEndHour(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).filter(h => h > gameStartHour).map(h => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          총 {totalHours}시간 ({totalHours * 60}분) · 행동당 15분 소모 · 최대 {Math.floor(totalHours * 60 / 15)}회 행동 가능
        </p>
      </div>

      <div className="flex gap-2">
        <button className="btn" type="submit">초안 생성</button>
        <button className="btn bg-pine" type="button" onClick={saveDraft} disabled={!draftId}>저장</button>
        <button className="btn bg-brass" type="button" onClick={publishDraft} disabled={!draftId}>게시</button>
      </div>
      {message && <p className="text-sm text-green-400">{message}</p>}
    </form>
  );
}
