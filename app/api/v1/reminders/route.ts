/**
 * Adım hatırlatması (yalnızca kişi isterse, tek e-posta).
 *   GET              → { reminder | null }
 *   POST { days }    → { reminder }   (3 ya da 7 gün; bekleyen adım gerekir)
 *   DELETE           → { success }
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { recordEvent } from '@/lib/admin/metrics';
import { REMINDER_DAYS, cancelReminder, getReminder, setReminder, type ReminderDays } from '@/lib/reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ reminder: await getReminder(user.username) });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const body = await readJson(req);
  const days = body?.['days'];
  if (!REMINDER_DAYS.includes(days as ReminderDays)) return jsonError(400, 'Geçersiz süre');
  const reminder = await setReminder(user.username, days as ReminderDays);
  if (!reminder) return jsonError(400, 'Hatırlatma için önce bir adım seçmelisin.');
  await recordEvent('reminder_set');
  return NextResponse.json({ reminder });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  await cancelReminder(user.username);
  return NextResponse.json({ success: true });
}
