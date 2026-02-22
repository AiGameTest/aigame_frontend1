import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyCases, listMySessions, updateNickname, updateProfileImage, uploadFile } from '../api/client';
import type { SessionSummaryResponse, UserCaseDraftResponse } from '../api/types';
import { useAuthStore } from '../store/authStore';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '진행 중',
  WON: '해결',
  LOST: '실패',
  CLOSED: '종료',
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'text-gold',
  WON: 'text-amber',
  LOST: 'text-crimson',
  CLOSED: 'text-faded',
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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    listMyCases().then(setMyCases).catch(() => setMyCases([]));
    listMySessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (user) setNickname(user.nickname);
  }, [user]);

  const handleSaveNickname = async () => {
    if (!nickname.trim() || nickname === user?.nickname) { setIsEditing(false); return; }
    setSaving(true); setSaveMessage('');
    try {
      await updateNickname({ nickname: nickname.trim() });
      await bootstrap();
      setSaveMessage('닉네임이 변경되었습니다.');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('닉네임 변경에 실패했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally { setSaving(false); }
  };

  const handleProfileImageChange = async (file: File | null) => {
    if (!file) return;
    setUploadingProfile(true); setSaveMessage('');
    try {
      const uploaded = await uploadFile(file, 'profiles');
      await updateProfileImage({ profileImageUrl: uploaded.url });
      await bootstrap();
      setSaveMessage('프로필 이미지가 변경되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('프로필 이미지 변경에 실패했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally { setUploadingProfile(false); }
  };

  if (!user) return null;

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const pastSessions = sessions.filter((s) => s.status !== 'ACTIVE');
  const wonSessions = sessions.filter((s) => s.status === 'WON').length;
  const totalSessions = sessions.length;
  const winRate = totalSessions > 0 ? Math.round((wonSessions / totalSessions) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">

      {/* 프로필 헤더 */}
      <div className="panel-paper" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(61,52,40,0.25)' }}>
        <div className="h-[1px] bg-gold-dim -mx-6 -mt-6 mb-6" />
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          {/* 아바타 + 닉네임 */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user.profileImageUrl}
                alt={`${user.nickname} 프로필`}
                className="w-20 h-20 rounded-full object-cover border border-ghost"
                style={{ filter: 'sepia(0.3) brightness(0.9)' }}
              />
              <label className="absolute -bottom-1 -right-1 font-detail text-[9px] px-2 py-1 bg-shadow border border-ghost text-faded cursor-pointer hover:text-sepia hover:border-gold-dim transition-colors tracking-wide">
                {uploadingProfile ? '...' : '변경'}
                <input type="file" className="hidden" accept="image/*" disabled={uploadingProfile}
                  onChange={(e) => { const f = e.target.files?.[0] ?? null; void handleProfileImageChange(f); e.currentTarget.value = ''; }}
                />
              </label>
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                    className="noir-input text-base font-headline max-w-[200px] py-1.5"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && void handleSaveNickname()}
                  />
                  <button onClick={() => void handleSaveNickname()} disabled={saving} className="btn-secondary py-1.5 px-3 text-[0.65rem]">
                    {saving ? '저장 중' : '저장'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setNickname(user.nickname); }} className="btn-ghost py-1.5 px-3 text-[0.65rem]">
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-headline text-2xl text-sepia">{user.nickname}</h1>
                  <button onClick={() => setIsEditing(true)} className="font-detail text-[9px] text-ghost hover:text-gold-dim transition-colors tracking-widest">수정</button>
                </div>
              )}
              <p className="font-detail text-xs text-faded tracking-wide">{user.email}</p>
              <div className="flex items-center gap-2">
                <span className="badge-open">{user.coins.toLocaleString()} Coins</span>
                {user.role === 'ADMIN' && <span className="badge-file">Admin</span>}
              </div>
              {saveMessage && (
                <p className={`font-detail text-[10px] tracking-wide ${saveMessage.includes('실패') ? 'text-crimson' : 'text-amber'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-6 md:gap-8">
            {[
              { value: totalSessions, label: '총 수사' },
              { value: wonSessions, label: '해결' },
              { value: `${winRate}%`, label: '성공률' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-headline text-2xl text-amber">{value}</p>
                <p className="font-detail text-[9px] text-ghost tracking-widest uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 진행 중인 수사 */}
      {activeSessions.length > 0 && (
        <div className="panel space-y-3">
          <p className="font-label text-[10px] tracking-[0.25em] uppercase text-gold-dim mb-4">진행 중인 수사</p>
          {activeSessions.map((s) => (
            <div key={s.id} className="border border-ghost bg-dark p-3.5 flex items-center justify-between cursor-pointer hover:border-gold-dim transition-colors group" onClick={() => navigate(`/play/${s.publicId}`)}>
              <div>
                {s.title && <p className="font-headline text-sm text-sepia mb-1 group-hover:text-amber transition-colors">{s.title}</p>}
                <div className="flex items-center gap-2">
                  <span className="badge-file">{MODE_LABEL[s.mode] ?? s.mode}</span>
                  <span className={`font-detail text-[10px] tracking-wide ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </div>
                {s.gameStartHour != null && s.gameEndHour != null && s.gameMinutesUsed != null && (
                  <p className="font-detail text-[9px] text-ghost mt-1 tracking-wide">
                    게임 시간: {s.gameStartHour}시~{s.gameEndHour}시 / 경과: {s.gameMinutesUsed}분
                  </p>
                )}
              </div>
              <span className="font-label text-[9px] tracking-[0.2em] uppercase text-gold-dim group-hover:text-gold transition-colors">이어하기 →</span>
            </div>
          ))}
        </div>
      )}

      {/* 수사 기록 */}
      {pastSessions.length > 0 && (
        <div className="panel space-y-3">
          <p className="font-label text-[10px] tracking-[0.25em] uppercase text-faded mb-4">수사 기록</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {pastSessions.map((s) => (
              <div key={s.id} className="border border-ghost bg-dark p-3.5 flex items-center justify-between cursor-pointer hover:border-ghost/80 transition-colors group" onClick={() => navigate(`/result/${s.publicId}`)}>
                <div>
                  {s.title && <p className="font-headline text-sm text-sepia mb-1">{s.title}</p>}
                  <div className="flex items-center gap-2">
                    <span className="badge-file">{MODE_LABEL[s.mode] ?? s.mode}</span>
                    <span className={`font-detail text-[10px] tracking-wide ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                  </div>
                  <p className="font-detail text-[9px] text-ghost mt-1 tracking-wide">
                    {new Date(s.startedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <span className="font-label text-[9px] tracking-[0.2em] uppercase text-ghost group-hover:text-faded transition-colors">결과 →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내가 만든 사건 */}
      {myCases.length > 0 && (
        <div className="panel space-y-3">
          <p className="font-label text-[10px] tracking-[0.25em] uppercase text-faded mb-4">내가 만든 사건</p>
          {myCases.map((c) => (
            <div className="border border-ghost bg-dark p-3.5 flex items-center justify-between" key={c.id}>
              <div>
                <p className="font-headline text-sm text-sepia mb-1">{c.title}</p>
                <p className="font-body italic text-xs text-faded line-clamp-1">{c.summary}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={c.published ? 'badge-open' : 'badge-closed'}>{c.published ? 'Published' : 'Draft'}</span>
                  <span className="font-detail text-[9px] text-ghost">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
              <button className="btn-ghost py-1.5 px-3 text-[0.65rem]" onClick={() => navigate(`/create?editId=${c.id}`)}>
                수정
              </button>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 && myCases.length === 0 && (
        <div className="panel text-center py-10">
          <p className="font-body italic text-faded mb-5 text-sm">아직 수사 기록이 없습니다.</p>
          <button className="btn-primary px-8 py-3" onClick={() => navigate('/')}>
            첫 사건 시작하기
          </button>
        </div>
      )}
    </div>
  );
}
