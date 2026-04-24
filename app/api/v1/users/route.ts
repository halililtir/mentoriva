import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

/* ---- Types ---- */
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

/* ---- Memory fallback ---- */
const mem: Record<string, BetaUser> = {};

/* ---- Helpers ---- */
async function get(username: string): Promise<BetaUser | null> {
  const kv = getKV();
  if (kv) {
    const raw = await kv.get(`user:${username}`);
    if (!raw) return null;
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as BetaUser;
  }
  return mem[username] ?? null;
}

async function set(username: string, user: BetaUser) {
  const kv = getKV();
  if (kv) {
    await kv.set(`user:${username}`, JSON.stringify(user));
  } else {
    mem[username] = user;
  }
}

async function del(username: string) {
  const kv = getKV();
  if (kv) {
    await kv.del(`user:${username}`);
  } else {
    delete mem[username];
  }
}

async function list(): Promise<BetaUser[]> {
  const kv = getKV();
  if (kv) {
    const keys: string[] = await kv.keys('user:*');
    const out: BetaUser[] = [];
    for (const k of keys) {
      const raw = await kv.get(k);
      if (raw) out.push((typeof raw === 'string' ? JSON.parse(raw) : raw) as BetaUser);
    }
    return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  return Object.values(mem).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function isAdmin(req: Request) {
  const key = new URL(req.url).searchParams.get('key') ?? '';
  return key === '121017' || key === (process.env['ADMIN_SECRET'] || '121017').trim();
}

/* ---- POST ---- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === 'login') {
      const u = String(body.username ?? '').trim().toLowerCase();
      const p = String(body.password ?? '').trim();
      if (!u || !p) return NextResponse.json({ error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 });
      const user = await get(u);
      if (!user || user.password !== p) return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
      if (!user.isActive) return NextResponse.json({ error: 'Hesap pasif' }, { status: 403 });
      user.lastSeen = new Date().toISOString();
      await set(u, user);
      return NextResponse.json({ success: true, user: { username: u, questionLimit: user.questionLimit, questionsUsed: user.questionsUsed, remaining: Math.max(0, user.questionLimit - user.questionsUsed) } });
    }

    if (action === 'use_token') {
      const u = String(body.username ?? '').trim().toLowerCase();
      const user = await get(u);
      if (!user || !user.isActive) return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 401 });
      if (user.questionsUsed >= user.questionLimit) return NextResponse.json({ error: 'limit_reached', remaining: 0 }, { status: 429 });
      user.questionsUsed++;
      user.lastSeen = new Date().toISOString();
      await set(u, user);
      return NextResponse.json({ success: true, questionsUsed: user.questionsUsed, remaining: Math.max(0, user.questionLimit - user.questionsUsed) });
    }

    if (action === 'create') {
      if (!isAdmin(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
      const u = String(body.username ?? '').trim().toLowerCase();
      const p = String(body.password ?? '').trim();
      if (u.length < 2) return NextResponse.json({ error: 'Kullanıcı adı en az 2 karakter' }, { status: 400 });
      if (p.length < 3) return NextResponse.json({ error: 'Şifre en az 3 karakter' }, { status: 400 });
      if (await get(u)) return NextResponse.json({ error: 'Bu kullanıcı zaten var' }, { status: 409 });
      const nu: BetaUser = { username: u, password: p, questionLimit: Number(body.questionLimit) || 10, questionsUsed: 0, isActive: true, createdAt: new Date().toISOString(), lastSeen: null, notes: String(body.notes ?? '') };
      await set(u, nu);
      return NextResponse.json({ success: true, user: nu });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (e) {
    console.error('[Users POST]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/* ---- GET ---- */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  try {
    const users = await list();
    return NextResponse.json({ users, total: users.length });
  } catch (e) {
    console.error('[Users GET]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/* ---- PUT ---- */
export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  try {
    const body = await req.json();
    const u = String(body.username ?? '').trim().toLowerCase();
    const user = await get(u);
    if (!user) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    if ('password' in body) user.password = String(body.password);
    if ('questionLimit' in body) user.questionLimit = Number(body.questionLimit);
    if ('questionsUsed' in body) user.questionsUsed = Number(body.questionsUsed);
    if ('isActive' in body) user.isActive = Boolean(body.isActive);
    if ('notes' in body) user.notes = String(body.notes);
    await set(u, user);
    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error('[Users PUT]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/* ---- DELETE ---- */
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  const username = new URL(req.url).searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username gerekli' }, { status: 400 });
  try {
    await del(username.toLowerCase());
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[Users DELETE]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
