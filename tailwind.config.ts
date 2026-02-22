import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void:        '#060504',
        shadow:      '#0d0b09',
        dark:        '#161210',
        paper:       '#1e1a14',
        gold:        '#c9a447',
        'gold-dim':  '#7d6428',
        amber:       '#e8c96a',
        sepia:       '#d4c49e',
        faded:       '#7a6a4e',
        ghost:       '#3d3428',
        crimson:     '#8b1a1a',
      },
      fontFamily: {
        display:  ['"Cinzel Decorative"', 'serif'],
        headline: ['"Playfair Display"', '"Noto Serif KR"', 'serif'],
        body:     ['"IM Fell English"', '"Noto Serif KR"', 'serif'],
        label:    ['Cinzel', '"Noto Serif KR"', 'serif'],
        detail:   ['"Courier Prime"', 'monospace'],
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        grain: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-2%,-3%)' },
          '20%': { transform: 'translate(3%,1%)' },
          '30%': { transform: 'translate(-1%,4%)' },
          '40%': { transform: 'translate(4%,-2%)' },
          '50%': { transform: 'translate(-3%,3%)' },
          '60%': { transform: 'translate(2%,-4%)' },
          '70%': { transform: 'translate(-4%,2%)' },
          '80%': { transform: 'translate(3%,-1%)' },
          '90%': { transform: 'translate(-2%,4%)' },
        },
        'vignette-breathe': {
          '0%, 100%': { opacity: '0.82' },
          '50%': { opacity: '0.96' },
        },
        'lamp-flicker': {
          '0%, 100%': { opacity: '1' },
          '8%': { opacity: '0.92' },
          '15%': { opacity: '1' },
          '22%': { opacity: '0.87' },
          '30%': { opacity: '1' },
          '45%': { opacity: '0.94' },
          '72%': { opacity: '0.89' },
          '94%': { opacity: '0.93' },
        },
        'title-in': {
          from: { opacity: '0', letterSpacing: '0.5em' },
          to:   { opacity: '1', letterSpacing: '0.12em' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'grain':            'grain 0.4s steps(1) infinite',
        'vignette-breathe': 'vignette-breathe 6s ease-in-out infinite',
        'lamp-flicker':     'lamp-flicker 4s ease-in-out infinite',
        'title-in':         'title-in 1.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-up':          'fade-up 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'cursor-blink':     'cursor-blink 1s step-end infinite',
      },
      transitionTimingFunction: {
        'noir': 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
