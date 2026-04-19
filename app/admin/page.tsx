'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

interface BetaUser {
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
  const [key, setKey] = useState('');
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<'users' | 'feedback'>('users');
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Yeni kullanıcı formu
  const [newUser, setNewUser] = useState({ username: '', password: '', questionLimit: '10', notes: '' });
  const [formMsg, setFormMsg] = useState('');

  const adminKey = () => `key=${encodeURIComponent(key)}`;

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, fRes] = await Promise.all([
        fetch(`/api/v1/users?${adminKey()}`),
        fetch(`/api/v1/feedback?${adminKey()}`),
      ]);
      if (!uRes.ok) throw new Error('Yanlış anahtar');
      const uData = await uRes.json();
      const fData = await fRes.json();
      setUsers(uData.users ?? []);
      setFeedbacks(fData.feedbacks ?? []);
      setAuth(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const [uRes, fRes] = await Promise.all([
        fetch(`/api/v1/users?${adminKey()}`),
        fetch(`/api/v1/feedback?${adminKey()}`),
      ]);
      if (uRes.ok) { const d = await uRes.json(); setUsers(d.users ?? []); }
      if (fRes.ok) { const d = await fRes.json(); setFeedbacks(d.feedbacks ?? []); }
    } finally { setLoading(false); }
  };

  const createUser = async () => {
    setFormMsg('');
    try {
      const res = await fetch(`/api/v1/users?${adminKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          username: newUser.username.trim(),
          password: newUser.password.trim(),
          questionLimit: Number(newUser.questionLimit) || 10,
          notes: newUser.notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormMsg(data.error ?? 'Hata'); return; }
      setFormMsg('Kullanıcı oluşturuldu');
      setNewUser({ username: '', password: '', questionLimit: '10', notes: '' });
      refresh();
    } catch { setFormMsg('Bağlantı hatası'); }
  };

  const toggleActive = async (u: BetaUser) => {
    await fetch(`/api/v1/users?${adminKey()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u.username, isActive: !u.isActive }),
    });
    refresh();
  };

  const resetQuestions = async (u: BetaUser) => {
    await fetch(`/api/v1/users?${adminKey()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u.username, questionsUsed: 0 }),
    });
    refresh();
  };

  const deleteUser = async (username: string) => {
    if (!confirm(`"${username}" silinecek. Emin misin?`)) return;
    await fetch(`/api/v1/users?${adminKey()}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
    refresh();
  };

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('tr-TR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso));
    } catch { return iso; }
  };

  if (!auth) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-5">
        <div className="w-full max-w-sm space-y-6 text-center">
          <Logo />
          <h1 className="font-display text-2xl">Admin Panel</h1>
          <div className="space-y-3">
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Admin anahtarı" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 text-center placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" autoFocus />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={login} disabled={loading} className="w-full py-3 rounded-xl bg-brand-500 text-[#070b14] text-sm font-medium">
              {loading ? 'Kontrol...' : 'Giriş'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/85 backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex"><Logo /></Link>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-medium uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={loading} className="text-xs text-white/35 hover:text-white/60 transition-colors">
              {loading ? '...' : 'Yenile'}
            </button>
            <button onClick={() => { setAuth(false); setKey(''); }} className="text-xs text-white/20 hover:text-white/40">Çıkış</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-5 py-6 space-y-6">
        {/* Sekmeler */}
        <div className="flex gap-1 bg-white/[0.02] rounded-xl p-1 border border-white/[0.04] w-fit">
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'users' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35 hover:text-white/60'}`}>
            Kullanıcılar ({users.length})
          </button>
          <button onClick={() => setTab('feedback')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'feedback' ? 'bg-brand-500/10 text-brand-400' : 'text-white/35 hover:text-white/60'}`}>
            Geri bildirimler ({feedbacks.length})
          </button>
        </div>

        {/* KULLANICILAR */}
        {tab === 'users' && (
          <div className="space-y-6">
            {/* Yeni kullanıcı formu */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
              <h2 className="font-display text-lg">Yeni kullanıcı ekle</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Kullanıcı adı" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Şifre" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={newUser.questionLimit} onChange={(e) => setNewUser({ ...newUser, questionLimit: e.target.value })}
                  placeholder="Limit" type="number" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
                <input value={newUser.notes} onChange={(e) => setNewUser({ ...newUser, notes: e.target.value })}
                  placeholder="Not (opsiyonel)" className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-brand-500/40" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={createUser} className="px-4 py-2 rounded-lg bg-brand-500 text-[#070b14] text-xs font-medium hover:bg-brand-400 transition-colors">Oluştur</button>
                {formMsg && <span className="text-xs text-amber-400">{formMsg}</span>}
              </div>
            </div>

            {/* Kullanıcı listesi */}
            {users.length === 0 ? (
              <p className="text-center text-white/25 text-sm py-10">Henüz kullanıcı yok.</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.username} className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${u.isActive ? 'border-white/[0.06] bg-white/[0.02]' : 'border-red-500/15 bg-red-500/[0.02]'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white/80 text-sm">{u.username}</span>
                        <span className="text-[10px] text-white/25 font-mono">şifre: {u.password}</span>
                        {!u.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Pasif</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30">
                        <span>Kullanım: <span className="text-white/50">{u.questionsUsed}/{u.questionLimit}</span></span>
                        <span>Son giriş: {fmt(u.lastSeen)}</span>
                        <span>Kayıt: {fmt(u.createdAt)}</span>
                        {u.notes && <span className="text-amber-400/50">{u.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => resetQuestions(u)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
                        Sıfırla
                      </button>
                      <button onClick={() => toggleActive(u)} className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors ${u.isActive ? 'bg-amber-500/8 border-amber-500/20 text-amber-400' : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'}`}>
                        {u.isActive ? 'Dondur' : 'Aktif et'}
                      </button>
                      <button onClick={() => deleteUser(u.username)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-colors">
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GERİ BİLDİRİMLER */}
        {tab === 'feedback' && (
          <div className="space-y-3">
            {feedbacks.length === 0 ? (
              <p className="text-center text-white/25 text-sm py-10">Henüz geri bildirim yok.</p>
            ) : (
              feedbacks.map((fb) => (
                <div key={fb.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-sm text-white/70 font-medium">{fb.name}</span>
                      <span className="text-xs text-brand-400 ml-2">{fb.email}</span>
                    </div>
                    <span className="text-[10px] text-white/25">{fmt(fb.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed whitespace-pre-wrap">{fb.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
