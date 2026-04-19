/**
 * Content Moderation — Kriz algılama ve zararlı içerik filtresi.
 *
 * Strateji:
 * 1. Keyword-based fast filter (bu dosya) — %90 durumları yakalar
 * 2. Claude'un system prompt'undaki SAFETY_OVERRIDE — kalanı için backup
 *
 * Not: Bu bir klinik araç DEĞİL. Gerçek bir psikolog/psikiyatristle
 * review edilmeli. Şimdilik "yanlış alarm > gerçek kriz kaçırma" ilkesiyle
 * biraz geniş tutuldu.
 */

// -----------------------------------------------------------
// Kriz Keyword'leri (Türkçe)
// -----------------------------------------------------------

/**
 * AKTİF intihar/self-harm niyeti göstergeleri.
 *
 * Tasarım ilkesi: Mentorler felsefi karakterini korumalı.
 * "Ölümün anlamı nedir?", "Hayat anlamsız geliyor", "Çok yorgunum" gibi
 * FELSEFİ/DUYGUSAL ifadeler burada TETİKLENMEZ — bunlar Nietzsche, Mevlânâ,
 * Jung'un tam da cevap vermesi gereken sorulardır.
 *
 * Sadece AKTİF NİYET/PLAN ifadelerinde tetiklenir:
 * - "Kendimi öldürmek istiyorum"
 * - "İntihar edeceğim"
 * - "Canıma kıymak üzereyim"
 *
 * False negative riski > false positive riski, ama felsefi serbestlik de önemli.
 */
const CRISIS_PATTERNS: RegExp[] = [
  // Aktif intihar niyeti (fiil + birinci şahıs)
  /\bintihar\s*ed(eceğ|iyor)/i,
  /\bkendimi\s*öldür(eceğ|mek\s*isti|ece)/i,
  /\bcanıma\s*kıy(acağ|mak\s*isti|aca)/i,
  /\bhayatıma\s*son\s*ver/i,

  // Aktif self-harm niyeti
  /\bkendime\s*zarar\s*ver(eceğ|iyor)/i,
  /\bkendimi\s*kes(eceğ|iyor|mek\s*isti)/i,

  // Açık plan/karar ifadeleri
  /\bbugün\s*(öldür|bitir|son)/i,
  /\byarın\s*(öldür|bitir|son).*?\b(kendim|hayat)/i,
  /\bplan.*?\b(intihar|kendim.*öldür)/i,
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
  /\bbomba\s*(yap|nasıl|tarif)/i,
  /\bpatlayıcı\s*(yap|nasıl|tarif)/i,
  /\bsilah\s*(yap|nasıl.*?yap)/i,

  // Uyuşturucu üretimi/satışı (kullanım tartışılabilir, üretim değil)
  /\buyuşturucu\s*(yap|üret|nasıl)/i,

  // Çocuğa zarar
  /\bçocuğ.*?(zarar|öldür|incit)/i,

  // Başkasına saldırı planı
  /\bnasıl\s*öldür.*?\b(onu|kişi|insan)/i,
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

  const normalized = input.toLowerCase().trim();

  // 1. Kriz kontrolü (en yüksek öncelik)
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: 'crisis',
        matchedPattern: pattern.source,
      };
    }
  }

  // 2. Zararlı içerik kontrolü
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: 'harmful',
        matchedPattern: pattern.source,
      };
    }
  }

  return { allowed: true };
}

/**
 * Test amaçlı: Tüm keyword'leri döndürür (unit testler için).
 */
export function _getPatternsForTesting() {
  return {
    crisis: CRISIS_PATTERNS,
    harmful: HARMFUL_PATTERNS,
  };
}
