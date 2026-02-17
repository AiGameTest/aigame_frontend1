import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const GENRES = [
  { label: '미스터리', value: 'mystery' },
  { label: '스릴러', value: 'thriller' },
  { label: '호러', value: 'horror' },
  { label: '로맨스', value: 'romance' },
];

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

interface DropdownItem {
  label: string;
  path: string;
}

function NavDropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  return (
    <div className="relative group">
      <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-dark-surface flex items-center">
        {label}
        <ChevronIcon />
      </button>

      <div
        className="
          absolute left-0 top-full mt-1 z-50
          min-w-[160px] rounded-xl border border-dark-border
          bg-dark-card/95 backdrop-blur-md shadow-2xl shadow-black/60
          opacity-0 invisible translate-y-1
          group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
          transition-all duration-200
        "
      >
        {/* hover gap 방지 브릿지 */}
        <div className="absolute -top-1 left-0 right-0 h-2" />
        <ul className="py-1.5">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                to={item.path}
                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
          min-w-[180px] rounded-xl border border-dark-border
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
          <p className="text-xs text-accent-pink mt-0.5">{coins} Coins</p>
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

          {/* 로고 + 네비게이션 */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-accent-pink text-2xl">📜</span>
              <span className="font-bold text-lg text-white tracking-tight">추리 게임</span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              <NavDropdown
                label="장르"
                items={GENRES.map((g) => ({ label: g.label, path: `/?genre=${g.value}` }))}
              />
            </nav>
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