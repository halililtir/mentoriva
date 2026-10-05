/**
 * /api/admin/lab/grade — laboratuvar cevaplarını hakemle puanlar (yalnızca admin).
 *   POST { question, results: [{ mentorId, text }] } → { grades: [{ mentorId, grade | null }] }
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { gradeAnswer } from '@/lib/admin/grader';
import { MENTOR_IDS, type MentorId } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const question = typeof body?.['question'] === 'string' ? body['question'].trim().slice(0, 1000) : '';
  const raw = Array.isArray(body?.['results']) ? (body['results'] as unknown[]) : [];
  const items = raw
    .map((r) => r as Record<string, unknown>)
    .filter((r) => MENTOR_IDS.includes(r['mentorId'] as MentorId) && typeof r['text'] === 'string' && (r['text'] as string).trim())
    .slice(0, MENTOR_IDS.length) as Array<{ mentorId: MentorId; text: string }>;
  if (!question || items.length === 0) return jsonError(400, 'Soru ve en az bir cevap gerekli');

  const grades = await Promise.all(items.map(async (r) => ({ mentorId: r.mentorId, grade: await gradeAnswer(question, r.mentorId, r.text) })));
  return NextResponse.json({ grades }, { headers: { 'Cache-Control': 'no-store' } });
}
