import { FormEvent, useState } from 'react';
import { createUserCase, publishUserCase, updateUserCase } from '../api/client';

export function CreatePage() {
  const [draftId, setDraftId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [message, setMessage] = useState('');

  async function createDraft(e: FormEvent) {
    e.preventDefault();
    const draft = await createUserCase({ title, summary, scenarioPrompt });
    setDraftId(draft.id);
    setMessage(`초안 #${draft.id}이(가) 생성되었습니다.`);
  }

  async function saveDraft() {
    if (!draftId) return;
    const draft = await updateUserCase(draftId, { title, summary, scenarioPrompt });
    setMessage(`초안 #${draft.id}이(가) 저장되었습니다.`);
  }

  async function publishDraft() {
    if (!draftId) return;
    const draft = await publishUserCase(draftId);
    setMessage(`초안 #${draft.id}이(가) 게시되었습니다.`);
  }

  return (
    <form className="card max-w-2xl mx-auto space-y-4" onSubmit={createDraft}>
      <h1 className="text-2xl font-bold text-white">✍️ 사건 만들기</h1>
      <p className="text-sm text-gray-400">나만의 추리 사건을 작성하고 커뮤니티에 공유하세요.</p>
      <input className="input" placeholder="사건 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" placeholder="사건 요약" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <textarea className="input" placeholder="시나리오 프롬프트 (상세 설정)" value={scenarioPrompt} onChange={(e) => setScenarioPrompt(e.target.value)} rows={8} />
      <div className="flex gap-2">
        <button className="btn" type="submit">초안 생성</button>
        <button className="btn bg-pine" type="button" onClick={saveDraft} disabled={!draftId}>저장</button>
        <button className="btn bg-brass" type="button" onClick={publishDraft} disabled={!draftId}>게시</button>
      </div>
      {message && <p className="text-sm text-green-400">{message}</p>}
    </form>
  );
}
