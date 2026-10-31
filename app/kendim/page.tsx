import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { JOURNEY_COST } from '@/lib/journey/content';
import { STUDY_COST } from '@/lib/studies/guided-content';

export const metadata: Metadata = {
  title: 'Kendimi anlamak',
  description: 'İçindeki karmaşaya, tekrar eden durumlara, yönüne ya da neyin önemli olduğuna birlikte bakalım. Nereden başlayacağını seç, gerisi sana göre ilerlesin.',
  alternates: { canonical: '/kendim' },
};

/** Durum → doğru akış. Araç adı değil, kişinin kendi cümlesi seçilir. */
const PATHS = [
  {
    href: '/icimde',
    say: 'İçimde bir şey var ama adını koyamıyorum',
    get: 'Yaşadığını birlikte açar, sana ne anlatıyor olabileceğini ve şimdi ne deneyebileceğini söyleriz.',
    meta: 'Hak kullanmaz · birkaç dakika',
  },
  {
    href: '/calismalar/tekrar',
    say: 'Aynı şey tekrar tekrar başıma geliyor',
    get: 'Dönüp duran döngüyü görür, bir dahaki sefere farklı deneyebileceğin tek bir şey bulursun.',
    meta: `${STUDY_COST} hak · birkaç soru`,
  },
  {
    href: '/yolculuk',
    say: 'Nereye gittiğimi bilmiyorum',
    get: 'Neredesin, ne istiyorsun? Üç soruyla bir fark ediş ve atabileceğin küçük bir adım.',
    meta: `${JOURNEY_COST} hak · birkaç soru`,
  },
  {
    href: '/calismalar/degerler',
    say: 'Benim için neyin önemli olduğunu bulmak istiyorum',
    get: 'Seni canlı hissettiren anlardan kendi değerlerine bakar, nerede eksik kaldıklarını görürsün.',
    meta: `${STUDY_COST} hak · birkaç soru`,
  },
];

/** "Kendimi anlamak" tek kapısı: dört akış kişinin durumuna göre buradan açılır. */
export default function KendimPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-10">
        <p className="eyebrow">Kendimi anlamak</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.9rem)] leading-tight text-balance">
          Şu an sana en <span className="italic text-gradient">yakın olan hangisi?</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">
          Doğru cevap yok; hangisi içinden geçiyorsa oradan başla. Yazdıkların yalnızca sen istersen kaydedilir.
        </p>

        <ul className="mt-8 space-y-3">
          {PATHS.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="glass group block rounded-3xl p-5 transition hover:border-white/20 sm:p-6">
                <span className="block font-display text-[21px] leading-snug text-white/95">{p.say}</span>
                <span className="mt-2 block text-[14.5px] leading-relaxed text-white/55">{p.get}</span>
                <span className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[12px] text-white/35">{p.meta}</span>
                  <span className="text-sm text-brand-300 transition group-hover:translate-x-0.5">Başla →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-[13.5px] text-white/45">
          Bunların hiçbiri değilse <Link href="/#mentorlar" className="text-brand-300 hover:underline">doğrudan bir mentora sor</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
