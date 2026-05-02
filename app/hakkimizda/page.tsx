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
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/85 backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="inline-flex"><Logo /></Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-white/35 hover:text-white/60 transition-colors">Ana Sayfa</Link>
            <Link href="/test" className="text-white/35 hover:text-white/60 transition-colors">Testi Çöz</Link>
            <Link href="/geri-bildirim" className="text-white/35 hover:text-white/60 transition-colors">Geri Bildirim</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-5 py-12 sm:py-20 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl leading-tight">
            Tek bir hakikatten <span className="text-brand-500">fazlası</span>.
          </h1>
          <p className="text-[16px] text-white/50 leading-relaxed max-w-[560px] mx-auto">
            Cevap bulmak kolaydır. Zor olan, doğru soruyu sormak ve o soruya farklı aynalardan bakabilmektir.
          </p>
        </section>

        {/* Hikaye */}
        <section className="space-y-5">
          <p className="text-[15px] text-white/50 leading-[1.8]">
            Mentoriva; seni tek bir zihinle, tek bir doğruyla ya da tek bir algıyla sınırlamaz. Bu yolculuk, basit ama tutkulu bir hayalle başladı: {'\u201c'}Kitap sayfalarında fısıldayan o dev zihinlerle gerçekten konuşabilseydik ne olurdu?{'\u201d'}
          </p>
          <p className="text-[15px] text-white/50 leading-[1.8]">
            Biz, sorulara yanıt vermek için değil; bakış açısını çoğaltmak ve tarihin tozlu raflarındaki bilgeliği bugünün canlı bir diyaloğuna dönüştürmek için buradayız.
          </p>
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]"></div></div>
            <div className="relative flex justify-center">
              <p className="bg-[#070b14] px-6 text-[15px] text-brand-400/80 italic">
                Çünkü biliyoruz ki: doğru cevap yoktur; yalnızca güçlü perspektifler vardır.
              </p>
            </div>
          </div>
        </section>

        {/* Zihinlerin karşılaşma noktası */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl sm:text-3xl">Zihinlerin karşılaşma noktası</h2>
          <p className="text-[15px] text-white/45 leading-[1.8]">
            Aynı soruyu sorarsın, ancak yankısı her defasında değişir.
          </p>

          {/* Mentor kartları */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { name: 'Carl Jung', desc: 'İç dünyandaki arketipleri keşfet', color: '#00bcd4', border: 'border-cyan-500/20', bg: 'bg-cyan-500/[0.04]' },
              { name: 'Friedrich Nietzsche', desc: 'Konfor alanının dışına savrul', color: '#f59e0b', border: 'border-amber-500/20', bg: 'bg-amber-500/[0.04]' },
              { name: 'Mevlânâ', desc: 'Kalbin dinginliğine sığın', color: '#d4a574', border: 'border-orange-400/20', bg: 'bg-orange-400/[0.04]' },
              { name: 'Marcus Aurelius', desc: 'Zihnini disipline et', color: '#8b9bb4', border: 'border-slate-400/20', bg: 'bg-slate-400/[0.04]' },
            ].map((m) => (
              <div key={m.name} className={`rounded-xl ${m.border} ${m.bg} p-4 sm:p-5 space-y-2 transition-all hover:scale-[1.02]`}>
                <h3 className="font-display text-sm sm:text-base" style={{ color: m.color }}>{m.name}</h3>
                <p className="text-[12px] sm:text-[13px] text-white/35 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-[15px] text-white/45 leading-[1.8]">
            Mentoriva, tarihin en keskin akıllarını bugünün teknolojisiyle bir araya getirerek onları birer {'\u201c'}kitap karakteri{'\u201d'} olmaktan çıkarıp birer yol arkadaşına dönüştürür. Karar ise her zaman sana aittir. Biz sadece perdeleri aralarız.
          </p>
        </section>

        {/* Misyon */}
        <section className="space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl">Misyonumuz: {'\u201c'}nasıl{'\u201d'} düşünmek?</h2>
          <p className="text-[15px] text-white/50 leading-[1.8]">
            Mesele sana ne düşüneceğini söylemek değil, nasıl düşünebileceğini göstermek. Günümüzün bilgi kirliliği içinde Mentoriva, seni hazır reçetelerden kurtarıp çoklu farkındalığa davet eder.
          </p>
          <p className="text-[15px] text-white/50 leading-[1.8]">
            Bu platform, kütüphanelerin sessizliğini bir sohbetin samimiyetiyle birleştirme arzusundan doğdu. Düşünce biçimini dönüştürmek, hayatı dönüştürmenin ilk adımıdır.
          </p>
        </section>

        {/* Bilgelik ve Teknoloji */}
        <section className="space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl">Bilgelik ve teknoloji</h2>
          <p className="text-[15px] text-white/50 leading-[1.8]">
            Mentoriva, gelişmiş yapay zekâ mimarisini insanlık tarihinin felsefi mirasıyla harmanlar. Her mentor kendi özgün üslubu ve terminolojisiyle konuşur, kendi düşünce sisteminin süzgecinden geçerek yanıt verir.
          </p>
          <p className="text-[15px] text-white/50 leading-[1.8]">
            Yapay zekayı, geçmişin bilgeliğine ulaşmak için dijital bir köprü olarak konumlandırdık.
          </p>
        </section>

        {/* Rehberlik Notu */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl">Bir rehberlik notu</h2>
          <div className="rounded-2xl border border-brand-500/15 bg-gradient-to-br from-brand-500/[0.03] to-transparent p-6 sm:p-8 space-y-4">
            <p className="text-[16px] text-brand-400 font-display">
              Mentoriva bir otorite değil, bir pusuladır.
            </p>
            <p className="text-[14px] text-white/45 leading-[1.8]">
              Sunulan perspektifler; profesyonel psikolojik destek, tıbbi teşhis veya hukuki tavsiye niteliği taşımaz. Buradaki sesler, tarihsel figürlerin öğretilerinden ilham alan yapay zekâ yorumlarıdır.
            </p>
            <p className="text-[14px] text-white/45 leading-[1.8]">
              Mentoriva henüz ilk adımlarını atan bir keşif yolculuğu. Bu dijital kütüphaneyi ve düşünce mimarisini birlikte inşa ediyoruz; bu yüzden geri bildirimlerin bizim için kadim bir el yazması kadar değerli.
            </p>
          </div>
        </section>

        {/* Kapanış */}
        <section className="text-center py-8 space-y-5">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-brand-500/30 to-transparent mx-auto"></div>
          <Logo />
          <p className="text-[16px] text-white/50 font-display">
            Zihninin mutlak hakimi sensin;
          </p>
          <p className="text-[15px] text-brand-400/70 italic">
            Mentoriva ise sadece yol arkadaşın.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="btn-primary inline-flex">
              Mentorlarla tanış
            </Link>
            <Link href="/geri-bildirim" className="btn-ghost inline-flex text-sm">
              Geri bildirim ver
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-white/15">
        <div className="mx-auto max-w-content px-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span>&copy; {new Date().getFullYear()} Mentoriva. Tüm hakları saklıdır.</span>
            <Link href="/gizlilik" className="text-white/25 hover:text-white/50 transition-colors">Gizlilik</Link>
            <Link href="/kullanim-sartlari" className="text-white/25 hover:text-white/50 transition-colors">Kullanım Şartları</Link>
            <Link href="/geri-bildirim" className="text-white/25 hover:text-white/50 transition-colors">Geri Bildirim</Link>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:info@mentoriva.com.tr" className="text-white/25 hover:text-white/50 transition-colors">info@mentoriva.com.tr</a>
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
