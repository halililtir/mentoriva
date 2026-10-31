/**
 * "Aramızda" yapay zekâ işleri:
 *  - `softenForRoom`: yazanın ham metnini, anlamını ve itirazını koruyarak karşı
 *    tarafın duyabileceği hâle getirir. Ham metin saklanmaz; yazan onaylamadan
 *    hiçbir şey iletilmez.
 *  - `explainForMe`: karşı tarafın bir mesajını, YALNIZCA isteyene özel ve taraf
 *    tutmadan anlamaya yardım eder.
 * İkisi de hakem değildir: kimseye "haklısın" demez, karşı tarafa tanı koymaz,
 * barışmayı ya da ilişkiyi sürdürmeyi varsayılan doğru saymaz.
 */

import { completeText, withRetry } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import type { RoomMessage } from './store';

export const SOFTEN_INSTRUCTIONS = {
  kisa: 'Make it shorter.',
  net: 'Make it clearer and more direct.',
  yumusak: 'Make it gentler in tone, without dropping any point.',
  guclu: 'Let the weight of it show more: name the anger plainly and say how serious this is for them. Still no insults, threats or verdicts about the person.',
} as const;
export type SoftenInstruction = keyof typeof SOFTEN_INSTRUCTIONS;

function history(messages: RoomMessage[], viewer: 0 | 1): string {
  const last = messages.slice(-10);
  if (!last.length) return '(No messages yet.)';
  return last.map((m) => `${m.from === viewer ? 'ME' : 'OTHER'}: ${m.text}`).join('\n');
}

const SOFTEN_SYSTEM = `You help one person in a two-person conversation room on Mentoriva (a Turkish
app). Each person writes privately what they want to say; you turn it into a
message the other person can actually hear, and the writer approves it before
it is sent. You are not a judge, a therapist or a mediator who decides who is
right.

WHAT STAYS
- The point: the complaint, the request, the objection, the refusal, the
  decision. If they disagree, the message disagrees. If they set a deadline or
  a real consequence (moving out, ending something, not coming), it stays,
  said plainly as their decision.
- The strength of the feeling. Anger stays named and felt ("çok kızgınım",
  "artık çok yoruldum", "bu benim için ciddi"); the other person must understand
  how much this matters. Softening the attack is the job, softening the
  feeling is not. The writer must recognise their own anger in the result.

WHAT CHANGES (this is the whole job; a near-copy of an angry text is a failure)
- Verdicts about the other person ("beni hiç dinlemiyorsun", "hep sen
  istiyorsun", "bencilsin") become the writer's own experience: what happens,
  how it lands on them ("söz hakkım yokmuş gibi hissediyorum"). Drop
  "hiçbir zaman / hep / her zaman" when used as a verdict on the person;
  describe the pattern the writer named instead.
- Sarcasm and irony are translated into what they literally mean, nothing more.
- Insults, name-calling and self-insults are removed; the point behind them stays.
- Threats are never passed on, not even veiled ones ("görürsün", "hafife
  almam", "sonra karışmam"), and you never invent a warning of your own. A
  decision the writer stated about their own conduct stays ("artık sessiz
  kalmayacağım"). Keep a concrete consequence they named as a plain statement.
  If there was only a vague threat, keep the objection and say in "kept" that
  the threat was left out.
- Where it fits, end with what the writer wants, using only what they said or
  clearly implied (e.g. "bunu konuşmak istiyorum").

NEVER ADD
- Facts, details, reasons or feelings that are not in the writer's text. If
  they did not say they do most of the dishes, do not write it. If they did
  not say they feel lonely, do not write it.
- Apologies, self-blame, forgiveness, agreement, compliments or
  reconciliation; no assumption that the relationship should continue or end.
- Diagnoses, labels or guesses about the other person's motives; no
  guilt-tripping or manipulation.

FORM
Natural spoken Turkish, first person ("ben"), addressed to the other person
("sen"), calm and honest, usually 1-4 sentences, shorter than or about as long
as the original. Take the earlier messages into account so it reads as a reply
when it is one. If the original is already calm and clear, change little.

"heard": one or two warm Turkish sentences to the writer only ("sen"), never
sent to the other person. Show you took in what this costs them, using a
concrete thing they wrote. No advice, no analysis of the other person, no
"anlıyorum" cliché, and do not repeat the message.

"kept": one short Turkish sentence to the writer ("sen"): what you kept and,
if you left something out (a threat, an insult), that you left it out.

SAFETY: if the writer's text shows that the other person uses violence,
threats, stalking or serious coercion against them, do not rewrite; return
{"safety": true}. Ordinary conflict, anger and hurt are NOT safety cases.

No markdown, no emojis, no quotation marks around the message.
Return ONLY JSON: {"heard": "...", "text": "...", "kept": "...", "safety": false}`;

const EXPLAIN_SYSTEM = `In a two-person conversation room on Mentoriva (a Turkish app), one person
asks you privately to help them understand a message from the other person.
Only the asker will see your answer.

Write in warm, plain Turkish addressed to the asker ("sen"):
- "meaning": 2-3 sentences on what the other person may be trying to say or
  ask for, offered as possibilities ("belki", "olabilir"), based only on the
  conversation. Do not judge who is right, do not diagnose or label anyone, do
  not invent history or motives beyond the text, and do not tell the asker
  that their feelings are wrong.
- "ask": one open, non-defensive question the asker could send to understand
  better (first person, natural).

No markdown, no emojis. Return ONLY JSON: {"meaning": "...", "ask": "..."}`;

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/^["“]+|["”]+$/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export type SoftenResult = { safety: true } | { safety: false; text: string; kept: string; heard: string };

export function parseSoften(raw: unknown): SoftenResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['safety'] === true) return { safety: true };
  const text = clean(o['text'], 1200);
  return text ? { safety: false, text, kept: clean(o['kept'], 240), heard: clean(o['heard'], 300) } : null;
}

export async function softenForRoom(p: {
  topic: string;
  messages: RoomMessage[];
  viewer: 0 | 1;
  raw: string;
  instruction?: SoftenInstruction;
}): Promise<SoftenResult> {
  const user = [
    `<topic>${p.topic}</topic>`,
    `<conversation_so_far>\n${history(p.messages, p.viewer)}\n</conversation_so_far>`,
    `<what_i_want_to_say>\n${p.raw}\n</what_i_want_to_say>`,
    p.instruction ? `[${SOFTEN_INSTRUCTIONS[p.instruction]}]` : '',
  ].filter(Boolean).join('\n\n');
  const parsed = await withRetry(async () => {
    const out = await completeText({
      system: SOFTEN_SYSTEM,
      user,
      maxTokens: 800,
      effort: 'medium',
      feature: 'bridge',
      mock: () => JSON.stringify({ text: `Bunu sana açıkça söylemek istiyorum: ${p.raw.slice(0, 120)}`, kept: 'Asıl söylemek istediğini korudum.', heard: 'Bunu yazmak bile seni yormuş gibi; yükün belli.', safety: false }),
    });
    return parseSoften(extractJson(out));
  });
  if (!parsed) throw new Error('Geçersiz çıktı');
  return parsed;
}

export async function explainForMe(p: { topic: string; messages: RoomMessage[]; viewer: 0 | 1; target: RoomMessage }): Promise<{ meaning: string; ask: string } | null> {
  const user = `<topic>${p.topic}</topic>\n\n<conversation>\n${history(p.messages, p.viewer)}\n</conversation>\n\n<message_to_understand>\n${p.target.text}\n</message_to_understand>`;
  try {
    const out = await completeText({
      system: EXPLAIN_SYSTEM,
      user,
      maxTokens: 400,
      feature: 'bridge',
      mock: () => JSON.stringify({ meaning: 'Belki planlarının da hesaba katılmasını istiyor.', ask: 'Senin için en zor olan kısmı ne?' }),
    });
    const o = extractJson(out) as Record<string, unknown> | null;
    const meaning = clean(o?.['meaning'], 600);
    return meaning ? { meaning, ask: clean(o?.['ask'], 240) } : null;
  } catch {
    return null;
  }
}
