/**
 * "Söyleyeceğimi hazırla" — kişinin birine söylemek istediğini, anlamını ve
 * itirazını koruyarak yeniden ifade eder: daha sakin, kısa ve net, sınırını
 * koruyan. Uzlaşmayı, özrü ya da affetmeyi varsayılan doğru saymaz; hakem
 * olmaz. Metin saklanmaz.
 *
 * Karşı taraftan şiddet, tehdit ya da baskı anlatılıyorsa yeniden yazmaz
 * (`safety`); bu durumda "sakin konuş" önerisi zarar verebilir.
 */

import { completeText } from '@/lib/claude/client';
import { extractJson } from '@/lib/journey/schema';

import { PREPARE_LIMITS, PREPARE_STYLE_IDS, PREPARE_STYLES, type PrepareResult, type PrepareStyle } from './prepare-public';

export { PREPARE_LIMITS, PREPARE_STYLE_IDS, PREPARE_STYLES, type PrepareResult, type PrepareStyle };

export interface PrepareInput {
  to: string;
  text: string;
  matters: string;
  styles: PrepareStyle[];
}

const SYSTEM = `You help a person on Mentoriva (a Turkish app) prepare something they want
to say to someone in their life. You rewrite THEIR message in the requested
styles so the other person can actually hear it. You are not a judge, a
therapist or a mediator.

WHAT STAYS (in every version)
- The point: the complaint, the request, the objection, the refusal, the
  decision. If they disagree, every version disagrees. A deadline or a real
  consequence they named (moving out, ending something, not coming, raising it
  openly) stays, said plainly as their decision.
- The strength of the feeling. "Bıktım" may become "artık çok yoruldum" but
  must not turn into mild annoyance.

WHAT CHANGES (in every version, including the short one; a near-copy of an
angry text is a failure)
- Verdicts about the other person ("beni hiç dinlemiyorsun", "hep sen
  istiyorsun", "sadece kendine harcıyorsun", "bencilsin") become the writer's
  own experience: what happens and how it lands on them ("söz hakkım yokmuş
  gibi hissediyorum"). Drop "hiçbir zaman / hep / her zaman / sadece" when used
  as a verdict on the person; describe the pattern the writer named instead.
- Sarcasm and irony are translated into what they literally mean, nothing more.
- Insults, name-calling and self-insults are removed; the point behind them stays.
- Threats are never passed on, not even veiled ones ("görürsün", "hafife
  almam", "görmezden gelmem", "sessiz kalmam" used as a warning). Keep only a
  concrete action the writer actually named, as a plain statement. If there was
  only a vague threat, keep the objection and the request, and say in "kept"
  that the threat was left out.
- Where it fits, end with what the writer wants, using only what they said or
  clearly implied.

NEVER ADD
- Facts, details, reasons or feelings that are not in the writer's text. If
  they did not say they do most of the dishes, do not write it.
- Promises or offers from the writer ("ben de payıma düşeni yapacağım"),
  apologies, self-blame, forgiveness, agreement, compliments or reconciliation
  that are not in the original. Do not assume the relationship should continue
  or end.
- Diagnoses, labels or guesses about the other person's motives
  ("sen narsistsin", "seni korkuttuğu için…"); no guilt-tripping or manipulation.

FORM
Natural spoken Turkish, first person ("ben"), addressed to the other person.
Match the address to who they are (e.g. "siz" for a manager if the writer used
it or it clearly fits). Styles:
- sakin: calm and warm but firm; the anger may be named ("kızgınım") without
  attacking. 2-4 sentences.
- net: 1-2 short sentences: the core point as the writer's experience and the
  request. Short does not mean blunt verdicts.
- sinir: what they accept and what they do not, and what THEY will do (not
  what they will punish). 2-4 sentences.

"kept": one short Turkish sentence to the person ("sen"): what you kept and,
if you left something out (a threat, an insult), that you left it out.

SAFETY: if the text shows that the other person uses violence, threats,
stalking or serious coercion against them, do not rewrite; return
{"safety": true}. Ordinary conflict, anger and hurt are NOT safety cases.

No markdown, no quotation marks around the versions, no emojis.
Return ONLY JSON: {"versions": [{"style": "sakin|net|sinir", "text": "..."}], "kept": "...", "safety": false}`;

function userMessage(input: PrepareInput): string {
  return [
    input.to ? `<to>${input.to}</to>` : '',
    `<message>\n${input.text}\n</message>`,
    input.matters ? `<what_matters_to_me>\n${input.matters}\n</what_matters_to_me>` : '',
    `<styles>${input.styles.join(', ')}</styles>`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[*#_`]/g, '').replace(/^["“]+|["”]+$/g, '').trim().slice(0, max) : '';

export function parsePrepare(raw: unknown, styles: PrepareStyle[]): PrepareResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['safety'] === true) return { versions: [], kept: '', safety: true };
  const versions: PrepareResult['versions'] = [];
  if (Array.isArray(o['versions'])) {
    for (const v of o['versions']) {
      if (!v || typeof v !== 'object') continue;
      const style = (v as Record<string, unknown>)['style'];
      const text = clean((v as Record<string, unknown>)['text'], 1200);
      if (typeof style !== 'string' || !styles.includes(style as PrepareStyle) || !text) continue;
      if (versions.some((x) => x.style === style)) continue;
      versions.push({ style: style as PrepareStyle, text });
    }
  }
  if (!versions.length) return null;
  return { versions, kept: clean(o['kept'], 240), safety: false };
}

export function sanitizePrepare(body: Record<string, unknown> | null): PrepareInput | string {
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const text = typeof body?.['text'] === 'string' ? body['text'].trim() : '';
  if (text.length < 10) return 'Söylemek istediğini birkaç kelimeyle de olsa yaz.';
  if (text.length > PREPARE_LIMITS.text) return `En fazla ${PREPARE_LIMITS.text} karakter yazabilirsin.`;
  const styles = Array.isArray(body?.['styles']) ? PREPARE_STYLE_IDS.filter((id) => (body['styles'] as unknown[]).includes(id)) : [];
  if (!styles.length) return 'En az bir biçim seç.';
  return { to: s(body?.['to'], PREPARE_LIMITS.to), text, matters: s(body?.['matters'], PREPARE_LIMITS.matters), styles };
}

function mock(input: PrepareInput): string {
  return JSON.stringify({
    versions: input.styles.map((style) => ({ style, text: `(${PREPARE_STYLES[style].label}) Bunu sana açıkça söylemek istiyorum: ${input.text.slice(0, 120)}` })),
    kept: 'Söylemek istediğin asıl noktayı ve isteğini korudum.',
    safety: false,
  });
}

/** Hata fırlatır (çağıran hakkı iade eder). */
export async function prepareMessage(input: PrepareInput): Promise<PrepareResult> {
  const out = await completeText({
    system: SYSTEM,
    user: userMessage(input),
    maxTokens: 1200,
    effort: 'medium',
    feature: 'prepare',
    mock: () => mock(input),
  });
  const parsed = parsePrepare(extractJson(out), input.styles);
  if (!parsed) throw new Error('Geçersiz çıktı');
  return parsed;
}
