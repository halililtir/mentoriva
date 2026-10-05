'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { canUseMentor } from '@/lib/mentors/access';
import { useEarlyMentors } from '@/lib/useEarlyMentors';
import { cn } from '@/lib/cn';
import type { MentorId } from '@/types';

interface Props {
  hostId: MentorId;
  perks: readonly string[];
  onPick: (id: MentorId) => void;
}

/**
 * Sohbetin altında "Başka bir bakış ekle": başka bir mentor bu sohbeti okuyup
 * kendi bakışını tek mesajla ekler (1 hak). Erken erişimdeki mentor kilitli görünür.
 */
export function PerspectivePicker({ hostId, perks, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const early = useEarlyMentors();
  const others = ACTIVE_MENTORS.filter((m) => m.id !== hostId);

  if (!open) {
    return (
      <div className="flex justify-center pt-1 animate-fade-in">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white/85"
        >
          <span aria-hidden="true" className="text-sm leading-none">＋</span>
          Başka bir bakış ekle
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/80">Bu sohbete kimin bakışını eklemek istersin?</p>
          <p className="mt-0.5 text-[11px] text-white/40">Seçtiğin mentor sohbeti okur ve kendi bakışını ekler. 1 hak kullanır; sonra sohbetine kaldığın yerden devam edersin.</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-xs text-white/35 hover:text-white/70" aria-label="Kapat">
          Vazgeç
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {others.map((m) => {
          const id = m.id as MentorId;
          const locked = !canUseMentor(id, perks, early);
          const accent = getAccent(m.accentColor);
          return (
            <button
              key={id}
              disabled={locked}
              onClick={() => { setOpen(false); onPick(id); }}
              title={locked ? 'Erken erişimde: Kurucu Üye ve Destekçilere açık' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition',
                locked ? 'cursor-not-allowed border-white/[0.06] text-white/30' : 'border-white/10 text-white/80 hover:bg-white/[0.05]',
              )}
              style={locked ? undefined : { borderColor: accent.border }}
            >
              <span className={cn('relative h-6 w-6 overflow-hidden rounded-full', locked && 'grayscale')}>
                <Image src={m.portraitUrl} alt="" fill sizes="24px" className="object-cover" style={{ objectPosition: m.portraitPosition ?? 'center' }} />
              </span>
              {m.shortName}
              {locked && <span aria-hidden="true">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
