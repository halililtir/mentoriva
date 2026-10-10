/**
 * Rehberli çalışma motoru: kişinin cevaplarına göre bir sonraki soruyu ve
 * sonunda kişinin söylediklerinin aynasını üretir. Anlatılanlar saklanmaz;
 * istemci her adımda o ana kadarki soru-cevapları imzalı izinle gönderir.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { STUDY_ANSWER_MAX, type GuidedStudy, type StudyFinish, type StudyTurn } from './guided-content';

const COMMON = `You guide a short reflective study on Mentoriva, a Turkish app. You are not a
therapist, not a judge and not a mentor character: you ask good questions so the
person can see their own situation more clearly in their own words.

Rules (always):
- Base everything only on what the person wrote. Never invent causes, history,
  motives or feelings they did not mention; never diagnose or label them or
  anyone else; no childhood, parents or trauma unless they brought them up.
- Never decide for them or tell them what they should do or who they should be.
- Plain, warm, natural Turkish addressed to "sen". No markdown, no emojis, no quotes.
- If the person indicates a risk of harming themselves or others, or being in
  danger, return {"crisis": true} and nothing else.`;

function transcript(turns: StudyTurn[]): string {
  return turns.map((t, i) => `<turn n="${i + 1}">\nQ: ${t.q}\nA: ${t.a.slice(0, STUDY_ANSWER_MAX)}\n</turn>`).join('\n');
}

const NEXT_RULES = `Now write the NEXT step:
- "reflect": optional, at most one short sentence that mirrors something they
  actually said (their words), so they feel heard. Empty string if not needed.
  Not praise, not interpretation.
- "question": ONE open question, at most 30 words, that builds on their last
  answer and moves the study forward. Not leading ("X mi, yoksa Y mi?" menus are
  not allowed), not a diagnosis in disguise, not a repetition of earlier questions.
- "done": true when the study has enough material for the person to draw their
  own conclusion (usually after 3-5 answers), or if they clearly want to stop.
  When done is true, "question" may be empty.

Return ONLY JSON: {"reflect": "...", "question": "...", "done": false}`;

const FINISH_RULES = `The study is over. The person may have written in their own words what
became clear to them ("takeaway"); their view comes first.
Write:
- "summary": 2-3 sentences that mirror back what the person said: the main
  things they described, in their own terms. No new interpretation, no advice,
  no verdict. If they wrote a takeaway, do not contradict it.
- "open": one open question that is still unanswered for them, drawn from their
  answers (at most 25 words).
- "steps": up to two small, concrete, optional steps that follow directly from
  what THEY said (e.g. something they said they want to try). Empty list if
  nothing fits. Never a step that decides the matter for them.

Return ONLY JSON: {"summary": "...", "open": "...", "steps": ["..."]}`;

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/^["“]+|["”]+$/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export type NextStep = { crisis: true } | { crisis: false; reflect: string; question: string; done: boolean };

export function parseNext(raw: unknown): NextStep | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['crisis'] === true) return { crisis: true };
  const question = clean(o['question'], 300);
  const done = o['done'] === true;
  if (!question && !done) return null;
  return { crisis: false, reflect: clean(o['reflect'], 220), question, done: done || !question };
}

export function parseFinish(raw: unknown): ({ crisis: true } | ({ crisis: false } & StudyFinish)) | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['crisis'] === true) return { crisis: true };
  const summary = clean(o['summary'], 700);
  if (!summary) return null;
  const steps = Array.isArray(o['steps']) ? o['steps'].map((s) => clean(s, 160)).filter(Boolean).slice(0, 2) : [];
  return { crisis: false, summary, open: clean(o['open'], 240), steps };
}

export async function nextQuestion(study: GuidedStudy, turns: StudyTurn[], last: boolean): Promise<NextStep | null> {
  const system = `${COMMON}\n\n# THIS STUDY: ${study.title}\n${study.guide}\n\n${NEXT_RULES}`;
  const user = `${transcript(turns)}${last ? '\n\n[This is the last question you may ask; set done to true if the material is enough.]' : ''}`;
  const out = await completeText({
    system,
    user,
    maxTokens: 300,
    feature: 'study',
    mock: () => JSON.stringify({ reflect: 'Anlattığını duydum.', question: turns.length >= 3 ? '' : 'Bu durumda senin için en ağır basan şey ne?', done: turns.length >= 3 }),
  });
  return parseNext(extractJson(out));
}

export async function finishStudy(study: GuidedStudy, turns: StudyTurn[], takeaway: string): Promise<ReturnType<typeof parseFinish>> {
  const system = `${COMMON}\n\n# THIS STUDY: ${study.title}\n\n${FINISH_RULES}`;
  const user = `${transcript(turns)}${takeaway ? `\n\n<takeaway>\n${takeaway}\n</takeaway>` : ''}`;
  const out = await completeText({
    system,
    user,
    maxTokens: 600,
    effort: 'medium',
    feature: 'study',
    mock: () => JSON.stringify({ summary: 'Anlattıklarında iki yol arasında kaldığını ve en çok huzuru önemsediğini söyledin.', open: 'Huzur senin için bugün neye benziyor?', steps: ['Bu hafta iki seçeneği de birine anlatıp kendi sesini dinlemek'] }),
  });
  return parseFinish(extractJson(out));
}
