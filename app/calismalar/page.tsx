import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { GUIDED_STUDIES, STUDY_COST } from '@/lib/studies/guided-content';
import { JOURNEY_COST } from '@/lib/journey/content';

export const metadata: Metadata = {
  title: 'Çalışmalar',
  description: 'Karar vermek, sınır koymak, neyin önemli olduğunu bulmak ve tekrar eden durumlar için kısa, sana göre ilerleyen çalışmalar; ayrıca İçimde ne var?, Kendine Yolculuk ve Söyleyeceğimi hazırla.',
  alternates: { canonical: '/calismalar' },
};

const OTHERS = [
  { href: '/icimde', title: 'İçimde ne var?', desc: 'Duygunun adını bilmeden başla; yaşadığını kendi kelimelerinle anlat.', meta: 'Hak kullanmaz' },
  { href: '/yolculuk', title: 'Kendine Yolculuk', desc: 'Neredesin, ne istiyorsun? Üç soru, bir fark ediş ve küçük bir adım.', meta: `${JOURNEY_COST} hak` },
  { href: '/hazirla', title: 'Söyleyeceğimi hazırla', desc: 'Söylemek istediğini anlamını kaybetmeden daha sakin ya da net ifade et.', meta: '1 hak' },
];

/** Bütün çalışmalar tek yerde: rehberli çalışmalar + diğer araçlar. */
export default function CalismalarPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-10">
        <p className="eyebrow">Çalışmalar</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.9rem)] leading-tight text-balance">
          Kısa, sana göre ilerleyen <span className="italic text-gradient">düşünme çalışmaları.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
          Sabit bir soru listesi yok: her soru senin cevabına göre gelir. Senin yerine karar verilmez; sonunda neyin netleştiğini sen yazarsın.
          İstediğin an bırakıp bir mentorla konuşmaya geçebilirsin.
        </p>

        <h2 className="mt-12 text-[11px] uppercase tracking-[0.18em] text-white/40">Rehberli çalışmalar · {STUDY_COST} hak</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {GUIDED_STUDIES.map((s) => (
            <Link key={s.id} href={`/calismalar/${s.id}`} className="glass group flex flex-col rounded-3xl p-6 transition hover:border-white/20">
              <span className="font-display text-2xl text-white/95">{s.title}</span>
              <span className="mt-2 flex-1 text-[14.5px] leading-relaxed text-white/55">{s.tagline}</span>
              <span className="mt-4 text-sm text-brand-300 transition group-hover:translate-x-0.5">Başla →</span>
            </Link>
          ))}
        </div>

        <h2 className="mt-12 text-[11px] uppercase tracking-[0.18em] text-white/40">Diğer araçlar</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {OTHERS.map((o) => (
            <Link key={o.href} href={o.href} className="group flex flex-col rounded-3xl border border-white/[0.08] p-5 transition hover:border-white/20">
              <span className="font-display text-xl text-white/90">{o.title}</span>
              <span className="mt-2 flex-1 text-[13.5px] leading-relaxed text-white/50">{o.desc}</span>
              <span className="mt-3 text-[12px] text-white/35">{o.meta}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
