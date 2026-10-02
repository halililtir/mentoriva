import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { getClientIp, isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { hit, RATE_LIMITS } from '@/lib/rate-limit';
import { INPUT_LIMITS } from '@/lib/features';
import { isAdmin } from '@/lib/auth/session';
import { newToken } from '@/lib/auth/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FeedbackEntry {
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

/* ---- POST: geri bildirim kaydet ---- */
export async function POST(req: Request) {
  if (!(await hit('feedback', getClientIp(req), RATE_LIMITS.FEEDBACK_IP))) {
    return jsonError(429, 'Çok fazla mesaj gönderdin. Biraz sonra tekrar dene.');
  }

  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const name = str(body['name'], 80);
  const email = normalizeEmail(body['email']);
  const message = str(body['message'], INPUT_LIMITS.MAX_FEEDBACK_LENGTH);

  if (name.length < 2) return jsonError(400, 'İsim gerekli');
  if (!isValidEmail(email)) return jsonError(400, 'Geçerli bir e-posta gir');
  if (message.length < 5) return jsonError(400, 'Mesaj en az 5 karakter olmalı');

  const entry: FeedbackEntry = { name, email, message, createdAt: new Date().toISOString() };
  // Aynı milisaniyede gelen iki mesaj birbirini ezmesin
  await getKV().set(`feedback:${Date.now()}:${newToken().slice(0, 6)}`, entry);

  return NextResponse.json({ success: true });
}

/* ---- GET: admin listeleme ---- */
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');

  const kv = getKV();
  const keys = await kv.keys('feedback:*');
  const entries = await Promise.all(keys.map((k) => kv.get<FeedbackEntry | string>(k)));
  const feedbacks = entries
    .map((raw, i) => {
      if (!raw) return null;
      const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as FeedbackEntry;
      return { ...parsed, id: keys[i]! };
    })
    .filter((f): f is FeedbackEntry & { id: string } => f !== null)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return NextResponse.json({ feedbacks, total: feedbacks.length });
}
