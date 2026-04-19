/**
 * POST /api/v1/feedback
 *
 * Geri bildirimi Vercel KV'ye kaydeder.
 * KV yoksa (local dev) dosya sistemine yazar.
 *
 * Kayıt formatı:
 *   key: feedback:{timestamp}
 *   value: { name, email, message, createdAt, ip }
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface FeedbackEntry {
  name: string;
  email: string;
  message: string;
  createdAt: string;
  ip: string;
}

// -----------------------------------------------------------
// Validation
// -----------------------------------------------------------

function validateBody(body: unknown):
  | { ok: true; data: { name: string; email: string; message: string } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Geçersiz istek' };
  }
  const b = body as Record<string, unknown>;

  const name = typeof b['name'] === 'string' ? b['name'].trim() : '';
  const email = typeof b['email'] === 'string' ? b['email'].trim() : '';
  const message = typeof b['message'] === 'string' ? b['message'].trim() : '';

  if (name.length < 2) return { ok: false, error: 'Ad en az 2 karakter olmalı' };
  if (name.length > 100) return { ok: false, error: 'Ad çok uzun' };
  if (!email.includes('@') || email.length < 5) return { ok: false, error: 'Geçerli bir e-posta girin' };
  if (email.length > 200) return { ok: false, error: 'E-posta çok uzun' };
  if (message.length < 10) return { ok: false, error: 'Mesaj en az 10 karakter olmalı' };
  if (message.length > 5000) return { ok: false, error: 'Mesaj çok uzun (max 5000)' };

  return { ok: true, data: { name, email, message } };
}

// -----------------------------------------------------------
// Storage
// -----------------------------------------------------------

async function saveFeedback(entry: FeedbackEntry): Promise<void> {
  const key = `feedback:${Date.now()}`;

  // KV varsa oraya kaydet
  if (process.env['KV_REST_API_URL']) {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, JSON.stringify(entry));
    // TTL koymuyoruz — geri bildirimler kalıcı
    return;
  }

  // KV yoksa (local dev) console'a logla
  console.log('[Feedback]', key, JSON.stringify(entry, null, 2));
}

// -----------------------------------------------------------
// Route Handler
// -----------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Geçersiz JSON' } },
      { status: 400 },
    );
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: validation.error } },
      { status: 400 },
    );
  }

  const { name, email, message } = validation.data;

  // IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';

  const entry: FeedbackEntry = {
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
    ip,
  };

  try {
    await saveFeedback(entry);
  } catch (err) {
    console.error('[Feedback] Kayıt hatası:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Geri bildirim kaydedilemedi' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

// -----------------------------------------------------------
// GET — Admin panel için tüm feedbackleri listele
// -----------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  // Basit admin koruması: URL'de ?key=ADMIN_SECRET gerekli
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('key');
  const expectedKey = process.env['ADMIN_SECRET'] ?? '121017';

  if (adminKey !== expectedKey) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Yetkisiz erişim' } },
      { status: 401 },
    );
  }

  if (!process.env['KV_REST_API_URL']) {
    return NextResponse.json({
      feedbacks: [],
      note: 'Vercel KV yapılandırılmamış. Local dev\'de feedbackler console\'a loglanır.',
    });
  }

  try {
    const { kv } = await import('@vercel/kv');
    const keys = await kv.keys('feedback:*');

    const feedbacks: Array<FeedbackEntry & { id: string }> = [];
    for (const key of keys) {
      const raw = await kv.get(key);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        feedbacks.push({ ...parsed as FeedbackEntry, id: key as string });
      }
    }

    // En yeniden eskiye sırala
    feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ feedbacks, total: feedbacks.length });
  } catch (err) {
    console.error('[Feedback] Listeleme hatası:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Feedbackler yüklenemedi' } },
      { status: 500 },
    );
  }
}
