import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { STUDY_COST } from '@/lib/studies/guided-content';

export const metadata: Metadata = {
  title: 'Çalışmalar',
  description: 'Bir karar vermen, biriyle konuşman ya da kendini anlaman gerektiğinde sana göre ilerleyen kısa çalışmalar.',
  alternates: { canonical: '/calismalar' },
};

const GROUPS = [
  {
    title: 'Karar veriyorum',
    items: [
      { href: '/calismalar/karar', title: 'Karar vermek', desc: 'Seçeneklerini tart; iki mentor farklı taraflarda dursun, nerede ayrıldıklarını gör.', meta: `${STUDY_COST} hak` },
    ],
  },
  {
    title: 'Bir konuşmam var',
    items: [
      { href: '/hazirla', title: 'Söyleyeceğimi hazırla', desc: 'Söylemek istediğini anlamını kaybetmeden daha sakin ya da net ifade et.', meta: '1 hak' },
      { href: '/calismalar/sinir', title: 'Sınır koymak', desc: 'Neyin sana fazla geldiğini netleştir, söylemeye hazır bir cümleyle çık.', meta: `${STUDY_COST} hak` },
      { href: '/aramizda', title: 'Aramızda', desc: 'Zor bir konuyu o kişiyle ortak bir alanda konuş; yalnızca onayladığın hâl gitsin.', meta: 'Beta · mesaj başına 1 hak' },
    ],
  },
  {
    title: 'Kendimi anlamak istiyorum',
    items: [
      { href: '/kendim', title: 'Nereden başlayacağını seç', desc: 'İçindeki karmaşa, tekrar eden bir durum, yönün ya da neyin önemli olduğu: sana yakın olandan başla.', meta: 'Kısa ve sana göre' },
    ],
  },
];

/** Bütün çalışmalar tek yerde; kişinin durumuna göre gruplu. */
export default function CalismalarPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-10">
        <p className="eyebrow">Çalışmalar</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.9rem)] leading-tight text-balance">
          Bugün neyle <span className="italic text-gradient">uğraşıyorsun?</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
          Her çalışma senin cevaplarına göre ilerler ve sonunda eline somut bir şey geçer. İstediğin an bırakıp bir mentorla konuşmaya geçebilirsin.
        </p>

        {GROUPS.map((g) => (
          <section key={g.title} className="mt-10">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-white/40">{g.title}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} className="glass group flex flex-col rounded-3xl p-6 transition hover:border-white/20">
                  <span className="font-display text-2xl text-white/95">{i.title}</span>
                  <span className="mt-2 flex-1 text-[14.5px] leading-relaxed text-white/55">{i.desc}</span>
                  <span className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[12px] text-white/35">{i.meta}</span>
                    <span className="text-sm text-brand-300 transition group-hover:translate-x-0.5">Başla →</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
