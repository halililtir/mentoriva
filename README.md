# Mentoriva

> **Tek bir soru, dört farklı zihin.** Kişisel sorularına tek bir cevap yerine dört farklı düşünce geleneğinden bakış.

Mentoriva, tek bir soruya **Carl Jung**, **Friedrich Nietzsche**, **Mevlânâ Celâleddîn-i Rûmî** ve **Marcus Aurelius** karakterlerinden ayrı ayrı perspektif sunan çoklu-mentor platformudur. Kullanıcı 1–4 mentor seçer, cevaplar aynı anda akar, ardından seçtiği mentorla sohbete devam eder.

## Özellikler

- **Paralel mentor cevapları** — Server-Sent Events ile streaming
- **Devam eden sohbet** — seçilen mentorla derinleşme
- **Üyelik** — e-posta doğrulamalı kayıt, şifre sıfırlama, httpOnly çerezle sunucu tarafı oturum
- **Günlük kota** — kullanıcı başına günlük soru hakkı (Türkiye saatiyle gece yarısı yenilenir), sunucuda tutulur
- **Kişilik testi** (`/test`) — "Zihninin mimarı kim?"
- **Admin paneli** (`/admin`) — kullanıcılar, hak tanımlama, geri bildirimler, mentor popülerliği
- **Kriz algılama** — aktif intihar/kendine zarar niyetinde mentor cevabı yerine destek mesajı
- **Doğrulanmış alıntılar** — mentorlar cevabı orijinal metinden doğrulanmış kendi sözleriyle bitirir; `/alintilar` sayfaları
- **Paylaşım kartı** — cevaptan seçilen cümle hikâye boyutunda görsel olarak paylaşılır
- **Günün sorusu** — her gün dört mentorun cevabı, giriş gerektirmez (Vercel cron)
- **Davet et, kazan** — davet eden ve yeni üye bonus soru hakkı kazanır
- **Prompt caching** — her mentorun system prompt'u cache'lenir

## Teknoloji

- **Next.js 14** (App Router) · **React 18** · **TypeScript** (strict)
- **Tailwind CSS 3** — animasyonlar CSS ile, ek animasyon kütüphanesi yok
- **Anthropic Claude SDK** (`claude-sonnet-4-6`, hata durumunda `claude-haiku-4-5`)
- **Upstash Redis** — kullanıcılar, oturumlar, kota, rate limit, geri bildirim
- **Resend** — doğrulama ve şifre sıfırlama e-postaları
- **Vitest** — birim ve route testleri

## Kurulum

```bash
npm install
cp .env.example .env.local   # değerleri doldur
npm run dev                   # http://localhost:3000
```

### API anahtarı olmadan yerel geliştirme

`.env.local` içine `MENTORIVA_MOCK_AI=1` yazarsan Claude API çağrılmaz, mentorlar sahte cevaplar akıtır. `KV_*` değişkenleri boşsa veriler bellekte tutulur. `RESEND_API_KEY` yoksa doğrulama kodu sunucu konsoluna yazılır. Böylece kayıt → soru → sohbet akışının tamamı yerelde denenebilir.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build (tip ve lint kontrolü dahil) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest testleri |

## Ortam değişkenleri

Ayrıntılı açıklamalar `.env.example` içinde.

| Değişken | Zorunlu | Not |
|---|---|---|
| `ANTHROPIC_API_KEY` | evet | Yalnızca sunucuda kullanılır |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | production'da evet | Yoksa bellek deposu (kalıcı değil) |
| `ADMIN_SECRET` | admin için | En az 12 karakter; yoksa `/admin` kapalı |
| `RESEND_API_KEY` | kayıt için | |
| `RESEND_FROM` | önerilir | Resend'de doğrulanmış alan adından gönderici |
| `NEXT_PUBLIC_SITE_URL` | hayır | Varsayılan `https://mentoriva.com.tr` |

## Proje yapısı

```
app/
├── page.tsx                  # Ana sayfa: galeri → soru → cevap(lar) → sohbet
├── giris, kayit, sifremi-unuttum, test, hakkimizda, geri-bildirim, admin …
├── api/v1/auth/*             # register, verify, login, logout, me, reset-request, reset-confirm
├── api/v1/mentors/respond    # Paralel mentor cevapları (SSE)
├── api/v1/mentors/chat       # Tek mentorla sohbet (SSE)
├── api/v1/users|feedback|stats  # Admin uçları (+ herkese açık geri bildirim POST)
└── api/admin/*               # Admin oturumu
components/
├── home/                     # Hero, CouncilOrbit, HowItWorks, SelectionDock
├── mentors/                  # Galeri kartı, soru, tekli/karşılaştırma cevap, limit, kriz
├── chat/ChatView.tsx
├── shared/                   # Header, Footer, Logo, Atmosphere, AuthShell, Toast
└── ui/                       # Reveal, TypingDots, CodeInput
lib/
├── auth/                     # password (scrypt), session, users + kota, codes
├── claude/                   # SDK wrapper, mock
├── mentors/                  # metadata, prompts, slaps
├── safety/moderation.ts
├── kv.ts, rate-limit.ts, sse.ts, session.tsx, useSSEStream.ts, features.ts, site.ts
tests/                        # Vitest
```

## Production deploy (Vercel)

1. Repoyu Vercel'e bağla (Next.js otomatik algılanır).
2. **Storage → Upstash for Redis** ekle; `KV_REST_API_URL` / `KV_REST_API_TOKEN` otomatik gelir.
3. Environment Variables: `ANTHROPIC_API_KEY`, `ADMIN_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_SITE_URL`.
4. Resend panelinde gönderici alan adını doğrula (SPF/DKIM kayıtları).
5. Vercel panelinde **Analytics** sekmesini aç (çerezsiz ölçüm).
6. Deploy. Günün sorusu cron'u `vercel.json` ile otomatik kurulur.

## Güvenlik

- `ANTHROPIC_API_KEY` ve diğer anahtarlar yalnızca sunucuda kullanılır.
- Şifreler scrypt ile tuzlanıp hash'lenir. Eski düz metin kayıtlar ilk girişte otomatik hash'e çevrilir.
- Oturum httpOnly + SameSite çerezle tutulur; Redis'te yalnızca token özeti saklanır.
- Kota ve yetki kontrolü sunucuda yapılır, istemciye güvenilmez.
- Rate limit: mentor uçları (kullanıcı + IP), giriş, kod gönderimi, admin girişi, geri bildirim.
- Doğrulama kodları kriptografik rastgele üretilir, hash'lenerek saklanır, 5 yanlış denemede geçersiz olur.
- CSP, HSTS, X-Frame-Options ve diğer güvenlik başlıkları `next.config.js` içinde.

## Kriz politikası

`lib/safety/moderation.ts` aktif intihar veya kendine zarar niyeti ifadelerini (Türkçe büyük/küçük harf ve Türkçe karaktersiz yazımlar dahil) yakalar. Bu durumda mentor çağrılmaz, kota düşülmez ve kullanıcıya bir uzmana danışmasını öneren destekleyici bir mesaj gösterilir. Mentor prompt'ları (`prompts/shared.ts`) da aynı durumda karakteri bırakıp profesyonel desteğe yönlendirir. Bilinçli bir ürün kararıyla belirli telefon numarası verilmez.

## Disclaimer

> Mentoriva, profesyonel psikolojik destek veya tıbbi tavsiye yerine geçmez. Cevaplar, tarihî figürlerin felsefi perspektiflerini yansıtan yapay zekâ üretimleridir.

## Lisans

Proprietary — tüm hakları saklıdır.
