import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'Mentoriva nedir, misyonumuz ve rehberlik notu.',
};

export default function AboutPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/80 backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="inline-flex"><Logo /></Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Ana Sayfa</Link>
            <Link href="/test" className="text-white/35 hover:text-white/60 transition-colors">Testi Çöz</Link>
            <Link href="/geri-bildirim" className="text-white/35 hover:text-white/60 transition-colors">Geri Bildirim</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-narrow px-5 py-12 sm:py-16 space-y-14">

        {/* Hero */}
        <section className="space-y-5">
          <h1 className="font-display text-h1 text-balance leading-tight">
            Tek bir hakikatten fazlası.
          </h1>
          <p className="text-[15px] text-white/50 leading-relaxed">
            Cevap bulmak kolaydır. Zor olan, doğru soruyu sormak ve o soruya
            farklı aynalardan bakabilmektir.
          </p>
          <p className="text-[15px] text-white/50 leading-relaxed">
            Mentoriva; seni tek bir zihinle, tek bir doğruyla ya da tek bir
            algıyla sınırlamaz. Biz, sorulara yanıt vermek için değil; bakış
            açısını çoğaltmak için buradayız.
          </p>
          <p className="text-[15px] text-white/70 leading-relaxed italic">
            Çünkü biliyoruz ki: doğru cevap yoktur; yalnızca güçlü
            perspektifler vardır.
          </p>
        </section>

        {/* Zihinlerin karşılaşma noktası */}
        <section className="space-y-5">
          <h2 className="font-display text-h2">Zihinlerin karşılaşma noktası</h2>
          <p className="text-[15px] text-white/50 leading-relaxed">
            Aynı soruyu sorarsın, ancak yankısı her defasında değişir.
          </p>
          <div className="space-y-4 text-[15px] text-white/50 leading-relaxed">
            <p>
              <span className="text-[#00bcd4] font-medium">Carl Jung</span> ile
              iç dünyandaki arketipleri keşfeder,{' '}
              <span className="text-[#e89a3c] font-medium">Friedrich Nietzsche</span> ile
              konfor alanının dışına savrulur,{' '}
              <span className="text-[#d4a574] font-medium">Mevlânâ</span> ile
              kalbin dinginliğine sığınır,{' '}
              <span className="text-[#8b9bb4] font-medium">Marcus Aurelius</span> ile
              zihnini disipline edersin.
            </p>
            <p>
              Mentoriva, tarihin en keskin akıllarını bugünün teknolojisiyle
              bir araya getirir. Karar ise her zaman sana aittir. Biz sadece
              perdeleri aralarız.
            </p>
          </div>
        </section>

        {/* Misyon */}
        <section className="space-y-5">
          <h2 className="font-display text-h2">Misyonumuz: {'\u201c'}nasıl{'\u201d'} düşünmek?</h2>
          <p className="text-[15px] text-white/50 leading-relaxed">
            Mesele sana ne düşüneceğini söylemek değil, nasıl düşünebileceğini
            göstermek. Günümüzün bilgi kirliliği içinde Mentoriva, seni hazır
            reçetelerden kurtarıp çoklu farkındalığa davet eder.
          </p>
          <p className="text-[15px] text-white/50 leading-relaxed">
            Düşünce biçimini dönüştürmek, hayatı dönüştürmenin ilk adımıdır.
          </p>
        </section>

        {/* Bilgelik ve Teknoloji */}
        <section className="space-y-5">
          <h2 className="font-display text-h2">Bilgelik ve teknoloji</h2>
          <p className="text-[15px] text-white/50 leading-relaxed">
            Mentoriva, gelişmiş yapay zekâ mimarisini insanlık tarihinin
            felsefi mirasıyla harmanlar. Her mentor kendi özgün üslubu ve
            terminolojisiyle konuşur, kendi düşünce sisteminin süzgecinden
            geçerek yanıt verir. Sana sadece bilgi değil, bir zihinsel alan
            açar.
          </p>
        </section>

        {/* Rehberlik notu */}
        <section className="space-y-4">
          <h2 className="font-display text-h2">Bir rehberlik notu</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 space-y-4">
            <p className="text-[15px] text-white/70 font-medium">
              Mentoriva bir otorite değil, bir pusuladır.
            </p>
            <p className="text-[14px] text-white/45 leading-relaxed">
              Sunulan perspektifler; profesyonel psikolojik destek, tıbbi
              teşhis veya hukuki tavsiye niteliği taşımaz. Buradaki sesler,
              tarihsel figürlerin öğretilerinden ilham alan yapay zekâ
              yorumlarıdır.
            </p>
            <p className="text-[14px] text-white/45 leading-relaxed">
              Zihninin mutlak hakimi sensin; Mentoriva ise sadece yol
              arkadaşın.
            </p>
          </div>
        </section>

        {/* Kapanış */}
        <section className="text-center py-8 space-y-3">
          <Logo />
          <p className="text-[15px] text-white/40 italic">
            Cevapların ötesine, farkındalığın merkezine.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-4">
          <Link href="/geri-bildirim" className="btn-primary inline-flex">
            Geri bildirim ver
          </Link>
          <p className="text-xs text-white/20">
            Mentoriva, sizin geri bildirimlerinizle şekilleniyor.
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-white/15">
        <div className="mx-auto max-w-content px-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span>&copy; {new Date().getFullYear()} Mentoriva. Tüm hakları saklıdır.</span>
            <Link href="/hakkimizda" className="text-white/25 hover:text-white/50 transition-colors">Hakkımızda</Link>
            <Link href="/geri-bildirim" className="text-white/25 hover:text-white/50 transition-colors">Geri Bildirim</Link>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:info@mentoriva.com.tr" className="text-white/25 hover:text-white/50 transition-colors">
              info@mentoriva.com.tr
            </a>
            <a href="https://instagram.com/mentoriva_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              @mentoriva_
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
