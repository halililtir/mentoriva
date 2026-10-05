'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getActiveMentor, getAccent } from '@/lib/mentors/metadata';
import { RECOMMEND_TEXT_MAX, RECOMMEND_TEXT_MIN, type MentorPick } from '@/lib/mentors/recommend-public';
import { EmergencyLine } from '@/components/mentors/EmergencyLine';
import { track } from '@/lib/analytics';
import { useSession } from '@/lib/session';
import { GuestConsent } from '@/components/shared/GuestConsent';
import type { MentorId } from '@/types';

interface Props {
  /** Önerilen mentorlarla soru ekranına geç; yazılan metin soru olarak hazır gelir. */
  onUse: (text: string, ids: MentorId[]) => void;
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; picks: MentorPick[] }
  | { kind: 'crisis'; message: string }
  | { kind: 'error'; message: string };

/**
 * "Kimi seçeceğini bilmiyor musun?" — kişi meselesini yazar, Mentoriva uygun
 * mentorları kısa gerekçeyle önerir (hak kullanmaz, metin saklanmaz).
 */
export function MentorFinder({ onUse }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const isGuest = useSession().status === 'guest';
  const [consent, setConsent] = useState(false);

  const ask = async () => {
    const t = text.trim();
    if (t.length < RECOMMEND_TEXT_MIN || state.kind === 'loading' || (isGuest && !consent)) return;
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/v1/mentors/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, ...(isGuest ? { consent: true } : {}) }),
      });
      const data = (await res.json().catch(() => null)) as { picks?: MentorPick[]; crisis?: string; error?: string | { message?: string } } | null;
      const errorText = typeof data?.error === 'string' ? data.error : data?.error?.message;
      if (data?.crisis) return setState({ kind: 'crisis', message: data.crisis });
      if (!res.ok || !data?.picks?.length) return setState({ kind: 'error', message: errorText ?? 'Şu an öneri hazırlanamadı. Mentorları aşağıdan kendin seçebilirsin.' });
      track('mentor_recommend', { picks: data.picks.length });
      setState({ kind: 'done', picks: data.picks });
    } catch {
      setState({ kind: 'error', message: 'Bağlantı kurulamadı. Biraz sonra tekrar dene.' });
    }
  };

  if (!open) {
    return (
      <div className="mx-auto mt-6 flex max-w-xl justify-center">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/[0.06] px-4 py-2 text-sm text-white/75 transition hover:border-brand-500/45 hover:text-white"
        >
          Kimi seçeceğini bilmiyor musun? <span className="text-brand-300">Meseleni yaz, önerelim</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass mx-auto mt-6 max-w-xl rounded-2xl p-5 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-white/90">Meseleni anlat, sana uygun mentorları önerelim</p>
          <p className="mt-1 text-xs text-white/45">Birkaç cümle yeter. Öneri hak kullanmaz; yazdığın saklanmaz ve istersen soru olarak hazır gelir.</p>
        </div>
        <button onClick={() => { setOpen(false); setState({ kind: 'idle' }); }} className="text-xs text-white/35 hover:text-white/70" aria-label="Kapat">
          Kapat
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); if (state.kind !== 'loading') setState({ kind: 'idle' }); }}
        maxLength={RECOMMEND_TEXT_MAX}
        rows={3}
        placeholder="Örneğin: İşimde mutsuzum ama ayrılmaya cesaret edemiyorum, ailem de karşı çıkıyor."
        className="input-field mt-4 min-h-[96px] w-full resize-y text-base"
        aria-label="Meselen"
      />
      {isGuest && <GuestConsent checked={consent} onChange={setConsent} className="mt-3" />}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-white/30">{text.length}/{RECOMMEND_TEXT_MAX}</span>
        <button onClick={() => void ask()} disabled={text.trim().length < RECOMMEND_TEXT_MIN || state.kind === 'loading' || (isGuest && !consent)} className="btn-primary !px-5 !py-2.5 text-sm">
          {state.kind === 'loading' ? 'Düşünülüyor…' : 'Mentor öner'}
        </button>
      </div>

      {state.kind === 'done' && (
        <div className="mt-5 space-y-3" aria-live="polite">
          {state.picks.map((p) => {
            const m = getActiveMentor(p.id);
            const a = getAccent(m.accentColor);
            return (
              <div key={p.id} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: a.border, background: a.bg }}>
                <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: a.hex }}>
                  <Image src={m.portraitUrl} alt="" fill sizes="40px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm" style={{ color: a.text }}>{m.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/75">{p.why}</p>
                </div>
              </div>
            );
          })}
          <button onClick={() => onUse(text.trim(), state.picks.map((p) => p.id))} className="btn-primary w-full justify-center text-sm">
            {state.picks.length > 1 ? 'Bu mentorlara sor' : `${getActiveMentor(state.picks[0]!.id).shortName} ile başla`}
          </button>
        </div>
      )}

      {state.kind === 'crisis' && (
        <div role="alert" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-relaxed text-amber-100/85">
          {state.message}
          <EmergencyLine message={state.message} className="mt-2 font-medium text-amber-100" />
        </div>
      )}
      {state.kind === 'error' && <p className="mt-4 text-sm text-red-300/90">{state.message}</p>}
    </div>
  );
}
