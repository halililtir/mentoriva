/**
 * Hukuki metinlerin sürümü ve kayıtta alınan onaylar.
 * Kullanım Şartları ya da Gizlilik Politikası esaslı değişirse LEGAL_VERSION
 * güncellenir; kullanıcı kaydında hangi sürümü onayladığı saklanır.
 */

export const LEGAL_VERSION = '2026-10';
export const LEGAL_UPDATED = 'Ekim 2026';

/** Mentoriva'yı kullanmak için alt yaş sınırı. */
export const MIN_AGE = 18;

export interface ConsentRecord {
  /** Onaylanan metin sürümü. */
  version: string;
  /** 18 yaşından büyük olduğunu beyan etti. */
  adult: true;
  /** Kullanım Şartları'nı kabul etti, Gizlilik Politikası'nı (aydınlatma) okudu. */
  terms: true;
  /** Yurt dışındaki yapay zekâ sağlayıcısına aktarım için ayrı açık rıza. */
  transfer: true;
  at: string;
}
