# CLAUDE.md

Bu dosya, bu depoda çalışan Claude Code için yönlendirmedir.

## Proje

Mentoriva — kullanıcının tek sorusuna Jung, Nietzsche, Mevlânâ, Marcus Aurelius ve Seneca karakterlerinden ayrı ayrı yapay zekâ cevabı üreten, ardından seçilen mentorla sohbete devam ettiren Türkçe web uygulaması. Kapalı beta: e-posta doğrulamalı üyelik ve günlük soru kotası var. Depo: `github.com/halililtir/mentoriva`, Vercel'e deploy edilir.

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

## Mimari

### İstek akışı

1. `app/page.tsx` istemci tarafı durum makinesi: `gallery → ask → single-response | compare → chat` (+ kota bitince `limit`). Karşılaştırma görünümü sohbete geçince sökülmez (`hidden`), geri dönünce yeniden istek atılmaz.
   - `gallery` görünümü bir tanıtım sayfasıdır ve oturuma göre sıralanır. **Misafir** için sıra şöyledir: Hero (canlı örnek `DemoPreview`), rakamlar, "neden", "nasıl çalışır", mentorlar, örnek sorular, "ne değildir", SSS, kapanış. **Üye** için sıra: Hero, mentorlar, örnek sorular, nasıl çalışır, SSS, kapanış.
   - Bölümler `components/home/*` altındadır. Tanıtım metinleri (örnek cevaplar, konu başlıkları, SSS) `lib/home-content.ts` içindedir; metin değişikliği için bileşenlere dokunma.
   - "Bu soruyu sor" ile seçilen soru `sessionStorage.mentoriva_draft` içinde taslak olarak tutulur. Misafir kayıt olup döndüğünde taslak korunur ve `AskView` o soruyla dolu açılır.
   - `FlowSteps` (Mentor seç → Soru yaz → Cevapları gör → Sohbet et) kullanıcıya akışta nerede olduğunu gösterir.
2. İstemci `lib/useSSEStream.ts` ile POST atar ve SSE okur. Kimlik httpOnly çerezle otomatik gider; istemci kullanıcı adı başlığı **göndermez**.
3. `POST /api/v1/mentors/respond` ve `/chat` aynı sırayı izler: `authorizeMentorRequest` (oturum + rate limit, `lib/sse.ts`) → doğrulama → moderasyon → `reserveQuestion` (kota) → stream. İlk olay `{type:'quota', remaining}`; hiçbir mentor cevap üretemezse `releaseQuestion` ile hak iade edilir.
4. `lib/claude/client.ts → streamMentorResponse()`: SDK singleton, system prompt'ta `cache_control: ephemeral`, ilk denemede `API.MODEL`, hata olursa (henüz metin akmadıysa) bir kez `API.FALLBACK_MODEL`.

### Oturum ve kota (`lib/auth/`)

- `session.ts` — `mentoriva_session` (30 gün) ve `mentoriva_admin` (12 saat) httpOnly çerezleri. Redis'te `session:<sha256(token)>` / `admin-session:<sha256(token)>`.
- `password.ts` — scrypt; düz metin eski kayıtları tanır (`needsRehash`), login'de hash'e çevrilir.
- `users.ts` — `user:<email>` kaydı + günlük sayaç `usage:<email>:<YYYY-MM-DD>` (atomik INCR, Europe/Istanbul günü, `lib/time.ts`). Günlük limit `dailyLimitOf()`: varsayılan `DEFAULT_DAILY_LIMIT` (10, `lib/auth/limits.ts`). Kayıtta artık limit yazılmaz; eski kayıtlardaki otomatik 5 (`LEGACY_DEFAULT_LIMIT`) varsayılana döner, admin'in verdiği limit (`limitByAdmin`) korunur. Arayüz metinlerinde sayıyı elle yazma, sabiti kullan. `dailyUsed`/`dailyResetDate` eski alanlardır, okunmaz.
- `codes.ts` — kayıt/şifre sıfırlama kodları: hash'li saklanır, 10 dk TTL, 5 yanlışta kilit.
- `registration.ts` — kayıt sırasında `pending:<email>` (ad, parola özeti, davet; 7 gün) da yazılır. `completeRegistration` hem kodla doğrulamada hem admin onayında kullanılır (Üyeler sekmesi → "Doğrulama bekleyenler", `/api/admin/pending`). E-posta ulaşmayan biri böyle açılır.
- E-posta: `lib/email.ts` (`sendEmailDetailed` hata nedenini döner ve admin Hatalar'a yazar; kod konu satırında). Admin "E-posta ayarları" kartından deneme e-postası (`/api/admin/email-test`).
- İstemci tarafı: `lib/session.tsx` (`SessionProvider`, `useSession`) yalnızca `/api/v1/auth/me` sonucunu ve SSE'den gelen kalan hakkı gösterir.

### Admin

`/admin` → `/api/admin/login` (ADMIN_SECRET, en az 12 karakter; 12 saatlik çerez). Panel `app/admin/page.tsx` + `components/admin/*` (Genel bakış, Üyeler, Geri bildirim, İşlem kaydı); tüm çağrılar `adminFetch` ile, 401 gelince giriş ekranına döner.

- `GET /api/admin/overview`: sistem durumu (`lib/health.ts`, `/api/health` ile ortak), üye özetleri, son 30 günün olay serileri, mentor tercihleri, son 7 günün konuları, **anonim** son sorular, okunmamış geri bildirim sayısı.
- `/api/v1/users` (admin): GET üyeleri bugünkü kullanım/bonus/davet sayısıyla toplu okur (`getMany`). PUT: `dailyLimit`, `isActive`, `notes`, `password`, `resetToday: true`, `addBonus` (1–500). Önce tüm alanlar doğrulanır, sonra yazılır. DELETE kişisel veriyle birlikte siler.
- `/api/v1/feedback` (admin): GET, PATCH `{id, status: 'new'|'read'}`, DELETE `?id=`. Kimlik `feedback:<ms>:<token>` desenine uymazsa reddedilir (başka anahtar silinemez).
- Metrikler `lib/admin/metrics.ts → recordEvent()`: `stats:day:<tarih>:<olay>` (question, chat, signup, journey, share, referral, feedback, crisis, mentor_error; 120 gün TTL). Konular `lib/admin/topics.ts` (anahtar kelime, ASCII katlanmış; `stats:topic:<tarih>:<konu>`). Soru metni ve kullanıcı eşleşmesi metriklere yazılmaz; `stats:recent-questions` kullanıcısızdır.
- Sunucusuz ortamda yanıt sonrası iş kesilebildiği için metrik yazımları `await` edilir; fonksiyonlar hata fırlatmaz.
- Her admin değişikliği `lib/admin/audit.ts` ile `admin-log` listesine yazılır (son 300), `GET /api/admin/log`.
- **Cevap değerlendirme:** `components/shared/RateAnswer.tsx` (👍/👎, 👎 sonrası isteğe bağlı neden) → `POST /api/v1/rate` (oturumsuz, IP sınırlı) → `lib/admin/ratings.ts` sayaçları `stats:rating:<tarih>:<mentor>:<up|down>`, `stats:rating-reason:<tarih>:<neden>`. Cevap metni gönderilmez. Neden kimlikleri bileşende ve `DOWN_REASONS`'ta aynı olmalı.
- **Hata kaydı:** `lib/admin/errors.ts → logError()` son 200 hatayı `errors:recent`'e yazar (e-posta, anahtar, URL sorgusu temizlenir; kullanıcı metni asla). Tarayıcı: `components/shared/ErrorReporter.tsx` (layout'ta) + `app/error.tsx` → `POST /api/v1/errors`. Panelde "Hatalar" sekmesi (`GET /api/admin/errors`). Sentry yok; istenirse bunun yanına eklenir.
- **Haftalık özet:** `lib/admin/report.ts` (son 7 gün / önceki 7 gün). Cron `/api/cron/weekly-report` pazartesi 06:00 UTC, `Authorization: Bearer CRON_SECRET` ister; alıcı `ADMIN_EMAIL`. Panelde önizleme ve "Şimdi gönder" (`/api/admin/report`). Gönderim `lib/email.ts → sendEmail()`.
- **Büyüme ve maliyet** (`GET /api/admin/insights`): huni ve haftalık gruplar `lib/admin/funnel.ts` (üye kayıtlarından; ek veri yok). Yapay zekâ maliyeti `lib/admin/cost.ts`: `client.ts` her çağrının token kullanımını (`message_start`/`message_delta`, `res.usage`) `recordUsage(feature, model, usage)` ile yazar; özellik `answer | chat | daily | journey | other` (`streamMentorResponse({feature})`, `completeText({feature})`). Fiyatlar `PRICES` (USD/1M token, liste fiyatı) — model değişirse güncelle.
- **Yeni üye karşılaması:** `components/home/WelcomeCard.tsx`, yalnızca `questionsUsed === 0` olan üyeye (`toPublicUser` döner); metinler `lib/home-content.ts → WELCOME`.

### Mentor prompt'ları

- `lib/mentors/prompts/<mentor>.ts` → `MentorPromptBundle` (`initial`, `chat`, `examples`); ortak bloklar `prompts/shared.ts`.
- Yapı: karakter (kim, nasıl düşünür, ses, esnek biçim; düz yazı, büyük harfle bağırma ve "o Jung'un işi" gibi karşıtlık yasakları yok) + `POSITIONS` (eserlere dayalı düşünce haritası) + `DEPTH` (alt metni oku, tek tez, uzunluk sorunun ağırlığına göre, genel öğüt yasağı) + kimlik/dil/güvenlik + alıntı kataloğu + `examplesBlock` (3 farklı örnek, system prompt içinde "şablon değil" diye). Sohbet: + `CONVERSATION` (genişleme değil derinleşme) + mentora özel not. Örnekler sahte konuşma turu olarak **verilmez**.
- Sohbet geçmişi: son 24 mesaj, ilk soru + ilk cevap her zaman korunur (chat route); pencere kullanıcı mesajıyla başlar (`buildMentorRequest`).
- Talimat değişikliğini admin "Mentor laboratuvarı" ile sına (`lib/admin/lab.ts` sabit soru seti, `/api/admin/lab`; kota düşmez, maliyet "Diğer").
- Ortak kurallar (`shared.ts`): karakterde kal, ama kullanıcı ciddi olarak sorarsa yapay zekâ olduğunu söyle; fikirleri yalnızca figürün belgelenmiş eserlerine dayandır.
- **Kapanış alıntıları:** model alıntı metnini yazmaz. `lib/mentors/quotes.ts` içindeki doğrulanmış katalogdan `[[alinti:<id>]]` etiketi seçer; `lib/mentors/quote-stream.ts` akışta etiketi kaynaklı metinle değiştirir, bilinmeyen kimliği düşürür. Katalogdaki her alıntı orijinal dilde birebir doğrulanmış olmalı (`verifiedFrom`) ve Türkçesi Mentoriva'nın kendi çevirisi olmalı (yayınlanmış çeviriler telifli). Kataloğu olanlar: Seneca (12, Latince; 2026-10-02'den beri aktif mentor), Marcus (10, Yunanca + Long çevirisi), Nietzsche (9, Almanca), Mevlânâ (12, Farsça, Ney-nâme). Yalnızca Jung'un kataloğu yok (eserleri 2031'e kadar telifli); `quoteCatalogPrompt` onlara "hiç alıntı yazma" talimatı verir. "Ne olursan ol yine gel" ve "Yara ışığın girdiği yerdir" Mevlânâ'ya yanlış atfedilir; kullanma.
- Hero'daki canlı örnek (`DEMO_SAMPLES`) bilerek dört mentorla sınırlıdır; bir soruya en fazla dört mentor seçilir (`MAX_SELECTED`).
- Yeni aktif mentor: `types/index.ts` (`MENTOR_IDS`), `lib/mentors/metadata.ts` (`ACTIVE_MENTORS`, `shortName` dahil), `lib/mentors/prompts/<id>.ts` + `prompts/index.ts`, `lib/mentors/slaps.ts`, `public/mentors/` görseli, `app/test/page.tsx` (sorular + analizler).

### Sabitler

Tek kaynak `lib/features.ts`: `API` (model, token, timeout), `INPUT_LIMITS`, `RATE_LIMITS`, `CRISIS_RESPONSE`. Alan adı ve iletişim bilgisi `lib/site.ts`.

### Redis anahtarları

`user:*`, `usage:*`, `bonus:*`, `guest:*`, `guest-count:*`, `chats:*`, `chat:*`, `pending:*`, `ref-count:*`, `session:*`, `admin-session:*`, `code:*`, `code-attempts:*`, `rl:*`, `feedback:*`, `stats:mentor:*`, `stats:day:*`, `stats:topic:*`, `stats:recent-questions`, `admin-log`, `answers:*`, `daily:*`, `journey*`. Tek giriş noktası `lib/kv.ts → getKV()` (asla null dönmez; env yoksa bellek deposu — veri `globalThis.__mentorivaMemoryStore` Map'inde, metotlar her yüklemede yeniden kurulur). Toplu okuma `getMany()` (MGET), desen taraması `scanKeys()` (SCAN; `KEYS` kullanma).

## Büyüme özellikleri

- **Paylaşım kartı:** `components/share/ShareCardDialog.tsx`. İki adımlı: `POST /api/v1/share/card` (Node) cümlenin gerçekten üretilmiş bir cevapta geçtiğini doğrular (`lib/share/answers.ts`, `answers:<email>` son 30 cevap; günün sorusu için `daily:<tarih>`) ve 5 dk'lık HMAC izni döner (`lib/share/token.ts`). `POST /api/v1/share/image` (Edge) izinle 1080×1920 PNG çizer (`lib/share/card.tsx`). Node'da `next/og` Windows'ta font yolu hatası verdiği için çizim Edge'dedir. İmza anahtarı `SHARE_CARD_SECRET` ya da `KV_REST_API_TOKEN`.
- **Test hikâye kartı:** `GET /api/v1/share/test-card?m=&r=<id>-<yüzde>,…&s=<tohum>` (Edge, `lib/share/test-card.tsx`); serbest metin almaz, cümle `getRandomSlap(m, s)`. Bileşen `components/shared/StoryCard.tsx` (önizleme, Web Share ile paylaş, indir).
- Görsellerde ve tanıtımda adres her zaman `DISPLAY_HOST` = `mentoriva.com.tr` (`lib/site.ts`). Çalışan bağlantılar (paylaşım metni, e-posta) `SITE_URL` kullanır.
- **Günün sorusu:** `lib/daily.ts` (soru havuzu + günde bir üretim, kilitli), `GET /api/v1/daily`, `vercel.json` cron (21:05 UTC = 00:05 İstanbul). Bileşen `components/home/DailyQuestion.tsx`.
- **Davet:** `lib/auth/referral.ts` + `lib/auth/bonus.ts`. Davet eden +5, yeni üye +2 bonus; kişi başı 10 ödüllü davet. Bonus, günlük hak bitince `reserveQuestion` içinde harcanır ve `Reservation.fromBonus` ile doğru havuza iade edilir. `?ref=` kodu `SessionProvider` tarafından localStorage'a alınır. Sayfa `/davet`.
- **Test → soru:** test sonucu `sessionStorage.mentoriva_preselect` yazar; ana sayfa mentoru seçili açar (`?mentor=` parametresi de desteklenir). Anahtarlar `lib/flow-keys.ts`.
- **Alıntı sayfaları:** `/alintilar`, `/alintilar/[id]` (statik, schema.org Quotation, site haritasında).
- **Ölçüm:** `lib/analytics.ts → track()`; paketsiz Vercel Web Analytics betiği yalnızca production'da yüklenir (Vercel panelinde Analytics açılmalı). Olay verisine kişisel bilgi konmaz.

## İşaretler (rozetler) — `/isaretlerim`

- **İlke:** kişiye özel, kimseyle karşılaştırılmaz; miktarı değil derinliği/çeşitliliği ödüllendirir, seri (streak) baskısı yok. Bu ilkeyi bozacak (sıralama, "üst üste N gün", soru sayısı) rozet ekleme.
- Tanımlar (ad, anlam, nasıl kazanılır, simge) `lib/badges-public.ts`; kurallar ve depolama `lib/badges.ts`.
- Otomatik: İlk Adım, Çok Sesli (tüm aktif mentorlar), Derinleşen (sohbette 5. kullanıcı mesajı), İçe Bakış (yolculuk), Düşünme Alışkanlığı (7 farklı gün), Köprü (ödüllü davet), Paylaşan (paylaşım kartı). `awardBadges(username, event)` respond/chat/journey result/share card/referral içinden çağrılır, hata fırlatmaz.
- Admin verir: Kurucu Üye (günlük +1 hak: `effectiveDailyLimit`, kota ve `toPublicUser` bunu kullanır), Destekçi, Katkı Veren. `/api/v1/users` PUT `grantBadge`/`revokeBadge`.
- Redis: `badges:<email>` hash (HSETNX → iki kez verilmez), `progress:<email>` hash (`m:<mentor>`, `d:<gün>`), `badges-seen:<email>`. `deleteUser` bunları da siler.
- **Madalyalar:** `components/badges/BadgeMedal.tsx` (saf SVG: metalik kenar — verilen işaretlerde tırtıklı mühür —, guilloche örgü bandı, 88px üstünde kazınmış ad yazısı, ışıldayan sembol; kazanılmamışsa gri). Yeni işaret eklerken `LOOKS`'a da ekle.
- **Ayrıcalıklar (PERKS, `lib/badges-public.ts`):** ilke "daha çok soru değil, yeni bir kapı". `tam-meclis` (Çok Sesli: bir soruda bütün mentorlar; varsayılan en fazla `DEFAULT_MAX_MENTORS`=4), `sohbet-indir` (Derinleşen: `components/chat/ChatExport.tsx`, .txt ve yazdırarak PDF, tamamen tarayıcıda), `erken-erisim` (Kurucu Üye, Destekçi), `gunluk-arti-bir` (Kurucu Üye). `getPerks()` sunucuda, `toPublicUser().perks` istemcide. Yeni işaret kazanılınca `BadgeToaster` oturumu tazeler.
- **Mentor erişimi:** kurallar `lib/mentors/access.ts` (saf; istemci de kullanır), depolama `lib/mentors/access-server.ts` (Redis `access:early-mentors`, admin "Erken erişim" sekmesi, `/api/admin/access`; herkese açık liste `GET /api/v1/access`). respond/chat seçim sınırını ve erken erişimi **sunucuda** denetler (403 `MENTOR_NOT_ALLOWED`). Yeni mentoru önce erken erişime al.
- Bildirim: SSE `{type:'badges', ids}` → `announceBadges()`; SSE dışı olaylar (yolculuk, paylaşım) için `checkBadges()`. `BadgeToaster` layout'ta `SessionProvider` içinde.

## Kayıt olmadan deneme (misafir)

- Oturumsuz ziyaretçi IP başına günde 1 soru sorabilir, en fazla `GUEST_MAX_MENTORS` (2) mentor. `POST /api/v1/mentors/respond` misafiri `authorizeMentorRequest(..., { allowGuest: true })` ile geçirir; `lib/auth/guest.ts` → `guest:<gün>:<sha256(ip)>` (düz IP yok) ve günlük toplam sigortası `GUEST_DAILY_CAP` (300). Hiçbir mentor cevap veremezse hak iade edilir.
- Misafir kayıt formunu görmediği için 18+ ve yurt dışı aktarım onayı soru ekranında alınır (`AskView guest`); istek `consent: true` taşımazsa 403 `CONSENT_REQUIRED`. Kullanıldı 429 `GUEST_USED` → `LimitReachedView` misafir hâli.
- Misafirde: sohbete devam ve kayıt yok (üyeliğe yönlendirilir), cevap paylaşım kartı gizli, rozet/answers yazılmaz. Metrik olayı `guest_question`. Tarayıcı tarafı `lib/guest-trial.ts` (yalnızca arayüz yönlendirmesi).

## Kayıtlı sohbetler (`/sohbetlerim`)

- Yalnızca kullanıcı sohbet başlığındaki "Kaydet"e basarsa (`components/chat/ChatSave.tsx`). Depo `lib/chats.ts`: `chats:<email>` (hash: id → özet), `chat:<email>:<id>` (tamamı). Ücretsizde `SAVED_CHAT_LIMIT` = 5; dolunca 403 `CHAT_LIMIT` ve "Premium yakında" bilgilendirmesi (ücretli plan henüz yok).
- Kayıtlı sohbet devam ettikçe ChatView her tamamlanan cevaptan sonra PUT ile günceller; mesajlar `toSavable` ile soru-cevap çiftlerine indirgenir (sunucu sırayla değişen rolleri ister). En fazla 80 mesaj (ilk soru-cevap korunur).
- API `/api/v1/chats` (GET liste, POST) ve `/api/v1/chats/[id]` (GET, PUT, DELETE). Admin panelinde gösterilmez; `deleteUser` hepsini siler.

## Hukuki

- `lib/legal.ts`: `LEGAL_VERSION`, `MIN_AGE` (18). Kayıtta iki ayrı onay: (1) 18+ ve Kullanım Şartları kabulü + Gizlilik/Aydınlatma okundu, (2) yurt dışı aktarım (Anthropic, ABD) açık rızası. `/api/v1/auth/register` ikisini de zorunlu tutar; onay kaydı `pending.consent` → `user.consent`.
- `/gizlilik` metnindeki saklama süreleri koddakiyle aynı olmalı; değişirse metni ve `LEGAL_VERSION`'ı güncelle.
- Mentor adına ek: `lib/tr.ts` (`dative`, `genitive`, `comitative`); `'a` gibi sabit ek yazma.

## Kendine Yolculuk (`/yolculuk`)

- Akış: neredesin → anlat → 3 Sokratik soru (her ekranda bir) → üç pencere (Psikolojik çerçeve, mentor penceresi, Tefekkür) + 6 kartlık geçici harita → küçük adım → mentorla devam (yalnızca öneri sorusu taslak olarak gider).
- `POST /api/v1/journey/start`: `JOURNEY_COST` (2) hak düşer, sorular üretilemezse iade. Anlatım saklanmaz; 1 saatlik imzalı izne (`lib/signing.ts`, amaç `journey`) konur. `POST /api/v1/journey/result`: izinle sonuç; tek kullanımlık (`journey-done:<id>`).
- Yapay zekâ çağrısı akışsız: `completeText` (`lib/claude/client.ts`) → JSON → `lib/journey/schema.ts` ile doğrulanır. Talimatlar `lib/journey/prompts.ts`: tanı/etiket yasağı, inanç varsaymama, alıntı yok, mentorlardan üçüncü şahısla söz edilir, kriz → `{"crisis": true}`.
- Saklama YALNIZCA kullanıcı isterse: `journey-step:<email>`, `journeys:<email>` (`lib/journey/store.ts`). Admin panelinde gösterilmez; `deleteUser` bunları da siler. Yeni bir özellik eklerken yolculuk metinlerini başka isteklere taşıma ve loglama.
- Sabit metinler (başlangıç noktaları, küçük adımlar, mentor davetleri, harita alanları) `lib/journey/content.ts`.

## Tasarım sistemi

- Renkler `tailwind.config.ts` (`ink`, `brand`, mentor aksanları `lib/mentors/metadata.ts → ACCENT_THEMES`). Fontlar `next/font` ile (`--font-display` Playfair Display, `--font-sans` Outfit).
- **İki tema: Gündüz ve Gece; varsayılan cihaz ayarı** (`prefers-color-scheme`). Kullanıcı düğmeyle seçerse seçimi localStorage'da saklanır ve cihaz ayarının önüne geçer; seçim yoksa cihazın mod değişimi canlı izlenir. Renkler `app/globals.css` içinde `[data-theme='gece' | 'gunduz']` altında "R G B" CSS değişkenleridir; Tailwind `ink-*`, `brand-*`, `paper`, `muted`, `faint`, `onbrand` ve **`white`** bunları okur. `white` ön plan rengidir: gündüzde koyulaşır, böylece `text-white/50` gibi sınıflar her iki temada çalışır. Yeni renk yazarken sabit hex/`rgba(255,255,255,…)` yerine bu sınıfları ya da `rgb(var(--fg) / x)` kullan. Mentor adı gibi aksan **metinleri** `getAccent(..).text` ile (gündüzde koyu ton), çizgi/arka plan `hex` ile boyanır. Gündüzde düşük alfalı metinler ve `text-amber-*`/`text-red-*` globals.css'te okunur tonlara çekilir. Portre kartları `data-theme="gece"` ile her temada koyu kalır. Ana sayfada `.band` sarmalayıcısı gündüzde açık mavi şerit çizer. Seçim `lib/theme.ts` (localStorage + ilk boyamadan önce çalışan `THEME_INIT`), düğme `components/shared/ThemeSwitcher.tsx`. Paylaşım görselleri (OG, StoryCard, share/card) bilerek hep koyudur.
- Ortak sınıflar `app/globals.css`: `btn-primary/secondary/ghost`, `glass`, `input-field`, `eyebrow`, `text-gradient`, `skeleton`, `glow-border` (akış sırasında dönen çerçeve, `--accent` değişkeniyle), `focus-ring-gradient`, `reveal`, `typing-dots`, `streaming-cursor`.
- Animasyon keyframe'leri Tailwind config'te (`animate-fade-up`, `animate-word`, `animate-orbit`, `animate-dock-in`…). Hepsi `prefers-reduced-motion` altında kapanır.
- **Aynı elemanda hem animasyon hem hover transform kullanma**: `animation-fill-mode: both` hover'daki `translate/scale`'i ezer. Animasyonu dış, hover'ı iç elemana koy (bkz. `MentorGalleryCard`).
- Arka plan `components/shared/Atmosphere.tsx` (layout'ta tek kez). Sayfalar `Header` + `Footer` kullanır; giriş sayfaları `AuthShell`.
- Mentor cevapları düz metin render edilir; prompt'lar markdown'ı yasaklar. Bunu koru.

## Kriz politikası

Moderasyon (`lib/safety/moderation.ts`) girdiyi Türkçe küçültüp ASCII'ye katlar; desenler ASCII yazılır. Kriz/zararlı içerikte mentor çağrılmaz, kota düşülmez. Ürün sahibinin kararı (2026-10-03): **112 yalnızca moderasyonun kriz algıladığı kartta** verilir (`components/mentors/EmergencyLine.tsx`; CrisisNotice ve sohbet uyarısı). Mentor cevaplarında ve Kendine Yolculuk metinlerinde numara yoktur (`prompts/shared.ts`). Bu alanı değiştirmeden önce kullanıcıya sor.

## Ortam değişkenleri (Vercel)

`ANTHROPIC_API_KEY`, Redis (`UPSTASH_REDIS_REST_*` ya da `KV_REST_API_*`), `ADMIN_SECRET` (≥12), `SHARE_CARD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `RESEND_FROM` (doğrulanmış alan adı), `ADMIN_EMAIL` (haftalık özet), `CRON_SECRET` (cron doğrulaması). Hangilerinin eksik olduğu `/api/health` ve admin "Genel bakış"ta görünür.

## Açık konular

- `ADMIN_SECRET` production'da en az 12 karakterlik yeni bir değerle değiştirilmeli; eskisi kodda ve git geçmişinde açıkta kaldığı için kullanılmamalı.
- Resend'de gönderici alan adı doğrulanıp `RESEND_FROM` ayarlanmalı.
- Üye listesi SCAN + MGET ile okunuyor; on binlerce üyede set tabanlı indeks ve sayfalama gerekir.
- Hata izleme (ör. Sentry) yok.
- Model `claude-sonnet-5-5`: ilk cevap effort `medium`, sohbet `low`, yolculuk sonucu `medium`; temperature yok (Haiku fallback temperature ile). Effort'u laboratuvarla doğrula.
