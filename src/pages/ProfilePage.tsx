import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyCases, listMySessions } from '../api/client';
import type { SessionSummaryResponse, UserCaseDraftResponse } from '../api/types';
import { useAuthStore } from '../store/authStore';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '수사 중',
  WON: '해결',
  LOST: '미해결',
  CLOSED: '종료',
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'text-accent-pink',
  WON: 'text-green-400',
  LOST: 'text-red-400',
  CLOSED: 'text-gray-400',
};

const MODE_LABEL: Record<string, string> = {
  BASIC: '기본',
  AI: 'AI',
  USER: '유저',
};

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [myCases, setMyCases] = useState<UserCaseDraftResponse[]>([]);
  const [sessions, setSessions] = useState<SessionSummaryResponse[]>([]);

  useEffect(() => {
    listMyCases().then(setMyCases).catch(() => setMyCases([]));
    listMySessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  if (!user) return null;

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const pastSessions = sessions.filter((s) => s.status !== 'ACTIVE');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Profile */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h1 className="text-2xl font-bold text-white">내 정보</h1>
        <p className="text-gray-300 mt-1">닉네임 : {user.nickname}</p>
        <p className="text-gray-400 mt-2">Coins: <strong className="text-white">{user.coins}</strong></p>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-xl font-semibold text-white mb-3">진행 중인 수사</h2>
          <div className="space-y-2">
            {activeSessions.map((s) => (
              <div
                key={s.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-accent-pink/50 transition-colors"
                onClick={() => navigate(`/play/${s.id}`)}
              >
              {s.remainingQuestions}
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-card text-gray-300 mr-2">
                    {MODE_LABEL[s.mode] ?? s.mode}
                  </span>
                  <span className={`text-sm font-semibold ${STATUS_STYLE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">
                    질문 {s.questionsUsed}/{s.questionLimit} · 남은 질문 {s.remainingQuestions}회
                  </p>
                </div>
                <span className="text-accent-pink text-sm font-bold">이어하기 →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-xl font-semibold text-white mb-3">수사 기록</h2>
          <div className="space-y-2">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => navigate(`/result/${s.id}`)}
              >
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-card text-gray-300 mr-2">
                    {MODE_LABEL[s.mode] ?? s.mode}
                  </span>
                  <span className={`text-sm font-semibold ${STATUS_STYLE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">
                    질문 {s.questionsUsed}/{s.questionLimit}회 사용
                  </p>
                </div>
                <span className="text-gray-500 text-sm">결과 보기 →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Cases (user-created) */}
      {myCases.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-xl font-semibold text-white mb-3">My Cases</h2>
          <div className="space-y-2">
            {myCases.map((c) => (
              <div className="bg-dark-surface border border-dark-border rounded-lg p-3" key={c.id}>
                <p className="font-semibold text-white">{c.title}</p>
                <p className="text-sm text-gray-400">{c.summary}</p>
                <p className="text-xs mt-1 text-gray-500">{c.published ? 'Published' : 'Draft'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
