'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { DRAFT_KEY } from '@/lib/flow-keys';
import { PREPARE_DRAFT_KEY } from '@/lib/prepare-public';
import { CARD_LIMITS, FEELINGS } from '@/lib/feelings/content';
import { SMALL_STEPS, SMALL_STEP_IDS, type SmallStepId } from '@/lib/journey/content';
import { cardToNote, cardToQuestion, type CardDraft } from '@/lib/feelings/card';

export type { CardDraft };

interface Props {
  initial: CardDraft;
  /** Misafir "kaydet" dedi: kartı sekmede sakla, kayda yönlendir. */
  onGuestSave: (card: CardDraft) => void;
  onSaved: () => void;
  onRestart: () => void;
}

type Path = 'understand' | 'step' | 'enough' | null;

/**
 * Farkındalık kartı: kişi her alanı düzenleyip onaylar. Devam yolları
 * zorunlu değil; "şimdilik bu kadar" da bir sonuçtur.
 */
export function FeelingCardView({ initial, onGuestSave, onSaved, onRestart }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [card, setCard] = useState<CardDraft>(initial);
  const [newFeeling, setNewFeeling] = useState('');
  const [path, setPath] = useState<Path>(null);
  const [stepId, setStepId] = useState<SmallStepId | null>(null);
  const [stepDetail, setStepDetail] = useState('');
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [stepSave, setStepSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  /** "Mentorlar hatırlasın": düzenlenebilir not taslağı (null = kapalı). */
  const [memo, setMemo] = useState<string | null>(null);
  const [memoState, setMemoState] = useState<'idle' | 'saved' | 'error'>('idle');

  const saveMemo = async () => {
    if (!memo?.trim()) return;
    const res = await fetch('/api/v1/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: memo, source: 'card' }) }).catch(() => null);
    setMemoState(res?.ok ? 'saved' : 'error');
  };

  const set = <K extends keyof CardDraft>(k: K, v: CardDraft[K]) => { setCard((c) => ({ ...c, [k]: v })); if (save === 'saved') setSave('idle'); };
  const isMember = status === 'user';

  const saveCard = async () => {
    if (!isMember) return onGuestSave(card);
    setSave('saving');
    try {
      const res = await fetch('/api/v1/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'feelings', card }) });
      if (!res.ok) throw new Error();
      setSave('saved');
      track('feelings_card_saved');
      onSaved();
    } catch {
      setSave('error');
    }
  };

  const saveStep = async () => {
    if (!stepId) return;
    const label = `${SMALL_STEPS[stepId]}${stepDetail.trim() ? `: ${stepDetail.trim()}` : ''}`;
    set('step', label);
    if (!isMember) return;
    setStepSave('saving');
    try {
      const res = await fetch('/api/v1/journey/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, detail: stepDetail.trim(), topic: card.feelings.join(', ') }),
      });
      setStepSave(res.ok ? 'saved' : 'error');
    } catch {
      setStepSave('error');
    }
  };

  const toMentor = () => {
    try { sessionStorage.setItem(DRAFT_KEY, cardToQuestion(card)); } catch {}
    track('feelings_to_mentor');
    router.push('/#mentorlar');
  };

  const toPrepare = () => {
    try {
      sessionStorage.setItem(PREPARE_DRAFT_KEY, JSON.stringify({ matters: [...card.matters, card.note].filter(Boolean).join(', ') }));
    } catch {}
    track('feelings_to_prepare');
    router.push('/hazirla');
  };

  const known = FEELINGS.filter((f) => card.feelings.includes(f.name));

  return (
    <section className="animate-fade-up">
      <h2 className="font-display text-2xl sm:text-3xl">Farkındalık kartın</h2>
      <p className="mt-2 text-sm text-white/50">Her satırı değiştirebilirsin. Kart senin cümlelerinle anlamlı.</p>

      <div className="glass relative mt-6 overflow-hidden rounded-3xl p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
        <Field label="Yaşadığım durum">
          <textarea value={card.situation} onChange={(e) => set('situation', e.target.value.slice(0, CARD_LIMITS.situation))} rows={3} className="input-field w-full resize-y text-base" />
        </Field>

        <Field label="Bana yakın gelen duygular">
          <div className="flex flex-wrap gap-2">
            {card.feelings.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] py-1 pl-3 pr-1.5 text-[13.5px] text-white/85">
                {f}
                <button onClick={() => set('feelings', card.feelings.filter((x) => x !== f))} className="rounded-full px-1.5 text-white/40 hover:text-white" aria-label={`${f} çıkar`}>×</button>
              </span>
            ))}
            {card.feelings.length < CARD_LIMITS.items && (
              <input
                value={newFeeling}
                onChange={(e) => setNewFeeling(e.target.value.slice(0, CARD_LIMITS.item))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFeeling.trim()) { e.preventDefault(); set('feelings', [...card.feelings, newFeeling.trim()]); setNewFeeling(''); }
                }}
                placeholder="+ ekle"
                className="w-28 rounded-full border border-dashed border-white/15 bg-transparent px-3 py-1 text-[13.5px] text-white/80 placeholder:text-white/30 focus:outline-none"
                aria-label="Duygu ekle"
              />
            )}
          </div>
        </Field>

        <Field label="Aklımdan geçen yorum" hint="isteğe bağlı">
          <input value={card.thought} onChange={(e) => set('thought', e.target.value.slice(0, CARD_LIMITS.thought))} placeholder="Örneğin: Beni önemsemiyorlar" className="input-field w-full text-base" />
        </Field>

        <Field label="Benim için önemli olan">
          {card.matters.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {card.matters.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] py-1 pl-3 pr-1.5 text-[13.5px] text-white/85">
                  {m}
                  <button onClick={() => set('matters', card.matters.filter((x) => x !== m))} className="rounded-full px-1.5 text-white/40 hover:text-white" aria-label={`${m} çıkar`}>×</button>
                </span>
              ))}
            </div>
          )}
          <input value={card.note} onChange={(e) => set('note', e.target.value.slice(0, CARD_LIMITS.note))} placeholder="Kendi kelimelerinle…" className="input-field w-full text-base" />
        </Field>

        {card.step && (
          <Field label="Seçtiğim adım">
            <p className="text-[15px] text-white/85">{card.step}</p>
          </Field>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={() => void saveCard()} disabled={save === 'saving' || save === 'saved'} className="btn-primary text-sm">
            {save === 'saved' ? 'Kaydedildi ✓' : save === 'saving' ? 'Kaydediliyor…' : isMember ? 'Kartımı kaydet' : 'Kaydetmek için ücretsiz üye ol'}
          </button>
          {save === 'error' && <span className="text-sm text-red-300/90">Kaydedilemedi, tekrar dene.</span>}
          {!isMember && <span className="text-[12px] text-white/35">Kartın üye olduktan sonra burada seni bekler.</span>}
          {isMember && memo === null && (
            <button onClick={() => setMemo(cardToNote(card))} className="text-[13px] text-white/50 hover:text-white">
              Mentorlar hatırlasın…
            </button>
          )}
        </div>
        {isMember && memo !== null && (
          <div className="mt-4 rounded-2xl border border-white/[0.08] p-3">
            <p className="text-[12px] text-white/45">Sonraki sohbetlerde mentorların bilmesini istediğin cümle (düzenleyebilirsin):</p>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value.slice(0, 200))} rows={2} className="mt-1 w-full resize-none bg-transparent text-[14px] leading-relaxed text-white/85 focus:outline-none" aria-label="Hatırlanacak not" />
            <div className="flex items-center gap-3">
              <button onClick={() => void saveMemo()} disabled={!memo.trim() || memoState === 'saved'} className="btn-secondary !py-1.5 text-[13px]">
                {memoState === 'saved' ? 'Hafızana eklendi ✓' : 'Hafızama ekle'}
              </button>
              <button onClick={() => { setMemo(null); setMemoState('idle'); }} className="text-[12px] text-white/40">Vazgeç</button>
              {memoState === 'error' && <span className="text-[12px] text-red-300/90">Eklenemedi.</span>}
            </div>
          </div>
        )}
      </div>

      <h3 className="mt-10 font-display text-xl">Şimdi ne yapmak istersin?</h3>
      <p className="mt-1 text-sm text-white/45">Hiçbirini seçmek zorunda değilsin. Her duygu hemen çözülmesi gereken bir şey değil.</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <PathButton active={path === 'understand'} onClick={() => setPath(path === 'understand' ? null : 'understand')} title="Biraz daha anlamak" desc="Seçtiğin duyguların ne anlattığına ve yakınlarından farkına bak." />
        <PathButton onClick={toMentor} title="Bir mentorla düşünmek" desc="Kartın soru olarak hazır gelir; mentoru sen seçersin." />
        <PathButton onClick={toPrepare} title="Söyleyeceğimi hazırlamak" desc="Birine söylemek istediğini daha sakin ya da net ifade et." />
        <PathButton active={path === 'step'} onClick={() => setPath(path === 'step' ? null : 'step')} title="Küçük bir adım belirlemek" desc="İstersen kendine küçük, yapılabilir bir adım seç." />
        <PathButton active={path === 'enough'} onClick={() => setPath('enough')} title="Şimdilik fark etmek yeter" desc="Bazen adını koymak yeterlidir." className="sm:col-span-2" />
      </div>

      {path === 'understand' && (
        <div className="mt-5 space-y-3 animate-fade-in">
          {known.length === 0 && <p className="text-sm text-white/50">Kartındaki kelimeler sözlükte yok; kendi kelimelerin de gayet geçerli. İstersen <Link href="/yolculuk" className="underline">Kendine Yolculuk</Link> ile daha uzun bir çalışma yapabilirsin.</p>}
          {known.map((f) => (
            <div key={f.id} className="rounded-2xl border border-white/[0.08] p-4">
              <p className="font-display text-lg">{f.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{f.desc}</p>
              {f.near && <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">{f.near.diff}</p>}
            </div>
          ))}
        </div>
      )}

      {path === 'step' && (
        <div className="mt-5 rounded-2xl border border-white/[0.08] p-4 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {SMALL_STEP_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setStepId(id)}
                aria-pressed={stepId === id}
                className={cn('rounded-full border px-3.5 py-2 text-[13px] transition', stepId === id ? 'border-brand-400/50 bg-brand-500/[0.09] text-white' : 'border-white/10 text-white/60')}
              >
                {SMALL_STEPS[id]}
              </button>
            ))}
          </div>
          <input value={stepDetail} onChange={(e) => setStepDetail(e.target.value.slice(0, 200))} placeholder="Ne zaman, kiminle, nasıl? (isteğe bağlı)" className="input-field mt-3 w-full text-base" />
          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => void saveStep()} disabled={!stepId || stepSave === 'saving'} className="btn-secondary text-sm">
              {stepSave === 'saved' ? 'Adımın kaydedildi ✓' : 'Bu adımı seç'}
            </button>
            <span className="text-[12px] text-white/35">
              {isMember ? 'Birkaç gün sonra ana sayfada nasıl geçtiğini nazikçe sorarız.' : 'Adım kartına eklenir.'}
            </span>
          </div>
          {stepSave === 'error' && <p className="mt-2 text-sm text-red-300/90">Adım kaydedilemedi.</p>}
        </div>
      )}

      {path === 'enough' && (
        <p className="mt-5 rounded-2xl border border-white/[0.08] p-4 text-[15px] leading-relaxed text-white/70 animate-fade-in">
          Yaşadığına bir ad vermek küçük ama gerçek bir adımdır. İstediğin zaman geri gelebilirsin.
        </p>
      )}

      <div className="mt-10 text-center">
        <button onClick={onRestart} className="text-sm text-white/40 hover:text-white/70">Yeni bir kart başlat</button>
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="relative mt-4 first:mt-0">
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-white/40">
        {label} {hint && <span className="normal-case tracking-normal text-white/25">({hint})</span>}
      </p>
      {children}
    </div>
  );
}

function PathButton({ title, desc, onClick, active, className }: { title: string; desc: string; onClick: () => void; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-2xl border px-4 py-3.5 text-left transition', active ? 'border-brand-400/50 bg-brand-500/[0.08]' : 'border-white/[0.08] hover:border-white/20', className)}
    >
      <span className="block text-[15px] text-white/90">{title}</span>
      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/45">{desc}</span>
    </button>
  );
}
