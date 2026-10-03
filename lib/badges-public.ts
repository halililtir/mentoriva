/**
 * İşaret (rozet) tanımları — istemci ve sunucu ortak. Kurallar ve depolama lib/badges.ts.
 */

export type BadgeKind = 'auto' | 'grant';

/**
 * Ayrıcalıklar — işaretlerin açtığı deneyimler. İlke: "daha çok soru" değil,
 * "yeni bir kapı". Soru hakkı yalnızca Kurucu Üye'de (+1) artar.
 */
export const PERKS = {
  'tam-meclis': { name: 'Tam meclis', desc: 'Tek soruyu bütün mentorlara birden sorabilirsin (diğer üyeler en fazla 4 seçer).' },
  'sohbet-indir': { name: 'Sohbeti saklama', desc: 'Bir mentorla sohbetini metin ya da PDF olarak indirebilirsin.' },
  'erken-erisim': { name: 'Erken erişim', desc: 'Yeni mentorları ve özellikleri herkesten önce denersin.' },
  'gunluk-arti-bir': { name: 'Günlük +1 soru', desc: 'Her gün bir soru hakkın fazladan var.' },
} as const;

export type PerkId = keyof typeof PERKS;

/** Herkesin bir soruda seçebileceği en fazla mentor (Tam meclis bunu kaldırır). */
export const DEFAULT_MAX_MENTORS = 4;

export interface BadgeDef {
  id: string;
  kind: BadgeKind;
  name: string;
  /** Rozetin anlamı — kazanınca gösterilir. */
  meaning: string;
  /** Henüz kazanılmadıysa nasıl kazanılır (baskı kurmayan dille). */
  how: string;
  /** Simge (tek karakter, e-posta/PNG gerektirmesin diye). */
  icon: string;
  /** Bu işaretin açtığı ayrıcalıklar (PERKS). */
  perks?: PerkId[];
}

export const BADGES: BadgeDef[] = [
  {
    id: 'ilk-adim', kind: 'auto', icon: '◐', name: 'İlk Adım',
    meaning: 'Aklındaki soruyu ilk kez dile getirdin. Bir soruyu kelimelere dökmek, onunla yüzleşmenin başlangıcıdır.',
    how: 'İlk sorunu sorduğunda.',
  },
  {
    id: 'cok-sesli', kind: 'auto', icon: '✶', name: 'Çok Sesli', perks: ['tam-meclis'],
    meaning: 'Bütün mentorları dinledin. Tek bir doğruya değil, birbirine itiraz eden bakışlara kulak verdin.',
    how: 'Her mentordan en az bir cevap aldığında.',
  },
  {
    id: 'derinlesen', kind: 'auto', icon: '❋', name: 'Derinleşen', perks: ['sohbet-indir'],
    meaning: 'Bir sohbette soruyu defalarca açtın. Asıl cevap çoğu zaman ilk cevabın arkasından gelir.',
    how: 'Bir mentorla aynı sohbette beş mesaj yazdığında.',
  },
  {
    id: 'ice-bakis', kind: 'auto', icon: '◎', name: 'İçe Bakış',
    meaning: 'Kendine Yolculuk’u tamamladın. Kendine dürüstçe bakmak, dışarıya bakmaktan daha çok cesaret ister.',
    how: 'Kendine Yolculuk’u sonuna kadar götürdüğünde.',
  },
  {
    id: 'dusunme-aliskanligi', kind: 'auto', icon: '☾', name: 'Düşünme Alışkanlığı',
    meaning: 'Yedi ayrı gün buraya düşünmeye geldin. Üst üste olması gerekmiyordu; önemli olan geri dönmendi.',
    how: 'Yedi farklı günde soru sorduğunda; günlerin art arda olması gerekmez.',
  },
  {
    id: 'kopru', kind: 'auto', icon: '⌒', name: 'Köprü',
    meaning: 'Bir dostunu davet ettin. İyi bir soruyu birine ulaştırmak da bir armağandır.',
    how: 'Davet ettiğin biri üye olduğunda.',
  },
  {
    id: 'paylasan', kind: 'auto', icon: '✧', name: 'Paylaşan',
    meaning: 'Bir cevabı kart olarak paylaştın; seni düşündüren bir cümleyi başkasına da taşıdın.',
    how: 'Bir cevabı paylaşım kartı yaptığında.',
  },
  {
    id: 'kurucu', kind: 'grant', icon: '◆', name: 'Kurucu Üye', perks: ['gunluk-arti-bir', 'erken-erisim'],
    meaning: 'Mentoriva’yı ilk günlerinde denedin; soruların ve sabrınla bugünkü hâline gelmesine katkı verdin.',
    how: 'Kapalı beta üyelerine verilir.',
  },
  {
    id: 'destekci', kind: 'grant', icon: '♦', name: 'Destekçi', perks: ['erken-erisim'],
    meaning: 'Mentoriva’nın yaşaması ve büyümesi için doğrudan destek oldun.',
    how: 'Mentoriva’yı destekleyenlere verilir.',
  },
  {
    id: 'katki', kind: 'grant', icon: '✎', name: 'Katkı Veren',
    meaning: 'Geri bildirimin bir şeyi düzeltti ya da yeni bir fikre ilham verdi. Bu ürün biraz da senin elinden çıktı.',
    how: 'Ürünü geri bildirimiyle şekillendirenlere verilir.',
  },
];

export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b]));
export const GRANTABLE = BADGES.filter((b) => b.kind === 'grant').map((b) => b.id);

/** Kurucu üyelerin günlük ek hakkı. */
export const FOUNDER_DAILY_BONUS = 1;

/** Sahip olunan işaretlerin açtığı ayrıcalıklar. */
export function perksFromBadges(ids: readonly string[]): PerkId[] {
  const out = new Set<PerkId>();
  for (const id of ids) for (const p of BADGE_BY_ID[id]?.perks ?? []) out.add(p);
  return [...out];
}
