'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

interface User {
  username: string;
  password: string;
  questionLimit: number;
  questionsUsed: number;
  isActive: boolean;
  createdAt: string;
  lastSeen: string | null;
  notes: string;
}

interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminPage() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'users' | 'fb'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [fbs, setFbs] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [nu, setNu] = useState({ username: '', password: '', limit: '10', notes: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/check').then(r => { if (r.ok) { setAuthed(true); load(); } }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [u, f] = await Promise.all([
        fetch('/api/v1/users?key=121017').then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/v1/feedback?key=121017').then(r => r.json()).catch(() => ({ feedbacks: [] })),
      ]);
      setUsers(u.users ?? []);
      setFbs(f.feedbacks ?? []);
    } catch {} finally { setLoading(false); }
  }

  async function login() {
    if (!pw.trim()) return;
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw.trim() }) });
      if (!r.ok) { const d = await r.json(); setErr(d.error ?? 'Hata'); return; }
      setAuthed(true); load();
    } catch { setErr('Bağlantı hatası'); } finally { setLoading(false); }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setAuthed(false); setPw(''); setUsers([]); setFbs([]);
  }

  async function create() {
    setMsg('');
    try {
      const r = await fetch('/api/v1/users?key=121017', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', username: nu.username.trim(), password: nu.password.trim(), questionLimit: Number(nu.limit) || 10, notes: nu.notes.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error ?? 'Hata'); return; }
      setMsg('Oluşturuldu'); setNu({ username: '', password: '', limit: '10', notes: '' }); load();
    } catch { setMsg('Bağlantı hatası'); }
  }

  async function toggle(u: User) {
    await fetch('/api/v1/users?key=121017', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u.username, isActive: !u.isActive }) });
    load();
  }

  async function reset(u: User) {
    await fetch('/api/v1/users?key=121017', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u.username, questionsUsed: 0 }) });
    load();
  }

  async function remove(username: string) {
    if (!confirm(`"${username}" silinecek?`)) return;
    await fetch(`/api/v1/users?key=121017&username=${encodeURIComponent(username)}`, { method: 'DELETE' });
    load();
  }

  const fmt = (s: string | null) => {
    if (!s) return '\u2014';
    try { return new Intl.DateTimeFormat('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s)); } catch { return s; }
  };

  if (checking) return <div className="min-h-dvh flex items-center justify-center"><Logo /></div>;

  if (!authed) return (
    <div className="min-h-dvh flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Logo />
        <h1 className="font-display text-2xl">Admin Panel</h1>
        <div className="space-y-3">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Admin şifresi" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 text-center placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" autoFocus />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button onClick={login} disabled={loading} className="w-full py-3 rounded-xl bg-brand-500 text-[#070b14] text-sm font-medium">{loading ? '...' : 'Giriş'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/85 backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo /></Link>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-medium uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} disabled={loading} className="text-xs text-white/35 hover:text-white/60">{loading ? '...' : 'Yenile'}</button>
            <button onClick={logout} className="text-xs text-white/20 hover:text-white/40">Çıkış</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-5 py-6 space-y-6">
        <div className="flex gap-1 bg-white/[0.02] rounded-xl p-1 border border-white/[0.04] w-fit">
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-xs font-medium ${tab === 'users' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35'}`}>Kullanıcılar ({users.length})</button>
          <button onClick={() => setTab('fb')} className={`px-4 py-2 rounded-lg text-xs font-medium ${tab === 'fb' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35'}`}>Geri bildirimler ({fbs.length})</button>
        </div>

        {tab === 'users' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
              <h2 className="font-display text-lg">Yeni kullanıcı</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input value={nu.username} onChange={e => setNu({ ...nu, username: e.target.value })} placeholder="Kullanıcı adı" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} placeholder="Şifre" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={nu.limit} onChange={e => setNu({ ...nu, limit: e.target.value })} placeholder="Limit" type="number" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={nu.notes} onChange={e => setNu({ ...nu, notes: e.target.value })} placeholder="Not" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={create} className="px-4 py-2 rounded-lg bg-brand-500 text-[#070b14] text-xs font-medium">Oluştur</button>
                {msg && <span className="text-xs text-amber-400">{msg}</span>}
              </div>
            </div>

            {users.length === 0 ? <p className="text-center text-white/25 text-sm py-10">Henüz kullanıcı yok.</p> : (
              <div className="space-y-2">{users.map(u => (
                <div key={u.username} className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${u.isActive ? 'border-white/[0.06] bg-white/[0.02]' : 'border-red-500/15 bg-red-500/[0.02]'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white/80 text-sm">{u.username}</span>
                      <span className="text-[10px] text-white/25 font-mono">pw: {u.password}</span>
                      {!u.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Pasif</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30">
                      <span>{u.questionsUsed}/{u.questionLimit}</span>
                      <span>Son: {fmt(u.lastSeen)}</span>
                      {u.notes && <span className="text-amber-400/50">{u.notes}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => reset(u)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40">Sıfırla</button>
                    <button onClick={() => toggle(u)} className={`text-[10px] px-2.5 py-1.5 rounded-lg border ${u.isActive ? 'bg-amber-500/8 border-amber-500/20 text-amber-400' : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'}`}>{u.isActive ? 'Dondur' : 'Aktif et'}</button>
                    <button onClick={() => remove(u.username)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400">Sil</button>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'fb' && (
          <div className="space-y-3">
            {fbs.length === 0 ? <p className="text-center text-white/25 text-sm py-10">Henüz geri bildirim yok.</p> : fbs.map(f => (
              <div key={f.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex justify-between">
                  <div><span className="text-sm text-white/70 font-medium">{f.name}</span><span className="text-xs text-brand-400 ml-2">{f.email}</span></div>
                  <span className="text-[10px] text-white/25">{fmt(f.createdAt)}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed whitespace-pre-wrap">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
