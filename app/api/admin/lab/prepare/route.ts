/**
 * POST /api/admin/lab/prepare — "Söyleyeceğimi hazırla"yı gerçek modelle
 * sınamak için (yalnızca admin). Gövde /api/v1/prepare ile aynı → { result }.
 * Hiçbir şey kaydedilmez; kota düşmez; maliyet "prepare".
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { prepareMessage, sanitizePrepare } from '@/lib/prepare';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const input = sanitizePrepare(await readJson(req));
  if (typeof input === 'string') return jsonError(400, input);
  try {
    return NextResponse.json({ result: await prepareMessage(input) });
  } catch {
    return jsonError(502, 'Üretilemedi');
  }
}
