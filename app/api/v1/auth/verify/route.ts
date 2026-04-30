import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email ve doğrulama kodu gerekli' }, { status: 400 });
    }

    const kv = getKV();
    if (!kv) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 });
    }

    // Geçici kayıt verisini oku
    const raw = await kv.get(`verify:${email}`);
    if (!raw) {
      return NextResponse.json({ error: 'Doğrulama kodu süresi dolmuş veya geçersiz. Tekrar kayıt olun.' }, { status: 400 });
    }

    const pending = (typeof raw === 'string' ? JSON.parse(raw) : raw) as {
      email: string; password: string; name: string; code: string;
    };

    // Kodu kontrol et
    if (pending.code !== code) {
      return NextResponse.json({ error: 'Doğrulama kodu hatalı' }, { status: 400 });
    }

    // Hesap zaten var mı
    const existing = await kv.get(`user:${email}`);
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 });
    }

    // Kullanıcı oluştur
    const newUser = {
      username: email,
      password: pending.password,
      name: pending.name,
      email: email,
      questionLimit: 5,
      questionsUsed: 0,
      dailyLimit: 5,
      dailyUsed: 0,
      dailyResetDate: new Date().toISOString().slice(0, 10),
      isActive: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastSeen: null,
      notes: 'mail ile kayıt',
    };

    await kv.set(`user:${email}`, JSON.stringify(newUser));

    // Geçici veriyi sil
    await kv.del(`verify:${email}`);

    // Session cookie set et
    const res = NextResponse.json({
      success: true,
      user: {
        username: email,
        name: pending.name,
        questionLimit: newUser.dailyLimit,
        questionsUsed: 0,
        remaining: newUser.dailyLimit,
      },
    });

    return res;
  } catch (e) {
    console.error('[Auth Verify]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
