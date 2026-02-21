import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGenerationStore } from '../store/generationStore';

function CoinIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block ${className}`} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.2" />
      <text x="8" y="11.5" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">C</text>
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
      {/* 헤더 트리거: 프로필 이미지 */}
      <button className="flex items-center gap-1.5 px-1.5 py-1 rounded-full hover:bg-dark-surface transition-colors">
        <img
          src={profileImageUrl}
          alt={nickname}
          className="w-8 h-8 rounded-full object-cover border border-white/15"
        />
      </button>

      <div
        className="
          absolute right-0 top-full mt-1 z-50
          min-w-[200px] rounded-xl border border-dark-border
          bg-dark-card/95 backdrop-blur-md shadow-2xl shadow-black/60
          opacity-0 invisible translate-y-1
          group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
          transition-all duration-200
        "
      >
        {/* hover gap 방지 브릿지 */}
        <div className="absolute -top-1 left-0 right-0 h-2" />

        {/* 유저 정보 헤더 */}
        <div className="px-4 py-3 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <img
              src={profileImageUrl}
              alt={nickname}
              className="w-9 h-9 rounded-full object-cover border border-white/15"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{nickname}</p>
            </div>
          </div>

        </div>

        <ul className="py-1.5">
          <li>
            <Link
              to="/me"
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              프로필
            </Link>
          </li>
          <li className="border-t border-dark-border mt-1 pt-1">
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
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
    <footer className="mt-auto border-t border-white/[0.06] bg-[#090909]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Open Clue" className="h-6 w-6 object-contain opacity-80" />
            <div>
              <span className="font-bold text-white tracking-tight">Open Clue</span>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-none">AI Murder Mystery</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            <Link to="/cases?tab=basic" className="hover:text-gray-300 transition-colors">사건 목록</Link>
            <Link to="/create" className="hover:text-gray-300 transition-colors">사건 만들기</Link>
            <Link to="/coins" className="hover:text-gray-300 transition-colors">코인 충전</Link>
            <span className="text-white/10">|</span>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">이용약관</Link>
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">개인정보처리방침</Link>
            <a href="mailto:paper101214@gmail.com" className="hover:text-gray-300 transition-colors">문의</a>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-white/[0.05]" />

        {/* Bottom row */}
        <p className="text-[11px] text-gray-600 leading-relaxed">
          © {year} Open Clue. All rights reserved.
          <span className="mx-2 text-white/10">·</span>
          현재 코인 충전 기능은 정식 출시 전 준비 중입니다.
        </p>
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

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] w-[360px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] transition-all"
      style={{
        border: status === 'complete'
          ? '1px solid rgba(34,197,94,0.25)'
          : status === 'error'
          ? '1px solid rgba(239,68,68,0.25)'
          : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* 상단 컬러 바 */}
      <div
        className="h-[3px] w-full"
        style={{
          background: status === 'complete'
            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
            : status === 'error'
            ? 'linear-gradient(90deg, #ef4444, #f87171)'
            : 'linear-gradient(90deg, #ff4d6d, #c026d3, #6366f1)',
          backgroundSize: isGenerating ? '200% 100%' : '100% 100%',
          animation: isGenerating ? 'toastShimmer 2s linear infinite' : 'none',
        }}
      />

      <div className="bg-[#0d0f14]/95 backdrop-blur-xl px-4 py-3.5">
        {/* 헤더 행 */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {isGenerating && (
              <div className="w-3.5 h-3.5 border-[1.5px] border-white/20 border-t-[#ff4d6d] rounded-full animate-spin flex-shrink-0" />
            )}
            {status === 'complete' && (
              <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase"
              style={{
                color: status === 'complete' ? '#4ade80'
                  : status === 'error' ? '#f87171'
                  : 'rgba(255,255,255,0.4)',
              }}
            >
              {status === 'complete' ? '생성 완료' : status === 'error' ? '생성 실패' : '사건 생성 중'}
            </span>
          </div>
          <button
            onClick={clear}
            className="w-5 h-5 flex items-center justify-center rounded-full text-white/20 hover:text-white/50 hover:bg-white/5 transition-all text-[10px] leading-none"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        {isGenerating && (
          <div>
            <p className="text-sm font-semibold text-white/85 leading-snug">
              {status === 'story' ? '스토리를 생성하고 있습니다' : '캐릭터 이미지를 생성하고 있습니다'}
            </p>
            <p className="text-[11px] text-white/35 mt-1">완료되면 알림이 표시됩니다</p>
          </div>
        )}

        {status === 'complete' && (
          <div>
            <p className="text-sm font-bold text-white leading-snug">사건이 준비되었습니다!</p>
            <p className="text-[11px] text-white/40 mt-1">지금 바로 수사를 시작할 수 있습니다</p>
            <button
              onClick={handlePlay}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-black text-white tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #ff4d6d, #e0365a)',
                boxShadow: '0 4px 20px rgba(255,77,109,0.35)',
              }}
            >
              수사 시작하기 →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <p className="text-sm font-semibold text-white/85 leading-snug">생성에 실패했습니다</p>
            <p className="text-[11px] text-red-400/70 mt-1 line-clamp-2">{errorMessage ?? '알 수 없는 오류가 발생했습니다'}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes toastShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

// PlayPage는 전체화면 레이아웃이라 footer 불필요
const NO_FOOTER_PATHS = ['/play/'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const hideFooter = NO_FOOTER_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* 로고 + 네비게이션 */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" alt="Open Clue" className="h-7 w-7 object-contain" />
              <span className="font-bold text-lg text-white tracking-tight">Open Clue</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/cases"
                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                사건 목록
              </Link>
            </nav>
          </div>

          {/* 우측 유저 영역 */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/coins"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                >
                  <CoinIcon className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-red-400">{user.coins.toLocaleString()} C</span>
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
              <Link to="/login" className="btn text-xs px-3 py-1.5 rounded-full">
                로그인
              </Link>
            )}
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">{children}</main>

      {!hideFooter && <AppFooter />}
      <GenerationToast />
    </div>
  );
}