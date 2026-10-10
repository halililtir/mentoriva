/**
 * Çalışma kartları — yalnızca kullanıcı "Kaydet" dediğinde.
 *   GET            → { cards }
 *   POST   { kind: 'feelings', card } → { card }
 *   DELETE ?id=    → { success }
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { recordEvent } from '@/lib/admin/metrics';
import { deleteCard, listCards, sanitizeCard, saveCard } from '@/lib/studies/cards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  return NextResponse.json({ cards: await listCards(user.username) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Kartını kaydetmek için giriş yapmalısın');
  const body = await readJson(req);
  const kind = body?.['kind'];
  if (kind !== 'feelings' && kind !== 'study') return jsonError(400, 'Geçersiz kart türü');
  const fields = sanitizeCard(body?.['card']);
  if (!fields) return jsonError(400, 'Kart boş görünüyor');
  const card = await saveCard(user.username, kind, fields);
  await recordEvent(kind === 'study' ? 'study_card' : 'feelings_card');
  return NextResponse.json({ card });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[0-9a-f]{12}$/.test(id)) return jsonError(400, 'Geçersiz kimlik');
  return (await deleteCard(user.username, id)) ? NextResponse.json({ success: true }) : jsonError(404, 'Kart bulunamadı');
}
