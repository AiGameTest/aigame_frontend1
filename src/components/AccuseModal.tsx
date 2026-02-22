import { useState } from 'react';

export function AccuseModal({ open, suspects, onSubmit, onClose }: { open: boolean; suspects: string[]; onSubmit: (name: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('');
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-md border border-crimson/40 bg-shadow shadow-[0_24px_60px_rgba(139,26,26,0.3)]"
        style={{ boxShadow: '0 24px 60px rgba(139,26,26,0.25), inset 0 0 0 1px rgba(139,26,26,0.12)' }}
      >
        {/* 상단 크림슨 선 */}
        <div className="h-[2px] w-full bg-crimson" />

        <div className="p-6">
          <div className="mb-5">
            <span className="font-detail text-[10px] tracking-[0.25em] uppercase text-crimson/70">ACCUSATION</span>
            <h3 className="font-headline text-xl text-sepia mt-1">범인 지목</h3>
            <p className="font-body italic text-sm text-faded mt-1.5">
              신중하게 결정하십시오. 지목 후에는 되돌릴 수 없습니다.
            </p>
          </div>

          <div className="divider-ornate my-4">
            <span>✦</span>
          </div>

          <div className="space-y-1.5 mb-5">
            <label className="font-label text-[0.7rem] tracking-[0.2em] uppercase text-faded">용의자 선택</label>
            <select
              className="noir-select"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">— 용의자를 선택하세요 —</option>
              {suspects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              className="btn-danger flex-1"
              disabled={!value}
              onClick={() => onSubmit(value)}
            >
              지목 확정
            </button>
            <button className="btn-ghost px-6" onClick={onClose}>
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
