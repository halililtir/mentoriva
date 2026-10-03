/** Yeni hesapların günlük soru hakkı. İstemci de okuduğu için sunucu modüllerinden ayrı tutulur. */
export const DEFAULT_DAILY_LIMIT = 10;

/**
 * Eski varsayılan (2026-10-03'e kadar). Kayıtta otomatik yazılmış bu değer artık
 * yeni varsayılan sayılır; admin'in elle verdiği limit (limitByAdmin) korunur.
 */
export const LEGACY_DEFAULT_LIMIT = 5;

/** Kayıt olmadan deneme: IP başına günde bir soru, en fazla iki mentor. */
export const GUEST_MAX_MENTORS = 2;
