/**
 * Ana sayfanın tanıtım bölümleri: "neden" ve "bilmen gerekenler". Etkileşimli olanlar (kullanım alanları, SSS, kapanış)
 * ayrı dosyalarda.
 */

import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { COMPARE_DEMO, COMPARE_ROWS } from '@/lib/home-content';

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
// Neden Mentoriva? — aynı soruya asistan ve Mentoriva. Asistanın dengeli
// listesi ekrana girince satır satır çizilir, üstüne damga basılır; ardından
// mentorların birbirinden ayrışan tek cümlelik cevapları belirir.
// -----------------------------------------------------------

const STRIKE_START = 500;
const STRIKE_STEP = 260;

export function WhyMentoriva() {
  const d = COMPARE_DEMO;
  const stampAt = STRIKE_START + d.assistant.length * STRIKE_STEP + 100;
  return (
    <section className="mx-auto max-w-content px-5 py-12 sm:py-28" aria-labelledby="why-title">
      <div className="grid items-start gap-8 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28">
          <SectionHeading eyebrow="Neden Mentoriva?" title="Bilgi için asistan," accent="düşünmek için Mentoriva." id="why-title" align="left">
            Asistanlar bilgiye ulaşmakta harikadır. Ama &ldquo;ne yapmalıyım?&rdquo; diye sorduğunda herkese verilebilecek dengeli bir
            liste döner. Mentoriva sana ne yapacağını söylemez; <span className="text-white/85">sorunun içinde senin göremediğin yeri gösterir.</span>
          </SectionHeading>
          <Reveal delay={120} className="hidden lg:block">
            <dl className="mt-8 space-y-3">
              {COMPARE_ROWS.map((row, i) => (
                <div key={row.label} className="grid grid-cols-[110px_1fr] gap-x-3 text-[13.5px] leading-snug">
                  <dt className="pt-px text-[12px] text-white/45">{row.label}</dt>
                  <dd>
                    <span className="strike text-white/55" style={{ '--d': `${700 + i * 220}ms` } as React.CSSProperties}>{row.general}</span>
                    <span className="m-appear mt-0.5 block font-medium text-white/90" style={{ '--d': `${950 + i * 220}ms` } as React.CSSProperties}>
                      <span className="mr-1.5 text-brand-300" aria-hidden="true">→</span>{row.mentoriva}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <figure className="glass overflow-hidden rounded-2xl p-4 sm:p-6" aria-label="Aynı soruya asistan ve Mentoriva cevabı (temsili)">
            <p className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[14px] leading-snug text-white/85">
              {d.question}
            </p>

            <div className="mt-5">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" /> Genel amaçlı asistan
              </p>
              <div className="relative mt-2 space-y-1 text-[13.5px] leading-relaxed text-white/60">
                {d.assistant.map((line, i) => (
                  <p key={line}>
                    <span className="strike" style={{ '--d': `${STRIKE_START + i * STRIKE_STEP}ms` } as React.CSSProperties}>{line}</span>
                  </p>
                ))}
                <span
                  className="stamp absolute right-0 top-1/2 rounded-lg border-2 border-red-400/70 bg-ink-50/90 px-3 py-1 font-display text-[15px] italic text-red-400 shadow-lg sm:right-2 sm:text-base"
                  style={{ '--d': `${stampAt}ms` } as React.CSSProperties}
                >
                  {d.verdict}
                </span>
              </div>
            </div>

            <div
              className="m-appear relative mt-5 rounded-xl border border-brand-400/30 bg-brand-500/[0.06] p-3.5 sm:p-4"
              style={{ '--d': `${stampAt + 350}ms` } as React.CSSProperties}
            >
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Mentoriva
              </p>
              <ul className="mt-3 space-y-3">
                {d.mentors.map((x, i) => {
                  const m = ACTIVE_MENTORS.find((a) => a.id === x.id);
                  if (!m) return null;
                  const a = getAccent(m.accentColor);
                  return (
                    <li
                      key={x.id}
                      className="m-appear flex gap-3"
                      style={{ '--d': `${stampAt + 650 + i * 380}ms` } as React.CSSProperties}
                    >
                      <span className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: a.hex }}>
                        <Image src={m.portraitUrl} alt="" fill sizes="32px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                      </span>
                      <p className="text-[13.5px] leading-relaxed text-white/85">
                        <span className="mr-1.5 font-medium" style={{ color: a.text }}>{m.shortName}</span>
                        {x.text}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 border-t border-white/[0.07] pt-3 text-[12.5px] leading-relaxed text-white/55">{d.footer}</p>
            </div>
            <figcaption className="mt-3 text-right text-[10.5px] text-white/30">Temsili örnek</figcaption>
          </figure>
        </Reveal>
      </div>
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
    <section className="mx-auto max-w-content px-5 py-12 sm:py-24" aria-labelledby="know-title">
      <SectionHeading eyebrow="Bilmen gerekenler" title="Açık ve dürüst:" accent="Mentoriva ne değildir?" id="know-title" />
      <div className="m-rail-md mt-8 grid gap-5 sm:mt-12 md:grid-cols-3">
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
