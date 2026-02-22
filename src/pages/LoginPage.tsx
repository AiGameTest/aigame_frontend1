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
    if (provider === 'kakao') window.location.href = kakaoLoginUrl();
    else if (provider === 'google') window.location.href = googleLoginUrl();
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16">
      <div className="w-full max-w-sm">
        {/* 패널 */}
        <div
          className="panel-paper"
          style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(61,52,40,0.3)' }}
        >
          {/* 상단 골드 선 */}
          <div className="h-[1px] w-full bg-gold-dim -mx-6 -mt-6 mb-6" style={{ width: 'calc(100% + 48px)' }} />

          <div className="text-center mb-8">
            <p className="badge-file inline-block mb-4">DETECTIVE BUREAU</p>
            <h1 className="font-display text-gold text-2xl tracking-wider mb-3">Open Clue</h1>
            <p className="font-body italic text-faded text-base">수사에 참여하려면 신원을 확인하세요.</p>
          </div>

          {/* 구분선 */}
          <div className="divider-ornate my-6">
            <span>✦</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleOAuth2Login('kakao')}
              className="w-full flex items-center justify-center gap-3 py-3 border border-[#c9a300]/40 bg-[#FEE500]/10 hover:bg-[#FEE500]/18 transition-colors group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#c9a300" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.59 6.55-.16.57-.59 2.07-.68 2.39-.11.39.14.38.3.28.12-.08 1.96-1.33 2.76-1.87.66.1 1.34.15 2.03.15 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"/>
              </svg>
              <span className="font-label text-xs tracking-[0.2em] uppercase text-[#c9a300]">
                카카오로 로그인
              </span>
            </button>
          </div>

          {/* 하단 */}
          <div className="mt-8 pt-6 border-t border-ghost/50">
            <p className="font-detail text-[9px] text-ghost text-center leading-relaxed tracking-wide">
              로그인 시 서비스 이용약관 및<br />개인정보처리방침에 동의합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
