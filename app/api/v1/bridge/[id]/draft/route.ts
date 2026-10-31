/**
 * POST /api/v1/bridge/[id]/draft { text, instruction?, regen? } — yazanın ham
 * metnini karşı tarafın duyabileceği hâle getirir. Ham metin saklanmaz. Mesaj
 * başına 1 hak düşer; üretilemezse ya da güvenlik nedeniyle yeniden yazılmazsa
 * iade edilir. Aynı metnin ince ayarı `regen` izniyle ücretsizdir (en fazla
 * REGEN_MAX kez; sonrası yeni hak ister, metin değişirse izin geçmez).
 *   → { heard, text, kept, token, regen, remaining } | { safety: true, remaining } | { crisis }
 * `token`: gönderilecek metnin özetini taşıyan 30 dakikalık imzalı izin; böylece
 * yalnızca onaylanan öneri birebir gönderilebilir (elle değiştirilen metin geçmez).
 */

import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { jsonError, readJson } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { CRISIS_RESPONSE, RATE_LIMITS } from '@/lib/features';
import { moderateInput } from '@/lib/safety/moderation';
import { recordEvent } from '@/lib/admin/metrics';
import { logError } from '@/lib/admin/errors';
import { signJson, verifyJson } from '@/lib/signing';
import { getKV } from '@/lib/kv';
import { releaseQuestion, reserveQuestion } from '@/lib/auth/users';
import { MESSAGE_MAX, listMessages } from '@/lib/bridge/store';
import { requireMember } from '@/lib/bridge/guard';
import { SOFTEN_INSTRUCTIONS, softenForRoom, type SoftenInstruction } from '@/lib/bridge/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const hashText = (t: string) => createHash('sha256').update(t).digest('hex');
const REGEN_MAX = 5;
const REGEN_TTL_MS = 30 * 60 * 1000;

interface RegenPermit { r: string; u: string; h: string; k: string }

/** Geçerli izinse ve sınır dolmadıysa ince ayar ücretsizdir: sayaç anahtarı döner (atomik). */
async function freeRegen(token: unknown, roomId: string, username: string, raw: string): Promise<string | null> {
  if (typeof token !== 'string') return null;
  const p = await verifyJson<RegenPermit>('bridge-regen', token);
  if (!p || p.r !== roomId || p.u !== username || p.h !== hashText(raw)) return null;
  const kv = getKV();
  const key = `bridge-regen:${p.k}`;
  const used = await kv.incr(key);
  await kv.expire(key, 3600).catch(() => 0);
  return used <= REGEN_MAX ? key : null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireMember(req, params.id);
  if (ctx instanceof NextResponse) return ctx;
  const { user, room, me } = ctx;
  if (room.members.length < 2) return jsonError(400, 'Karşı taraf henüz katılmadı.');
  if (!(await hit('bridge-draft', user.username, RATE_LIMITS.BRIDGE_DRAFT_USER))) return jsonError(429, 'Biraz yavaşlayalım; birkaç dakika sonra devam et.');

  const body = await readJson(req);
  const raw = typeof body?.['text'] === 'string' ? body['text'].trim() : '';
  if (raw.length < 3) return jsonError(400, 'Söylemek istediğini yaz.');
  if (raw.length > MESSAGE_MAX) return jsonError(400, `En fazla ${MESSAGE_MAX} karakter yazabilirsin.`);
  const ins = body?.['instruction'];
  const instruction = typeof ins === 'string' && Object.hasOwn(SOFTEN_INSTRUCTIONS, ins) ? (ins as SoftenInstruction) : undefined;

  const moderation = moderateInput(raw);
  if (!moderation.allowed) {
    await recordEvent('crisis');
    return NextResponse.json({ crisis: CRISIS_RESPONSE[moderation.reason] });
  }

  const regenKey = await freeRegen(body?.['regen'], room.id, user.username, raw);
  const reservation = regenKey ? null : await reserveQuestion(user);
  if (!regenKey && !reservation) return NextResponse.json({ error: 'Bugünkü hakların doldu.', code: 'QUOTA_EXCEEDED' }, { status: 429 });

  try {
    const result = await softenForRoom({ topic: room.topic, messages: await listMessages(room.id), viewer: me, raw, instruction });
    if (result.safety) {
      if (reservation) await releaseQuestion(user, reservation).catch(() => {});
      await recordEvent('bridge_safety');
      return NextResponse.json({ safety: true, ...(reservation ? { remaining: reservation.remaining + 1 } : {}) });
    }
    const token = await signJson('bridge-send', { r: room.id, u: user.username, h: hashText(result.text) }, REGEN_TTL_MS);
    if (!token) throw new Error('Gönderim izni imzalanamadı');
    // Hak düşen her hazırlama yeni bir ince ayar hakkı açar.
    const regen = reservation
      ? await signJson('bridge-regen', { r: room.id, u: user.username, h: hashText(raw), k: randomBytes(8).toString('hex') } satisfies RegenPermit, REGEN_TTL_MS)
      : undefined;
    return NextResponse.json({ heard: result.heard, text: result.text, kept: result.kept, token, ...(regen ? { regen } : {}), ...(reservation ? { remaining: reservation.remaining } : {}) });
  } catch (e) {
    await logError('server', 'bridge-draft', e);
    if (reservation) await releaseQuestion(user, reservation).catch(() => {});
    if (regenKey) await getKV().decr(regenKey).catch(() => 0); // üretilemeyen ince ayar sayılmaz
    return jsonError(502, reservation ? 'Şu an hazırlanamadı. Hakkın iade edildi; biraz sonra tekrar dene.' : 'Şu an hazırlanamadı; biraz sonra tekrar dene.');
  }
}
