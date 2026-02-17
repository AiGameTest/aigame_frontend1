import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyCases, listMySessions, updateNickname } from '../api/client';
import type { SessionSummaryResponse, UserCaseDraftResponse } from '../api/types';
import { useAuthStore } from '../store/authStore';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '진행 중',
  WON: '해결',
  LOST: '실패',
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
  USER: '사용자',
};

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const navigate = useNavigate();

  const [myCases, setMyCases] = useState<UserCaseDraftResponse[]>([]);
  const [sessions, setSessions] = useState<SessionSummaryResponse[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    listMyCases().then(setMyCases).catch(() => setMyCases([]));
    listMySessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (user) setNickname(user.nickname);
  }, [user]);

  const handleSaveNickname = async () => {
    if (!nickname.trim() || nickname === user?.nickname) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveMessage('');
    try {
      await updateNickname({ nickname: nickname.trim() });
      await bootstrap();
      setSaveMessage('닉네임이 변경되었습니다.');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('닉네임 변경에 실패했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const pastSessions = sessions.filter((s) => s.status !== 'ACTIVE');

  const wonSessions = sessions.filter((s) => s.status === 'WON').length;
  const totalSessions = sessions.length;
  const winRate = totalSessions > 0 ? Math.round((wonSessions / totalSessions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-dark-surface flex items-center justify-center text-3xl font-bold text-white border border-dark-border">
              {user.nickname.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="input text-lg font-bold max-w-[220px]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && void handleSaveNickname()}
                  />
                  <button
                    onClick={() => void handleSaveNickname()}
                    disabled={saving}
                    className="btn-outline text-xs px-3 py-1"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNickname(user.nickname);
                    }}
                    className="btn-outline text-xs px-3 py-1"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white">{user.nickname}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-accent-pink transition-colors p-1"
                    title="닉네임 수정"
                  >
                    수정
                  </button>
                </div>
              )}

              <p className="text-sm text-gray-400">{user.email}</p>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-accent-pink/20 text-accent-pink text-sm font-semibold border border-accent-pink/30">
                  {user.coins} Coins
                </span>
                {user.role === 'ADMIN' && (
                  <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-sm font-semibold border border-purple-600/30">
                    Admin
                  </span>
                )}
              </div>

              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('실패') ? 'text-red-400' : 'text-green-400'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{totalSessions}</p>
              <p className="text-xs text-gray-400">총 수사</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-green-400">{wonSessions}</p>
              <p className="text-xs text-gray-400">해결</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-accent-pink">{winRate}%</p>
              <p className="text-xs text-gray-400">성공률</p>
            </div>
          </div>
        </div>
      </div>

      {activeSessions.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-xl font-semibold text-white mb-3">진행 중인 수사</h2>
          <div className="space-y-2">
            {activeSessions.map((s) => (
              <div
                key={s.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-accent-pink/50"
                onClick={() => navigate(`/play/${s.id}`)}
              >
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-card text-gray-300 mr-2">
                    {MODE_LABEL[s.mode] ?? s.mode}
                  </span>
                  <span className={`text-sm font-semibold ${STATUS_STYLE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">
                    시작: {new Date(s.startedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <span className="text-accent-pink text-sm font-bold">이어하기</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pastSessions.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-xl font-semibold text-white mb-3">수사 기록</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-gray-500"
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
                    시작: {new Date(s.startedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <span className="text-gray-400 text-sm">결과 보기</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {myCases.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-xl font-semibold text-white mb-3">내가 만든 사건</h2>
          <div className="space-y-2">
            {myCases.map((c) => (
              <div className="bg-dark-surface border border-dark-border rounded-lg p-3" key={c.id}>
                <p className="font-semibold text-white">{c.title}</p>
                <p className="text-sm text-gray-400">{c.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${c.published ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'}`}>
                    {c.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && myCases.length === 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">아직 수사 기록이 없습니다.</p>
          <button className="btn px-6 py-3" onClick={() => navigate('/')}>
            첫 사건 시작하기
          </button>
        </div>
      )}
    </div>
  );
}