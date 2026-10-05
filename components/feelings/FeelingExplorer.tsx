'use client';

import { useState } from 'react';
import { FEELINGS, FEELING_BY_ID, FEELING_GROUPS, type FeelingGroup } from '@/lib/feelings/content';
import { cn } from '@/lib/cn';

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  /** Başta açık grup; yoksa hepsi kapalı başlar. */
  initialGroup?: FeelingGroup;
}

/**
 * Serbestçe gezilebilen duygu sözlüğü. Gruplar iyi/kötü değil, duygunun
 * içte yarattığı harekettir. Bir duyguya dokununca açıklaması ve yakın bir
 * duygudan farkı açılır; seçmek ayrı bir dokunuştur.
 */
export function FeelingExplorer({ selected, onToggle, initialGroup }: Props) {
  const [group, setGroup] = useState<FeelingGroup | null>(initialGroup ?? null);
  const [open, setOpen] = useState<string | null>(null);
  const groups = Object.entries(FEELING_GROUPS) as Array<[FeelingGroup, (typeof FEELING_GROUPS)[FeelingGroup]]>;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Duygu grupları">
        {groups.map(([id, g]) => (
          <button
            key={id}
            role="tab"
            aria-selected={group === id}
            onClick={() => { setGroup(group === id ? null : id); setOpen(null); }}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] transition',
              group === id ? 'border-white/25 bg-white/[0.07] text-white' : 'border-white/10 text-white/60 hover:text-white/85',
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: g.hex }} aria-hidden="true" />
            {g.label}
          </button>
        ))}
      </div>

      {group && (
        <div className="mt-4 animate-fade-in">
          <p className="text-[12.5px] text-white/45">{FEELING_GROUPS[group].hint}</p>
          <ul className="mt-3 space-y-2">
            {FEELINGS.filter((f) => f.group === group).map((f) => {
              const isOn = selected.includes(f.id);
              const isOpen = open === f.id;
              const near = f.near ? FEELING_BY_ID.get(f.near.id) : undefined;
              return (
                <li key={f.id} className={cn('rounded-xl border transition', isOn ? 'border-white/25 bg-white/[0.05]' : 'border-white/[0.07]')}>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button onClick={() => setOpen(isOpen ? null : f.id)} className="flex-1 text-left text-[14.5px] text-white/85" aria-expanded={isOpen}>
                      {f.name}
                      <span className="ml-2 text-[11px] text-white/30">{isOpen ? 'kapat' : 'ne demek?'}</span>
                    </button>
                    <button
                      onClick={() => onToggle(f.id)}
                      aria-pressed={isOn}
                      className={cn(
                        'rounded-full border px-3 py-1 text-[12px] transition',
                        isOn ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-white/10 text-white/55 hover:text-white/85',
                      )}
                    >
                      {isOn ? 'Bana yakın ✓' : 'Bana yakın'}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-white/[0.06] px-3 py-2.5 text-[13px] leading-relaxed text-white/60 animate-fade-in">
                      <p>{f.desc}</p>
                      {f.near && near && (
                        <p className="mt-1.5 text-white/45">
                          <span className="text-white/60">{near.name} ile farkı:</span> {f.near.diff}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
