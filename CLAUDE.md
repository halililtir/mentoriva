# CLAUDE.md

Bu dosya, bu depoda çalışan Claude Code için yönlendirmedir.

## Proje

Mentoriva — kullanıcının tek sorusuna Jung, Nietzsche, Mevlânâ, Marcus Aurelius, Seneca ve Sokrates (erken erişim) karakterlerinden ayrı ayrı yapay zekâ cevabı üreten, ardından seçilen mentorla sohbete devam ettiren Türkçe web uygulaması. Kapalı beta: e-posta doğrulamalı üyelik ve günlük soru kotası var. Depo: `github.com/halililtir/mentoriva`, Vercel'e deploy edilir.

Arayüz, prompt'lar, commit mesajları ve kod yorumları Türkçedir; yeni metinleri de Türkçe yaz.

## Komutlar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # tip + lint kontrolü dahil
npm run typecheck
npm run lint
npm test           # vitest (tests/)
```

- Yerelde API anahtarı olmadan çalışmak için `.env.local` içine `MENTORIVA_MOCK_AI=1` yaz (`lib/claude/mock.ts`). `KV_*` yoksa bellek deposu, `RESEND_API_KEY` yoksa doğrulama kodu sunucu konsoluna yazılır.
- Dev sunucusu çalışırken `npm run build` yapma; ikisi aynı `.next` klasörünü kullanır.
- Windows'ta `.git` yolu uzunsa git komutlarına `-c core.longpaths=true` ekle (repo ayarında açık).
- `tailwind.config.ts` değişince dev sunucusunu yeniden başlat.

## Teknoloji

Next.js 14 (App Router) · React 18 · TypeScript (strict + `noUncheckedIndexedAccess`) · Tailwind CSS 3 · `@anthropic-ai/sdk` · Upstash Redis · Resend (HTTP `fetch`) · Vitest · Vercel. Yol takma adı `@/*` depo köküdür.

## Mimari (özet)

- `app/page.tsx` istemci tarafı durum makinesi: `gallery → ask → single-response | compare → chat` (+ kota bitince `limit`). İstemci `lib/useSSEStream.ts` ile SSE okur; kimlik httpOnly çerezle gider.
- `/api/v1/mentors/respond` ve `/chat`: `authorizeMentorRequest` (oturum + rate limit) → doğrulama → moderasyon → `reserveQuestion` (kota) → stream. Hiçbir mentor cevap üretemezse `releaseQuestion` ile hak iade edilir.
- Yapay zekâ çağrıları `lib/claude/client.ts` (`streamMentorResponse`, `completeText`); her çağrı `feature` ile maliyete yazılır (`lib/admin/cost.ts`, model değişirse `PRICES`'ı güncelle).
- Sabitlerin tek kaynağı `lib/features.ts`; alan adı ve iletişim `lib/site.ts`. Redis'e tek giriş `lib/kv.ts → getKV()`; toplu okuma `getMany()`, desen taraması `scanKeys()` (`KEYS` kullanma).

## Ayrıntılar (`docs/`)

İlgili alana dokunmadan önce oku:

- [`docs/mimari.md`](docs/mimari.md) — istek akışı, oturum ve kota (`lib/auth/`), admin paneli ve metrikler, Redis anahtar listesi
- [`docs/mentorlar.md`](docs/mentorlar.md) — mentor prompt yapısı, laboratuvar ve hakem, alıntı kataloğu, başka bir bakış, öneri, sentez, yeni mentor ekleme
- [`docs/ozellikler.md`](docs/ozellikler.md) — paylaşım kartı, günün sorusu, davet, işaretler, misafir denemesi, kayıtlı sohbetler, hukuki onaylar, İçimde ne var?, Söyleyeceğimi hazırla, Aramızda, rehberli çalışmalar, Yolculuğum ve hafıza, Kendine Yolculuk
- [`docs/tasarim.md`](docs/tasarim.md) — temalar, renk sınıfları, ortak CSS sınıfları, animasyonlar

Yeni bir özellik ya da kural eklediğinde ayrıntıyı ilgili `docs/` dosyasına yaz; buraya yalnızca her işte geçerli olan kuralı ekle.

## Her işte geçerli kurallar

- Arayüz metinlerinde mentor sayısı ("dört mentor") ve günlük hak sayısı elle yazılmaz; sabitleri kullan. Mentor adına ek `lib/tr.ts` ile (`'a` gibi sabit ek yazma).
- Mentor cevapları düz metin render edilir; prompt'lar markdown'ı yasaklar. Talimat değişikliğini admin "Mentor laboratuvarı" ve eski/yeni ses karşılaştırmasıyla sına; yasak eklemek yerine olumlu ilke yaz (ayrıntı `docs/mentorlar.md`).
- Misafirin yazdığı metni yapay zekâya gönderen her uç `consent: true` ister.
- Yeni bir kişisel veri anahtarı eklersen `deleteUser`'a, `/api/v1/me/export`'a ve `/gizlilik`'e ekle; `/gizlilik`'teki saklama süreleri kodla aynı kalmalı (değişirse `LEGAL_VERSION`).
- Hafıza yalnızca kişinin onayladığı notlardır; gizli profil ya da otomatik çıkarım ekleme. İşaretler (rozetler) sıralama, seri ya da soru sayısı ödüllendirmez.
- Kullanıcı metinleri (soru, yolculuk, çalışma, Aramızda) metriklere, loglara ve hata kaydına yazılmaz.
- Renklerde sabit hex/`rgba(255,255,255,…)` yerine tema sınıflarını ya da `rgb(var(--fg) / x)` kullan. Aynı elemanda hem animasyon hem hover transform kullanma (ayrıntı `docs/tasarim.md`).

## Kriz politikası

Moderasyon (`lib/safety/moderation.ts`) girdiyi Türkçe küçültüp ASCII'ye katlar; desenler ASCII yazılır. Kriz/zararlı içerikte mentor çağrılmaz, kota düşülmez. Ürün sahibinin kararı (2026-10-03): **112 yalnızca moderasyonun kriz algıladığı kartta** verilir (`components/mentors/EmergencyLine.tsx`; CrisisNotice ve sohbet uyarısı). Mentor cevaplarında ve Kendine Yolculuk metinlerinde numara yoktur (`prompts/shared.ts`). Bu alanı değiştirmeden önce kullanıcıya sor.

## Deploy öncesi kontrol

`main`'e birleştirmeden ya da Vercel'e göndermeden önce:

1. `npm run typecheck`, `npm run lint`, `npm test` geçmeli.
2. Kota, oturum/çerez, moderasyon-kriz, misafir onayı, ödeme/hak iadesi veya kişisel veri silme/dışa aktarma koduna dokunan değişikliklerde Claude Code'da `/code-review high` çalıştır ve bulguları kapat. Büyük sürümlerde `/code-review ultra` (ayrıca ücretlendirilir) düşünülebilir.

## Ortam değişkenleri (Vercel)

`ANTHROPIC_API_KEY`, Redis (`UPSTASH_REDIS_REST_*` ya da `KV_REST_API_*`), `ADMIN_SECRET` (≥12), `SHARE_CARD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `RESEND_FROM` (doğrulanmış alan adı), `ADMIN_EMAIL` (haftalık özet), `CRON_SECRET` (cron doğrulaması). Hangilerinin eksik olduğu `/api/health` ve admin "Genel bakış"ta görünür.

## Açık konular

- `ADMIN_SECRET` production'da en az 12 karakterlik yeni bir değerle değiştirilmeli; eskisi kodda ve git geçmişinde açıkta kaldığı için kullanılmamalı.
- Resend'de gönderici alan adı doğrulanıp `RESEND_FROM` ayarlanmalı.
- Üye listesi SCAN + MGET ile okunuyor; on binlerce üyede set tabanlı indeks ve sayfalama gerekir.
- Hata izleme (ör. Sentry) yok.
- Model `claude-sonnet-5-5`: ilk cevap effort `medium`, sohbet `low`, yolculuk sonucu `medium`; temperature yok (Haiku fallback temperature ile). Effort'u laboratuvarla doğrula.
