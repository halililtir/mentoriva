# Mimari ayrıntıları

CLAUDE.md'den taşındı (2026-10-25). Kısa özet ve genel kurallar CLAUDE.md'de.

## İstek akışı

1. `app/page.tsx` istemci tarafı durum makinesi: `gallery → ask → single-response | compare → chat` (+ kota bitince `limit`). Karşılaştırma görünümü sohbete geçince sökülmez (`hidden`), geri dönünce yeniden istek atılmaz.
   - `gallery` görünümü bir tanıtım sayfasıdır ve oturuma göre sıralanır. **Misafir** için sıra şöyledir: Hero (soru kutusu, portreler, canlı örnek `DemoPreview`), üç kapı (`Doors`), "neden", mentorlar (Yakında dahil), günün sorusu, "ne değildir", SSS, kapanış. **Üye** için sıra: Hero, üç kapı, mentorlar, günün sorusu, örnek sorular, SSS, kapanış. Sayfa kişinin durumunu sorar (karar, konuşma, kendini anlama), araç saymaz; yeni bölüm eklerken bu sadeliği koru.
   - Bölümler `components/home/*` altındadır. Tanıtım metinleri (örnek cevaplar, konu başlıkları, SSS) `lib/home-content.ts` içindedir; metin değişikliği için bileşenlere dokunma.
   - "Bu soruyu sor" ile seçilen soru `sessionStorage.mentoriva_draft` içinde taslak olarak tutulur. Misafir kayıt olup döndüğünde taslak korunur ve `AskView` o soruyla dolu açılır.
   - `FlowSteps` (Mentor seç → Soru yaz → Cevapları gör → Sohbet et) kullanıcıya akışta nerede olduğunu gösterir.
2. İstemci `lib/useSSEStream.ts` ile POST atar ve SSE okur. Kimlik httpOnly çerezle otomatik gider; istemci kullanıcı adı başlığı **göndermez**.
   - **Netleştirme adımı** (`lib/clarify.ts`): kısa/belirsiz soruda (`needsClarify`: ≤6 kelime ya da <40 karakter) "Sor"dan sonra `AskView` içinde isteğe bağlı panel: kısa bağlam + niyet (anlamak, karar, sadece anlatmak, farklı bakış); "Atla" var. Yapay zekâ çağrısı yok. İstek `context` taşır; respond route `sanitizeContext` + kriz filtresinden (soru + bağlam) geçirir, mentora `messageForMentor` ile etiketli not olarak gider; ekrandaki soru, analitik ve paylaşım kaydı yalnızca soruyu kullanır.
3. `POST /api/v1/mentors/respond` ve `/chat` aynı sırayı izler: `authorizeMentorRequest` (oturum + rate limit, `lib/sse.ts`) → doğrulama → moderasyon → `reserveQuestion` (kota) → stream. İlk olay `{type:'quota', remaining}`; hiçbir mentor cevap üretemezse `releaseQuestion` ile hak iade edilir.
4. `lib/claude/client.ts → streamMentorResponse()`: SDK singleton, system prompt'ta `cache_control: ephemeral`, ilk denemede `API.MODEL`, hata olursa (henüz metin akmadıysa) bir kez `API.FALLBACK_MODEL`.

## Oturum ve kota (`lib/auth/`)

- `session.ts` — `mentoriva_session` (30 gün) ve `mentoriva_admin` (12 saat) httpOnly çerezleri. Redis'te `session:<sha256(token)>` / `admin-session:<sha256(token)>`.
- `password.ts` — scrypt; düz metin eski kayıtları tanır (`needsRehash`), login'de hash'e çevrilir.
- `users.ts` — `user:<email>` kaydı + günlük sayaç `usage:<email>:<YYYY-MM-DD>` (atomik INCR, Europe/Istanbul günü, `lib/time.ts`). Günlük limit `dailyLimitOf()`: varsayılan `DEFAULT_DAILY_LIMIT` (10, `lib/auth/limits.ts`). Kayıtta artık limit yazılmaz; eski kayıtlardaki otomatik 5 (`LEGACY_DEFAULT_LIMIT`) varsayılana döner, admin'in verdiği limit (`limitByAdmin`) korunur. Arayüz metinlerinde sayıyı elle yazma, sabiti kullan. `dailyUsed`/`dailyResetDate` eski alanlardır, okunmaz.
- `codes.ts` — kayıt/şifre sıfırlama kodları: hash'li saklanır, 10 dk TTL, 5 yanlışta kilit.
- `registration.ts` — kayıt sırasında `pending:<email>` (ad, parola özeti, davet; 7 gün) da yazılır. `completeRegistration` hem kodla doğrulamada hem admin onayında kullanılır (Üyeler sekmesi → "Doğrulama bekleyenler", `/api/admin/pending`). E-posta ulaşmayan biri böyle açılır.
- E-posta: `lib/email.ts` (`sendEmailDetailed` hata nedenini döner ve admin Hatalar'a yazar; kod konu satırında). Admin "E-posta ayarları" kartından deneme e-postası (`/api/admin/email-test`).
- İstemci tarafı: `lib/session.tsx` (`SessionProvider`, `useSession`) yalnızca `/api/v1/auth/me` sonucunu ve SSE'den gelen kalan hakkı gösterir.

## Admin

`/admin` → `/api/admin/login` (ADMIN_SECRET, en az 12 karakter; 12 saatlik çerez). Anahtar unutulursa giriş ekranındaki "e-postama giriş bağlantısı gönder" → `POST /api/admin/magic` yalnızca `ADMIN_EMAIL`'e 15 dakikalık, tek kullanımlık bağlantı yollar (`admin-magic:<sha256>`); bağlantı `/admin?giris=` sayfasında POST ile tüketilir (e-posta tarayıcıları GET ile önceden açabildiği için). Panel `app/admin/page.tsx` + `components/admin/*` (Genel bakış, Üyeler, Geri bildirim, İşlem kaydı); tüm çağrılar `adminFetch` ile, 401 gelince giriş ekranına döner.

- `GET /api/admin/overview`: sistem durumu (`lib/health.ts`, `/api/health` ile ortak), üye özetleri, son 30 günün olay serileri, mentor tercihleri, son 7 günün konuları, **anonim** son sorular, okunmamış geri bildirim sayısı.
- `/api/v1/users` (admin): GET üyeleri bugünkü kullanım/bonus/davet sayısıyla toplu okur (`getMany`). PUT: `dailyLimit`, `isActive`, `notes`, `password`, `resetToday: true`, `addBonus` (1–500). Önce tüm alanlar doğrulanır, sonra yazılır. DELETE kişisel veriyle birlikte siler.
- `/api/v1/feedback` (admin): GET, PATCH `{id, status: 'new'|'read'}`, DELETE `?id=`. Kimlik `feedback:<ms>:<token>` desenine uymazsa reddedilir (başka anahtar silinemez).
- Metrikler `lib/admin/metrics.ts → recordEvent()`: `stats:day:<tarih>:<olay>` (question, chat, signup, journey, share, referral, feedback, crisis, mentor_error; 120 gün TTL). Konular `lib/admin/topics.ts` (anahtar kelime, ASCII katlanmış; `stats:topic:<tarih>:<konu>`). Soru metni ve kullanıcı eşleşmesi metriklere yazılmaz; `stats:recent-questions` kullanıcısızdır.
- Sunucusuz ortamda yanıt sonrası iş kesilebildiği için metrik yazımları `await` edilir; fonksiyonlar hata fırlatmaz.
- Her admin değişikliği `lib/admin/audit.ts` ile `admin-log` listesine yazılır (son 300), `GET /api/admin/log`.
- **Cevap değerlendirme:** `components/shared/RateAnswer.tsx` (👍/👎, 👎 sonrası isteğe bağlı neden) → `POST /api/v1/rate` (oturumsuz, IP sınırlı) → `lib/admin/ratings.ts` sayaçları `stats:rating:<tarih>:<mentor>:<up|down>`, `stats:rating-reason:<tarih>:<neden>`. Cevap metni gönderilmez. Neden kimlikleri bileşende ve `DOWN_REASONS`'ta aynı olmalı.
- **Hata kaydı:** `lib/admin/errors.ts → logError()` son 200 hatayı `errors:recent`'e yazar (e-posta, anahtar, URL sorgusu temizlenir; kullanıcı metni asla). Tarayıcı: `components/shared/ErrorReporter.tsx` (layout'ta) + `app/error.tsx` → `POST /api/v1/errors`. Panelde "Hatalar" sekmesi (`GET /api/admin/errors`). Sentry yok; istenirse bunun yanına eklenir.
- **Haftalık özet:** `lib/admin/report.ts` (son 7 gün / önceki 7 gün). Cron `/api/cron/weekly-report` pazartesi 06:00 UTC, `Authorization: Bearer CRON_SECRET` ister; alıcı `ADMIN_EMAIL`. Panelde önizleme ve "Şimdi gönder" (`/api/admin/report`). Gönderim `lib/email.ts → sendEmail()`.
- **Büyüme ve maliyet** (`GET /api/admin/insights`): huni ve haftalık gruplar `lib/admin/funnel.ts` (üye kayıtlarından; ek veri yok). Yapay zekâ maliyeti `lib/admin/cost.ts`: `client.ts` her çağrının token kullanımını (`message_start`/`message_delta`, `res.usage`) `recordUsage(feature, model, usage)` ile yazar; özellik `answer | chat | daily | journey | synthesis | perspective | recommend | feelings | prepare | memory | study | other` (`streamMentorResponse({feature})`, `completeText({feature})`). Fiyatlar `PRICES` (USD/1M token, liste fiyatı) — model değişirse güncelle.
- **Yeni üye karşılaması:** `components/home/WelcomeCard.tsx`, yalnızca `questionsUsed === 0` olan üyeye (`toPublicUser` döner); metinler `lib/home-content.ts → WELCOME`.

## Sabitler

Tek kaynak `lib/features.ts`: `API` (model, token, timeout), `INPUT_LIMITS`, `RATE_LIMITS`, `CRISIS_RESPONSE`. Alan adı ve iletişim bilgisi `lib/site.ts`.

## Redis anahtarları

`user:*`, `usage:*`, `bonus:*`, `guest-dev:*`, `guest-ip:*`, `guest-count:*`, `chats:*`, `chat:*`, `pending:*`, `ref-count:*`, `session:*`, `admin-session:*`, `code:*`, `code-attempts:*`, `rl:*`, `feedback:*`, `stats:mentor:*`, `stats:day:*`, `stats:topic:*`, `stats:recent-questions`, `admin-log`, `answers:*`, `daily:*`, `journey*`, `cards:*`, `memory:*`, `reminder:*`, `reminder-day:*`, `study-done:*`, `bridge:*`, `bridge-msgs:*`, `bridges:*`, `bridge-closed:*`, `bridge-join:*`, `bridge-sent:*`, `bridge-seen:*`, `bridge-mail:*`, `bridge-regen:*`, `bridge-mute:*`, `bridge-here:*`, `decisions:*`, `decision-day:*`, `decision-owner:*`. Tek giriş noktası `lib/kv.ts → getKV()` (asla null dönmez; env yoksa bellek deposu — veri `globalThis.__mentorivaMemoryStore` Map'inde, metotlar her yüklemede yeniden kurulur). Toplu okuma `getMany()` (MGET), desen taraması `scanKeys()` (SCAN; `KEYS` kullanma).
