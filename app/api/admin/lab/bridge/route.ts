/**
 * POST /api/admin/lab/bridge — Aramızda yumuşatmasını gerçek modelle sınamak
 * için (yalnızca admin). { topic, raw, instruction?, history?: [{ mine, text }] }
 * → { result }. Hiçbir şey kaydedilmez; kota düşmez; maliyet "bridge".
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { SOFTEN_INSTRUCTIONS, softenForRoom, type SoftenInstruction } from '@/lib/bridge/ai';
import type { RoomMessage } from '@/lib/bridge/store';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const topic = typeof body?.['topic'] === 'string' ? body['topic'].slice(0, 80) : '';
  const raw = typeof body?.['raw'] === 'string' ? body['raw'].slice(0, 1200) : '';
  if (!topic || raw.length < 3) return jsonError(400, 'Geçersiz istek');
  const ins = body?.['instruction'];
  const instruction = typeof ins === 'string' && ins in SOFTEN_INSTRUCTIONS ? (ins as SoftenInstruction) : undefined;
  const hist = Array.isArray(body?.['history']) ? (body['history'] as unknown[]).slice(-20) : [];
  const messages: RoomMessage[] = hist.flatMap((h, i) => {
    const o = h as { mine?: unknown; text?: unknown };
    return typeof o?.text === 'string' ? [{ id: String(i), from: o.mine ? 0 : 1, text: o.text.slice(0, 1200), at: new Date().toISOString() } as RoomMessage] : [];
  });
  try {
    return NextResponse.json({ result: await softenForRoom({ topic, messages, viewer: 0, raw, instruction }) });
  } catch (e) {
    // Yalnızca admin görür; sınama sırasında nedeni anlamak için.
    return NextResponse.json({ error: 'Üretilemedi', detail: String(e instanceof Error ? e.message : e).slice(0, 400) }, { status: 502 });
  }
}
