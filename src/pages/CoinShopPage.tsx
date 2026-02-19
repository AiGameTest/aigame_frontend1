import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// ── 코인 패키지 정의 ─────────────────────────────────────
interface CoinPackage {
  id: string;
  coins: number;
  price: number;       // 원
  bonus: number;       // 보너스 코인
  tag?: string;
  popular?: boolean;
  best?: boolean;
}

const PACKAGES: CoinPackage[] = [
  { id: 'sm',  coins: 100,  price: 1100,  bonus: 0,   tag: '입문' },
  { id: 'md',  coins: 300,  price: 3000,  bonus: 30,  tag: '기본' },
  { id: 'lg',  coins: 600,  price: 5500,  bonus: 100, tag: '인기', popular: true },
  { id: 'xl',  coins: 1200, price: 9900,  bonus: 300, tag: '베스트', best: true },
  { id: 'xxl', coins: 3000, price: 22000, bonus: 1000, tag: '프리미엄' },
];

// 더미 거래 내역
interface TxRecord { id: number; desc: string; amount: number; date: string; type: 'charge' | 'use'; }
const DUMMY_TX: TxRecord[] = [
  { id: 1, desc: 'AI 사건 생성', amount: -20, date: '2026-02-17', type: 'use' },
  { id: 2, desc: '코인 충전 (600C 패키지)', amount: 700, date: '2026-02-15', type: 'charge' },
  { id: 3, desc: '기본 사건 플레이', amount: -10, date: '2026-02-13', type: 'use' },
  { id: 4, desc: '코인 충전 (300C 패키지)', amount: 330, date: '2026-02-10', type: 'charge' },
];

// ── 보상형 광고 설정 ──────────────────────────────────────
const AD_REWARD_COINS = 10;
const AD_DAILY_LIMIT  = 5;
const AD_COUNTDOWN    = 5;

// ── 보상형 광고 모달 ──────────────────────────────────────
function RewardedAdModal({
  onClose,
  onRewarded,
}: {
  onClose: () => void;
  onRewarded: () => void;
}) {
  const [phase, setPhase] = useState<'watching' | 'done'>('watching');
  const [countdown, setCountdown] = useState(AD_COUNTDOWN);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  function handleClaim() {
    onRewarded();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#110d1e] shadow-2xl overflow-hidden">

        {phase === 'watching' && (
          <>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center h-52 gap-3">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-accent-pink animate-spin" />
              <p className="text-sm text-gray-400 mt-1">광고 시청 중...</p>
              <div className="absolute top-3 right-4 bg-black/60 rounded-lg px-2.5 py-1 text-xs font-bold text-white tabular-nums">
                {countdown}s
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                  className="h-full bg-accent-pink transition-all duration-1000"
                  style={{ width: `${((AD_COUNTDOWN - countdown) / AD_COUNTDOWN) * 100}%` }}
                />
              </div>
            </div>
            <div className="px-5 py-4 text-center">
              <p className="text-xs text-gray-500">
                광고를 끝까지 시청하면 <span className="text-accent-pink font-bold">{AD_REWARD_COINS}C</span>가 지급됩니다.
              </p>
              <p className="text-[11px] text-gray-600 mt-1">광고 시청 중에는 닫을 수 없습니다.</p>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-4xl">
                🎁
              </div>
              <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">광고 시청 완료!</h3>
              <p className="text-gray-400 text-sm mt-1">
                <span className="text-emerald-400 font-bold text-lg">+{AD_REWARD_COINS}C</span> 를 받을 수 있습니다.
              </p>
            </div>
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              코인 받기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 보상형 광고 섹션 ──────────────────────────────────────
function RewardedAdSection() {
  const [usedToday, setUsedToday] = useState(2);
  const [showModal, setShowModal]   = useState(false);
  const [justEarned, setJustEarned] = useState(false);

  const remaining = AD_DAILY_LIMIT - usedToday;
  const exhausted = remaining <= 0;

  function handleRewarded() {
    setUsedToday((prev) => prev + 1);
    setJustEarned(true);
    setTimeout(() => setJustEarned(false), 3000);
  }

  return (
    <>
      {showModal && (
        <RewardedAdModal
          onClose={() => setShowModal(false)}
          onRewarded={handleRewarded}
        />
      )}

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📺</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">무료 코인 적립</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                  무료
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                  준비 중
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">광고 시청 후 코인을 무료로 적립하세요</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-black text-emerald-400">+{AD_REWARD_COINS}C</span>
            <p className="text-[10px] text-gray-500">1회</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">오늘 사용 현황</span>
            <span className={exhausted ? 'text-gray-600' : 'text-emerald-400 font-semibold'}>
              {usedToday} / {AD_DAILY_LIMIT}회
              {!exhausted && <span className="text-gray-500 font-normal"> ({remaining}회 남음)</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(usedToday / AD_DAILY_LIMIT) * 100}%`,
                background: exhausted
                  ? 'rgb(75,85,99)'
                  : 'linear-gradient(to right, #10b981, #34d399)',
              }}
            />
          </div>
        </div>

        {justEarned && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 text-sm text-emerald-300 font-semibold animate-pulse">
            <span>✓</span>
            <span>+{AD_REWARD_COINS}C 적립 완료!</span>
          </div>
        )}

        {exhausted ? (
          <div className="rounded-xl bg-white/[0.03] border border-white/10 py-3 text-center text-sm text-gray-500">
            오늘 사용 가능 횟수를 모두 소진했습니다. 내일 다시 이용해주세요.
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50 text-emerald-300 hover:text-emerald-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>광고 보고 {AD_REWARD_COINS}C 받기</span>
          </button>
        )}

        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
          정식 출시 시 제공 예정 · 광고 정책 준수 포맷만 적용 · 부정 이용 방지 시스템 적용
        </p>
      </div>
    </>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────
function CoinBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-xl';
  return (
    <span className={`font-black text-accent-pink ${sizeClass}`}>
      {value.toLocaleString()}
      <span className="text-xs font-semibold ml-0.5 opacity-70">C</span>
    </span>
  );
}

function PackageCard({
  pkg,
  selected,
  onClick,
}: {
  pkg: CoinPackage;
  selected: boolean;
  onClick: () => void;
}) {
  const total = pkg.coins + pkg.bonus;
  const perCoin = (pkg.price / total).toFixed(1);

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border p-4 transition-all duration-200 group
        ${selected
          ? 'bg-accent-pink/10 border-accent-pink/60 shadow-[0_0_24px_rgba(255,77,109,0.15)]'
          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
        }
        ${pkg.popular || pkg.best ? 'ring-1 ' + (selected ? 'ring-accent-pink/40' : 'ring-white/10') : ''}
      `}
    >
      {(pkg.popular || pkg.best) && (
        <div className={`absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold border
          ${pkg.best
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-accent-pink/20 text-accent-pink border-accent-pink/40'
          }`}
        >
          {pkg.best ? '🏆 베스트' : '🔥 인기'}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <CoinBadge value={pkg.coins} />
            {pkg.bonus > 0 && (
              <span className="text-xs text-emerald-400 font-semibold">+{pkg.bonus} 보너스</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-gray-500">합계 {total.toLocaleString()}C</span>
            <span className="text-[11px] text-gray-600">·</span>
            <span className="text-[11px] text-gray-500">개당 {perCoin}원</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-base font-black text-white">{pkg.price.toLocaleString()}원</p>
          <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto transition-all
            ${selected ? 'border-accent-pink bg-accent-pink' : 'border-white/20'}`}
          >
            {selected && (
              <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export function CoinShopPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('lg');
  const [payMethod, setPayMethod] = useState<'card' | 'kakao'>('card');
  const [purchasing, setPurchasing] = useState(false);
  const [tab, setTab] = useState<'shop' | 'history'>('shop');
  const [successPkg, setSuccessPkg] = useState<CoinPackage | null>(null);

  const selectedPkg = PACKAGES.find((p) => p.id === selected)!;

  async function handlePurchase() {
    if (purchasing) return;
    setPurchasing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSuccessPkg(selectedPkg);
    setPurchasing(false);
  }

  if (successPkg) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-accent-pink/20 border border-accent-pink/30 flex items-center justify-center mx-auto text-4xl">
            🎉
          </div>
          <div className="absolute inset-0 rounded-full animate-ping bg-accent-pink/10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">충전 완료!</h2>
          <p className="text-gray-400 mt-2">
            <span className="text-accent-pink font-bold">{(successPkg.coins + successPkg.bonus).toLocaleString()}C</span>가 지급되었습니다.
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">기본 코인</span><span className="text-white font-semibold">{successPkg.coins.toLocaleString()}C</span></div>
          {successPkg.bonus > 0 && <div className="flex justify-between"><span className="text-emerald-400">보너스</span><span className="text-emerald-300 font-semibold">+{successPkg.bonus.toLocaleString()}C</span></div>}
          <div className="border-t border-white/10 pt-2 flex justify-between"><span className="text-gray-400">결제 금액</span><span className="text-white font-bold">{successPkg.price.toLocaleString()}원</span></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSuccessPkg(null)} className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 hover:text-white hover:border-white/30 transition-colors text-sm font-semibold">
            더 충전하기
          </button>
          <button onClick={() => navigate('/')} className="flex-1 py-3 rounded-xl bg-accent-pink text-white font-bold text-sm hover:opacity-90 transition-opacity">
            게임 시작 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* ── 상단 헤더 ── */}
      <div className="rounded-2xl overflow-hidden border border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a14] via-[#12091c] to-[#0a1020] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent-pink/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

        <div className="relative px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-[0.2em] text-accent-pink/70 font-semibold">Coin Shop</span>
            </div>
            <h1 className="text-2xl font-black text-white">코인 충전소</h1>
            <p className="text-sm text-gray-400 mt-1">코인으로 AI 사건 생성 및 특별 기능을 이용하세요.</p>
            <p className="text-sm text-red-400 mt-1">현재 코인 충전/적립 기능은 미구현입니다.</p>
            <p className="text-sm text-red-400 mt-1">정식 출시 시, 유료 충전(결제) 과 보상형 광고(일일 제한) 를 통해 코인을 제공할 계획입니다.</p>
            <p className="text-sm text-red-400 mt-1">보상형 광고는 정책 준수 가능한 광고 포맷/네트워크에서만 제공되며, 부정 이용 방지 및 이용 제한이 적용됩니다.</p>
          </div>

          <div className="flex-shrink-0 text-right">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">보유 코인</p>
            <div className="mt-1 flex items-center gap-1.5 justify-end">
              <span className="text-2xl font-black text-accent-pink">
                {(user?.coins ?? 0).toLocaleString()}
              </span>
              <span className="text-sm text-accent-pink/70 font-semibold">C</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.08]">
        {(['shop', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'shop' ? '💳 충전하기' : '📋 사용 내역'}
          </button>
        ))}
      </div>

      {tab === 'shop' ? (
        <>
          {/* ── 코인 사용처 안내 ── */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🤖', label: 'AI 사건 생성', cost: '20C' },
              { icon: '⭐', label: '기본 사건 플레이', cost: '10C' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{item.label}</p>
                <p className="text-xs text-accent-pink font-bold mt-1">{item.cost}</p>
              </div>
            ))}
          </div>

          {/* ── 보상형 광고 ── */}
          <RewardedAdSection />

          {/* ── 패키지 선택 ── */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">패키지 선택</p>
            <div className="space-y-2.5">
              {PACKAGES.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selected === pkg.id}
                  onClick={() => setSelected(pkg.id)}
                />
              ))}
            </div>
          </div>

          {/* ── 결제 수단 ── */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">결제 수단</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'card',  label: '신용카드' },
                { id: 'kakao', label: '카카오페이' },
              ] as const).map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPayMethod(method.id)}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all
                    ${payMethod === method.id
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
                    }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 주문 요약 + 결제 버튼 ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-gray-500">주문 요약</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">패키지</span>
                <span className="text-white font-semibold">{selectedPkg.coins.toLocaleString()}C {selectedPkg.tag && `(${selectedPkg.tag})`}</span>
              </div>
              {selectedPkg.bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-emerald-400">보너스 코인</span>
                  <span className="text-emerald-300 font-semibold">+{selectedPkg.bonus.toLocaleString()}C</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">지급 총 코인</span>
                <CoinBadge value={selectedPkg.coins + selectedPkg.bonus} size="sm" />
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-gray-300 font-semibold">결제 금액</span>
                <span className="text-white font-black text-base">{selectedPkg.price.toLocaleString()}원</span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all mt-1
                ${purchasing
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-accent-pink text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,77,109,0.3)] hover:shadow-[0_0_30px_rgba(255,77,109,0.45)]'
                }`}
            >
              {purchasing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-300 rounded-full animate-spin" />
                  결제 처리 중...
                </span>
              ) : (
                `${selectedPkg.price.toLocaleString()}원 결제하기`
              )}
            </button>

            <p className="text-center text-[11px] text-gray-600">
              결제 시 이용약관 및 환불 정책에 동의합니다.
            </p>
          </div>
        </>
      ) : (
        /* ── 사용 내역 탭 ── */
        <div className="space-y-2">
          {DUMMY_TX.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">거래 내역이 없습니다.</div>
          ) : (
            DUMMY_TX.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/15 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${tx.type === 'charge' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}
                  >
                    {tx.type === 'charge' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{tx.desc}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}C
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}