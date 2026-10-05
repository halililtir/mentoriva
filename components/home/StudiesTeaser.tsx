import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/home/Sections';

const STUDIES = [
  {
    href: '/icimde',
    eyebrow: 'Kısa keşif',
    title: 'İçimde ne var?',
    desc: 'Duygunun adını bilmen gerekmiyor. Yaşadığını kendi kelimelerinle anlat, düzenleyebileceğin bir farkındalık kartı oluştur.',
    cta: 'Keşfe başla',
    tint: 'bg-teal-400/10',
  },
  {
    href: '/yolculuk',
    eyebrow: 'Derinleşen çalışma',
    title: 'Kendine Yolculuk',
    desc: 'Neredesin, ne istiyorsun? Üç kısa soru, sana özel bir fark ediş ve sonunda küçük bir adım.',
    cta: 'Yolculuğa başla',
    tint: 'bg-brand-500/15',
  },
  {
    href: '/hazirla',
    eyebrow: 'İletişim',
    title: 'Söyleyeceğimi hazırla',
    desc: 'Birine söylemek istediğini anlamını ve itirazını kaybetmeden daha sakin, daha net ya da sınırını koruyarak ifade et.',
    cta: 'Hazırla',
    tint: 'bg-amber-400/10',
  },
];

/** Ana sayfada çalışmalar: mentor sorularının yanında kendini anlamaya açılan kapılar. */
export function StudiesTeaser() {
  return (
    <section className="mx-auto max-w-content px-5 py-10 sm:py-20" aria-labelledby="studies-title">
      <SectionHeading eyebrow="Çalışmalar" title="Bir cevaptan fazlası:" accent="kendini anlamak." id="studies-title">
        Soru sormadan önce ya da sonra; test değil, etiket yok. Yazdıkların yalnızca sen istersen kaydedilir.
      </SectionHeading>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STUDIES.map((s, i) => (
          <Reveal key={s.href} delay={i * 80}>
            <Link href={s.href} className="glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition hover:border-white/20 sm:p-7">
              <span className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl ${s.tint}`} />
              <span className="relative text-[11px] uppercase tracking-[0.16em] text-white/40">{s.eyebrow}</span>
              <span className="relative mt-2 font-display text-2xl text-white/95">{s.title}</span>
              <span className="relative mt-3 flex-1 text-[14.5px] leading-relaxed text-white/55">{s.desc}</span>
              <span className="relative mt-5 text-sm text-brand-300 transition group-hover:translate-x-0.5">{s.cta} →</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
