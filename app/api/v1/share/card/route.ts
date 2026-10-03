/**
 * POST /api/v1/share/card → { token } (5 dk geçerli, imzalı kart izni).
 *
 * Görseli /api/v1/share/image (Edge) bu izinle çizer.
 *
 * Karta yalnızca sunucunun gerçekten ürettiği bir cevaptan alınmış cümle
 * basılabilir: `answer` kaynağında oturum sahibinin son cevapları, `daily`
 * kaynağında günün sorusu kontrol edilir. Böylece kimse Mentoriva markasıyla
 * keyfi metin içeren görsel üretemez.
 */

import { NextResponse } from 'next/server';
import { jsonError, getClientIp, readJson, str } from '@/lib/http';
import { hit } from '@/lib/rate-limit';
import { getSessionUser } from '@/lib/auth/session';
import { findMatchingAnswer, getRecordedAnswers } from '@/lib/share/answers';
import { signCard } from '@/lib/share/token';
import { getDaily } from '@/lib/daily';
import { isActiveMentor } from '@/lib/mentors/metadata';
import { findQuoteInText } from '@/lib/mentors/quotes';
import { moderateInput } from '@/lib/safety/moderation';
import { todayKey } from '@/lib/time';
import { recordEvent } from '@/lib/admin/metrics';

export const runtime = 'nodejs';

const MAX_HIGHLIGHT = 240;
/** Kartta gösterilecek en uzun soru; daha uzunu kısaltılır (doğrulama tam metinle yapılır). */
const CARD_QUESTION_MAX = 200;

export async function POST(req: Request) {
  if (!(await hit('share-card', getClientIp(req), { max: 30, windowSec: 600 }))) {
    return jsonError(429, 'Çok fazla kart oluşturdun. Biraz sonra tekrar dene.');
  }

  const body = await readJson(req);
  if (!body) return jsonError(400, 'Geçersiz istek');

  const source = body['source'] === 'daily' ? 'daily' : 'answer';
  const mentorId = str(body['mentorId'], 30);
  const question = str(body['question'], 1000);
  const highlight = str(body['highlight'], 1000);

  if (!isActiveMentor(mentorId)) return jsonError(400, 'Geçersiz mentor');
  if (highlight.length < 10 || highlight.length > MAX_HIGHLIGHT) return jsonError(400, `Seçilen cümle 10–${MAX_HIGHLIGHT} karakter olmalı`);
  if (!question) return jsonError(400, 'Soru gerekli');

  // Kriz veya zararlı içerik taşıyan metinler kart olarak basılmaz
  if (!moderateInput(question).allowed || !moderateInput(highlight).allowed) {
    return jsonError(400, 'Bu içerik paylaşım kartına dönüştürülemiyor.');
  }

  let answerText: string | null = null;
  if (source === 'daily') {
    const entry = await getDaily(todayKey());
    const text = entry?.answers[mentorId];
    if (entry && text && findMatchingAnswer([{ mentorId, question: entry.question, text }], mentorId, question, highlight)) {
      answerText = text;
    }
  } else {
    const user = await getSessionUser(req);
    if (!user) return jsonError(401, 'Kart oluşturmak için giriş yapmalısın.');
    const answers = await getRecordedAnswers(user.username);
    const match = answers.find((a) => findMatchingAnswer([a], mentorId, question, highlight));
    answerText = match?.text ?? null;
  }
  if (!answerText) return jsonError(403, 'Bu cümle, sana verilmiş bir mentor cevabında bulunamadı.');

  const token = await signCard({
    mentorId,
    question: question.length > CARD_QUESTION_MAX ? `${question.slice(0, CARD_QUESTION_MAX - 1).trimEnd()}…` : question,
    highlight,
    quote: findQuoteInText(mentorId, answerText),
    label: source === 'daily' ? 'Günün sorusu' : undefined,
  });
  if (!token) return jsonError(503, 'Paylaşım kartı şu an kullanılamıyor.');
  await recordEvent('share');
  return NextResponse.json({ token });
}
