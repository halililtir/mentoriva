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

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';
import type { RoomMessage } from './store';

export const SOFTEN_INSTRUCTIONS = {
  kisa: 'Make it shorter.',
  net: 'Make it clearer and more direct.',
  yumusak: 'Make it gentler in tone, without dropping any point.',
} as const;
export type SoftenInstruction = keyof typeof SOFTEN_INSTRUCTIONS;

function history(messages: RoomMessage[], viewer: 0 | 1): string {
  const last = messages.slice(-10);
  if (!last.length) return '(No messages yet.)';
  return last.map((m) => `${m.from === viewer ? 'ME' : 'OTHER'}: ${m.text}`).join('\n');
}

const SOFTEN_SYSTEM = `You help one person in a two-person conversation room on Mentoriva (a Turkish
app). Each person writes privately what they want to say; you turn it into a
message the other person can hear, and the writer approves it before it is sent.
You are not a judge, a therapist or a mediator who decides who is right.

Preserve:
- the meaning, the request, the complaint and the objection. If they disagree
  or refuse, the message still disagrees or refuses.
- the facts exactly as given. Add no new facts, reasons, feelings or promises.

Do NOT:
- add apologies, self-blame, forgiveness, agreement or reconciliation that are
  not in the original; do not assume the relationship should continue or end.
- diagnose, label or interpret the other person; no sarcasm, threats,
  guilt-tripping or manipulation. Insults and name-calling are removed, but the
  point behind them stays.

Write natural spoken Turkish, first person ("ben" language), addressed to the
other person ("sen"), calm and honest, usually 1-5 sentences. Take the earlier
messages into account so it reads as a reply when it is one.

"kept": one Turkish sentence to the writer ("sen") naming what you kept.

Safety: if the writer's text shows that the other person uses violence,
threats, stalking or serious coercion against them, do not rewrite; return
{"safety": true}. Ordinary conflict, anger and hurt are NOT safety cases.

No markdown, no emojis, no quotation marks around the message.
Return ONLY JSON: {"text": "...", "kept": "...", "safety": false}`;

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

export type SoftenResult = { safety: true } | { safety: false; text: string; kept: string };

export function parseSoften(raw: unknown): SoftenResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['safety'] === true) return { safety: true };
  const text = clean(o['text'], 1200);
  return text ? { safety: false, text, kept: clean(o['kept'], 240) } : null;
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
  const out = await completeText({
    system: SOFTEN_SYSTEM,
    user,
    maxTokens: 600,
    effort: 'medium',
    feature: 'bridge',
    mock: () => JSON.stringify({ text: `Bunu sana açıkça söylemek istiyorum: ${p.raw.slice(0, 120)}`, kept: 'Asıl söylemek istediğini korudum.', safety: false }),
  });
  const parsed = parseSoften(extractJson(out));
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
