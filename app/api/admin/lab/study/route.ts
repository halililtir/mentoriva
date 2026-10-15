/**
 * POST /api/admin/lab/study — rehberli çalışma sonucunu örnek cevaplarla
 * sınamak için (yalnızca admin). { studyId, turns: [{q, a}], takeaway }
 * → { result }. Hiçbir şey kaydedilmez; kota düşmez; maliyet "study".
 */

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/session';
import { jsonError, readJson } from '@/lib/http';
import { GUIDED_BY_ID } from '@/lib/studies/guided-content';
import { finishStudy } from '@/lib/studies/guided';
import { sanitizeTurns } from '@/lib/studies/guided-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const study = GUIDED_BY_ID.get(typeof body?.['studyId'] === 'string' ? body['studyId'] : '');
  const turns = sanitizeTurns(body?.['turns']);
  if (!study || !turns) return jsonError(400, 'Geçersiz istek');
  const takeaway = typeof body?.['takeaway'] === 'string' ? body['takeaway'].slice(0, 400) : '';
  const result = await finishStudy(study, turns, takeaway);
  return result ? NextResponse.json({ result }) : jsonError(502, 'Üretilemedi');
}
