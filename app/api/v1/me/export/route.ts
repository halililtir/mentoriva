/**
 * GET /api/v1/me/export — kullanıcının hesabında tutulan her şeyi tek JSON
 * dosyası olarak indirir: profil, onaylı notlar, farkındalık kartları,
 * kayıtlı sohbetler, yolculuk haritaları, küçük adım ve işaretler.
 * Şifre özeti, yönetici notu ve davet edenin e-postası dahil edilmez.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/features';
import { getMemory } from '@/lib/memory/notes';
import { listCards } from '@/lib/studies/cards';
import { getChat, listChats } from '@/lib/chats';
import { getStep, listJourneys } from '@/lib/journey/store';
import { getBadges } from '@/lib/badges';
import { getReminder } from '@/lib/reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  if (!(await hit('export', user.username, RATE_LIMITS.EXPORT_USER))) return jsonError(429, 'Biraz sonra tekrar dene.');

  const u = user.username;
  const [memory, cards, chatList, journeys, step, badges, reminder] = await Promise.all([
    getMemory(u), listCards(u), listChats(u), listJourneys(u), getStep(u), getBadges(u), getReminder(u),
  ]);
  const chats = (await Promise.all(chatList.map((c) => getChat(u, c.id)))).filter(Boolean);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name ?? null,
      email: user.email ?? u,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      questionsUsed: user.questionsUsed ?? 0,
      referralCode: user.referralCode ?? null,
      consent: user.consent ?? null,
    },
    memory,
    cards,
    chats,
    journeys,
    step,
    reminder,
    badges,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mentoriva-verilerim-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
