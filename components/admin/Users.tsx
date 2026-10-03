'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Card, Pill, adminFetch, fmtAgo, fmtDate, inputCls, smallBtn } from './shared';

export interface AdminUser {
  username: string;
  name?: string;
  dailyLimit: number;
  usedToday: number;
  bonus: number;
  referrals: number;
  questionsUsed?: number;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  lastSeen: string | null;
  notes?: string;
  referredBy?: string;
}

type Filter = 'all' | 'active-today' | 'frozen' | 'referred' | 'never';
type Sort = 'created' | 'seen' | 'questions';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Tümü' },
  { id: 'active-today', label: 'Bugün aktif' },
  { id: 'never', label: 'Hiç soru sormamış' },
  { id: 'referred', label: 'Davetle gelen' },
  { id: 'frozen', label: 'Dondurulmuş' },
];

const isToday = (iso: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

function toCsv(users: AdminUser[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['e-posta', 'ad', 'kayıt', 'son görülme', 'toplam soru', 'bugün', 'günlük limit', 'bonus', 'davet', 'davet eden', 'durum', 'not'];
  const rows = users.map((u) => [
    u.username, u.name, u.createdAt, u.lastSeen, u.questionsUsed ?? 0, u.usedToday, u.dailyLimit, u.bonus, u.referrals,
    u.referredBy, u.isActive ? 'aktif' : 'dondurulmuş', u.notes,
  ]);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function Users({ users, onChanged, onError }: { users: AdminUser[]; onChanged: () => Promise<void>; onError: (e: unknown) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('created');
  const [open, setOpen] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR');
    return users
      .filter((u) => !needle || u.username.includes(needle) || (u.name ?? '').toLocaleLowerCase('tr-TR').includes(needle) || (u.notes ?? '').toLocaleLowerCase('tr-TR').includes(needle))
      .filter((u) =>
        filter === 'all' ? true
          : filter === 'active-today' ? isToday(u.lastSeen)
            : filter === 'frozen' ? !u.isActive
              : filter === 'referred' ? !!u.referredBy
                : (u.questionsUsed ?? 0) === 0,
      )
      .sort((a, b) =>
        sort === 'questions' ? (b.questionsUsed ?? 0) - (a.questionsUsed ?? 0)
          : sort === 'seen' ? +new Date(b.lastSeen ?? 0) - +new Date(a.lastSeen ?? 0)
            : +new Date(b.createdAt) - +new Date(a.createdAt),
      );
  }, [users, q, filter, sort]);

  const exportCsv = () => {
    const blob = new Blob(['﻿' + toCsv(list)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentoriva-uyeler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-posta, ad ya da not ara…" className={cn(inputCls, 'sm:max-w-xs')} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(inputCls, 'sm:w-44')}>
          <option value="created">En yeni kayıt</option>
          <option value="seen">Son görülen</option>
          <option value="questions">En çok soru</option>
        </select>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={exportCsv} className={smallBtn} disabled={list.length === 0}>CSV indir</button>
          <button onClick={() => setShowCreate((v) => !v)} className={smallBtn}>{showCreate ? 'Kapat' : '+ Yeni üye'}</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              filter === f.id ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-white/10 text-white/60 hover:text-white/85',
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-white/45">{list.length} / {users.length} üye</span>
      </div>

      {showCreate && <CreateUser onDone={async () => { setShowCreate(false); await onChanged(); }} onError={onError} />}

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/50">Bu filtreyle eşleşen üye yok.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((u) => (
            <li key={u.username} className={cn('rounded-2xl border bg-ink-50/70', u.isActive ? 'border-white/[0.08]' : 'border-red-500/25')}>
              <button onClick={() => setOpen(open === u.username ? null : u.username)} className="flex w-full flex-col gap-2 px-4 py-3 text-left sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-white/90">{u.name || u.username.split('@')[0]}</span>
                    <span className="truncate text-xs text-white/50">{u.username}</span>
                    {!u.isActive && <Pill tone="bad">Dondurulmuş</Pill>}
                    {u.referredBy && <Pill tone="brand">Davetli</Pill>}
                    {u.bonus > 0 && <Pill tone="warn">+{u.bonus} bonus</Pill>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/45">Kayıt {fmtDate(u.createdAt)} · son görülme {fmtAgo(u.lastSeen)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs tabular-nums text-white/60">
                  <span title="Bugün / günlük limit">Bugün <b className="text-white/85">{u.usedToday}/{u.dailyLimit}</b></span>
                  <span title="Toplam soru">Toplam <b className="text-white/85">{u.questionsUsed ?? 0}</b></span>
                  <span className={cn('transition-transform', open === u.username && 'rotate-180')}>▾</span>
                </div>
              </button>
              {open === u.username && <UserDetail user={u} onChanged={onChanged} onError={onError} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserDetail({ user, onChanged, onError }: { user: AdminUser; onChanged: () => Promise<void>; onError: (e: unknown) => void }) {
  const [limit, setLimit] = useState(String(user.dailyLimit));
  const [bonus, setBonus] = useState('5');
  const [notes, setNotes] = useState(user.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const update = async (payload: Record<string, unknown>, done: string) => {
    setBusy(true); setMsg('');
    try {
      await adminFetch('/api/v1/users', { method: 'PUT', json: { username: user.username, ...payload } });
      setMsg(done);
      await onChanged();
    } catch (e) { onError(e); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminFetch(`/api/v1/users?username=${encodeURIComponent(user.username)}`, { method: 'DELETE' });
      await onChanged();
    } catch (e) { onError(e); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 border-t border-white/[0.06] px-4 py-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] sm:grid-cols-4">
        <div><dt className="text-white/45">Doğrulama</dt><dd className="text-white/80">{user.isVerified === false ? 'Hayır' : 'Evet'}</dd></div>
        <div><dt className="text-white/45">Davet ettiği</dt><dd className="text-white/80">{user.referrals} kişi</dd></div>
        <div><dt className="text-white/45">Davet eden</dt><dd className="truncate text-white/80">{user.referredBy ?? '—'}</dd></div>
        <div><dt className="text-white/45">Kalan bonus</dt><dd className="text-white/80">{user.bonus}</dd></div>
      </dl>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] p-3">
          <p className="mb-2 text-xs font-medium text-white/70">Günlük soru limiti</p>
          <div className="flex gap-2">
            <input type="number" min={0} max={1000} value={limit} onChange={(e) => setLimit(e.target.value)} className={inputCls} />
            <button disabled={busy} onClick={() => update({ dailyLimit: Number(limit) }, 'Limit kaydedildi')} className={smallBtn}>Kaydet</button>
          </div>
          <p className="mt-1.5 text-[11px] text-white/45">Kalıcı; her gün bu kadar hak.</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] p-3">
          <p className="mb-2 text-xs font-medium text-white/70">Bonus soru ver</p>
          <div className="flex gap-2">
            <input type="number" min={1} max={500} value={bonus} onChange={(e) => setBonus(e.target.value)} className={inputCls} />
            <button disabled={busy} onClick={() => update({ addBonus: Number(bonus) }, `+${bonus} bonus eklendi`)} className={smallBtn}>Ekle</button>
          </div>
          <p className="mt-1.5 text-[11px] text-white/45">Tek seferlik; günlük hak bitince harcanır.</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] p-3">
          <p className="mb-2 text-xs font-medium text-white/70">Not (yalnızca sen görürsün)</p>
          <div className="flex gap-2">
            <input value={notes} maxLength={200} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
            <button disabled={busy} onClick={() => update({ notes }, 'Not kaydedildi')} className={smallBtn}>Kaydet</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button disabled={busy || user.usedToday === 0} onClick={() => update({ resetToday: true }, 'Bugünkü kullanım sıfırlandı')} className={smallBtn}>
          Bugünü sıfırla
        </button>
        <button disabled={busy} onClick={() => update({ isActive: !user.isActive }, user.isActive ? 'Hesap donduruldu' : 'Hesap aktif edildi')} className={smallBtn}>
          {user.isActive ? 'Hesabı dondur' : 'Hesabı aktif et'}
        </button>
        <a href={`mailto:${user.username}`} className={smallBtn}>E-posta yaz</a>
        {msg && <span className="text-xs text-emerald-400">{msg}</span>}
      </div>

      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-3">
        <p className="text-xs font-medium text-red-400">Kalıcı silme</p>
        <p className="mt-1 text-[11px] text-white/55">Hesap, kullanım, bonus, kayıtlı cevaplar ve yolculuklar silinir; geri alınamaz. Onaylamak için e-postayı yaz.</p>
        <div className="mt-2 flex gap-2">
          <input value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder={user.username} className={inputCls} />
          <button
            disabled={busy || confirmDelete.trim().toLowerCase() !== user.username}
            onClick={remove}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-30"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateUser({ onDone, onError }: { onDone: () => Promise<void>; onError: (e: unknown) => void }) {
  const [f, setF] = useState({ username: '', name: '', password: '', dailyLimit: '5', notes: '' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await adminFetch('/api/v1/users', { method: 'POST', json: { ...f, username: f.username.trim(), dailyLimit: Number(f.dailyLimit) } });
      await onDone();
    } catch (e) { onError(e); } finally { setBusy(false); }
  };
  return (
    <Card title="Yeni üye (doğrulanmış olarak açılır)">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="E-posta" type="email" className={inputCls} />
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ad (isteğe bağlı)" className={inputCls} />
        <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Şifre (en az 8)" type="password" autoComplete="new-password" className={inputCls} />
        <input value={f.dailyLimit} onChange={(e) => setF({ ...f, dailyLimit: e.target.value })} placeholder="Günlük limit" type="number" className={inputCls} />
        <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Not" className={inputCls} />
      </div>
      <button disabled={busy} onClick={submit} className="btn-primary mt-3 !px-4 !py-2 text-sm">Oluştur</button>
    </Card>
  );
}
