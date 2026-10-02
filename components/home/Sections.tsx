/**
 * Ana sayfanın tanıtım bölümleri: düşünce gelenekleri, "neden", "nasıl çalışır",
 * "bilmen gerekenler". Etkileşimli olanlar (kullanım alanları, SSS, kapanış)
 * ayrı dosyalarda.
 */

import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';
import { ACTIVE_MENTORS, COMING_SOON_MENTORS, getAccent } from '@/lib/mentors/metadata';

// -----------------------------------------------------------
// Ortak bölüm başlığı
// -----------------------------------------------------------

export function SectionHeading({
  eyebrow,
  title,
  accent,
  children,
  id,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  /** Başlığın vurgulanan (gradient) son kısmı. */
  accent?: string;
  children?: React.ReactNode;
  id?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className={`inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300/85 ${align === 'center' ? '' : ''}`}>
        <span className="h-px w-6 bg-brand-400/70" />
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-balance">
        {title} {accent && <span className="italic text-gradient">{accent}</span>}
      </h2>
      {children && <p className="mt-4 text-[15px] leading-relaxed text-white/50">{children}</p>}
    </Reveal>
  );
}

// -----------------------------------------------------------
// Düşünce gelenekleri şeridi
// -----------------------------------------------------------

/**
 * Hero'nun hemen altında: hangi düşünce geleneklerinin temsil edildiğini
 * dönemleri ve cevap tarzlarıyla gösterir. Sayı yığını yerine içerik.
 */
export function TraditionsStrip() {
  return (
    <section className="mx-auto max-w-content px-5" aria-labelledby="traditions-title">
      <Reveal>
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-1 border-b border-white/[0.06] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="traditions-title" className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
              Yüzyılları aşan düşünce gelenekleri
            </h2>
            <p className="text-[11px] text-white/30">
              Yakında: {COMING_SOON_MENTORS.map((m) => m.shortName).join(' · ')}
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-5">
            {ACTIVE_MENTORS.map((m, i) => {
              const a = getAccent(m.accentColor);
              return (
                <li
                  key={m.id}
                  className={`group relative px-6 py-6 transition-colors duration-500 hover:bg-white/[0.02] ${
                    i > 0 ? 'border-t border-white/[0.06] sm:border-t-0' : ''
                  } ${i % 2 === 1 ? 'sm:border-l sm:border-white/[0.06]' : ''} ${i >= 2 ? 'sm:border-t sm:border-white/[0.06] lg:border-t-0' : ''} ${
                    i === 2 ? 'lg:border-l lg:border-white/[0.06]' : ''
                  }`}
                >
                  <span
                    className="absolute inset-x-6 top-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-out-expo group-hover:scale-x-100"
                    style={{ background: a.hex }}
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border" style={{ borderColor: a.border }}>
                      <Image src={m.portraitUrl} alt="" fill sizes="40px" className="object-cover grayscale-[30%] transition duration-500 group-hover:grayscale-0" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium" style={{ color: a.hex }}>{m.tradition}</p>
                      <p className="truncate text-xs text-white/45">
                        {m.shortName} <span className="tabular-nums text-white/25">· {m.lifespan}</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] leading-relaxed text-white/55">{m.voice}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

// -----------------------------------------------------------
// Neden Mentoriva? — genel amaçlı asistanla dürüst bir kıyas
// -----------------------------------------------------------

const COMPARISON: Array<{ label: string; general: string; mentoriva: string }> = [
  {
    label: 'Ne verir?',
    general: 'Konunun her yönünü dengeleyen tek, kapsamlı bir cevap.',
    mentoriva: 'Birbirinden farklı, zaman zaman çelişen dört net duruş. Farkı sen görürsün.',
  },
  {
    label: 'Nasıl konuşur?',
    general: 'Nötr, nazik ve yardımsever bir asistan dili.',
    mentoriva: 'Her mentor kendi tarzıyla: biri sorgular, biri zorlar, biri teselli eder, biri yön gösterir.',
  },
  {
    label: 'Ne için ideal?',
    general: 'Bilgi, araştırma, yazı, kod ve günlük işler.',
    mentoriva: 'Kararlar, ilişkiler, iç çatışmalar ve anlam arayışı gibi kişisel sorular.',
  },
  {
    label: 'Sonunda ne kalır?',
    general: 'Genellikle bir çözüm listesi ya da öneriler.',
    mentoriva: 'Soruna yeni bir açıdan bakmanı sağlayan fikirler ve kendine sorman gereken sorular.',
  },
];

export function WhyMentoriva() {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:py-28" aria-labelledby="why-title">
      <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28">
          <SectionHeading eyebrow="Neden Mentoriva?" title="Bilgi için asistan," accent="düşünmek için Mentoriva." id="why-title" align="left">
            Genel amaçlı yapay zekâ asistanları bilgiye ulaşmakta harikadır. Ama &ldquo;ne yapmalıyım?&rdquo; gibi kişisel
            sorularda çoğu zaman her ihtimali tartan, dengeli ama mesafeli bir cevap verirler. İnsanlık ise bu sorulara
            yüzyıllardır çok farklı cevaplar verdi. Mentoriva bu farklılığı bir araya getirir; amacı sana ne yapacağını
            söylemek değil, <span className="text-white/80">kendi cevabına daha geniş bir açıdan bakmanı sağlamaktır.</span>
          </SectionHeading>
          <Reveal delay={120}>
            <blockquote className="mt-8 border-l-2 border-brand-500/60 pl-5 font-display text-xl italic leading-snug text-white/75">
              &ldquo;Doğru cevaptan önce doğru soru gelir.&rdquo;
            </blockquote>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="glass overflow-hidden rounded-2xl">
            {/* Sütun başlıkları — geniş ekranda */}
            <div className="hidden grid-cols-[120px_1fr_1fr] border-b border-white/[0.06] text-[11px] uppercase tracking-[0.14em] sm:grid">
              <span />
              <span className="px-5 py-3.5 text-white/40">Genel amaçlı asistan</span>
              <span className="flex items-center gap-2 border-l border-white/[0.06] bg-brand-500/[0.06] px-5 py-3.5 text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Mentoriva
              </span>
            </div>

            <dl>
              {COMPARISON.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid sm:grid-cols-[120px_1fr_1fr] ${i < COMPARISON.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
                >
                  <dt className="px-5 pb-1 pt-4 text-[12px] font-medium text-white/70 sm:py-5">{row.label}</dt>
                  <dd className="px-5 pb-2 text-[13.5px] leading-relaxed text-white/45 sm:py-5">
                    <span className="mr-1.5 text-[10px] uppercase tracking-wider text-white/30 sm:hidden">Asistan:</span>
                    {row.general}
                  </dd>
                  <dd className="border-white/[0.06] bg-brand-500/[0.035] px-5 pb-4 pt-2 text-[13.5px] leading-relaxed text-white/85 sm:border-l sm:py-5">
                    <span className="mr-1.5 text-[10px] uppercase tracking-wider text-brand-300 sm:hidden">Mentoriva:</span>
                    {row.mentoriva}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-4 px-1 text-xs leading-relaxed text-white/35">
            İkisi birbirinin alternatifi değil: bir konuyu öğrenmek için asistana, o konuda ne hissettiğini ve ne yapmak
            istediğini düşünmek için Mentoriva&apos;ya gelirsin.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// -----------------------------------------------------------
// Nasıl çalışır?
// -----------------------------------------------------------

const STEPS = [
  {
    title: 'Ücretsiz üye ol',
    body: 'Adını, e-postanı ve bir şifre yaz; e-postana gelen 6 haneli kodla hesabını doğrula. Bir dakika sürer.',
    note: 'Kredi kartı istenmez',
    icon: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" />,
  },
  {
    title: 'Mentorlarını seç',
    body: 'Derinleşmek istiyorsan tek bir mentor, farklı bakışları görmek istiyorsan 2–4 mentor seç.',
    note: 'Kararsızsan dört mentor seç',
    icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  },
  {
    title: 'Sorunu yaz',
    body: 'Seni meşgul eden tek bir soru yaz. Kısa ve net sorular en derin cevapları getirir. Örnek sorulardan da başlayabilirsin.',
    note: '1 soru = 1 hak, mentor sayısından bağımsız',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: 'Karşılaştır, sohbete devam et',
    body: 'Cevaplar aynı anda akar. Seni en çok düşündüren mentoru seç ve onunla konuşmaya devam et.',
    note: 'Sohbette her mesaj 1 hak',
    icon: <path d="M8 12h8M12 8v8M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />,
  },
];

export function HowItWorks({ id }: { id?: string }) {
  return (
    <section id={id} className="mx-auto max-w-content scroll-mt-24 px-5 py-20 sm:py-28" aria-labelledby="how-title">
      <SectionHeading eyebrow="Nasıl çalışır?" title="Dört adımda" accent="ilk cevaplarına" id="how-title">
        Kurulum yok, öğrenmen gereken bir şey yok. İlk sorundan ilk cevabına bir dakikadan kısa sürer.
      </SectionHeading>

      <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-[2.25rem] hidden h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent lg:block" />
        {STEPS.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 110} className="group relative">
            <div className="glass flex h-full flex-col rounded-2xl p-6 transition-all duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:border-brand-500/25">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/30 bg-ink-0 font-display text-lg text-brand-300 shadow-[0_0_30px_-8px_rgba(0,188,212,0.6)] transition-transform duration-500 ease-spring group-hover:scale-110">
                  {i + 1}
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-white/30" aria-hidden="true">
                  {s.icon}
                </svg>
              </div>
              <h3 className="mt-5 font-display text-xl text-white/90">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">{s.body}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55">
                <span className="h-1 w-1 rounded-full bg-brand-400" />
                {s.note}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

// -----------------------------------------------------------
// Bilmen gerekenler (ne değildir)
// -----------------------------------------------------------

const GOOD_TO_KNOW = [
  {
    title: 'Bir düşünme aracıdır, terapi değildir',
    body: 'Tanı koymaz, tedavi önermez. Kriz belirtisi taşıyan mesajlarda mentorlar cevap vermez, seni profesyonel desteğe yönlendirir.',
    icon: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
  },
  {
    title: 'Cevaplar yapay zekâ yorumudur',
    body: 'Mentorlar, düşünürlerin eserlerinden ve yaklaşımlarından ilham alır. Cevaplar onların gerçek sözleri olarak alıntılanmamalıdır.',
    icon: <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />,
  },
  {
    title: 'Soruların sana aittir',
    body: 'Şifren geri döndürülemez biçimde saklanır. Soruların yalnızca cevap üretmek için kullanılır, model eğitiminde kullanılmaz.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
];

export function GoodToKnow() {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:py-24" aria-labelledby="know-title">
      <SectionHeading eyebrow="Bilmen gerekenler" title="Açık ve dürüst:" accent="Mentoriva ne değildir?" id="know-title" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {GOOD_TO_KNOW.map((g, i) => (
          <Reveal key={g.title} delay={i * 100}>
            <div className="glass h-full rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {g.icon}
                </svg>
              </span>
              <h3 className="mt-5 font-display text-lg text-white/90">{g.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{g.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
