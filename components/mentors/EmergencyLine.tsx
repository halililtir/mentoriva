import { CRISIS_RESPONSE } from '@/lib/features';

/**
 * Kriz kartındaki acil durum satırı. Ürün kararı (2026-10-03): numara YALNIZCA
 * moderasyonun kriz algıladığı kartta verilir; mentor cevaplarında ve
 * Kendine Yolculuk metinlerinde numara yoktur (prompts/shared.ts).
 * "Zararlı içerik" kartında gösterilmez.
 */
export function EmergencyLine({ message, className }: { message: string; className?: string }) {
  if (message !== CRISIS_RESPONSE.crisis) return null;
  return (
    <p className={className}>
      Kendine zarar verme tehlikesi şu an varsa{' '}
      <a href="tel:112" className="font-semibold underline decoration-amber-300/50 underline-offset-4">112</a>
      &apos;yi arayabilirsin; ücretsiz ve 7/24 açık.
    </p>
  );
}
