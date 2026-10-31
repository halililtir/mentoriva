'use client';

import Image from 'next/image';
import { getAccent, getActiveMentor } from '@/lib/mentors/metadata';
import type { StudyFinish } from '@/lib/studies/guided-content';

/** İki farklı mentorun bu meseleye bakışı. */
export function StudyPerspectives({ result }: { result: StudyFinish }) {
  const list = result.perspectives ?? [];
  const crux = result.decision?.crux;
  if (!list.length && !crux) return null;
  // Başlık ancak gerçekten iki ayrı taraf varsa bunu söyler
  const split = list.length === 2 && !!list[0]?.side && !!list[1]?.side && list[0].side !== list[1].side;
  return (
    <div>
      {list.length > 0 && <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{split ? 'İki mentor, iki taraf' : list.length > 1 ? 'İki farklı bakış' : 'Bir bakış'}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((p) => {
          const m = getActiveMentor(p.mentor);
          const a = getAccent(m.accentColor);
          return (
            <div key={p.mentor} className="rounded-2xl border p-4" style={{ borderColor: a.border, background: a.bg }}>
              <div className="flex items-center gap-2">
                <span className="relative h-7 w-7 overflow-hidden rounded-full border" style={{ borderColor: a.hex }}>
                  <Image src={m.portraitUrl} alt="" fill sizes="28px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
                </span>
                <span className="font-display text-[15px]" style={{ color: a.text }}>{m.shortName}</span>
              </div>
              {p.side && <p className="mt-2 font-display text-lg leading-snug text-white/95">{p.side}</p>}
              <p className="mt-2 text-[14px] leading-relaxed text-white/80">{p.text}</p>
            </div>
          );
        })}
      </div>
      {crux && (
        <div className="mt-3 rounded-2xl border border-brand-400/30 bg-brand-500/[0.06] p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-300">Ayrıldıkları yer</p>
          <p className="mt-1.5 font-display text-lg leading-snug text-white/95">{crux}</p>
        </div>
      )}
    </div>
  );
}

/** Çalışmanın somut ürünü: karar haritası, söylemeye hazır cümle, değerler ya da döngü. */
export function StudyOutcome({ result, onPrepare }: { result: StudyFinish; onPrepare: (sentence: string, want: string) => void }) {
  if (result.decision) {
    const d = result.decision;
    return (
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Karar haritan</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {d.options.map((o) => (
            <div key={o.name} className="rounded-2xl border border-white/[0.08] p-4">
              <p className="font-display text-lg text-white/95">{o.name}</p>
              {o.gives.length > 0 && (
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70"><span className="text-emerald-300/80">Kazandırdığı:</span> {o.gives.join(', ')}</p>
              )}
              {o.costs.length > 0 && (
                <p className="mt-1 text-[13.5px] leading-relaxed text-white/70"><span className="text-amber-300/80">Bedeli:</span> {o.costs.join(', ')}</p>
              )}
              {o.serves && <p className="mt-2 text-[12.5px] text-white/45">Hizmet ettiği: {o.serves}</p>}
            </div>
          ))}
        </div>
        {d.leaning && <p className="mt-4 rounded-2xl bg-white/[0.03] px-4 py-3 text-[15px] leading-relaxed text-white/85">{d.leaning}</p>}
        {d.consider && <Highlight label="Belki düşünmediğin bir yol" text={d.consider} />}
        <p className="mt-2 text-[12px] text-white/35">Tablo anlattıklarından çıktı. Son söz senin.</p>
      </div>
    );
  }

  if (result.boundary) {
    const b = result.boundary;
    return (
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Sınırın</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {b.line && <Box label="Sana fazla gelen" text={b.line} />}
          {b.want && <Box label="Yerine istediğin" text={b.want} />}
        </div>
        <div className="rounded-2xl border border-brand-400/30 bg-brand-500/[0.06] p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-300">Söyleyebileceğin bir cümle</p>
          <p className="mt-2 font-display text-lg leading-snug text-white/95">&ldquo;{b.sentence}&rdquo;</p>
          <button onClick={() => onPrepare(b.sentence, b.want)} className="mt-3 text-[13px] text-brand-300 hover:underline">
            Bu cümleyi Söyleyeceğimi hazırla&apos;da geliştir →
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {b.ifSay && <Box label="Söylersen" text={b.ifSay} />}
          {b.ifNot && <Box label="Söylemezsen" text={b.ifNot} />}
        </div>
        {b.protects && <Highlight label="Bu sınır neyi koruyor olabilir" text={b.protects} />}
      </div>
    );
  }

  if (result.values) {
    return (
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Senin için önemli olan</p>
        <div className="mt-3 space-y-3">
          {result.values.map((v) => (
            <div key={v.name} className="rounded-2xl border border-white/[0.08] p-4">
              <p className="font-display text-lg text-white/95">{v.name}</p>
              {v.present && <p className="mt-1.5 text-[13.5px] text-white/70"><span className="text-emerald-300/80">Hayatında var:</span> {v.present}</p>}
              {v.missing && <p className="mt-1 text-[13.5px] text-white/70"><span className="text-amber-300/80">Eksik kalıyor:</span> {v.missing}</p>}
            </div>
          ))}
        </div>
        {result.valuesTension && <Highlight label="Fark etmemiş olabileceğin bir gerilim" text={result.valuesTension} />}
        {result.valuesAsk && <Highlight label="Bu hafta senden isteyebileceği" text={result.valuesAsk} />}
      </div>
    );
  }

  if (result.cycle) {
    const c = result.cycle;
    return (
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Dönüp duran döngü</p>
        <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Box label="Ne olunca" text={c.trigger} />
          <span className="self-center text-white/30" aria-hidden="true">→</span>
          <Box label="Ne yapıyorsun" text={c.response} />
          <span className="self-center text-white/30" aria-hidden="true">→</span>
          <Box label="Ne oluyor" text={c.result} />
        </div>
        {c.gives && <Highlight label="Bu döngü sana ne kazandırıyor olabilir" text={c.gives} />}
        {c.experiment && (
          <div className="mt-3 rounded-2xl border border-brand-400/30 bg-brand-500/[0.06] p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-300">Bir dahaki sefere dene</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/90">{c.experiment}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function Highlight({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/85">{text}</p>
    </div>
  );
}

function Box({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/[0.08] p-3.5">
      <p className="text-[11px] text-white/40">{label}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-white/85">{text}</p>
    </div>
  );
}
