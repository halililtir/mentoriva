/**
 * Uygulama sabitleri — kod içinde magic number kalmaz.
 */

// -----------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------

export const FEATURES = {
  /** Anthropic prompt caching kullanılsın mı? (maliyet optimizasyonu) */
  PROMPT_CACHING_ENABLED: true,
} as const;

// -----------------------------------------------------------
// API Sabitleri
// -----------------------------------------------------------

export const API = {
  /** Claude API modeli. Sonnet 5.5: temperature kabul etmez, düşünme varsayılan açıktır. */
  MODEL: 'claude-sonnet-5-5',

  /**
   * Ana modelin düşünme derinliği. İlk cevapta mentor sorunun alt metnini
   * okuyup kendine özgü tezini seçsin diye 'medium'; sohbette hız için 'low'.
   * Yapılandırılmış JSON çağrıları (completeText) varsayılan olarak 'low'.
   */
  EFFORT_INITIAL: 'medium',
  EFFORT_CHAT: 'low',

  /** Fallback model (ana model hata verirse). */
  FALLBACK_MODEL: 'claude-haiku-4-5-20251001',

  /**
   * İlk cevaplar için max token. Sonnet 5.5'in yeni tokenizer'ı aynı metni ~%30 daha
   * çok token sayar ve düşünme de bu sınıra dahildir; o yüzden pay bırakıldı.
   * Uzunluğu sınır değil prompt belirler.
   */
  MAX_TOKENS_INITIAL: 3000,

  /** Chat cevapları için max token. */
  MAX_TOKENS_CHAT: 2000,

  /** Yalnızca fallback (Haiku) için; Sonnet 5.5 varsayılan dışı değeri 400 ile reddeder. */
  TEMPERATURE: 0.7,

  /** Tek bir mentor çağrısı için timeout. */
  REQUEST_TIMEOUT_MS: 50_000,

  /** Hata durumunda retry sayısı. */
  MAX_RETRIES: 1,
} as const;

// -----------------------------------------------------------
// Input Limitleri
// -----------------------------------------------------------

export const INPUT_LIMITS = {
  /** Kullanıcının sorusu için min karakter. */
  MIN_QUESTION_LENGTH: 10,

  /** Kullanıcının sorusu için max karakter. */
  MAX_QUESTION_LENGTH: 1000,

  /** Chat mesajı için max karakter. */
  MAX_CHAT_MESSAGE_LENGTH: 2000,

  /**
   * Chat'te modele gönderilecek max geçmiş mesaj sayısı. Pencere kayarken ilk
   * soru ve ilk cevap her zaman korunur (chat route), mentor konunun başını unutmaz.
   */
  MAX_CHAT_HISTORY_MESSAGES: 24,

  /** Chat isteğinde kabul edilen max mesaj sayısı (daha fazlası kırpılır). */
  MAX_CHAT_REQUEST_MESSAGES: 60,

  /** Geri bildirim mesajı için max karakter. */
  MAX_FEEDBACK_LENGTH: 3000,
} as const;

// -----------------------------------------------------------
// Rate Limit Konfigürasyonu
// -----------------------------------------------------------

const MINUTE = 60;
const TEN_MINUTES = 600;
const HOUR = 3600;

export const RATE_LIMITS = {
  /** /mentors/respond — kullanıcı başına. */
  RESPOND_USER: { max: 5, windowSec: MINUTE },
  /** /mentors/chat — kullanıcı başına. */
  CHAT_USER: { max: 15, windowSec: MINUTE },
  /** Mentor uçları — IP başına (aynı IP'den çok hesap açılmasına karşı). */
  MENTOR_IP: { max: 40, windowSec: MINUTE },

  /** Giriş denemesi — IP ve e-posta başına. */
  LOGIN_IP: { max: 20, windowSec: TEN_MINUTES },
  LOGIN_EMAIL: { max: 8, windowSec: TEN_MINUTES },

  /** Kayıt / şifre sıfırlama kodu gönderimi. */
  CODE_SEND_IP: { max: 6, windowSec: TEN_MINUTES },
  CODE_SEND_EMAIL: { max: 3, windowSec: TEN_MINUTES },

  /** Bir doğrulama koduna yapılabilecek yanlış deneme sayısı. */
  CODE_MAX_ATTEMPTS: 5,

  /** Admin giriş denemesi — IP başına. */
  ADMIN_LOGIN_IP: { max: 5, windowSec: TEN_MINUTES },

  /** Kendine Yolculuk — kullanıcı başına (başlatma ve sonuç ayrı sayılır). */
  JOURNEY_START_USER: { max: 6, windowSec: HOUR },
  JOURNEY_RESULT_USER: { max: 12, windowSec: HOUR },

  /** Geri bildirim — IP başına. */
  FEEDBACK_IP: { max: 5, windowSec: HOUR },

  /** Cevap değerlendirme (👍/👎) — IP başına. */
  RATE_IP: { max: 60, windowSec: HOUR },

  /** "Meselemi yazayım, sen öner" — kota düşmez, bu yüzden ayrıca sınırlı. */
  RECOMMEND_IP: { max: 20, windowSec: HOUR },
  RECOMMEND_USER: { max: 12, windowSec: HOUR },

  /** "İçimde ne var?" kelime önerisi — kota düşmez. */
  FEELINGS_IP: { max: 30, windowSec: HOUR },
  FEELINGS_USER: { max: 20, windowSec: HOUR },

  /** İstemci hata kaydı — IP başına. */
  CLIENT_ERROR_IP: { max: 20, windowSec: HOUR },
} as const;

// -----------------------------------------------------------
// Kriz Yanıtı
// -----------------------------------------------------------

export const CRISIS_RESPONSE = {
  crisis:
    'Bu konu, mentorların felsefi perspektiflerinin ötesinde bir destek gerektirebilir. Lütfen profesyonel bir uzmana danışmayı düşün.',
  harmful: 'Bu istek mentorların cevaplayabileceği bir konu değil.',
} as const;
