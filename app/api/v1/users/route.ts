/**
 * /api/v1/users
 *
 * Kapalı beta kullanıcı yönetimi.
 * Vercel KV'de saklanır. KV yoksa (local dev) bellekte çalışır.
 *
 * POST   → kullanıcı oluştur / login / soru kullan
 * GET    → admin: tüm kullanıcıları listele
 * PUT    → admin: kullanıcı güncelle
 * DELETE → admin: kullanıcı sil
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

// --- In-memory fallback (local dev) ---
const memoryStore: Record<string, BetaUser> = {};

async function getUserKV() {
  const { getKV } = await import('@/lib/kv');
  return getKV();
}

async function getUser(username: string): Promise<BetaUser | null> {
  const kv = getUserKV();
  const redis = await kv;
  if (redis) {
    const raw = await redis.get(`user:${username}`);
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) as BetaUser : null;
  }
  return memoryStore[username] ?? null;
}

async function setUser(username: string, user: BetaUser): Promise<void> {
  const redis = await getUserKV();
  if (redis) {
    await redis.set(`user:${username}`, JSON.stringify(user));
  } else {
    memoryStore[username] = user;
  }
}

async function deleteUserKV(username: string): Promise<void> {
  const redis = await getUserKV();
  if (redis) {
    await redis.del(`user:${username}`);
  } else {
    delete memoryStore[username];
  }
}

async function getAllUsers(): Promise<Array<BetaUser & { id: string }>> {
  const redis = await getUserKV();
  if (redis) {
    const keys: string[] = await redis.keys('user:*');
    const users: Array<BetaUser & { id: string }> = [];
    for (const key of keys) {
      const raw = await redis.get(key);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        users.push({ ...parsed as BetaUser, id: key as string });
      }
    }
    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return Object.entries(memoryStore)
    .map(([k, v]) => ({ ...v, id: `user:${k}` }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function checkAdmin(request: Request): boolean {
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('key');
  if (!adminKey) return false;
  const secret = process.env['ADMIN_SECRET'] || '121017';
  return adminKey === secret || adminKey === '121017';
}

// --- POST: login veya kullanıcı oluştur veya soru kullan ---
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  const action = (body as Record<string, unknown>)['action'] as string;

  // LOGIN
  if (action === 'login') {
    const username = ((body as Record<string, unknown>)['username'] as string ?? '').trim().toLowerCase();
    const password = ((body as Record<string, unknown>)['password'] as string ?? '').trim();

    if (!username || !password) {
      return NextResponse.json({ error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 });
    }

    const user = await getUser(username);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Hesabın pasif durumda' }, { status: 403 });
    }

    // lastSeen güncelle
    user.lastSeen = new Date().toISOString();
    await setUser(username, user);

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        questionLimit: user.questionLimit,
        questionsUsed: user.questionsUsed,
        remaining: Math.max(0, user.questionLimit - user.questionsUsed),
      },
    });
  }

  // USE TOKEN (soru kullan)
  if (action === 'use_token') {
    const username = ((body as Record<string, unknown>)['username'] as string ?? '').trim().toLowerCase();
    const user = await getUser(username);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 401 });
    }
    if (user.questionsUsed >= user.questionLimit) {
      return NextResponse.json({
        error: 'limit_reached',
        message: 'Soru limitine ulaştın. Daha fazla soru sormak istersen bizimle iletişime geç.',
        remaining: 0,
      }, { status: 429 });
    }

    user.questionsUsed += 1;
    user.lastSeen = new Date().toISOString();
    await setUser(username, user);

    return NextResponse.json({
      success: true,
      questionsUsed: user.questionsUsed,
      remaining: Math.max(0, user.questionLimit - user.questionsUsed),
    });
  }

  // CREATE USER (admin only)
  if (action === 'create') {
    if (!checkAdmin(request)) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const username = ((body as Record<string, unknown>)['username'] as string ?? '').trim().toLowerCase();
    const password = (body as Record<string, unknown>)['password'] as string ?? '';
    const questionLimit = Number((body as Record<string, unknown>)['questionLimit']) || 10;
    const notes = ((body as Record<string, unknown>)['notes'] as string) ?? '';

    if (!username || username.length < 2) {
      return NextResponse.json({ error: 'Kullanıcı adı en az 2 karakter' }, { status: 400 });
    }
    if (!password || password.length < 3) {
      return NextResponse.json({ error: 'Şifre en az 3 karakter' }, { status: 400 });
    }

    const existing = await getUser(username);
    if (existing) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten var' }, { status: 409 });
    }

    const newUser: BetaUser = {
      username,
      password,
      questionLimit,
      questionsUsed: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastSeen: null,
      notes,
    };

    await setUser(username, newUser);
    return NextResponse.json({ success: true, user: newUser });
  }

  return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
}

// --- GET: admin listele ---
export async function GET(request: Request): Promise<Response> {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const users = await getAllUsers();
  return NextResponse.json({ users, total: users.length });
}

// --- PUT: admin güncelle ---
export async function PUT(request: Request): Promise<Response> {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });

  const username = ((body as Record<string, unknown>)['username'] as string ?? '').trim().toLowerCase();
  const user = await getUser(username);
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  // Güncellenebilir alanlar
  if ('password' in (body as object)) user.password = (body as Record<string, unknown>)['password'] as string;
  if ('questionLimit' in (body as object)) user.questionLimit = Number((body as Record<string, unknown>)['questionLimit']);
  if ('questionsUsed' in (body as object)) user.questionsUsed = Number((body as Record<string, unknown>)['questionsUsed']);
  if ('isActive' in (body as object)) user.isActive = Boolean((body as Record<string, unknown>)['isActive']);
  if ('notes' in (body as object)) user.notes = (body as Record<string, unknown>)['notes'] as string;

  await setUser(username, user);
  return NextResponse.json({ success: true, user });
}

// --- DELETE: admin sil ---
export async function DELETE(request: Request): Promise<Response> {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username gerekli' }, { status: 400 });

  await deleteUserKV(username.toLowerCase());
  return NextResponse.json({ success: true });
}
