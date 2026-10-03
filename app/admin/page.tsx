'use client';

/**
 * Admin paneli. Tüm veri /api/admin/* ve admin çereziyle korunan
 * /api/v1/{users,feedback} uçlarından gelir; oturum düşerse giriş ekranına döner.
 * Bölümler components/admin/* altında.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { AdminAuthError, Card, adminFetch, fmtDateTime, inputCls, smallBtn } from '@/components/admin/shared';
import { Overview, type OverviewData } from '@/components/admin/Overview';
import { Users, type AdminUser } from '@/components/admin/Users';
import { FeedbackList, type AdminFeedback } from '@/components/admin/FeedbackList';
import { ErrorsList, type ErrorEntry } from '@/components/admin/ErrorsList';
import { WeeklyReportPanel } from '@/components/admin/WeeklyReportPanel';
import { Insights } from '@/components/admin/Insights';
import { cn } from '@/lib/cn';

type Tab = 'overview' | 'insights' | 'users' | 'feedback' | 'errors' | 'report' | 'log';
interface LogEntry { action: string; target: string; detail?: string; at: string }

export default function AdminPage() {
  const [authState, setAuthState] = useState<'checking' | 'out' | 'in'>('checking');
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof AdminAuthError) { setAuthState('out'); return; }
    setError(e instanceof Error ? e.message : 'Beklenmeyen hata');
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Biri hata verse de diğerleri gelsin
      const [o, u, f, l, er] = await Promise.allSettled([
        adminFetch<OverviewData>('/api/admin/overview'),
        adminFetch<{ users: AdminUser[] }>('/api/v1/users'),
        adminFetch<{ feedbacks: AdminFeedback[] }>('/api/v1/feedback'),
        adminFetch<{ entries: LogEntry[] }>('/api/admin/log'),
        adminFetch<{ entries: ErrorEntry[] }>('/api/admin/errors'),
      ]);
      const failed = [o, u, f, l, er].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      if (o.status === 'fulfilled') setOverview(o.value);
      if (u.status === 'fulfilled') setUsers(u.value.users ?? []);
      if (f.status === 'fulfilled') setFeedback(f.value.feedbacks ?? []);
      if (l.status === 'fulfilled') setLog(l.value.entries ?? []);
      if (er.status === 'fulfilled') setErrors(er.value.entries ?? []);
      if (failed) handleError(failed.reason);
      setUpdatedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    fetch('/api/admin/check', { cache: 'no-store' })
      .then((r) => {
        if (r.ok) { setAuthState('in'); void load(); } else setAuthState('out');
      })
      .catch(() => setAuthState('out'));
  }, [load]);

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setAuthState('out'); setOverview(null); setUsers([]); setFeedback([]); setLog([]);
  };

  if (authState === 'checking') return <div className="flex min-h-dvh items-center justify-center"><Logo /></div>;
  if (authState === 'out') return <AdminLogin onIn={() => { setAuthState('in'); void load(); }} />;

  const unread = feedback.filter((f) => f.status !== 'read').length;
  const TABS: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'overview', label: 'Genel bakış' },
    { id: 'insights', label: 'Büyüme ve maliyet' },
    { id: 'users', label: 'Üyeler', badge: users.length },
    { id: 'feedback', label: 'Geri bildirim', badge: unread || undefined },
    { id: 'errors', label: 'Hatalar', badge: errors.length || undefined },
    { id: 'report', label: 'Haftalık özet' },
    { id: 'log', label: 'İşlem kaydı' },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-ink-0/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Siteye dön"><Logo /></Link>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {updatedAt && <span className="hidden text-[11px] text-white/45 sm:inline">Güncellendi {fmtDateTime(updatedAt)}</span>}
            <button onClick={() => void load()} disabled={loading} className={smallBtn}>{loading ? 'Yükleniyor…' : 'Yenile'}</button>
            <ThemeSwitcher />
            <button onClick={logout} className={smallBtn}>Çıkış</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-content gap-1 overflow-x-auto px-5" aria-label="Admin bölümleri">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors',
                tab === t.id ? 'text-white' : 'text-white/55 hover:text-white/85',
              )}
            >
              {t.label}
              {t.badge !== undefined && (
                <span className={cn('ml-1.5 rounded-full px-1.5 text-[10px] tabular-nums', t.id === 'feedback' ? 'bg-brand-500 text-onbrand' : 'bg-white/10 text-white/70')}>
                  {t.badge}
                </span>
              )}
              <span className={cn('absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-400 transition-transform', tab === t.id ? 'scale-x-100' : 'scale-x-0')} />
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-content px-5 py-6">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-400">
            {error}
            <button onClick={() => setError('')} className="text-xs underline">kapat</button>
          </div>
        )}

        {tab === 'overview' && (overview ? <Overview data={overview} onOpenFeedback={() => setTab('feedback')} /> : <Skeleton />)}
        {tab === 'users' && <Users users={users} onChanged={load} onError={handleError} />}
        {tab === 'feedback' && <FeedbackList items={feedback} onChanged={load} onError={handleError} />}
        {tab === 'insights' && <Insights onError={handleError} />}
        {tab === 'errors' && <ErrorsList entries={errors} />}
        {tab === 'report' && <WeeklyReportPanel onError={handleError} />}
        {tab === 'log' && (
          <Card title="Son admin işlemleri">
            {log.length === 0 ? (
              <p className="text-sm text-white/50">Henüz kayıtlı işlem yok.</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {log.map((e, i) => (
                  <li key={i} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-36 shrink-0 text-[11px] tabular-nums text-white/45">{fmtDateTime(e.at)}</span>
                    <span className="text-sm text-white/85">{e.action}</span>
                    <span className="truncate text-xs text-white/55">{e.target}</span>
                    {e.detail && <span className="text-xs text-white/50 sm:ml-auto">{e.detail}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}

function AdminLogin({ onIn }: { onIn: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const login = async () => {
    if (!pw.trim()) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw.trim() }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setErr(d.error ?? 'Giriş başarısız'); return; }
      setPw(''); onIn();
    } catch { setErr('Bağlantı hatası'); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <form onSubmit={(e) => { e.preventDefault(); void login(); }} className="w-full max-w-sm space-y-5 rounded-3xl border border-white/[0.08] bg-ink-50/80 p-8 text-center">
        <Logo />
        <h1 className="font-display text-2xl">Admin paneli</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Admin anahtarı" autoComplete="current-password" className={cn(inputCls, 'text-center')} autoFocus />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={busy || !pw.trim()} className="btn-primary w-full">{busy ? 'Kontrol ediliyor…' : 'Giriş'}</button>
        <p className="text-[11px] text-white/45">Oturum 12 saat açık kalır.</p>
      </form>
    </div>
  );
}
