/** "Aramızda" kuralları: oda açarken ve davete katılırken aynı metin onaylanır. */
export const BRIDGE_RULES = [
  'Yazdığın ham metin karşı tarafa hiçbir zaman gitmez ve saklanmaz; ona yalnızca senin onayladığın hâl gider.',
  'Mentoriva taraf tutmaz, kimin haklı olduğuna karar vermez ve kimseye tanı koymaz.',
  'İkinizden biri konuşmayı kapattığında konuşma ve içindeki bütün mesajlar iki taraf için de silinir.',
  'Bu bir terapi ya da arabuluculuk hizmeti değildir; birbirinizi daha iyi duymanız için bir araçtır.',
];

export function BridgeRules({ className }: { className?: string }) {
  return (
    <ul className={`space-y-1.5 text-[13.5px] leading-relaxed text-white/60 ${className ?? ''}`}>
      {BRIDGE_RULES.map((r) => (
        <li key={r} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400/70" aria-hidden="true" />
          {r}
        </li>
      ))}
    </ul>
  );
}
