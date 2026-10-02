/**
 * Günün sorusu — her gün seçilmiş bir soruya tüm aktif mentorların cevabı.
 *
 * Cevaplar günde bir kez üretilir ve KV'de saklanır (daily:<YYYY-MM-DD>, 8 gün).
 * Üretimi Vercel cron (vercel.json) gece yarısından hemen sonra tetikler; cron
 * çalışmazsa günün ilk ziyaretçisi tetikler. Aynı anda iki üretim olmasın diye
 * basit bir kilit kullanılır.
 */

import { getKV } from '@/lib/kv';
import { streamMentorResponse } from '@/lib/claude/client';
import { todayKey } from '@/lib/time';
import { MENTOR_IDS, type MentorId } from '@/types';

export interface DailyEntry {
  date: string;
  question: string;
  answers: Partial<Record<MentorId, string>>;
  createdAt: string;
}

/** Elle seçilmiş, herkese hitap eden ve hassas olmayan sorular. Sırayla döner. */
export const DAILY_QUESTIONS = [
  'İnsan neden kendini sabote eder?',
  'Başkalarının ne düşündüğünü umursamamak mümkün mü?',
  'Gerçekten ne istediğimi nasıl bilebilirim?',
  'Öfkemle ne yapmalıyım?',
  'Yanlış karar verme korkusu nasıl aşılır?',
  'Yalnızlık bir eksiklik mi, bir fırsat mı?',
  'Başarı gerçekten mutlu eder mi?',
  'Geçmişi nasıl geride bırakırım?',
  'Neden hep ertelerim?',
  'Birini affetmek zorunda mıyım?',
  'Değişimden neden korkarız?',
  'Kıskançlık bize ne anlatır?',
  'İyi bir dost nasıl olunur?',
  'Hayatın bir anlamı var mı, yoksa onu biz mi yaratırız?',
  'Kendimi başkalarıyla kıyaslamayı nasıl bırakırım?',
  'Hayır demeyi neden bu kadar zor buluyorum?',
  'Mükemmeliyetçilik bir erdem mi, bir tuzak mı?',
  'Kontrol edemediğim şeyler için endişelenmeyi nasıl bırakırım?',
  'Sevdiğim işi mi yapmalıyım, güvenli olanı mı?',
  'Zamanım hep yetmiyor; ne yanlış gidiyor?',
  'Eleştiriyi nasıl karşılamalıyım?',
  'Cesaret nedir?',
  'Bir şeyi kaybettiğimde nasıl devam ederim?',
  'Sıradan bir hayat yaşamak kötü mü?',
  'Kendime nasıl daha iyi davranabilirim?',
  'Gerçek mutluluk nerede saklı?',
  'Aileme rağmen kendi yolumu seçebilir miyim?',
  'Haklı olmak mı önemli, huzurlu olmak mı?',
];

const DAY_MS = 86_400_000;
const LOCK_TTL = 90;
const ENTRY_TTL = 60 * 60 * 24 * 8;

export function questionForDate(date: string): string {
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
  return DAILY_QUESTIONS[((day % DAILY_QUESTIONS.length) + DAILY_QUESTIONS.length) % DAILY_QUESTIONS.length]!;
}

export async function getDaily(date: string): Promise<DailyEntry | null> {
  const raw = await getKV().get<DailyEntry | string>(`daily:${date}`);
  if (!raw) return null;
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as DailyEntry;
}

async function collect(mentorId: MentorId, question: string): Promise<string | null> {
  let text = '';
  for await (const chunk of streamMentorResponse({ mentorId, userMessage: question, mode: 'initial' })) {
    if (chunk.type === 'text_delta' && chunk.text) text += chunk.text;
    if (chunk.type === 'error') return null;
  }
  return text.trim() || null;
}

/** Günün girdisini döner; yoksa üretir. Üretim başka istekte sürüyorsa bekler. */
export async function ensureDaily(date: string = todayKey()): Promise<DailyEntry | null> {
  const existing = await getDaily(date);
  if (existing) return existing;

  const kv = getKV();
  const lockKey = `daily-lock:${date}`;
  const lock = await kv.incr(lockKey);
  if (lock === 1) await kv.expire(lockKey, LOCK_TTL);

  if (lock > 1) {
    // Başka bir istek üretiyor; en fazla ~40 sn bekle
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const done = await getDaily(date);
      if (done) return done;
    }
    return null;
  }

  try {
    const question = questionForDate(date);
    const results = await Promise.all(MENTOR_IDS.map(async (id) => [id, await collect(id, question)] as const));
    const answers = Object.fromEntries(results.filter(([, t]) => t)) as DailyEntry['answers'];
    if (Object.keys(answers).length === 0) return null;
    const entry: DailyEntry = { date, question, answers, createdAt: new Date().toISOString() };
    await kv.set(`daily:${date}`, entry, { ex: ENTRY_TTL });
    return entry;
  } finally {
    await kv.del(lockKey);
  }
}
