'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Card, Pill, fmtDateTime } from './shared';

export interface ErrorEntry {
  source: 'server' | 'client';
  where: string;
  message: string;
  path?: string;
  at: string;
}

/** Aynı mesajlar gruplanır: kaç kez, en son ne zaman. */
export function ErrorsList({ entries }: { entries: ErrorEntry[] }) {
  const [source, setSource] = useState<'all' | 'server' | 'client'>('all');

  const groups = useMemo(() => {
    const map = new Map<string, { sample: ErrorEntry; count: number; last: string }>();
    for (const e of entries) {
      if (source !== 'all' && e.source !== source) continue;
      const key = `${e.source}|${e.where}|${e.message}`;
      const g = map.get(key);
      if (g) { g.count++; if (e.at > g.last) g.last = e.at; } else map.set(key, { sample: e, count: 1, last: e.at });
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [entries, source]);

  return (
    <Card
      title="Son hatalar"
      action={
        <div className="flex gap-1.5">
          {(['all', 'server', 'client'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={cn('rounded-full border px-2.5 py-0.5 text-[11px]', source === s ? 'border-brand-500/40 bg-brand-500/10 text-brand-300' : 'border-white/10 text-white/60')}
            >
              {s === 'all' ? 'Tümü' : s === 'server' ? 'Sunucu' : 'Tarayıcı'}
            </button>
          ))}
        </div>
      }
    >
      {groups.length === 0 ? (
        <p className="text-sm text-white/50">Kayıtlı hata yok. 🎉</p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {groups.map(({ sample, count, last }) => (
            <li key={`${sample.source}${sample.where}${sample.message}`} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={sample.source === 'server' ? 'bad' : 'warn'}>{sample.source === 'server' ? 'Sunucu' : 'Tarayıcı'}</Pill>
                <span className="font-mono text-[12px] text-white/70">{sample.where}</span>
                {count > 1 && <Pill>{count} kez</Pill>}
                <span className="ml-auto text-[11px] text-white/45">{fmtDateTime(last)}</span>
              </div>
              <p className="mt-1.5 break-words font-mono text-[12px] leading-relaxed text-white/80">{sample.message}</p>
              {sample.path && <p className="mt-0.5 text-[11px] text-white/45">Sayfa: {sample.path}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[11px] text-white/45">Son 200 kayıt tutulur. E-posta ve anahtar benzeri değerler kaydedilmeden önce silinir.</p>
    </Card>
  );
}
