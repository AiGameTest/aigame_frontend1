import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminDeleteCase, adminDeleteUserCase, adminListCases, adminListUserCases } from '../api/client';
import type { AdminCaseTemplateResponse, UserCaseDraftResponse } from '../api/types';

function MetricRow({ playCount, recommendCount }: { playCount: number; recommendCount: number }) {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
      <span>▶ {playCount}</span>
      <span>♥ {recommendCount}</span>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<AdminCaseTemplateResponse[]>([]);
  const [userCases, setUserCases] = useState<UserCaseDraftResponse[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [basic, user] = await Promise.all([adminListCases(), adminListUserCases()]);
      setCases(basic);
      setUserCases(user);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return <div className="text-gray-400">관리자 목록을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">기본 사건 목록</h2>
          <span className="text-xs text-gray-500">총 {cases.length}개</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div key={c.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
              <div className="relative aspect-[16/10] bg-zinc-900">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">썸네일 없음</div>
                )}
                <span className="absolute top-2 left-2 badge badge-medium">{c.difficulty}</span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.description}</p>
                <MetricRow playCount={c.playCount ?? 0} recommendCount={c.recommendCount ?? 0} />
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline text-xs" onClick={() => navigate(`/admin/edit/basic/${c.id}`)}>수정</button>
                  <button
                    className="btn-outline text-xs text-red-300 border-red-400/30"
                    onClick={async () => {
                      if (!confirm(`기본 사건 #${c.id}를 삭제할까요?`)) return;
                      await adminDeleteCase(c.id);
                      setCases((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">유저 사건 목록</h2>
          <span className="text-xs text-gray-500">총 {userCases.length}개</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userCases.map((c) => (
            <div key={c.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
              <div className="relative aspect-[16/10] bg-zinc-900">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">썸네일 없음</div>
                )}
                <span className="absolute top-2 left-2 badge badge-medium">{c.published ? '게시됨' : '비공개'}</span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.summary}</p>
                <MetricRow playCount={c.playCount ?? 0} recommendCount={c.recommendCount ?? 0} />
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline text-xs" onClick={() => navigate(`/admin/edit/user/${c.id}`)}>수정</button>
                  <button
                    className="btn-outline text-xs text-red-300 border-red-400/30"
                    onClick={async () => {
                      if (!confirm(`유저 사건 #${c.id}를 삭제할까요?`)) return;
                      await adminDeleteUserCase(c.id);
                      setUserCases((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
