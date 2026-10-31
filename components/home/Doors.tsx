import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';

const DOORS = [
  {
    href: '/calismalar/karar',
    title: 'Karar veriyorum',
    desc: 'İki yol arasında sıkıştıysan seçeneklerini tart, mentorların nerede ayrıldığını gör.',
    cta: 'Kararımı tartalım',
    tint: 'bg-violet-400/10',
  },
  {
    href: '/hazirla',
    title: 'Bir konuşmam var',
    desc: 'Söylemek istediğini kavgaya dönmeden, daha net ve daha sakin bir hâle getir.',
    cta: 'Sözümü hazırlayalım',
    tint: 'bg-amber-400/10',
  },
  {
    href: '/kendim',
    title: 'Kendimi anlamak istiyorum',
    desc: 'İçindeki karmaşayı birlikte açalım; bir fark ediş ve küçük bir adımla çık.',
    cta: 'Başlayalım',
    tint: 'bg-teal-400/10',
  },
];

/** Ana sayfanın üç kapısı: kişi aracı değil, yaşadığı durumu seçer. */
export function Doors() {
  return (
    <section className="mx-auto w-full max-w-content px-5 pb-10 sm:pb-16" aria-labelledby="doors-title">
      <h2 id="doors-title" className="text-center font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        Bugün seni buraya ne getirdi?
      </h2>
      <div className="mt-5 grid gap-3.5 sm:grid-cols-3 sm:gap-4">
        {DOORS.map((d, i) => (
          <Reveal key={d.href} delay={i * 70}>
            <Link href={d.href} className="glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition hover:border-white/20 sm:p-6">
              <span className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl ${d.tint}`} />
              <span className="relative font-display text-[22px] leading-snug text-white/95">{d.title}</span>
              <span className="relative mt-2 flex-1 text-[14.5px] leading-relaxed text-white/55">{d.desc}</span>
              <span className="relative mt-4 text-sm text-brand-300 transition group-hover:translate-x-0.5">{d.cta} →</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
