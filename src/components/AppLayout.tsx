import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGenerationStore } from '../store/generationStore';
import { AmbientLayer } from './ambient/AmbientLayer';

function CoinIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block ${className}`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
      <text x="8" y="11.5" textAnchor="middle" fontSize="7.5" fill="currentColor" fontWeight="bold">C</text>
    </svg>
  );
}

function UserDropdown({
  nickname,
  profileImageUrl,
  onLogout,
}: {
  nickname: string;
  profileImageUrl: string;
  onLogout: () => void;
}) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-1.5 py-1 hover:opacity-80 transition-opacity">
        <img
          src={profileImageUrl}
          alt={nickname}
          className="w-8 h-8 rounded-full object-cover border border-ghost"
          style={{ filter: 'sepia(0.3) brightness(0.9)' }}
        />
      </button>

      <div className="absolute right-0 top-full mt-2 z-50 min-w-[190px] border border-ghost bg-shadow/98 backdrop-blur-sm opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200">
        <div className="absolute -top-2 left-0 right-0 h-2" />

        <div className="px-4 py-3 border-b border-ghost">
          <div className="flex items-center gap-2.5">
            <img
              src={profileImageUrl}
              alt={nickname}
              className="w-8 h-8 rounded-full object-cover border border-ghost"
              style={{ filter: 'sepia(0.3) brightness(0.9)' }}
            />
            <div className="min-w-0">
              <p className="font-label text-xs text-sepia tracking-wider truncate">{nickname}</p>
            </div>
          </div>
        </div>

        <ul className="py-1">
          <li>
            <Link
              to="/me"
              className="block px-4 py-2.5 font-detail text-xs text-faded hover:text-sepia hover:bg-paper/50 transition-colors tracking-wide"
            >
              프로필
            </Link>
          </li>
          <li className="border-t border-ghost mt-1 pt-1">
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2.5 font-detail text-xs text-crimson/70 hover:text-crimson hover:bg-paper/50 transition-colors tracking-wide"
            >
              로그아웃
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ghost bg-void">
      <div className="max-w-container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="font-display text-base text-gold-dim tracking-wider">Open Clue</span>
            <p className="font-detail text-[10px] text-faded mt-1 tracking-widest uppercase">
              AI Murder Mystery
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/cases?tab=basic" className="font-label text-[10px] tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors">사건 목록</Link>
            <Link to="/create" className="font-label text-[10px] tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors">사건 만들기</Link>
            <Link to="/coins" className="font-label text-[10px] tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors">코인 충전</Link>
            <span className="text-ghost">·</span>
            <Link to="/terms" className="font-label text-[10px] tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors">이용약관</Link>
            <Link to="/privacy" className="font-label text-[10px] tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors">개인정보처리방침</Link>
            <a href="mailto:paper101214@gmail.com" className="font-label text-[10px] tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors">문의</a>
          </nav>
        </div>

        <div className="mt-6 pt-5 border-t border-ghost/50">
          <p className="font-detail text-[10px] text-ghost tracking-widest">
            © {year} Open Clue. All rights reserved.
            <span className="mx-3 text-ghost/50">·</span>
            현재 코인 충전 기능은 정식 출시 전 준비 중입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}

function GenerationToast() {
  const navigate = useNavigate();
  const status = useGenerationStore((s) => s.status);
  const publicId = useGenerationStore((s) => s.publicId);
  const errorMessage = useGenerationStore((s) => s.errorMessage);
  const clear = useGenerationStore((s) => s.clear);

  if (status === 'idle') return null;

  function handlePlay() {
    if (publicId) {
      clear();
      navigate(`/play/${publicId}`);
    }
  }

  const isGenerating = status === 'story' || status === 'images';

  const borderColor =
    status === 'complete' ? 'border-amber/30' :
    status === 'error'    ? 'border-crimson/30' :
    'border-gold-dim/30';

  const barBg =
    status === 'complete' ? 'bg-amber' :
    status === 'error'    ? 'bg-crimson' :
    'bg-gold';

  return (
    <div className={`fixed bottom-6 right-6 z-[200] w-[340px] border ${borderColor} bg-shadow/98 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)]`}>
      <div className={`h-[2px] w-full ${barBg} ${isGenerating ? 'animate-lamp-flicker' : ''}`} />

      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isGenerating && (
              <div className="w-3 h-3 border border-gold-dim border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <span className={`font-label text-[11px] tracking-[0.2em] uppercase ${
              status === 'complete' ? 'text-amber' :
              status === 'error'    ? 'text-crimson' :
              'text-faded'
            }`}>
              {status === 'complete' ? '생성 완료' : status === 'error' ? '생성 실패' : '사건 생성 중'}
            </span>
          </div>
          <button
            onClick={clear}
            className="font-detail text-[10px] text-ghost hover:text-faded transition-colors px-1"
          >
            ✕
          </button>
        </div>

        {isGenerating && (
          <div>
            <p className="font-body text-sm text-sepia leading-snug">
              {status === 'story' ? '스토리를 생성하고 있습니다' : '캐릭터 이미지를 생성하고 있습니다'}
            </p>
            <p className="font-detail text-[10px] text-faded mt-1 tracking-wide">완료되면 알림이 표시됩니다</p>
          </div>
        )}

        {status === 'complete' && (
          <div>
            <p className="font-body text-sm text-sepia leading-snug">사건이 준비되었습니다.</p>
            <p className="font-detail text-[10px] text-faded mt-1">지금 바로 수사를 시작하세요</p>
            <button
              onClick={handlePlay}
              className="btn-primary w-full mt-3 py-2.5 text-[0.65rem]"
            >
              수사 시작하기
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <p className="font-body text-sm text-sepia leading-snug">생성에 실패했습니다.</p>
            <p className="font-detail text-[10px] text-crimson/70 mt-1 line-clamp-2">{errorMessage ?? '알 수 없는 오류가 발생했습니다.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const NO_FOOTER_PATHS = ['/play/'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const hideFooter = NO_FOOTER_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <AmbientLayer />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-void/95 backdrop-blur-sm border-b border-ghost">
        <div className="max-w-container mx-auto px-6 h-14 flex items-center justify-between relative z-[10]">

          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="font-display text-base text-gold group-hover:text-amber transition-colors tracking-wider">
                Open Clue
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/cases"
                className="font-label text-xs tracking-[0.2em] uppercase text-faded hover:text-sepia transition-colors px-3 py-2"
              >
                사건 목록
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/coins"
                  className="flex items-center gap-1.5 px-4 py-2 border border-gold-dim/40 bg-gold/5 hover:bg-gold/10 hover:border-gold-dim transition-colors"
                >
                  <CoinIcon className="w-4 h-4 text-gold-dim" />
                  <span className="font-detail text-sm text-gold-dim">{user.coins.toLocaleString()} C</span>
                </Link>
                <UserDropdown
                  nickname={user.nickname}
                  profileImageUrl={user.profileImageUrl}
                  onLogout={async () => {
                    await doLogout();
                    navigate('/login');
                  }}
                />
              </>
            ) : (
              <Link to="/login" className="btn-secondary py-2 px-5 text-[0.75rem]">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-container mx-auto px-6 py-8 w-full flex-1 relative z-[10]">
        {children}
      </main>

      {!hideFooter && <AppFooter />}
      <GenerationToast />
    </div>
  );
}
