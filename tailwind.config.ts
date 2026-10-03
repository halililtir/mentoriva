import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Temel yüzeyler
        // Tema renkleri app/globals.css içindeki CSS değişkenlerinden gelir
        // (html[data-theme] = gece | aksam | gunduz). "white" da temaya göre
        // ön plan rengidir: açık temada koyu metne döner; böylece text-white/50
        // gibi yüzlerce sınıf her temada doğru çalışır.
        white: 'rgb(var(--fg) / <alpha-value>)',
        ink: {
          0: 'rgb(var(--ink-0) / <alpha-value>)', // arka plan
          50: 'rgb(var(--ink-50) / <alpha-value>)', // kart arka planı
          100: 'rgb(var(--ink-100) / <alpha-value>)', // sekonder yüzey
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
        },
        // Marka rengi zeminli butonların üzerindeki metin
        onbrand: 'rgb(var(--on-brand) / <alpha-value>)',

        // Marka rengi — logonun cyan'ı
        brand: {
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)', // ana cyan (logo)
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
        },

        // Mentor aksent renkleri (eski siten + bizim paletten karma)
        mentor: {
          jung: '#00bcd4', // cyan (derinlik, bilinçdışı)
          nietzsche: '#e89a3c', // amber (ateş, güç)
          mevlana: '#d4a574', // altın (aşk, sufi)
          marcus: '#8b9bb4', // cool slate (stoik)
        },

        // Durum renkleri
        premium: '#f59e0b', // turuncu (eski siteden)
        danger: '#ef4444',

        // Metin
        paper: 'rgb(var(--paper) / <alpha-value>)', // ana metin
        muted: 'rgb(var(--muted) / <alpha-value>)', // sekonder metin
        faint: 'rgb(var(--faint) / <alpha-value>)', // devreden dışı
      },

      fontFamily: {
        // Başlıklar — editorial/felsefi hissi
        display: [
          'var(--font-display)',
          '"Playfair Display"',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
        // Gövde — çağdaş, temiz
        sans: [
          'var(--font-sans)',
          '"Outfit"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        // UI (buton, etiket)
        ui: [
          'var(--font-sans)',
          '"Outfit"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },

      fontSize: {
        // Bigger serif display sizes
        hero: ['clamp(2.25rem, 6vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h1: ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },

      maxWidth: {
        reading: '70ch',
        content: '1200px',
        narrow: '720px',
      },

      borderRadius: {
        card: '14px',
        pill: '9999px',
      },

      boxShadow: {
        'glow-brand': '0 0 0 1px rgba(0, 188, 212, 0.25), 0 8px 24px -8px rgba(0, 188, 212, 0.35)',
        'glow-jung': '0 0 0 1px rgba(0, 188, 212, 0.25), 0 8px 24px -8px rgba(0, 188, 212, 0.25)',
        'glow-nietzsche': '0 0 0 1px rgba(232, 154, 60, 0.30), 0 8px 24px -8px rgba(232, 154, 60, 0.30)',
        'glow-mevlana': '0 0 0 1px rgba(212, 165, 116, 0.30), 0 8px 24px -8px rgba(212, 165, 116, 0.30)',
        'glow-marcus': '0 0 0 1px rgba(139, 155, 180, 0.30), 0 8px 24px -8px rgba(139, 155, 180, 0.30)',
        'card': '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 20px 40px -20px rgba(0, 0, 0, 0.8)',
      },

      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-down': 'fade-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop': 'pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'dock-in': 'dock-in 0.55s cubic-bezier(0.34, 1.3, 0.64, 1) both',
        'word': 'word 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease-in-out infinite',
        'orbit': 'orbit 60s linear infinite',
        'orbit-reverse': 'orbit 60s linear infinite reverse',
        'spin-slow': 'orbit 120s linear infinite',
        'float': 'float 7s ease-in-out infinite',
        'aurora-1': 'aurora-1 26s ease-in-out infinite alternate',
        'aurora-2': 'aurora-2 32s ease-in-out infinite alternate',
        'aurora-3': 'aurora-3 38s ease-in-out infinite alternate',
        'breathe': 'breathe 3.2s ease-in-out infinite',
        'dot': 'dot 1.2s ease-in-out infinite',
        'needle': 'needle 2.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'dock-in': {
          '0%': { transform: 'translate(-50%, 120%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        word: {
          '0%': { opacity: '0', transform: 'translateY(0.5em)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'aurora-1': {
          '0%': { transform: 'translate(-10%, -10%) scale(1)' },
          '100%': { transform: 'translate(15%, 10%) scale(1.25)' },
        },
        'aurora-2': {
          '0%': { transform: 'translate(10%, 0) scale(1.1)' },
          '100%': { transform: 'translate(-20%, 15%) scale(0.9)' },
        },
        'aurora-3': {
          '0%': { transform: 'translate(0, 10%) scale(0.9)' },
          '100%': { transform: 'translate(10%, -15%) scale(1.2)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
        dot: {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-3px)' },
        },
        needle: {
          '0%': { transform: 'rotate(-140deg)' },
          '60%': { transform: 'rotate(18deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'cursor-blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
