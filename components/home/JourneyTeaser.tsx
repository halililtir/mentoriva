import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';

/** Ana sayfada Kendine Yolculuk tanıtımı — Mentoriva'nın asıl amacına açılan kapı. */
export function JourneyTeaser() {
  return (
    <section className="mx-auto max-w-content px-5 py-16 sm:py-20" aria-labelledby="journey-teaser-title">
      <Reveal>
        <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300/85">
                <span className="h-px w-6 bg-brand-400/70" /> Kendine Yolculuk
              </p>
              <h2 id="journey-teaser-title" className="mt-4 font-display text-[clamp(1.9rem,4vw,2.7rem)] leading-tight text-balance">
                Bir cevaptan fazlası: <span className="italic text-gradient">kendini fark etmek.</span>
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/55">
                Neredesin, ne hissediyorsun, aslında neye ihtiyacın var? Üç kısa soru, üç farklı pencere ve sonunda küçük bir adım.
                Test değil, etiket yok; yazdıkların kaydedilmez.
              </p>
              <Link href="/yolculuk" className="btn-primary mt-7 inline-flex">Yolculuğa başla →</Link>
            </div>
            <ul className="space-y-2.5" aria-label="Üç pencere">
              {[
                ['Psikolojik çerçeve', 'Duygu ile ihtiyacı, düşünce tuzaklarını ayırt et.'],
                ['Mentorun penceresi', 'Aynı duruma bir düşünürün bakışıyla bak.'],
                ['Tefekkür', 'Kendine sorabileceğin tek bir derin soru.'],
              ].map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-white/[0.07] bg-ink-0/40 px-4 py-3.5">
                  <p className="text-sm font-medium text-white/85">{t}</p>
                  <p className="mt-0.5 text-xs text-white/45">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
