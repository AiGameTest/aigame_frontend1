import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function ChevronIcon() {
  return (
    <svg
      className="inline-block ml-1 w-3 h-3 opacity-60 transition-transform duration-200 group-hover:rotate-180"
      viewBox="0 0 12 12"
      fill="none"
    >
      <path
        d="M2 4l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  coins,
  onLogout,
}: {
  nickname: string;
  coins: number;
  onLogout: () => void;
}) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-gray-300 hover:text-white hover:bg-dark-surface transition-colors">
        <span>{nickname}</span>
        <span className="text-xs text-accent-pink font-semibold">{coins}c</span>
        <ChevronIcon />
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
          <p className="text-sm font-semibold text-white">{nickname}</p>
          <p className="text-xs text-gray-500 mt-0.5">보유 코인</p>
          {/* 코인 표시 + 구매 링크 */}
          <Link
            to="/coins"
            className="mt-1.5 flex items-center justify-between group/coin rounded-lg bg-accent-pink/10 border border-accent-pink/20 px-3 py-2 hover:bg-accent-pink/20 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <CoinIcon className="w-4 h-4 text-accent-pink" />
              <span className="text-sm font-bold text-accent-pink">{coins.toLocaleString()} C</span>
            </div>
            <span className="text-[11px] text-accent-pink/70 group-hover/coin:text-accent-pink transition-colors">
              충전 →
            </span>
          </Link>
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
          <li>
            <Link
              to="/coins"
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>코인 충전</span>
              <CoinIcon className="w-3.5 h-3.5 text-accent-pink" />
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* 로고 */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-accent-pink text-2xl">📜</span>
              <span className="font-bold text-lg text-white tracking-tight">추리 게임</span>
            </Link>
          </div>

          {/* 우측 유저 영역 */}
          <div className="flex items-center gap-2">
            {user ? (
              <UserDropdown
                nickname={user.nickname}
                coins={user.coins}
                onLogout={async () => {
                  await doLogout();
                  navigate('/login');
                }}
              />
            ) : (
              <Link to="/login" className="btn text-xs px-3 py-1.5 rounded-full">
                로그인
              </Link>
            )}
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}