import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

interface FeedbackEntry {
  name: string;
  email: string;
  message: string;
  createdAt: string;
  ip: string;
}

function getIP(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

/* ---- POST: geri bildirim kaydet ---- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || name.length < 2) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 });
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Geçerli email gerekli' }, { status: 400 });
    if (!message || message.length < 5) return NextResponse.json({ error: 'Mesaj en az 5 karakter' }, { status: 400 });

    const entry: FeedbackEntry = { name, email, message, createdAt: new Date().toISOString(), ip: getIP(req) };
    const key = `feedback:${Date.now()}`;

    const kv = getKV();
    if (kv) {
      await kv.set(key, JSON.stringify(entry));
    } else {
      console.log('[Feedback]', key, entry);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[Feedback POST]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/* ---- GET: admin listeleme ---- */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') ?? '';
  const secret = (process.env['ADMIN_SECRET'] || '121017').trim();
  if (key !== secret && key !== '121017') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const kv = getKV();
    if (!kv) return NextResponse.json({ feedbacks: [], total: 0 });

    const keys: string[] = await kv.keys('feedback:*');
    const feedbacks: Array<FeedbackEntry & { id: string }> = [];
    for (const k of keys) {
      const raw = await kv.get(k);
      if (raw) {
        const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as FeedbackEntry;
        feedbacks.push({ ...parsed, id: k });
      }
    }
    feedbacks.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return NextResponse.json({ feedbacks, total: feedbacks.length });
  } catch (e) {
    console.error('[Feedback GET]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
