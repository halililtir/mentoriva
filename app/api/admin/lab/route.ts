/**
 * /api/admin/lab — mentor laboratuvarı (yalnızca admin çerezi).
 *   GET  → sabit soru seti ve değerlendirme ölçütleri
 *   POST → { question, mentorIds?, followUp?, answers? } — soruyu seçilen
 *          mentorlara paralel sorar. followUp verilirse ilk soru + o mentorun
 *          cevabı geçmiş sayılır ve sohbet modu denenir.
 * Kota düşmez, kullanıcı metriği ve cevap kaydı yazılmaz.
 */

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { isAdmin } from '@/lib/auth/session';
import { streamMentorResponse } from '@/lib/claude/client';
import { LAB_QUESTIONS, LAB_RUBRIC } from '@/lib/admin/lab';
import { MENTOR_IDS, type MentorId, type Message } from '@/types';
import { INPUT_LIMITS } from '@/lib/features';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  return NextResponse.json({ questions: LAB_QUESTIONS, rubric: LAB_RUBRIC }, { headers: { 'Cache-Control': 'no-store' } });
}

interface LabResult {
  mentorId: MentorId;
  text: string;
  ms: number;
  error?: string;
}

async function runOne(mentorId: MentorId, userMessage: string, chatHistory: Message[], mode: 'initial' | 'chat'): Promise<LabResult> {
  const started = Date.now();
  let text = '';
  let error: string | undefined;
  for await (const chunk of streamMentorResponse({ mentorId, userMessage, chatHistory, mode, feature: 'other' })) {
    if (chunk.type === 'complete') text = chunk.fullText ?? text;
    else if (chunk.type === 'text_delta') text += chunk.text ?? '';
    else if (chunk.type === 'error') error = chunk.error;
  }
  return { mentorId, text, ms: Date.now() - started, ...(error ? { error } : {}) };
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return jsonError(401, 'Yetkisiz');
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Geçersiz istek');
  }

  const question = typeof body['question'] === 'string' ? body['question'].trim() : '';
  if (question.length < 2 || question.length > INPUT_LIMITS.MAX_QUESTION_LENGTH) return jsonError(400, 'Soru 2-1000 karakter olmalı');

  const requested = Array.isArray(body['mentorIds']) ? body['mentorIds'] : MENTOR_IDS;
  const mentorIds = MENTOR_IDS.filter((id) => requested.includes(id));
  if (mentorIds.length === 0) return jsonError(400, 'En az bir mentor seç');

  const followUp = typeof body['followUp'] === 'string' ? body['followUp'].trim() : '';
  if (followUp.length > INPUT_LIMITS.MAX_CHAT_MESSAGE_LENGTH) return jsonError(400, 'Devam mesajı çok uzun');
  const answers = (body['answers'] && typeof body['answers'] === 'object' ? body['answers'] : {}) as Record<string, unknown>;

  const results = await Promise.all(
    mentorIds.map((id) => {
      if (!followUp) return runOne(id, question, [], 'initial');
      const first = typeof answers[id] === 'string' ? (answers[id] as string) : '';
      if (!first) return Promise.resolve<LabResult>({ mentorId: id, text: '', ms: 0, error: 'Önce ilk cevap gerekli' });
      return runOne(id, followUp, [{ role: 'user', content: question }, { role: 'assistant', content: first }], 'chat');
    }),
  );

  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
}
