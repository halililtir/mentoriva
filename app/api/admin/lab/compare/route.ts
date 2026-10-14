/**
 * /api/admin/lab/compare — eski (2026-10-05 öncesi) ve yeni mentor
 * talimatlarının körlemesine karşılaştırması (yalnızca admin çerezi).
 *
 *   GET                            → { tally: { [mentorId]: { legacy, current, tie } } }
 *   POST { question, mentorId }    → { mentorId, a, b, aIs }  (sıra rastgele)
 *   PUT  { mentorId, winner }      → { tally }  winner: 'legacy' | 'current' | 'tie'
 *
 * Kota düşmez; maliyet "Diğer". Seçimler `lab-votes:<mentor>` hash'inde sayılır.
 */

import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { getKV } from '@/lib/kv';
import { streamMentorResponse } from '@/lib/claude/client';
import { LEGACY_PROMPTS } from '@/lib/mentors/prompts/legacy';
import { INPUT_LIMITS } from '@/lib/features';
import type { MentorId } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Winner = 'legacy' | 'current' | 'tie';
const MENTORS = Object.keys(LEGACY_PROMPTS) as MentorId[];
const voteKey = (m: MentorId) => `lab-votes:${m}`;

async function run(mentorId: MentorId, question: string, system?: string): Promise<string> {
  let text = '';
  for await (const chunk of streamMentorResponse({ mentorId, userMessage: question, mode: 'initial', feature: 'other', systemOverride: system })) {
    if (chunk.type === 'text_delta' && chunk.text) text += chunk.text;
    else if (chunk.type === 'error') throw new Error(chunk.error ?? 'hata');
  }
  return text;
}

async function tally() {
  const kv = getKV();
  const rows = await Promise.all(MENTORS.map(async (m) => {
    const h = (await kv.hgetall<Record<string, unknown>>(voteKey(m))) ?? {};
    const n = (k: Winner) => Number(h[k] ?? 0) || 0;
    return [m, { legacy: n('legacy'), current: n('current'), tie: n('tie') }] as const;
  }));
  return Object.fromEntries(rows);
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  return NextResponse.json({ mentors: MENTORS, tally: await tally() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const question = typeof body?.['question'] === 'string' ? body['question'].trim() : '';
  const mentorId = body?.['mentorId'] as MentorId;
  if (question.length < 2 || question.length > INPUT_LIMITS.MAX_QUESTION_LENGTH) return jsonError(400, 'Soru 2-1000 karakter olmalı');
  const legacy = LEGACY_PROMPTS[mentorId];
  if (!legacy) return jsonError(400, 'Bu mentorun eski talimatı yok');
  try {
    const [oldText, newText] = await Promise.all([run(mentorId, question, legacy.initial), run(mentorId, question)]);
    const aIs: Winner = Math.random() < 0.5 ? 'legacy' : 'current';
    return NextResponse.json({ mentorId, a: aIs === 'legacy' ? oldText : newText, b: aIs === 'legacy' ? newText : oldText, aIs });
  } catch (e) {
    return jsonError(502, e instanceof Error ? e.message : 'Cevap üretilemedi');
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  const body = await readJson(req);
  const mentorId = body?.['mentorId'] as MentorId;
  const winner = body?.['winner'] as Winner;
  if (!LEGACY_PROMPTS[mentorId] || !['legacy', 'current', 'tie'].includes(winner)) return jsonError(400, 'Geçersiz oy');
  const h = (await getKV().hgetall<Record<string, unknown>>(voteKey(mentorId))) ?? {};
  await getKV().hset(voteKey(mentorId), { [winner]: (Number(h[winner] ?? 0) || 0) + 1 });
  return NextResponse.json({ tally: await tally() });
}
