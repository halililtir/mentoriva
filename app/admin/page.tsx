'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

interface User {
  username: string;
  password: string;
  questionLimit: number;
  questionsUsed: number;
  dailyLimit?: number;
  dailyUsed?: number;
  isActive: boolean;
  createdAt: string;
  lastSeen: string | null;
  notes: string;
  name?: string;
  email?: string;
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
  const [tab, setTab] = useState<'users' | 'fb' | 'stats'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [fbs, setFbs] = useState<Feedback[]>([]);
  const [mentorStats, setMentorStats] = useState<Record<string, number>>({});
  const [recentQuestions, setRecentQuestions] = useState<Array<{q: string; mentors: string[]; user: string; at: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [nu, setNu] = useState({ username: '', password: '', limit: '5', notes: '' });
  const [msg, setMsg] = useState('');
  const [tokenUser, setTokenUser] = useState('');
  const [tokenAmount, setTokenAmount] = useState('10');
  const [tokenMsg, setTokenMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/check').then(r => { if (r.ok) { setAuthed(true); load(); } }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [u, f, s] = await Promise.all([
        fetch('/api/v1/users?key=121017').then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/v1/feedback?key=121017').then(r => r.json()).catch(() => ({ feedbacks: [] })),
        fetch('/api/v1/stats?key=121017').then(r => r.json()).catch(() => ({ mentorStats: {}, recentQuestions: [] })),
      ]);
      setUsers(u.users ?? []);
      setFbs(f.feedbacks ?? []);
      setMentorStats(s.mentorStats ?? {});
      setRecentQuestions(s.recentQuestions ?? []);
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
        body: JSON.stringify({ action: 'create', username: nu.username.trim(), password: nu.password.trim(), questionLimit: Number(nu.limit) || 5, notes: nu.notes.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error ?? 'Hata'); return; }
      setMsg('Oluşturuldu'); setNu({ username: '', password: '', limit: '5', notes: '' }); load();
    } catch { setMsg('Bağlantı hatası'); }
  }

  async function giveTokens() {
    setTokenMsg('');
    if (!tokenUser.trim()) { setTokenMsg('Kullanıcı seçin'); return; }
    try {
      const r = await fetch('/api/v1/users?key=121017', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tokenUser.trim().toLowerCase(), dailyLimit: Number(tokenAmount) || 10, dailyUsed: 0, dailyResetDate: new Date().toISOString().slice(0, 10) }),
      });
      if (!r.ok) { setTokenMsg('Hata oluştu'); return; }
      setTokenMsg(`${tokenUser} için günlük ${tokenAmount} hak tanımlandı`);
      setTokenUser(''); setTokenAmount('10'); load();
    } catch { setTokenMsg('Bağlantı hatası'); }
  }

  async function toggle(u: User) {
    await fetch('/api/v1/users?key=121017', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u.username, isActive: !u.isActive }) });
    load();
  }

  async function resetDaily(u: User) {
    await fetch('/api/v1/users?key=121017', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u.username, dailyUsed: 0, dailyResetDate: new Date().toISOString().slice(0, 10) }) });
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

  // İstatistikler
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const totalQuestions = users.reduce((sum, u) => sum + (u.questionsUsed || 0), 0);
  const todayActive = users.filter(u => u.lastSeen && u.lastSeen.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const avgQuestions = totalUsers > 0 ? (totalQuestions / totalUsers).toFixed(1) : '0';

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
        {/* Sekmeler */}
        <div className="flex gap-1 bg-white/[0.02] rounded-xl p-1 border border-white/[0.04] w-fit">
          <button onClick={() => setTab('stats')} className={`px-4 py-2 rounded-lg text-xs font-medium ${tab === 'stats' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35'}`}>Özet</button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-xs font-medium ${tab === 'users' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35'}`}>Kullanıcılar ({users.length})</button>
          <button onClick={() => setTab('fb')} className={`px-4 py-2 rounded-lg text-xs font-medium ${tab === 'fb' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35'}`}>Geri bildirimler ({fbs.length})</button>
        </div>

        {/* ÖZET */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* Sayılar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Toplam Üye', value: totalUsers, color: 'text-brand-400' },
                { label: 'Aktif Üye', value: activeUsers, color: 'text-emerald-400' },
                { label: 'Bugün Aktif', value: todayActive, color: 'text-amber-400' },
                { label: 'Toplam Soru', value: totalQuestions, color: 'text-purple-400' },
                { label: 'Ort. Soru/Üye', value: avgQuestions, color: 'text-cyan-400' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-white/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Mentor Popülerlik */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
              <h2 className="font-display text-lg">Mentor Popülerliği</h2>
              <div className="space-y-3">
                {(() => {
                  const totalMentorQ = Object.values(mentorStats).reduce((a, b) => a + b, 0) || 1;
                  const mentorNames: Record<string, {name: string; color: string}> = {
                    jung: { name: 'Carl Gustav Jung', color: '#00bcd4' },
                    nietzsche: { name: 'Friedrich Nietzsche', color: '#f59e0b' },
                    mevlana: { name: 'Mevlânâ Rûmî', color: '#d4a574' },
                    marcus: { name: 'Marcus Aurelius', color: '#8b9bb4' },
                  };
                  return Object.entries(mentorStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([id, count]) => {
                      const pct = Math.round((count / totalMentorQ) * 100);
                      const info = mentorNames[id] || { name: id, color: '#666' };
                      return (
                        <div key={id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span style={{ color: info.color }}>{info.name}</span>
                            <span className="text-white/40">{count} soru ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                          </div>
                        </div>
                      );
                    });
                })()}
                {Object.keys(mentorStats).length === 0 && <p className="text-white/25 text-sm">Henüz veri yok.</p>}
              </div>
            </div>

            {/* Son Sorulan Sorular */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
              <h2 className="font-display text-lg">Son Sorulan Sorular</h2>
              {recentQuestions.length === 0 ? (
                <p className="text-white/25 text-sm">Henüz soru sorulmadı.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 leading-relaxed">{q.q}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/25">
                          <span>{q.mentors?.join(', ')}</span>
                          <span>·</span>
                          <span>{q.user === 'anon' ? 'anonim' : q.user.length > 20 ? q.user.slice(0, 20) + '...' : q.user}</span>
                          <span>·</span>
                          <span>{fmt(q.at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Token ver */}
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-5 space-y-4">
              <h2 className="font-display text-lg text-amber-400">Token Ver</h2>
              <p className="text-xs text-white/30">Seçtiğin kullanıcıya özel günlük soru hakkı tanımla</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={tokenUser}
                  onChange={e => setTokenUser(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 focus:outline-none focus:border-amber-500/40"
                >
                  <option value="">Kullanıcı seç</option>
                  {users.map(u => (
                    <option key={u.username} value={u.username}>{u.username} ({u.name || '-'})</option>
                  ))}
                </select>
                <input
                  value={tokenAmount}
                  onChange={e => setTokenAmount(e.target.value)}
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Günlük hak"
                  className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 text-center focus:outline-none focus:border-amber-500/40"
                />
                <button onClick={giveTokens} className="px-4 py-2.5 rounded-lg bg-amber-500 text-[#070b14] text-xs font-medium hover:bg-amber-400 transition-colors">
                  Tanımla
                </button>
              </div>
              {tokenMsg && <p className="text-xs text-amber-400">{tokenMsg}</p>}
            </div>
          </div>
        )}

        {/* KULLANICILAR */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
              <h2 className="font-display text-lg">Yeni kullanıcı</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input value={nu.username} onChange={e => setNu({ ...nu, username: e.target.value })} placeholder="Kullanıcı adı / email" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} placeholder="Şifre" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={nu.limit} onChange={e => setNu({ ...nu, limit: e.target.value })} placeholder="Günlük limit" type="number" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white/80 text-sm">{u.username}</span>
                      {u.name && <span className="text-[10px] text-white/30">({u.name})</span>}
                      {!u.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Pasif</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30 flex-wrap">
                      <span>Günlük: <span className="text-white/50">{u.dailyUsed || 0}/{u.dailyLimit || u.questionLimit || 5}</span></span>
                      <span>Toplam: <span className="text-white/50">{u.questionsUsed || 0}</span></span>
                      <span>Son: {fmt(u.lastSeen)}</span>
                      <span>Kayıt: {fmt(u.createdAt)}</span>
                      {u.notes && <span className="text-amber-400/50">{u.notes}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => resetDaily(u)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70">Günlük Sıfırla</button>
                    <button onClick={() => toggle(u)} className={`text-[10px] px-2.5 py-1.5 rounded-lg border ${u.isActive ? 'bg-amber-500/8 border-amber-500/20 text-amber-400' : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'}`}>{u.isActive ? 'Dondur' : 'Aktif et'}</button>
                    <button onClick={() => remove(u.username)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400">Sil</button>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {/* GERİ BİLDİRİMLER */}
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
