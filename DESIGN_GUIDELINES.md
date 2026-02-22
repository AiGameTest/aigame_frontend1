# Open Clue — Frontend Design Guidelines

> **콘셉트**: 1930년대 필름 느와르. UI 자체가 하나의 범죄 현장 파일.
> 인쇄되고, 세월에 바래고, 희미한 램프 아래 촬영된 느낌.
> 모든 픽셀이 오래된 종이 위에 찍힌 잉크처럼 보여야 한다.

---

## 1. 컬러 시스템

### 1-1. CSS Custom Properties (`src/styles/index.css` `:root` 블록)

```css
:root {
  --col-void:      #060504;  /* 최심층 배경 — 필름 느와르 블랙 */
  --col-shadow:    #0d0b09;  /* 카드·패널 배경 */
  --col-dark:      #161210;  /* 입력창·서피스 */
  --col-paper:     #1e1a14;  /* 상승된 서피스 — 오래된 종이 */
  --col-gold:      #c9a447;  /* 메인 액센트 — 황금빛 앰버 */
  --col-gold-dim:  #7d6428;  /* 음소거된 골드 */
  --col-amber:     #e8c96a;  /* 밝은 하이라이트 */
  --col-sepia:     #d4c49e;  /* 본문 텍스트 — 세피아 크림 */
  --col-faded:     #7a6a4e;  /* 흐린 텍스트 */
  --col-ghost:     #3d3428;  /* 플레이스홀더·극희미 요소 */
  --col-crimson:   #8b1a1a;  /* 위험·범죄 액센트 — 혈흔 */
}
```

### 1-2. Tailwind Config 매핑 (`tailwind.config.ts`)

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void:    '#060504',
        shadow:  '#0d0b09',
        dark:    '#161210',
        paper:   '#1e1a14',
        gold:    '#c9a447',
        'gold-dim': '#7d6428',
        amber:   '#e8c96a',
        sepia:   '#d4c49e',
        faded:   '#7a6a4e',
        ghost:   '#3d3428',
        crimson: '#8b1a1a',
      },
      fontFamily: {
        display:  ['"Cinzel Decorative"', 'serif'],
        headline: ['"Playfair Display"', '"Noto Serif KR"', 'serif'],
        body:     ['"IM Fell English"', '"Noto Serif KR"', 'serif'],
        label:    ['Cinzel', 'serif'],
        detail:   ['"Courier Prime"', 'monospace'],
      },
      maxWidth: {
        container: '720px',
      },
      spacing: {
        // 8px 단위 시스템
        'unit': '8px',
      },
      keyframes: {
        'grain': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%':       { transform: 'translate(-2%, -3%)' },
          '20%':       { transform: 'translate(3%, 1%)' },
          '30%':       { transform: 'translate(-1%, 4%)' },
          '40%':       { transform: 'translate(4%, -2%)' },
          '50%':       { transform: 'translate(-3%, 3%)' },
          '60%':       { transform: 'translate(2%, -4%)' },
          '70%':       { transform: 'translate(-4%, 2%)' },
          '80%':       { transform: 'translate(3%, -1%)' },
          '90%':       { transform: 'translate(-2%, 4%)' },
        },
        'vignette-breathe': {
          '0%, 100%': { opacity: '0.82' },
          '50%':       { opacity: '0.96' },
        },
        'lamp-flicker': {
          '0%, 100%': { opacity: '1' },
          '8%':        { opacity: '0.92' },
          '15%':       { opacity: '1' },
          '22%':       { opacity: '0.87' },
          '30%':       { opacity: '1' },
          '45%':       { opacity: '0.94' },
          '60%':       { opacity: '1' },
          '72%':       { opacity: '0.89' },
          '85%':       { opacity: '1' },
          '94%':       { opacity: '0.93' },
        },
        'title-in': {
          'from': { opacity: '0', letterSpacing: '0.6em' },
          'to':   { opacity: '1', letterSpacing: '0.2em' },
        },
        'fade-up': {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        'scan': {
          'from': { backgroundPosition: '0 0' },
          'to':   { backgroundPosition: '0 100%' },
        },
      },
      animation: {
        'grain':             'grain 0.4s steps(1) infinite',
        'vignette-breathe':  'vignette-breathe 6s ease-in-out infinite',
        'lamp-flicker':      'lamp-flicker 4s ease-in-out infinite',
        'title-in':          'title-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up':           'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gold-shimmer':      'gold-shimmer 3s linear infinite',
        'cursor-blink':      'cursor-blink 1s step-end infinite',
      },
      transitionTimingFunction: {
        'noir-enter': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'noir-exit':  'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 2. 타이포그래피

### 2-1. Google Fonts 로드 (`index.html` `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 2-2. 폰트 역할 정의

| 역할 | Tailwind 클래스 | 폰트 | 한국어 폴백 | 용도 |
|------|----------------|------|------------|------|
| Display | `font-display` | Cinzel Decorative | — | 앱 타이틀, 챕터 번호 |
| Headline | `font-headline` | Playfair Display | Noto Serif KR | 섹션 제목, 카드 제목 |
| Body | `font-body` | IM Fell English | Noto Serif KR | 본문, 사건 설명, 대화 |
| Label | `font-label` | Cinzel | — | 버튼, 태그, 네비 메뉴 |
| Detail | `font-detail` | Courier Prime | monospace | 파일 번호, 날짜, 시스템 |

### 2-3. 한국어 혼용 처리

Cinzel 계열(라틴 전용)을 한국어 콘텐츠에 사용할 때는 **Noto Serif KR**를 폴백으로 쌓는다.
버튼 레이블 등 짧은 한국어는 `font-label` 유지, 긴 본문은 반드시 `font-body`에 Noto Serif KR이 렌더링되도록 확인.

```css
/* 장르적 분위기를 위해 한국어도 세리프 계열로 통일 */
.font-body  { font-family: 'IM Fell English', 'Noto Serif KR', serif; }
.font-headline { font-family: 'Playfair Display', 'Noto Serif KR', serif; }
```

### 2-4. 크기 스케일

```
text-[10px]  tracking-[0.3em]   → 분류 배지, 파일 번호
text-xs      tracking-[0.2em]   → detail 텍스트
text-sm      tracking-[0.12em]  → 본문 보조, 메타 정보
text-base    tracking-[0.04em]  → 일반 본문
text-xl      tracking-[0.06em]  → 카드 제목 (headline)
text-2xl~4xl tracking-[0.1em]   → 페이지 제목 (display/headline)
```

---

## 3. 스페이싱 & 레이아웃

```
기본 단위: 8px
컨테이너 최대 너비: 720px  (max-w-container)
컴포넌트 내부 패딩: p-4 (16px) / p-6 (24px) / p-8 (32px)
섹션 간 간격: space-y-10 ~ space-y-16
```

---

## 4. 모션 시스템

### 4-1. 지속 시간 원칙

| 레벨 | 범위 | 사용처 |
|------|------|--------|
| Micro | 200–300ms | hover glow, border color |
| Screen | 500–700ms | 페이지 전환, 모달 등장 |
| Ambient | 4s–∞ | grain, vignette, flicker |

### 4-2. 타이핑(Typewriter) 효과 — React 훅

```tsx
// src/hooks/useTypewriter.ts
import { useState, useEffect } from 'react';

export function useTypewriter(
  lines: string[],
  {
    speed = 60,       // ms per character
    pause = 2200,     // ms between lines
    loop = true,
  } = {}
) {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = lines[lineIdx] ?? '';
    if (charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, speed);
      return () => clearTimeout(t);
    }
    // line complete → pause → next line
    const t = setTimeout(() => {
      if (loop || lineIdx < lines.length - 1) {
        setLineIdx((i) => (i + 1) % lines.length);
        setCharIdx(0);
        setDisplayed('');
      }
    }, pause);
    return () => clearTimeout(t);
  }, [charIdx, lineIdx, lines, speed, pause, loop]);

  return displayed;
}

// 사용 예시
// const text = useTypewriter(['단서를 수집하라', '범인을 찾아라', '진실은 하나다']);
// <p className="font-body text-sepia">{text}<span className="animate-cursor-blink">_</span></p>
```

### 4-3. Film Grain 오버레이 — React 컴포넌트

```tsx
// src/components/ambient/FilmGrain.tsx
export function FilmGrain({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] animate-grain"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
```

### 4-4. Vignette + Scanlines 컴포넌트

```tsx
// src/components/ambient/Vignette.tsx
export function Vignette() {
  return (
    <>
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[2] animate-vignette-breathe"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,5,4,0.92) 100%)',
        }}
      />
      {/* Scanlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,5,4,0.08) 2px, rgba(6,5,4,0.08) 4px)',
          backgroundSize: '100% 4px',
        }}
      />
    </>
  );
}
```

### 4-5. AmbientLayer 루트 컴포넌트

```tsx
// src/components/ambient/AmbientLayer.tsx
import { FilmGrain } from './FilmGrain';
import { Vignette } from './Vignette';

interface AmbientLayerProps {
  grain?: boolean;
  vignette?: boolean;
}

export function AmbientLayer({ grain = true, vignette = true }: AmbientLayerProps) {
  return (
    <>
      {grain && <FilmGrain />}
      {vignette && <Vignette />}
    </>
  );
}
```

`AppLayout` 안에서 `<AmbientLayer />` 한 번만 렌더링. PlayPage처럼 몰입도가 높은 화면은 `vignette` prop을 강화(opacity 높임).

---

## 5. 컴포넌트 클래스 사전

`src/styles/index.css`에 `@layer components` 블록으로 정의.

```css
@layer components {

  /* ── Panel ─────────────────────────────────────────── */
  .panel {
    @apply bg-shadow border border-ghost rounded p-6 relative;
    /* 모서리 장식은 before/after 또는 SVG로 추가 */
  }
  .panel-paper {
    @apply bg-paper border border-ghost rounded p-6 relative;
  }

  /* ── Buttons ────────────────────────────────────────── */
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2
           px-6 py-3
           font-label text-[0.72rem] tracking-[0.3em] uppercase
           text-void bg-gold
           border border-gold
           transition-all duration-200
           hover:bg-amber hover:border-amber
           hover:shadow-[0_0_24px_rgba(201,164,71,0.4)]
           active:scale-[0.97];
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2
           px-6 py-3
           font-label text-[0.72rem] tracking-[0.3em] uppercase
           text-gold bg-transparent
           border border-gold-dim
           transition-all duration-200
           hover:border-gold hover:text-amber
           hover:shadow-[0_0_18px_rgba(201,164,71,0.2)]
           active:scale-[0.97];
  }
  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2
           px-5 py-2.5
           font-label text-[0.72rem] tracking-[0.25em] uppercase
           text-faded bg-transparent
           border border-ghost
           transition-all duration-200
           hover:border-gold-dim hover:text-sepia;
  }
  .btn-danger {
    @apply inline-flex items-center justify-center gap-2
           px-6 py-3
           font-label text-[0.72rem] tracking-[0.3em] uppercase
           text-sepia bg-transparent
           border border-crimson
           transition-all duration-200
           hover:bg-crimson/20 hover:text-amber
           active:scale-[0.97];
  }

  /* ── Clue Card (증거 카드) ──────────────────────────── */
  .clue-card {
    @apply bg-paper border border-ghost p-5 relative
           font-body text-sepia
           transition-all duration-300
           hover:border-gold-dim
           hover:shadow-[0_4px_32px_rgba(201,164,71,0.12)];
    box-shadow: inset 0 0 0 1px rgba(61,52,40,0.3),
                2px 3px 12px rgba(6,5,4,0.7);
  }
  .clue-card-title {
    @apply font-headline text-lg text-amber mb-2 leading-snug;
  }
  .clue-card-meta {
    @apply font-detail text-xs text-faded tracking-widest uppercase;
  }

  /* ── Input ──────────────────────────────────────────── */
  .noir-input {
    @apply w-full bg-dark border border-ghost rounded-none
           px-4 py-3
           font-body text-sepia text-sm
           placeholder:text-ghost placeholder:font-detail
           outline-none
           transition-all duration-200
           focus:border-gold-dim focus:shadow-[0_0_0_1px_rgba(125,100,40,0.4)];
  }
  .noir-select {
    @apply noir-input appearance-none cursor-pointer;
  }
  .noir-textarea {
    @apply noir-input resize-none;
  }

  /* ── Badge ──────────────────────────────────────────── */
  .badge {
    @apply inline-block px-2 py-0.5
           font-detail text-[0.65rem] tracking-[0.2em] uppercase;
  }
  .badge-file {
    @apply badge text-gold-dim border border-gold-dim/40;
  }
  .badge-open {
    @apply badge text-amber bg-gold/10 border border-gold/30;
  }
  .badge-closed {
    @apply badge text-faded border border-ghost;
  }
  .badge-danger {
    @apply badge text-crimson border border-crimson/40;
  }

  /* ── Divider (장식 구분선) ──────────────────────────── */
  .divider-ornate {
    @apply flex items-center gap-4 my-8;
  }
  .divider-ornate::before,
  .divider-ornate::after {
    content: '';
    @apply flex-1 h-px;
    background: linear-gradient(to right, transparent, #7d6428);
  }
  .divider-ornate::after {
    background: linear-gradient(to left, transparent, #7d6428);
  }
  .divider-ornate span {
    @apply font-label text-gold-dim text-xs tracking-[0.3em];
  }

  /* ── Section Header ─────────────────────────────────── */
  .section-header {
    @apply flex justify-between items-baseline mb-6;
  }
  .section-title {
    @apply font-headline text-xl text-sepia tracking-[0.06em];
  }
  .section-link {
    @apply font-detail text-xs text-faded tracking-widest uppercase
           hover:text-gold transition-colors cursor-pointer;
  }

  /* ── Corner Ornament (모서리 장식) ──────────────────── */
  /* panel에 ::before/::after 또는 SVG 인라인으로 삽입 */
  /* 예시: CornerOrnament 컴포넌트 참고 (6장) */

}
```

---

## 6. React 컴포넌트 패턴

### 6-1. 프로젝트 구조 (ambient 관련)

```
src/
  components/
    ambient/
      AmbientLayer.tsx   ← grain + vignette
      FilmGrain.tsx
      Vignette.tsx
    ui/
      Panel.tsx          ← .panel 래핑 컴포넌트
      Button.tsx         ← .btn-* 통합 컴포넌트
      Divider.tsx        ← .divider-ornate
      Badge.tsx          ← .badge-*
      CornerOrnament.tsx ← SVG 모서리 장식
      NoirInput.tsx      ← .noir-input 래핑
  hooks/
    useTypewriter.ts
```

### 6-2. Panel 컴포넌트 (모서리 장식 포함)

```tsx
// src/components/ui/Panel.tsx
type PanelVariant = 'default' | 'paper';

interface PanelProps {
  variant?: PanelVariant;
  ornament?: boolean;   // 모서리 SVG 장식 표시 여부
  className?: string;
  children: React.ReactNode;
}

const CORNER_SVG = `
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
       xmlns="http://www.w3.org/2000/svg">
    <path d="M1 13 V1 H13" stroke="#7d6428" stroke-width="1" fill="none"/>
  </svg>
`;
const CORNER_URL = `url("data:image/svg+xml,${encodeURIComponent(CORNER_SVG)}")`;

export function Panel({ variant = 'default', ornament = false, className = '', children }: PanelProps) {
  const base = variant === 'paper' ? 'panel-paper' : 'panel';
  return (
    <div
      className={`${base} ${className}`}
      style={ornament ? {
        backgroundImage: `
          ${CORNER_URL},
          ${CORNER_URL},
          ${CORNER_URL},
          ${CORNER_URL}
        `,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '8px 8px, calc(100% - 8px) 8px, 8px calc(100% - 8px), calc(100% - 8px) calc(100% - 8px)',
        backgroundSize: '14px 14px',
      } : undefined}
    >
      {children}
    </div>
  );
}
```

### 6-3. Button 컴포넌트

```tsx
// src/components/ui/Button.tsx
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
};

export function Button({ variant = 'primary', loading, className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`${variantMap[variant]} ${loading ? 'opacity-60 cursor-wait' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
```

### 6-4. Divider 컴포넌트

```tsx
// src/components/ui/Divider.tsx
export function Divider({ label = '✦' }: { label?: string }) {
  return (
    <div className="divider-ornate">
      <span>{label}</span>
    </div>
  );
}
```

---

## 7. 페이지별 디자인 지침

### 7-1. AppLayout (`src/components/AppLayout.tsx`)

**헤더**
- 배경: `bg-void/95 backdrop-blur-sm`
- 하단 테두리: `border-b border-ghost`
- 높이: `h-14`
- 로고: `font-display text-gold` + 작은 배지처럼 처리
- 네비 링크: `font-label text-xs tracking-[0.2em] uppercase text-faded hover:text-sepia`
- 코인 표시: `font-detail text-gold border border-gold/30 bg-gold/5`
- 로그인 버튼: `btn-secondary` 소형 (py-1.5)
- 프로필 드롭다운: `bg-shadow border border-ghost`

**푸터**
- 배경: `bg-void`
- 상단 테두리: `border-t border-ghost`
- 폰트: `font-detail text-xs text-faded`
- 브랜드: `font-label text-gold-dim`
- 링크: `hover:text-sepia transition-colors`
- 문구: "© {year} Open Clue" + `font-detail`

**앰비언트**
```tsx
// AppLayout 안에서 1회 마운트
<AmbientLayer grain vignette />
```

---

### 7-2. HomePage (`src/pages/HomePage.tsx`)

**히어로 섹션** (배너 교체)
- 배경: 어두운 그라디언트 대신 `bg-void`에 텍스트 중심 레이아웃
- 분류 배지: `badge-file` — "CASE FILE · OPEN CLUE"
- 타이틀: `font-display text-3xl md:text-5xl text-amber animate-title-in`
- 서브타이틀: `useTypewriter` 훅 + `font-body italic text-sepia`
- 커서: `animate-cursor-blink text-gold`
- 구분선: `<Divider />`

**사건 섹션**
- 섹션 헤더: `.section-header` + `.section-title` + `.section-link`
- 카드 그리드: `grid grid-cols-2 md:grid-cols-4 gap-4`
- 각 카드: `.clue-card` 스타일 적용
- 빈 카드(만들기): 점선 `border-dashed border-ghost hover:border-gold-dim`

**AI 모드 모달**
- 배경 오버레이: `bg-void/90 backdrop-blur-sm`
- 모달 박스: `<Panel ornament>` (720px 이하 너비)
- 헤더: `font-headline text-2xl text-amber`
- 폼 입력: `.noir-input`
- 제출 버튼: `.btn-primary` 전체 너비

---

### 7-3. LoginPage (`src/pages/LoginPage.tsx`)

- 전체 화면 레이아웃: `min-h-screen bg-void flex items-center justify-center`
- 중앙 패널: `<Panel ornament className="max-w-sm w-full mx-4">`
- 상단 분류 배지: `badge-file` — "DETECTIVE BUREAU"
- 타이틀: `font-display text-2xl text-gold text-center`
- 소셜 로그인 버튼: `.btn-secondary` (Google 등)
- 법적 링크: `font-detail text-[10px] text-faded`

---

### 7-4. CaseBrowsePage (`src/pages/CaseBrowsePage.tsx`)

- 헤더: `font-headline text-3xl text-sepia` + `badge-file` 분류 번호
- 탭: `font-label text-xs tracking-[0.2em] uppercase` — 활성: `text-gold border-b border-gold`, 비활성: `text-faded`
- 검색창: `.noir-input` (돋보기 아이콘 `text-gold-dim`)
- 카드 그리드: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- 정렬: `font-detail text-xs text-faded`
- 페이지네이션: `btn-ghost` 소형

---

### 7-5. PlayPage (`src/pages/PlayPage.tsx`)

가장 중요한 화면. 몰입감 최우선.

- 레이아웃: 전체화면 (`h-screen overflow-hidden`) — 헤더/푸터 없음
- 좌측 패널 (용의자/위치): `bg-shadow border-r border-ghost`
- 우측 대화 영역: `bg-void`
- **대화 버블**:
  - NPC: `bg-paper border border-ghost` + `font-body italic text-sepia`
  - 타이핑 애니메이션: `useTypewriter` 훅 (대화 텍스트에 적용)
  - 아바타: 세피아 필터 `filter: sepia(0.6) brightness(0.85)`
- **액션 버튼**: `.btn-secondary` 소형, 수평 스크롤
- **시간 표시**: `font-detail text-gold-dim tracking-widest`
- **카운트다운**: 적색 경고 시 `text-crimson animate-lamp-flicker`
- **배경 효과**: `<AmbientLayer grain vignette />` + vignette opacity 강화

---

### 7-6. ResultPage (`src/pages/ResultPage.tsx`)

- 배경: `bg-void`
- 타이틀 등장: `animate-title-in` (느린 letterSpacing 확장)
- 성공: `text-amber` + 골드 glow `shadow-[0_0_40px_rgba(201,164,71,0.3)]`
- 실패: `text-faded` + `text-crimson` 강조
- 증거 목록: `.clue-card` 그리드 (미니 코르크보드 느낌)
- 정답 공개: `<Divider label="— 진실 —" />` 후 드라마틱하게 `animate-fade-up`
- 다시하기 버튼: `.btn-primary`

---

## 8. Z-index 레이어링

```
z-[0]   → 배경 캔버스 (Rain, City — 향후 구현)
z-[1]   → FilmGrain 오버레이
z-[2]   → Vignette
z-[3]   → Scanlines
z-[4]   → 램프 조명 효과 (향후)
z-[5]   → 장식용 SVG
z-[6]   → 마우스 glow (향후)
z-[8]   → UI 오너먼트 (모서리 장식)
z-[10]  → 메인 콘텐츠
z-[50]  → Header (sticky)
z-[100] → Modal
z-[200] → Toast
```

---

## 9. 접근성 가이드

- **대비**: sepia(`#d4c49e`) on void(`#060504`) = 약 10:1 ✓ WCAG AAA 통과
- **대비**: gold(`#c9a447`) on void(`#060504`) = 약 7.5:1 ✓ WCAG AA 통과
- **대비 주의**: faded(`#7a6a4e`) on void — 소형 텍스트 단독 사용 금지. 반드시 `text-sepia`와 함께 보조적으로만.
- **ambient 레이어**: 모든 `FilmGrain`, `Vignette` 컴포넌트에 `aria-hidden="true"` 필수
- **타이핑 애니메이션**: `prefers-reduced-motion` 미디어 쿼리 대응

```css
@media (prefers-reduced-motion: reduce) {
  .animate-grain,
  .animate-lamp-flicker,
  .animate-vignette-breathe {
    animation: none;
  }
}
```

- **포커스 링**: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold`
- **한국어 스크린리더**: `lang="ko"` 유지, 라틴 폰트만 있는 장식 텍스트에 `aria-hidden`

---

## 10. 빠른 적용 체크리스트

새 컴포넌트/페이지 개발 시 확인:

- [ ] 배경색이 `bg-void` / `bg-shadow` / `bg-paper` 중 하나인가?
- [ ] 텍스트 색이 `text-sepia` / `text-amber` / `text-faded` 인가? (`text-white` 사용 금지)
- [ ] 폰트 역할이 올바른가? (버튼 → `font-label`, 본문 → `font-body`, 제목 → `font-headline`)
- [ ] 버튼이 `.btn-primary` / `.btn-secondary` / `.btn-ghost` 중 하나인가?
- [ ] 입력창이 `.noir-input` 인가?
- [ ] 테두리가 `border-ghost` / `border-gold-dim` / `border-gold` 중 하나인가?
- [ ] 장식 요소에 `aria-hidden="true"` 붙었는가?
- [ ] `prefers-reduced-motion` 대응했는가?

---

## 11. 금지 사항

| 금지 | 대체 |
|------|------|
| `text-white` | `text-sepia` or `text-amber` |
| `bg-gray-*` | `bg-shadow` or `bg-paper` |
| `border-gray-*` | `border-ghost` or `border-gold-dim` |
| `font-sans` (Inter, Segoe UI 등) | `font-body` or `font-label` |
| `rounded-full` 버튼 | 직각 or `rounded-sm` (느와르는 각진 느낌) |
| `text-blue-*` / `text-purple-*` / `text-pink-*` | 느와르 팔레트 내 색상만 |
| 밝은 배경(`bg-white`, `bg-gray-50`) | `bg-paper` (가장 밝은 서피스) |