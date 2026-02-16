import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyCases, listMySessions, updateNickname } from '../api/client';
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
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const navigate = useNavigate();
  
  const [myCases, setMyCases] = useState<UserCaseDraftResponse[]>([]);
  const [sessions, setSessions] = useState<SessionSummaryResponse[]>([]);
  
  // Profile settings state
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    listMyCases().then(setMyCases).catch(() => setMyCases([]));
    listMySessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
    }
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
      await bootstrap(); // Refresh user data
      setSaveMessage('✓ 닉네임이 변경되었습니다');
      setIsEditing(false);
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('✗ 변경에 실패했습니다');
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
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-dark-card 
                      border border-dark-border rounded-2xl p-6 md:p-8 
                      animate-fade-in-up shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-pink to-purple-600 
                          flex items-center justify-center text-3xl font-bold text-white
                          shadow-lg animate-scale-in">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2 animate-slide-in-left">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="input text-lg font-bold max-w-[200px]"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveNickname()}
                    />
                    <button
                      onClick={handleSaveNickname}
                      disabled={saving}
                      className="btn-outline text-xs px-3 py-1 hover:bg-green-600 hover:border-green-600 hover:text-white"
                    >
                      {saving ? '저장중...' : '저장'}
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
                    <h1 className="text-2xl md:text-3xl font-black text-white">
                      {user.nickname}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-accent-pink transition-colors p-1"
                      title="닉네임 편집"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {showEmail && (
                <p className="text-sm text-gray-400 animate-fade-in">{user.email}</p>
              )}
              
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-accent-pink/20 text-accent-pink text-sm font-semibold
                               border border-accent-pink/30 animate-pulse-glow">
                  💰 {user.coins} Coins
                </span>
                {user.role === 'ADMIN' && (
                  <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-sm font-semibold
                                 border border-purple-600/30">
                    👑 Admin
                  </span>
                )}
              </div>
              
              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('✓') ? 'text-green-400' : 'text-red-400'} 
                              animate-slide-in-left`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
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
          )}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 animate-fade-in-up"
           style={{ animationDelay: '150ms' }}>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🔒</span>
          개인정보 설정
        </h2>
        
        <div className="space-y-3">
          {/* Email visibility toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg
                        hover:bg-dark-surface/80 transition-colors">
            <div>
              <p className="text-sm font-semibold text-white">이메일 주소 공개</p>
              <p className="text-xs text-gray-400">다른 사용자에게 이메일을 표시합니다</p>
            </div>
            <button
              onClick={() => setShowEmail(!showEmail)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                showEmail ? 'bg-accent-pink' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  showEmail ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Stats visibility toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg
                        hover:bg-dark-surface/80 transition-colors">
            <div>
              <p className="text-sm font-semibold text-white">통계 정보 공개</p>
              <p className="text-xs text-gray-400">프로필에 수사 통계를 표시합니다</p>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                showStats ? 'bg-accent-pink' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  showStats ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          💡 팁: 이 설정은 로컬에만 저장됩니다. 서버 연동 시 백엔드 구현이 필요합니다.
        </p>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 animate-fade-in-up"
             style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <span>🔍</span>
            진행 중인 수사
          </h2>
          <div className="space-y-2">
            {activeSessions.map((s, idx) => (
              <div
                key={s.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-3 
                         flex items-center justify-between cursor-pointer 
                         hover:border-accent-pink/50 hover:bg-dark-surface/80
                         transition-all duration-300 hover:translate-x-1
                         animate-slide-in-right"
                style={{ animationDelay: `${250 + idx * 50}ms` }}
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
                    질문 {s.questionsUsed}/{s.questionLimit} · 남은 질문 {s.remainingQuestions}회
                  </p>
                </div>
                <span className="text-accent-pink text-sm font-bold hover:translate-x-1 transition-transform">
                  이어하기 →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 animate-fade-in-up"
             style={{ animationDelay: '250ms' }}>
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <span>📚</span>
            수사 기록
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pastSessions.map((s, idx) => (
              <div
                key={s.id}
                className="bg-dark-surface border border-dark-border rounded-lg p-3 
                         flex items-center justify-between cursor-pointer 
                         hover:border-gray-600 hover:bg-dark-surface/80
                         transition-all duration-300 hover:translate-x-1
                         animate-slide-in-right"
                style={{ animationDelay: `${300 + idx * 30}ms` }}
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
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 animate-fade-in-up"
             style={{ animationDelay: '300ms' }}>
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <span>✍️</span>
            내가 만든 사건
          </h2>
          <div className="space-y-2">
            {myCases.map((c, idx) => (
              <div 
                className="bg-dark-surface border border-dark-border rounded-lg p-3
                         hover:border-accent-pink/30 transition-all duration-300
                         animate-slide-in-right"
                style={{ animationDelay: `${350 + idx * 50}ms` }}
                key={c.id}
              >
                <p className="font-semibold text-white">{c.title}</p>
                <p className="text-sm text-gray-400">{c.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    c.published 
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                      : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                  }`}>
                    {c.published ? '✓ Published' : '📝 Draft'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && myCases.length === 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center animate-fade-in-up"
             style={{ animationDelay: '200ms' }}>
          <p className="text-4xl mb-3">🕵️</p>
          <p className="text-gray-400 mb-4">아직 수사 기록이 없습니다</p>
          <button
            className="btn px-6 py-3 hover:scale-105 transition-transform"
            onClick={() => navigate('/')}
          >
            첫 사건 시작하기 →
          </button>
        </div>
      )}
    </div>
  );
}