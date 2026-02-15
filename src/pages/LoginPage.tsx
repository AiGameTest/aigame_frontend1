const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID ?? '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI ?? `${window.location.origin}/oauth/kakao/callback`;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? `${window.location.origin}/oauth/google/callback`;

function kakaoLoginUrl() {
  return `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
}

function googleLoginUrl() {
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('openid email profile')}`;
}

export function LoginPage() {
  function handleOAuth2Login(provider: string) {
    if (provider === 'kakao') {
      window.location.href = kakaoLoginUrl();
    } else if (provider === 'google') {
      window.location.href = googleLoginUrl();
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-stone-900/50 ring-1 ring-white/10 text-stone-100 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">로그인</h1>

        <div className="space-y-4">
          <button
            onClick={() => handleOAuth2Login("google")}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </button>

          <button
            onClick={() => handleOAuth2Login("kakao")}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-black px-4 py-3 rounded-lg hover:bg-[#FDD800] transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#000000"
                d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.59 6.55-.16.57-.59 2.07-.68 2.39-.11.39.14.38.3.28.12-.08 1.96-1.33 2.76-1.87.66.1 1.34.15 2.03.15 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"
              />
            </svg>
            카카오로 로그인
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>

  );
}
