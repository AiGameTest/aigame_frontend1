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
