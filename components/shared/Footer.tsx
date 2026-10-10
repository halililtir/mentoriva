import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/site';

const LINKS = [
  { href: '/calismalar', label: 'Çalışmalar' },
  { href: '/icimde', label: 'İçimde ne var?' },
  { href: '/yolculuk', label: 'Kendine Yolculuk' },
  { href: '/hazirla', label: 'Söyleyeceğimi hazırla' },
  { href: '/test', label: 'Kişilik Testi' },
  { href: '/alintilar', label: 'Kaynaklı Alıntılar' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/geri-bildirim', label: 'Geri Bildirim' },
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kullanim-sartlari', label: 'Kullanım Şartları' },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.06]">
      <div className="absolute inset-x-0 -top-px mx-auto h-px max-w-xl bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      <div className="mx-auto max-w-content px-5 py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo size={28} />
          <p className="max-w-xs text-sm leading-relaxed text-white/40">
            Tarihin en keskin zihinlerinden ilham alan bir düşünme aracı. Aynı soruya, farklı pencerelerden bak.
          </p>
        </div>

        <nav aria-label="Alt menü" className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Keşfet</p>
          <ul className="space-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-white/50 transition-colors hover:text-brand-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">İletişim</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="block text-sm text-white/50 transition-colors hover:text-brand-300">
            {CONTACT_EMAIL}
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-brand-300"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            {INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>

      <div className="border-t border-white/[0.04]">
        <p className="mx-auto max-w-content px-5 py-6 text-[11px] leading-relaxed text-white/25">
          Mentoriva yapay zekâ destekli bir düşünce aracıdır. Cevaplar tarihî figürlerin gerçek görüşleri değildir;
          profesyonel psikolojik destek veya tıbbi tavsiye yerine geçmez. © {new Date().getFullYear()} Mentoriva
        </p>
      </div>
    </footer>
  );
}
