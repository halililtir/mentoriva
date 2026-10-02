/**
 * Content Moderation — Kriz algılama ve zararlı içerik filtresi.
 *
 * Strateji:
 * 1. Keyword-based fast filter (bu dosya)
 * 2. Claude'un system prompt'undaki SAFETY_OVERRIDE — kalanı için backup
 *
 * Not: Bu bir klinik araç DEĞİL. Gerçek bir psikolog/psikiyatristle
 * review edilmeli. "Yanlış alarm > gerçek kriz kaçırma" ilkesiyle
 * biraz geniş tutuldu.
 *
 * Normalizasyon: Girdi Türkçe kurallarıyla küçültülür, ardından Türkçe
 * karakterler ASCII'ye katlanır (ç→c, ğ→g, ı/i→i, ö→o, ş→s, ü→u).
 * Böylece "İNTİHAR EDECEĞİM", "intihar edecegim" ve "intihar edeceğim"
 * aynı desenle yakalanır. Desenler bu yüzden ASCII yazılır.
 */

// -----------------------------------------------------------
// Normalizasyon
// -----------------------------------------------------------

const FOLD: Record<string, string> = {
  'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
  'â': 'a', 'î': 'i', 'û': 'u',
};

export function normalizeForModeration(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // birleşik aksanlar (İ → i̇ → i)
    .replace(/[çğıöşüâîû]/g, (ch) => FOLD[ch] ?? ch)
    .replace(/\s+/g, ' ')
    .trim();
}

// -----------------------------------------------------------
// Kriz Keyword'leri (ASCII'ye katlanmış Türkçe)
// -----------------------------------------------------------

/**
 * AKTİF intihar/self-harm niyeti göstergeleri.
 *
 * Tasarım ilkesi: Mentorler felsefi karakterini korumalı.
 * "Ölümün anlamı nedir?", "Hayat anlamsız geliyor", "Çok yorgunum" gibi
 * FELSEFİ/DUYGUSAL ifadeler burada TETİKLENMEZ — bunlar Nietzsche, Mevlânâ,
 * Jung'un tam da cevap vermesi gereken sorulardır.
 *
 * Sadece AKTİF NİYET/PLAN ifadelerinde tetiklenir.
 */
const CRISIS_PATTERNS: RegExp[] = [
  // Aktif intihar niyeti (fiil + birinci şahıs)
  /\bintihar\s*(ed(eceg|ecek|iyor|ecem|icem|eyim|esim)|etmek\s*ist|etmeyi\s*dusun|plan)/,
  /\bkendimi\s*(oldur(eceg|ecek|ecem|mek\s*ist|meyi\s*dusun)|asacag|asmak\s*ist|atacag(im)?\s*(kopru|cati|bina))/,
  /\bcanima\s*kiy(acag|acak|mak\s*ist)/,
  /\bhayatima\s*son\s*ver/,
  /\byasamak\s*istemiyorum/,
  /\bolmek\s*istiyorum/,

  // Aktif self-harm niyeti
  /\bkendime\s*zarar\s*ver(eceg|ecek|iyor|mek\s*ist)/,
  /\bkendimi\s*kes(eceg|ecek|iyor|mek\s*ist)/,

  // Açık plan/karar ifadeleri
  /\bbugun\s*(kendimi\s*)?(oldur|bitir|son\s*ver)/,
  /\byarin\s*(oldur|bitir|son).*\b(kendim|hayat)/,
  /\bplan.*\b(intihar|kendimi\s*oldur)/,
];

// -----------------------------------------------------------
// Yasadışı/Zararlı İçerik Keyword'leri
// -----------------------------------------------------------

/**
 * Açıkça yasadışı veya zararlı içerik istekleri.
 * Match olursa — felsefi cevap verme, moderate refusal.
 */
const HARMFUL_PATTERNS: RegExp[] = [
  // Silah/patlayıcı yapımı
  /\bbomba\s*(yap|nasil|tarif)/,
  /\bpatlayici\s*(yap|nasil|tarif)/,
  /\bsilah\s*(yap|nasil.*yap)/,

  // Uyuşturucu üretimi (kullanım tartışılabilir, üretim değil)
  /\buyusturucu\s*(yap|uret|nasil\s*yap)/,

  // Çocuğa zarar
  /\bcocug\w*\s.*\b(zarar\s*ver|oldur|incit|istismar)/,

  // Başkasına saldırı planı
  /\bnasil\s*oldur.*\b(onu|kisi|insan|birini)/,
  /\b(birini|onu)\s*oldurmek\s*ist/,
];

// -----------------------------------------------------------
// Moderation Sonuç Tipleri
// -----------------------------------------------------------

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; reason: 'crisis'; matchedPattern?: string }
  | { allowed: false; reason: 'harmful'; matchedPattern?: string };

// -----------------------------------------------------------
// Ana Moderation Fonksiyonu
// -----------------------------------------------------------

/**
 * Kullanıcı girdisini kontrol eder.
 * @returns allowed=true ise normal akışa devam; false ise akışı kes.
 */
export function moderateInput(input: string): ModerationResult {
  if (!input || input.trim().length === 0) {
    return { allowed: true };
  }

  const normalized = normalizeForModeration(input);

  // 1. Kriz kontrolü (en yüksek öncelik)
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'crisis', matchedPattern: pattern.source };
    }
  }

  // 2. Zararlı içerik kontrolü
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'harmful', matchedPattern: pattern.source };
    }
  }

  return { allowed: true };
}
