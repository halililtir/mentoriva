import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { getAccent } from '@/lib/mentors/metadata';
import { allQuotes, ORIGINAL_LANGUAGE } from '@/lib/quote-pages';

export const metadata: Metadata = {
  title: 'Doğrulanmış alıntılar',
  description:
    'Mevlânâ, Marcus Aurelius, Nietzsche ve Seneca’nın orijinal metinlerden doğrulanmış sözleri; eser ve bölüm bilgisiyle, Mentoriva çevirisiyle.',
  alternates: { canonical: '/alintilar' },
};

export default function AlintilarPage() {
  const quotes = allQuotes();
  // Aktif mentorlar önce, yakında gelecekler sonra
  const groups = [...new Set(quotes.map((q) => q.mentorId))]
    .map((id) => quotes.filter((q) => q.mentorId === id))
    .sort((a, b) => Number(b[0]!.mentor?.status === 'active') - Number(a[0]!.mentor?.status === 'active'));

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-content px-5 py-12 sm:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-300/85">Kaynaklı alıntılar</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] leading-tight">
            Gerçekten <span className="italic text-gradient">onların sözleri.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/50">
            İnternette dolaşan birçok &ldquo;ünlü söz&rdquo; aslında o kişiye ait değildir. Buradaki her alıntıyı orijinal dilindeki
            metinde birebir bulduk, eser ve bölümünü not ettik ve kendimiz Türkçeye çevirdik. Mentorlarımız cevaplarını yalnızca bu
            sözlerle kapatır.
          </p>
        </header>

        <div className="mt-14 space-y-14">
          {groups.map((group) => {
            const first = group[0]!;
            const a = first.mentor ? getAccent(first.mentor.accentColor) : null;
            return (
              <section key={first.mentorId} id={first.mentorId} aria-labelledby={`h-${first.mentorId}`} className="scroll-mt-24">
                <div className="flex items-center gap-4">
                  {first.mentor && (
                    <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: a?.hex }}>
                      <Image src={first.mentor.portraitUrl} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: first.mentor.portraitPosition ?? 'center' }} />
                    </span>
                  )}
                  <div>
                    <h2 id={`h-${first.mentorId}`} className="font-display text-2xl" style={{ color: a?.text }}>{first.mentor?.name ?? first.author}</h2>
                    <p className="text-xs text-white/40">
                      {group.length} alıntı · {ORIGINAL_LANGUAGE[first.mentorId] ?? 'orijinal dil'} metinden doğrulandı
                    </p>
                  </div>
                </div>

                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {group.map((q) => (
                    <li key={q.quote.id}>
                      <Link
                        href={`/alintilar/${q.quote.id}`}
                        className="glass group flex h-full flex-col justify-between rounded-2xl p-5 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-white/15"
                      >
                        <span className="font-display text-[17px] leading-snug text-white/85">&ldquo;{q.quote.text}&rdquo;</span>
                        <span className="mt-4 flex items-center justify-between text-xs text-white/40">
                          <span>{`${q.quote.work} ${q.quote.ref}`.trim()}</span>
                          <span className="transition-transform group-hover:translate-x-0.5" style={{ color: a?.text }}>→</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
