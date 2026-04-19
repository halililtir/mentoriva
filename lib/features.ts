/**
 * Feature Flags ve Uygulama Sabitleri
 *
 * Tek değişkenli kararları buradan yönetir — kod içinde magic number kalmaz.
 * Feature flag'ler ileride remote config'e (LaunchDarkly, PostHog) taşınabilir.
 */

// -----------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------

export const FEATURES = {
  /** Chat (devam eden sohbet) aktif mi? */
  CHAT_ENABLED: true,

  /** Kriz algılama aktif mi? (Production'da asla kapatma) */
  CRISIS_DETECTION_ENABLED: true,

  /** Rate limiting aktif mi? */
  RATE_LIMITING_ENABLED: true,

  /** Anthropic prompt caching kullanılsın mı? (maliyet optimizasyonu) */
  PROMPT_CACHING_ENABLED: true,

  /** Analytics aktif mi? */
  ANALYTICS_ENABLED: false,

  /** v1.1 ve sonrası için placeholder'lar */
  MULTI_LANGUAGE_ENABLED: false,
  USER_AUTH_ENABLED: false,
  PREMIUM_TIER_ENABLED: false,
  INTERJECTION_ENABLED: false, // mentor araya girer
} as const;

export type FeatureFlag = keyof typeof FEATURES;

// -----------------------------------------------------------
// API Sabitleri
// -----------------------------------------------------------

export const API = {
  /** Claude API modeli. */
  MODEL: 'claude-sonnet-4-6',

  /** Fallback model (ana model hata verirse). */
  FALLBACK_MODEL: 'claude-haiku-4-5-20251001',

  /** İlk cevaplar için max token — kesilme olmasın. */
  MAX_TOKENS_INITIAL: 1024,

  /** Chat cevapları için max token. */
  MAX_TOKENS_CHAT: 800,

  /** Temperature — karakter için biraz yüksek ama tutarlı. */
  TEMPERATURE: 0.85,

  /** Tek bir mentor çağrısı için timeout. */
  REQUEST_TIMEOUT_MS: 30_000,

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

  /** Chat'te tutulacak max mesaj sayısı (sliding window). */
  MAX_CHAT_HISTORY_MESSAGES: 10,
} as const;

// -----------------------------------------------------------
// Rate Limit Konfigürasyonu
// -----------------------------------------------------------

export const RATE_LIMITS = {
  /** /api/v1/mentors/respond — dakikada kaç istek. */
  RESPOND_PER_MINUTE: 3,

  /** /api/v1/mentors/chat — dakikada kaç istek. */
  CHAT_PER_MINUTE: 10,

  /** Günlük toplam API çağrısı limiti (IP başına). */
  DAILY_LIMIT: 15,
} as const;

// -----------------------------------------------------------
// Kriz Yanıtı
// -----------------------------------------------------------

export const CRISIS_RESPONSE = {
  message:
    'Bu konu, mentorların felsefi perspektiflerinin ötesinde bir destek gerektirebilir. Lütfen profesyonel bir uzmana danışmayı düşün.',
} as const;
