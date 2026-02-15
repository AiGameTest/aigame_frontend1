import type { EvidenceItem } from '../api/types';

export function EvidenceModal({ open, onClose, evidence }: { open: boolean; onClose: () => void; evidence: EvidenceItem[] }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg">
        <h3 className="font-bold text-lg text-white">📋 증거 보드</h3>
        <p className="text-sm text-gray-400 mt-1">수사 중 발견한 증거 목록입니다.</p>
        <div className="mt-4 space-y-2 max-h-80 overflow-auto">
          {evidence.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">아직 발견된 증거가 없습니다.</p>
          )}
          {evidence.map((e) => (
            <div key={e.id} className="bg-dark-surface border border-dark-border rounded-lg p-3">
              <p className="font-semibold text-white text-sm">{e.title}</p>
              <p className="text-sm text-gray-400 mt-1">{e.detail}</p>
            </div>
          ))}
        </div>
        <button className="btn mt-5" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
