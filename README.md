# Mentoriva

> **Düşünce meclisini kur.** ChatGPT sana bir cevap verir; Mentoriva sana bir düşünce meclisi kurar.

Mentoriva, tek bir soruya **Carl Jung**, **Friedrich Nietzsche**, **Mevlânâ Celâleddîn-i Rûmî** ve **Marcus Aurelius**'tan dört farklı perspektif sunan çoklu-mentor platformudur.

## ✨ Özellikler

- **4 paralel mentor cevabı** — Server-Sent Events ile streaming
- **Devam eden sohbet** — Seçtiğin mentor ile derinleş
- **Prompt caching** — Her mentor için system prompt cache'lenir, maliyet %90 düşer
- **Rate limiting** — Vercel KV ile IP-based
- **Kriz algılama** — Aktif intihar niyeti tespitinde helpline'a yönlendirme
- **Responsive tasarım** — Mobilden 4K'ya kadar
- **Erişilebilirlik** — Klavye navigasyonu, ARIA labels, reduced motion

## 🏗️ Teknoloji

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS 3**
- **Anthropic Claude SDK** (`claude-sonnet-4-6`)
- **Vercel KV** (rate limiting — opsiyonel, yoksa atlanır)

## 📁 Proje Yapısı

```
mentoriva/
├── app/
│   ├── api/v1/mentors/
│   │   ├── respond/route.ts   # 4 paralel streaming SSE
│   │   └── chat/route.ts      # Tek mentor streaming SSE
│   ├── layout.tsx             # Root, metadata, fonts
│   ├── page.tsx               # State machine (landing/responses/chat)
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── shared/                # Logo, Header
│   ├── landing/               # LandingView, QuestionForm
│   ├── mentors/               # MentorCard, ResponseCard, ResponsesView
│   └── chat/                  # ChatView
├── lib/
│   ├── mentors/
│   │   ├── metadata.ts        # UI metadata
│   │   └── prompts/           # 4 mentor system prompt + few-shot
│   ├── claude/
│   │   ├── client.ts          # SDK wrapper + streaming + caching
│   │   └── rate-limit.ts      # Vercel KV rate limiting
│   ├── safety/
│   │   └── moderation.ts      # Kriz algılama
│   ├── features.ts            # Feature flags + sabitler
│   ├── cn.ts                  # className utility
│   └── useSSEStream.ts        # SSE consumer hook
├── types/
│   └── index.ts               # Merkezi tip sistemi
└── public/
    └── favicon.svg
```

## 🚀 Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Environment değişkenlerini ayarla

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenle:

```bash
# Zorunlu
ANTHROPIC_API_KEY=sk-ant-api03-...

# Opsiyonel (rate limiting için)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Opsiyonel
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**API anahtarı nereden alınır?**
[console.anthropic.com](https://console.anthropic.com/settings/keys) → API Keys → Create Key

### 3. Geliştirme sunucusunu başlat

```bash
npm run dev
```

`http://localhost:3000` adresini aç.

### 4. TypeScript doğrulama

```bash
npm run typecheck
```

## 🌐 Production Deploy (Vercel)

### 1. GitHub'a push et

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <repo-url>
git push -u origin main
```

### 2. Vercel'e bağla

1. [vercel.com/new](https://vercel.com/new) → Repository'yi import et
2. Framework otomatik algılanır (Next.js)
3. **Environment Variables**:
   - `ANTHROPIC_API_KEY` — zorunlu
   - `NEXT_PUBLIC_SITE_URL` — `https://your-domain.vercel.app`

### 3. Vercel KV ekle (rate limiting için)

1. Vercel Dashboard → **Storage** → **Create Database** → **KV**
2. Proje ile ilişkilendir → 4 env var otomatik eklenir
3. Redeploy

### 4. Domain bağla (opsiyonel)

Settings → Domains → Add.

## 🎨 Tasarım Sistemi

**Renkler** (`tailwind.config.ts`):
- **Brand** — `#00bcd4` (logodan cyan)
- **Jung** — `#00bcd4` (cyan, bilinçdışı derinliği)
- **Nietzsche** — `#e89a3c` (amber, ateş)
- **Mevlânâ** — `#d4a574` (altın, tasavvuf)
- **Marcus** — `#8b9bb4` (soğuk slate, stoacılık)

**Tipografi**:
- **Display** — Playfair Display (serif, editorial hissi)
- **Body** — Outfit (sans, çağdaş)

## 🧠 Yeni Mentor Eklemek

1. `types/index.ts` → `MENTOR_IDS` array'ine ID ekle
2. `lib/mentors/metadata.ts` → `MENTORS` objesine metadata gir
3. `lib/mentors/prompts/` altında yeni dosya: system prompt + few-shot
4. `lib/mentors/prompts/index.ts` → `MENTOR_PROMPTS`'e register et

## 🛡️ Güvenlik

- **`ANTHROPIC_API_KEY` asla client'a sızmaz** — sadece API route'larında kullanılır
- **Kriz algılama** — `lib/safety/moderation.ts` aktif intihar niyeti ifadelerini yakalar ve helpline gösterir
- **Rate limiting** — dakikada 5 respond / 20 chat per IP
- **Input validation** — min/max uzunluk, son mesaj role kontrolü
- **Security headers** — `next.config.ts` içinde X-Frame-Options, CSP basics

## ⚠️ Disclaimer

> Mentoriva, profesyonel psikolojik destek veya tıbbi tavsiye yerine geçmez. Cevaplar, tarihî figürlerin felsefi perspektiflerini yansıtan yapay zekâ üretimleridir.
>
> **Kriz anında: 182 (İntihar Önleme Hattı) veya 112 (Acil Servis).**

## 🗺️ Roadmap

- **v1.1** — MongoDB ile session kalıcılığı
- **v1.2** — Google OAuth
- **v1.3** — Interjection (mentor araya girer)
- **v1.4** — Feedback 👍👎 + analiz paneli
- **v2.0** — Premium tier (Opus modeli, daha uzun sohbet, daha fazla mentor)

## 📄 Lisans

Proprietary — tüm hakları saklıdır.
