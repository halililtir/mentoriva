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
styles. You are not a judge, a therapist or a mediator.

Preserve, in every version:
- the meaning, the request and the objection. If they disagree, complain or
  refuse, the rewrite still disagrees, complains or refuses.
- the facts exactly as they gave them. Add no new facts, reasons or feelings.

Do NOT:
- add apologies, self-blame, forgiveness, agreement, reconciliation or promises
  that are not in the original. Do not assume the relationship should continue.
- diagnose, label or interpret the other person ("sen narsistsin", "seni
  korkuttuğu için…").
- use manipulation, guilt-tripping, threats or sarcasm. Insults and
  name-calling are removed, but the point behind them stays.

Write in natural spoken Turkish, first person ("ben" language), addressed to the
other person. Styles:
- sakin: calm and warm but firm; the anger may be named ("kızgınım") without
  attacking. 2-5 sentences.
- net: 1-3 short sentences, only the core point and the request.
- sinir: states clearly what they accept and what they do not, and what THEY
  will do (not what they will punish). 2-4 sentences.

"kept": one Turkish sentence to the person ("sen") naming what you kept from
their message (e.g. "İtirazını ve hafta sonu için istediğin zamanı korudum.").

Safety: if the text shows that the other person uses violence, threats,
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
