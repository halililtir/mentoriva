'use client';

/**
 * Admin paneli ortak parçaları: API çağrısı, biçimlendirme ve küçük UI öğeleri.
 */

import { cn } from '@/lib/cn';

/** Oturum düşerse (401) özel hata fırlatır; panel giriş ekranına döner. */
export class AdminAuthError extends Error {}

export async function adminFetch<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    cache: 'no-store',
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401) throw new AdminAuthError('Oturum süresi doldu');
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `İstek başarısız (${res.status})`);
  return data;
}

const DATE_TIME = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' });

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_TIME.format(d);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE.format(d);
}

/** "3 dk önce", "2 gün önce" */
export function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return 'hiç';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} gün önce`;
  return fmtDate(iso);
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-white/[0.08] bg-ink-50/70 p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-sans text-sm font-semibold text-white/85">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone = 'default' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-50/70 px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">{label}</p>
      <p
        className={cn(
          'mt-1 font-sans text-2xl font-semibold tabular-nums',
          tone === 'good' && 'text-emerald-400',
          tone === 'warn' && 'text-amber-400',
          tone === 'bad' && 'text-red-400',
          tone === 'default' && 'text-white/90',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-white/45">{hint}</p>}
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'good' | 'warn' | 'bad' | 'brand' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        tone === 'default' && 'border-white/10 text-white/55',
        tone === 'good' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        tone === 'warn' && 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        tone === 'bad' && 'border-red-500/30 bg-red-500/10 text-red-400',
        tone === 'brand' && 'border-brand-500/30 bg-brand-500/10 text-brand-300',
      )}
    >
      {children}
    </span>
  );
}

export const inputCls =
  'w-full rounded-lg border border-white/10 bg-ink-0/60 px-3 py-2 text-sm text-white/90 placeholder:text-white/35 focus:border-brand-500/60 focus:outline-none';

export const smallBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40';

/** Yatay çubuk (yüzde). */
export function Bar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${value ? pct : 0}%`, background: color }} />
    </div>
  );
}
