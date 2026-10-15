/**
 * Rehberli çalışma motoru: kişinin cevaplarına göre bir sonraki soruyu ve
 * sonunda gerçek bir karşılık üretir (fark edişler + çalışmaya özgü somut ürün).
 * Anlatılanlar saklanmaz; istemci her adımda o ana kadarki soru-cevapları
 * imzalı izinle gönderir.
 *
 * 2026-10-14: "yalnızca ayna" sonucu kullanıcıya bir şey vermiyordu. Artık
 * Mentoriva kişinin cevaplarında gördüğünü açıkça söyler; yine de karar
 * kişinindir ve söylenmeyen geçmiş/neden uydurulmaz.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import { PERSPECTIVE_MENTORS, STUDY_ANSWER_MAX, type GuidedStudy, type PerspectiveMentor, type StudyFinish, type StudyOutcome, type StudyTurn } from './guided-content';

const COMMON = `You guide a short thinking study on Mentoriva, a Turkish app. You are a warm,
perceptive companion who helps the person see their own situation clearly, and
who gives them something real in return for what they share.

Rules (always):
- Everything you say about the person rests on what they wrote. Do not invent
  their history, the causes of their feelings, or other people's motives; no
  childhood, parents or trauma unless they brought them up; no diagnoses or labels.
- You may say clearly what you notice in their answers (tensions, repeated
  words, what seems to weigh most). That is your value. Do not hedge every
  sentence; say "bana öyle görünüyor" once if needed.
- You do not make the decision for them, and you do not tell them who to be.
- Warm, natural, concrete Turkish addressed to "sen". No markdown, no emojis.
- If the person indicates a risk of harming themselves or others, or being in
  danger, return {"crisis": true} and nothing else.

# WHAT YOU ADD (most important)
Mirroring is not enough; the person already knows what they wrote. Restate
their words in at most one sentence. Everything else must ADD something they
did not write: a new angle or reframe, a distinction they have not made, a
connection between things they said that they did not link, how this kind of
situation usually unfolds for people, an idea from a thinker (Stoics, Mevlânâ,
Jung, Nietzsche, Socrates; named and paraphrased, never quoted), an option
they have not considered, or a concrete tool they can use. Be generous and
bold with ideas; be careful only about facts concerning the person.`;

function transcript(turns: StudyTurn[]): string {
  return turns.map((t, i) => `<turn n="${i + 1}">\nQ: ${t.q}\nA: ${t.a.slice(0, STUDY_ANSWER_MAX)}\n</turn>`).join('\n');
}

const NEXT_RULES = `Now write the NEXT step:
- "reflect": one or two sentences that give something back for their last
  answer: what you noticed in it, a connection to an earlier answer, or a
  useful distinction. Not praise, not a summary, not a diagnosis.
- "question": ONE open question, at most 30 words, that builds on it and moves
  the study forward. No "X mi, yoksa Y mi?" menus, no leading questions, no
  repetition.
- "done": true when there is enough material for a meaningful result (usually
  after 3-5 answers), or if they clearly want to stop. Then "question" may be empty.

Return ONLY JSON: {"reflect": "...", "question": "...", "done": false}`;

const OUTCOME_RULES: Record<StudyOutcome, string> = {
  decision: `"decision": a decision map built ONLY from their answers:
  {"options": [{"name": "short name of the option in their words",
  "gives": ["what it gives them", ...], "costs": ["what it costs them", ...],
  "serves": "which thing they said matters to them this option serves"}],
  "leaning": "one honest sentence on what seems to weigh most in what they
  wrote, e.g. 'Anlattıklarına bakınca huzur ve ailene yakınlık daha ağır
  basıyor gibi; yeni iş ise merakını besliyor.' Empty only if truly balanced.",
  "consider": "something they have not considered: a third path, a way to
  combine the options, or a small test they could run before deciding (1-2
  sentences)"}
  2-3 options, 1-3 short items each. Do not recommend; show the scale clearly.`,
  boundary: `"boundary": {"line": "what crosses their line, concretely, in their words",
  "want": "what they want instead", "sentence": "a ready-to-say sentence in
  first person, kind and clear, that keeps their point (1-2 sentences)",
  "ifSay": "what saying it might bring, from what they said",
  "ifNot": "what not saying it keeps costing them, from what they said",
  "protects": "what this boundary may protect for them (a value or need),
  offered as a possibility, one sentence"}.
  Do not assume the relationship should continue or end.`,
  values: `"values": 2-3 items [{"name": "a value in THEIR words (e.g. 'birine
  gerçekten faydalı olmak')", "present": "where it already lives in their life",
  "missing": "where it is missing or squeezed"}]. Names come from their
  moments, not from a standard list.
  Also "valuesTension": one or two sentences on a tension between these values
  (or between a value and how they live) that they may not have noticed, and
  "valuesAsk": what living the most important one more fully would ask of
  them this week (one concrete sentence).`,
  cycle: `"cycle": {"trigger": "what tends to start it", "response": "what they
  usually do or tell themselves", "result": "what it leads to",
  "experiment": "one small, concrete thing to try differently next time,
  drawn from what they said they want", "gives": "what this cycle may give
  them in the short term, which is often why it keeps returning (offered as
  a possibility, one sentence)"}. No psychological causes.`,
};

function finishRules(outcome: StudyOutcome): string {
  return `The study is over. The person may have written in their own words what became
clear to them ("takeaway"); honour it and never contradict it.
Give them a result worth having:
- "insights": 2-3 short paragraphs (each 1-3 sentences). Each must add
  something new (see WHAT YOU ADD): a link between answers they did not make,
  what seems to weigh most and why that matters, a tension, a strength they
  showed without noticing, or a perspective from outside their own words.
  Never a summary of what they wrote.
- "perspectives": two short takes from two DIFFERENT thinkers among jung,
  nietzsche, mevlana, marcus, seneca, chosen because they would see this
  matter in clearly different ways: [{"mentor": "id", "text": "2-3 sentences,
  in the third person ('Seneca buna şöyle bakardı: …'), applying that
  thinker's documented ideas to THIS situation"}]. No quotations.
- ${OUTCOME_RULES[outcome]}
- "open": one question still open for them (at most 25 words).
- "steps": up to two small, concrete, optional steps that follow from what
  they said. Never a step that makes the decision for them.

Return ONLY JSON with keys: "insights", "perspectives", "${outcome}",${outcome === 'values' ? ' "valuesTension", "valuesAsk",' : ''} "open", "steps".`;
}

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/^["“]+|["”]+$/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const list = (v: unknown, n: number, max: number): string[] =>
  Array.isArray(v) ? v.map((x) => clean(x, max)).filter(Boolean).slice(0, n) : [];
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export type NextStep = { crisis: true } | { crisis: false; reflect: string; question: string; done: boolean };

export function parseNext(raw: unknown): NextStep | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['crisis'] === true) return { crisis: true };
  const question = clean(o['question'], 300);
  const done = o['done'] === true;
  if (!question && !done) return null;
  return { crisis: false, reflect: clean(o['reflect'], 360), question, done: done || !question };
}

export function parseFinish(raw: unknown, outcome: StudyOutcome): ({ crisis: true } | ({ crisis: false } & StudyFinish)) | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['crisis'] === true) return { crisis: true };
  const insights = list(o['insights'], 3, 500);
  if (!insights.length) return null;
  const f: StudyFinish = { insights, open: clean(o['open'], 240), steps: list(o['steps'], 2, 160) };
  const perspectives = (Array.isArray(o['perspectives']) ? o['perspectives'] : [])
    .map((x) => obj(x))
    .map((x) => ({ mentor: clean(x['mentor'], 20) as PerspectiveMentor, text: clean(x['text'], 500) }))
    .filter((x) => PERSPECTIVE_MENTORS.includes(x.mentor) && x.text)
    .filter((x, i, arr) => arr.findIndex((y) => y.mentor === x.mentor) === i)
    .slice(0, 2);
  if (perspectives.length) f.perspectives = perspectives;

  if (outcome === 'decision') {
    const d = obj(o['decision']);
    const options = (Array.isArray(d['options']) ? d['options'] : [])
      .map((x) => obj(x))
      .map((x) => ({ name: clean(x['name'], 80), gives: list(x['gives'], 3, 120), costs: list(x['costs'], 3, 120), serves: clean(x['serves'], 160) }))
      .filter((x) => x.name)
      .slice(0, 3);
    if (options.length) f.decision = { options, leaning: clean(d['leaning'], 300), consider: clean(d['consider'], 400) };
  } else if (outcome === 'boundary') {
    const b = obj(o['boundary']);
    const sentence = clean(b['sentence'], 400);
    if (sentence) f.boundary = { line: clean(b['line'], 240), want: clean(b['want'], 240), sentence, ifSay: clean(b['ifSay'], 240), ifNot: clean(b['ifNot'], 240), protects: clean(b['protects'], 300) };
  } else if (outcome === 'values') {
    const v = (Array.isArray(o['values']) ? o['values'] : [])
      .map((x) => obj(x))
      .map((x) => ({ name: clean(x['name'], 80), present: clean(x['present'], 200), missing: clean(x['missing'], 200) }))
      .filter((x) => x.name)
      .slice(0, 3);
    if (v.length) {
      f.values = v;
      f.valuesTension = clean(o['valuesTension'], 400);
      f.valuesAsk = clean(o['valuesAsk'], 300);
    }
  } else {
    const c = obj(o['cycle']);
    if (clean(c['trigger'], 10)) {
      f.cycle = { trigger: clean(c['trigger'], 200), response: clean(c['response'], 200), result: clean(c['result'], 200), experiment: clean(c['experiment'], 240), gives: clean(c['gives'], 300) };
    }
  }
  return { crisis: false, ...f };
}

export async function nextQuestion(study: GuidedStudy, turns: StudyTurn[], last: boolean): Promise<NextStep | null> {
  const system = `${COMMON}\n\n# THIS STUDY: ${study.title}\n${study.guide}\n\n${NEXT_RULES}`;
  const user = `${transcript(turns)}${last ? '\n\n[This is the last question you may ask; set done to true if the material is enough.]' : ''}`;
  const out = await completeText({
    system,
    user,
    maxTokens: 400,
    feature: 'study',
    mock: () => JSON.stringify({ reflect: 'İki seçenekte de aslında aynı şeyi aradığını söylüyorsun: içinin rahat etmesini.', question: turns.length >= 3 ? '' : 'Bu durumda senin için en ağır basan şey ne?', done: turns.length >= 3 }),
  });
  return parseNext(extractJson(out));
}

const MOCK_FINISH: Record<StudyOutcome, unknown> = {
  decision: { options: [{ name: 'Burada kalmak', gives: ['ailene yakınlık', 'huzur'], costs: ['öğrenme fırsatı'], serves: 'huzur' }, { name: 'Yeni iş', gives: ['öğrenmek', 'heyecan'], costs: ['ailenden uzak kalmak'], serves: 'merak' }], leaning: 'Anlattıklarına bakınca huzur daha ağır basıyor gibi.' },
  boundary: { line: 'İşinin sürekli sana bırakılması', want: 'Kendi işine odaklanabilmek', sentence: 'Bu hafta kendi işlerimi bitirmem gerekiyor; bunu senin yerine alamayacağım.', ifSay: 'Kısa bir gerginlik, ama zamanının sana dönmesi', ifNot: 'Akşamları yorgun ve kırgın kalmak' },
  values: [{ name: 'Birine gerçekten faydalı olmak', present: 'Arkadaşlarına yardım ettiğinde', missing: 'İşinde' }],
  cycle: { trigger: 'Yeni bir işin ilk heyecanı geçince', response: 'Kendine "bu da benim yerim değil" demek', result: 'Bırakmak', experiment: 'Bir sonraki sıkıldığın gün bırakmak yerine bir hafta beklemek' },
};

export async function finishStudy(study: GuidedStudy, turns: StudyTurn[], takeaway: string): Promise<ReturnType<typeof parseFinish>> {
  const system = `${COMMON}\n\n# THIS STUDY: ${study.title}\n\n${finishRules(study.outcome)}`;
  const user = `${transcript(turns)}${takeaway ? `\n\n<takeaway>\n${takeaway}\n</takeaway>` : ''}`;
  const out = await completeText({
    system,
    user,
    maxTokens: 1400,
    effort: 'medium',
    feature: 'study',
    mock: () => JSON.stringify({
      insights: ['İki seçeneği anlatırken her seferinde "huzur" kelimesine döndün; bu sana bir şey söylüyor olabilir.', 'Yeni işi anlatırken sesin canlanıyor ama hep "ama" ile bitiyor.'],
      [study.outcome === 'decision' ? 'decision' : study.outcome === 'boundary' ? 'boundary' : study.outcome === 'values' ? 'values' : 'cycle']: MOCK_FINISH[study.outcome],
      open: 'Huzur senin için bugün neye benziyor?',
      steps: ['Bu hafta iki seçeneği de birine anlatıp kendi sesini dinlemek'],
    }),
  });
  return parseFinish(extractJson(out), study.outcome);
}
