import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { getAccent } from '@/lib/mentors/metadata';
import { allQuotes, findQuote, ORIGINAL_LANGUAGE, sourceLine } from '@/lib/quote-pages';

const ORIGINAL_LANG_CODE: Record<string, string> = { seneca: 'la', marcus: 'grc', nietzsche: 'de', mevlana: 'fa' };
import { SITE_URL } from '@/lib/site';
import { dative } from '@/lib/tr';

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return allQuotes().map((q) => ({ id: q.quote.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const q = findQuote(params.id);
  if (!q) return {};
  const title = `“${q.quote.text}” — ${q.author}`;
  return {
    title: title.length > 70 ? `${q.author}: ${q.quote.themes[0]} üzerine` : title,
    description: `${sourceLine(q)}. ${q.quote.text} Orijinal metinden doğrulanmış alıntı ve Mentoriva çevirisi.`,
    alternates: { canonical: `/alintilar/${q.quote.id}` },
  };
}

export default function AlintiPage({ params }: Props) {
  const q = findQuote(params.id);
  if (!q) notFound();

  const a = q.mentor ? getAccent(q.mentor.accentColor) : null;
  const related = allQuotes().filter((x) => x.mentorId === q.mentorId && x.quote.id !== q.quote.id).slice(0, 4);
  const isActive = q.mentor?.status === 'active';

  // Arama motorları için yapılandırılmış veri (schema.org Quotation)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    text: q.quote.text,
    inLanguage: 'tr',
    creator: { '@type': 'Person', name: q.mentor?.name ?? q.author },
    isPartOf: { '@type': 'Book', name: q.quote.work },
    url: `${SITE_URL}/alintilar/${q.quote.id}`,
    translator: { '@type': 'Organization', name: 'Mentoriva' },
  };

  return (
    <div className="min-h-dvh">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <nav className="text-xs text-white/40" aria-label="Konum">
          <Link href="/alintilar" className="hover:text-white/70">Alıntılar</Link>
          <span className="mx-2">/</span>
          <Link href={`/alintilar#${q.mentorId}`} className="hover:text-white/70">{q.author}</Link>
        </nav>

        <article className="glass relative mt-6 overflow-hidden rounded-3xl p-7 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${a?.hex ?? '#00bcd4'}, transparent)` }} />
          <blockquote>
            <p className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-snug text-white/90 text-balance">&ldquo;{q.quote.text}&rdquo;</p>
            <footer className="mt-6 flex items-center gap-3">
              {q.mentor && (
                <span className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: a?.hex }}>
                  <Image src={q.mentor.portraitUrl} alt="" fill sizes="44px" className="object-cover" style={{ objectPosition: q.mentor.portraitPosition ?? 'center' }} />
                </span>
              )}
              <cite className="not-italic">
                <span className="block font-display text-lg" style={{ color: a?.text }}>{q.mentor?.name ?? q.author}</span>
                <span className="block text-sm text-white/50">{`${q.quote.work} ${q.quote.ref}`.trim()}</span>
              </cite>
            </footer>
          </blockquote>

          <div className="mt-8 rounded-2xl border border-white/[0.06] bg-ink-0/40 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Orijinal metin · {ORIGINAL_LANGUAGE[q.mentorId] ?? ''}</p>
            <p
              lang={ORIGINAL_LANG_CODE[q.mentorId] ?? 'und'}
              dir={q.mentorId === 'mevlana' ? 'rtl' : undefined}
              className={`mt-2 text-[15px] leading-relaxed text-white/60 ${q.mentorId === 'mevlana' ? 'text-right' : 'font-display italic'}`}
            >
              {q.quote.original}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-white/30">
              Türkçe çeviri Mentoriva’ya aittir. Doğrulama kaynağı: {q.quote.verifiedFrom}.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {q.quote.themes.map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/55">{t}</span>
            ))}
          </div>
        </article>

        {/* Çağrı */}
        <section className="mt-8 rounded-3xl border p-6 text-center sm:p-8" style={{ borderColor: a?.border, background: a?.bg }}>
          <h2 className="font-display text-2xl text-white/90">Bu konu sana da tanıdık mı geliyor?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            {isActive
              ? `Kendi sorunu ${dative(q.mentor?.shortName ?? '')} sor; sana kendi felsefesiyle, senin durumuna özel cevap versin.`
              : `${q.mentor?.shortName ?? q.author} yakında aramıza katılıyor. O gelene kadar sorunu diğer mentorlara sorabilirsin.`}
          </p>
          <Link href={isActive ? `/?mentor=${q.mentorId}#mentorlar` : '/#mentorlar'} className="btn-primary mt-5 inline-flex">
            {isActive ? `${dative(q.mentor?.shortName ?? '')} sor` : 'Mentorlarla tanış'} →
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related">
            <h2 id="related" className="font-display text-xl text-white/80">{q.author}’dan diğer alıntılar</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.quote.id}>
                  <Link href={`/alintilar/${r.quote.id}`} className="glass block rounded-2xl p-4 text-sm leading-relaxed text-white/70 transition-colors hover:border-white/15 hover:text-white/90">
                    &ldquo;{r.quote.text}&rdquo;
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
