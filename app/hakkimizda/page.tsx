import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Logo } from '@/components/shared/Logo';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/home/Sections';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'Mentoriva nedir, mentorlar nasıl konuşur, kaynaklara nasıl sadık kalırız ve neyi yapmayız.',
};

const PRINCIPLES = [
  {
    title: 'Eserlere dayanır',
    body: 'Her mentor yalnızca o düşünürün belgelenmiş eserlerinde ve fikirlerinde temellenir. Düşünürün söylemediği bir şeyi ona söyletmemeye çalışırız.',
  },
  {
    title: 'Alıntılar doğrulanmıştır',
    body: 'Cevapların sonundaki alıntılar yapay zekâya yazdırılmaz. Orijinal dilinde (Latince, Yunanca, Almanca, Farsça) kaynağından tek tek kontrol edilmiş bir katalogdan gelir; Türkçesi bize aittir. Jung’un eserleri hâlâ telif kapsamında olduğu için onun cevaplarında alıntı yer almaz.',
  },
  {
    title: 'Yapay zekâ olduğunu saklamaz',
    body: 'Mentorlar düşünürlerin kendisi değil, onların fikirlerinden ilham alan yapay zekâ karakterleridir. İçtenlikle sorarsan bunu açıkça söylerler.',
  },
  {
    title: 'Karar senindir',
    body: 'Mentorlar aynı soruya bilerek farklı, hatta çelişen cevaplar verir. Amaç sana doğruyu dikte etmek değil, bakabileceğin pencereleri çoğaltmaktır.',
  },
];

const NOT_LIST = [
  'Terapi, psikolojik danışmanlık ya da tıbbi tavsiye değildir.',
  'Hukuki veya finansal karar için kaynak değildir.',
  'Kriz anında yardım hattı değildir; zor bir dönemdeysen lütfen bir yakınına ya da bir uzmana ulaş.',
  'Düşünürlerin “gerçek” sözlerinin arşivi değildir; doğrulanmış alıntılar dışındaki her cümle yapay zekâ yorumudur.',
];

export default function AboutPage() {
  return (
    <div className="min-h-dvh">
      <Header />

      <main className="mx-auto max-w-content px-5 pb-20 pt-12 sm:pt-20">
        {/* Giriş */}
        <section className="mx-auto max-w-[720px] text-center">
          <p className="eyebrow animate-fade-up">Hakkımızda</p>
          <h1 className="mt-6 font-display text-[clamp(2.2rem,5.5vw,3.6rem)] leading-[1.08] tracking-[-0.02em] text-balance animate-fade-up" style={{ animationDelay: '80ms' }}>
            Tek bir doğrudan <span className="italic text-gradient">fazlası.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[580px] text-[16px] leading-relaxed text-white/65 animate-fade-up" style={{ animationDelay: '160ms' }}>
            Mentoriva, aklındaki bir soruya farklı düşünce geleneklerinden bakmanı sağlayan bir düşünme aracıdır.
            Aynı soruyu sorarsın; bir psikolog, bir filozof, bir şair ya da bir Stoacı kendi diliyle cevap verir.
          </p>
        </section>

        {/* Hikâye */}
        <Reveal className="mx-auto mt-16 max-w-[680px] space-y-5 text-[15.5px] leading-[1.85] text-white/60">
          <p>
            Hepimiz zor bir kararın, bir kırgınlığın ya da tekrar eden bir döngünün içinde tek bir sesle düşünürüz:
            kendi sesimizle. Kitapların değerli tarafı, o sesin yanına başka sesler koymasıdır. Ama bir kitabı açıp
            kendi derdine cevap bulmak çoğu zaman zordur.
          </p>
          <p>
            Mentoriva bu boşluk için yapıldı: yüzyıllardır okunan düşünürlerin bakış açılarını, senin bugünkü
            sorunla buluşturmak. Hazır reçete vermek için değil; soruna başka pencerelerden bakabilmen ve kendi
            cevabını daha net görebilmen için.
          </p>
        </Reveal>

        {/* Mentorlar */}
        <section className="mt-24" aria-labelledby="about-mentors">
          <SectionHeading eyebrow="Mentorlar" title="Kimlerle" accent="konuşursun?" id="about-mentors">
            Her biri kendi geleneğinin diliyle ve kendi cevap tarzıyla konuşur. Yeni mentorlar zamanla eklenir.
          </SectionHeading>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIVE_MENTORS.map((m, i) => {
              const a = getAccent(m.accentColor);
              return (
                <Reveal key={m.id} delay={i * 80} as="article">
                  <div className="glass flex h-full gap-4 rounded-2xl p-5 transition-colors duration-300 hover:border-white/15">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: a.border }}>
                      <Image src={m.portraitUrl} alt={m.name} fill sizes="64px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg leading-tight" style={{ color: a.hex }}>{m.name}</h3>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/40">
                        {m.tradition}{m.lifespan ? ` · ${m.lifespan}` : ''}
                      </p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{m.voice}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* İlkeler */}
        <section className="mt-24" aria-labelledby="about-principles">
          <SectionHeading eyebrow="İlkelerimiz" title="Kaynağa" accent="sadakat" id="about-principles">
            Bir düşünürün adıyla konuşmak sorumluluk ister. Bu sorumluluğu şöyle taşıyoruz.
          </SectionHeading>

          <div className="mx-auto mt-12 grid max-w-[920px] gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="glass h-full rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 text-xs font-semibold text-brand-300">
                      {i + 1}
                    </span>
                    <h3 className="font-display text-lg text-white/90">{p.title}</h3>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/60">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-white/45">
            Doğrulanmış alıntıların tamamı kaynaklarıyla birlikte{' '}
            <Link href="/alintilar" className="text-brand-300 hover:text-brand-200">Alıntılar</Link> sayfasında.
          </p>
        </section>

        {/* Ne değildir */}
        <section className="mx-auto mt-24 max-w-[720px]" aria-labelledby="about-not">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
              <h2 id="about-not" className="font-display text-2xl">Mentoriva ne değildir?</h2>
              <ul className="mt-5 space-y-3">
                {NOT_LIST.map((t) => (
                  <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed text-white/65">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400/70" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/[0.06] pt-5 text-[13.5px] leading-relaxed text-white/50">
                Sorularını satmayız, reklam için kullanmayız; yapay zekâ sağlayıcımız da onları model eğitiminde kullanmaz.
                Ayrıntılar <Link href="/gizlilik" className="text-brand-300 hover:text-brand-200">Gizlilik Politikası</Link>’nda.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Erken aşama + iletişim */}
        <section className="mx-auto mt-24 max-w-[720px] text-center">
          <Reveal>
            <Logo />
            <h2 className="mt-6 font-display text-2xl sm:text-3xl text-balance">Henüz yolun başındayız.</h2>
            <p className="mx-auto mt-4 max-w-[540px] text-[15px] leading-relaxed text-white/55">
              Mentoriva kapalı beta aşamasında. Hangi cevabın işine yaradığını, hangisinin yaramadığını bize söylemen,
              ürünü en çok geliştiren şey.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/" className="btn-primary w-full sm:w-auto">Mentorlarla tanış</Link>
              <Link href="/geri-bildirim" className="btn-secondary w-full sm:w-auto">Geri bildirim ver</Link>
            </div>
            <p className="mt-8 text-sm text-white/40">
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white/70">{CONTACT_EMAIL}</a>
              <span className="mx-2">·</span>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white/70">{INSTAGRAM_HANDLE}</a>
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
