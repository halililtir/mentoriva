import { NextResponse } from 'next/server';
import { getKV, getMany, scanKeys } from '@/lib/kv';
import { getClientIp, isValidEmail, jsonError, normalizeEmail, readJson, str } from '@/lib/http';
import { hit, RATE_LIMITS } from '@/lib/rate-limit';
import { INPUT_LIMITS } from '@/lib/features';
import { isAdmin } from '@/lib/auth/session';
import { newToken } from '@/lib/auth/tokens';
import { recordEvent } from '@/lib/admin/metrics';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FeedbackStatus = 'new' | 'read';

interface FeedbackEntry {
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status?: FeedbackStatus;
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

  const entry: FeedbackEntry = { name, email, message, createdAt: new Date().toISOString(), status: 'new' };
  // Aynı milisaniyede gelen iki mesaj birbirini ezmesin
  await getKV().set(`feedback:${Date.now()}:${newToken().slice(0, 6)}`, entry);
  await recordEvent('feedback');

  return NextResponse.json({ success: true });
}

/* ---- GET: admin listeleme ---- */
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');

  const keys = await scanKeys('feedback:*');
  const entries = await getMany<FeedbackEntry | string>(keys);
  const feedbacks = entries
    .map((raw, i) => {
      if (!raw) return null;
      try {
        const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as FeedbackEntry;
        return { ...parsed, status: parsed.status ?? 'new', id: keys[i]! };
      } catch {
        return null;
      }
    })
    .filter((f): f is FeedbackEntry & { id: string; status: FeedbackStatus } => f !== null)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return NextResponse.json({ feedbacks, total: feedbacks.length }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Admin'in gönderdiği kimliğin gerçekten bir geri bildirim anahtarı olduğunu doğrular. */
function feedbackId(value: unknown): string | null {
  return typeof value === 'string' && /^feedback:\d+:[A-Za-z0-9_-]+$/.test(value) ? value : null;
}

/* ---- PATCH: okundu / okunmadı ---- */
export async function PATCH(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const id = feedbackId(body?.['id']);
  const status = body?.['status'];
  if (!id || (status !== 'new' && status !== 'read')) return jsonError(400, 'Geçersiz istek');

  const kv = getKV();
  const raw = await kv.get<FeedbackEntry | string>(id);
  if (!raw) return jsonError(404, 'Bulunamadı');
  const entry = (typeof raw === 'string' ? JSON.parse(raw) : raw) as FeedbackEntry;
  await kv.set(id, { ...entry, status });
  return NextResponse.json({ success: true });
}

/* ---- DELETE: ?id=feedback:… ---- */
export async function DELETE(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const id = feedbackId(new URL(req.url).searchParams.get('id'));
  if (!id) return jsonError(400, 'Geçersiz istek');
  await getKV().del(id);
  await logAdminAction('Geri bildirim silindi', id);
  return NextResponse.json({ success: true });
}
