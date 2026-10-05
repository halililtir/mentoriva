'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { hasGuestConsent, setGuestConsent } from '@/lib/guest-trial';
import { MIN_AGE } from '@/lib/legal';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

/**
 * Misafirin 18+ ve yurt dışı aktarım onayı (üyeler bunu kayıtta verir). Yazdığı
 * metin yapay zekâ sağlayıcısına gidecekse istenir; seçim tarayıcıda hatırlanır
 * ve soru ekranındaki onayla aynıdır. Sunucu da `consent: true` ister.
 */
export function GuestConsent({ checked, onChange, className }: Props) {
  useEffect(() => { if (hasGuestConsent()) onChange(true); }, [onChange]);
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${className ?? ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { onChange(e.target.checked); setGuestConsent(e.target.checked); }}
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/[0.04] accent-brand-500"
      />
      <span className="text-xs leading-relaxed text-white/55">
        {MIN_AGE} yaşından büyüğüm; yazdıklarımın, cevap üretilebilmesi için yurt dışındaki hizmet sağlayıcılara aktarılmasına açık rıza veriyorum.{' '}
        <Link href="/gizlilik#yurt-disi" target="_blank" className="text-brand-300/80 hover:underline">Gizlilik</Link>
      </span>
    </label>
  );
}
