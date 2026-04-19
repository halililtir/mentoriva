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
        ink: {
          0: '#070b14', // derin lacivert, arka plan
          50: '#0c1220', // kart arka planı
          100: '#0f1528', // sekonder yüzey
          200: '#151c30',
          300: '#1c2440',
          400: '#2a3350',
        },

        // Marka rengi — logonun cyan'ı
        brand: {
          300: '#5fe4ea',
          400: '#33d4dc',
          500: '#00bcd4', // ana cyan (logo)
          600: '#00a0b5',
          700: '#007d8c',
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
        paper: '#f0f2f5', // ana beyaz
        muted: '#8a92a4', // sekonder metin
        faint: '#4a5165', // devreden dışı
      },

      fontFamily: {
        // Başlıklar — editorial/felsefi hissi
        display: [
          '"Playfair Display"',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
        // Gövde — çağdaş, temiz
        sans: [
          '"Outfit"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        // UI (buton, etiket)
        ui: [
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

      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-up': 'fade-up 0.6s ease-out',
        'stagger-1': 'fade-up 0.6s ease-out 0.1s both',
        'stagger-2': 'fade-up 0.6s ease-out 0.2s both',
        'stagger-3': 'fade-up 0.6s ease-out 0.3s both',
        'stagger-4': 'fade-up 0.6s ease-out 0.4s both',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
