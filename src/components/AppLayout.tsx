import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = [
  { label: 'TOP 100', path: '/' },
  { label: '장르', path: '/' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-accent-pink text-2xl">📜</span>
              <span className="font-bold text-lg text-white tracking-tight">
                추리 게임
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-dark-surface"
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/create"
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-dark-surface"
                >
                  Create
                </Link>
              )}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/me"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {user.nickname}
                </Link>
                <span className="text-xs text-accent-pink font-semibold">
                  {user.coins} coin
                </span>
                <button
                  className="btn-outline text-xs"
                  onClick={async () => {
                    await doLogout();
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn text-xs px-3 py-1.5 rounded-full">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
