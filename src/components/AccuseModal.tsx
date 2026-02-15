import { useState } from 'react';

export function AccuseModal({ open, suspects, onSubmit, onClose }: { open: boolean; suspects: string[]; onSubmit: (name: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('');
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-lg text-white">⚖️ 범인 지목</h3>
        <p className="text-sm text-gray-400 mt-1">범인이라고 생각되는 용의자를 선택하세요.</p>
        <select className="input mt-4" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">용의자 선택...</option>
          {suspects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="mt-5 flex gap-2">
          <button className="btn" disabled={!value} onClick={() => onSubmit(value)}>확인</button>
          <button className="btn-outline" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
