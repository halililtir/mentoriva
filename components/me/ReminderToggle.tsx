'use client';

import { useEffect, useState } from 'react';

interface Reminder { date: string; days: number }

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });

/**
 * Seçilen adım için isteğe bağlı tek hatırlatma e-postası. Varsayılan kapalı;
 * kişi açarsa 3 ya da 7 gün sonra bir kez gider.
 */
export function ReminderToggle({ className }: { className?: string }) {
  const [reminder, setReminder] = useState<Reminder | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/reminders').then((r) => (r.ok ? r.json() : { reminder: null })).then((d: { reminder?: Reminder | null }) => setReminder(d.reminder ?? null)).catch(() => setReminder(null));
  }, []);

  const set = async (days: 3 | 7) => {
    setError('');
    const res = await fetch('/api/v1/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) });
    const data = (await res.json().catch(() => null)) as { reminder?: Reminder; error?: string } | null;
    if (!res.ok || !data?.reminder) return setError(data?.error ?? 'Hatırlatma kurulamadı.');
    setReminder(data.reminder);
  };
  const cancel = async () => {
    if ((await fetch('/api/v1/reminders', { method: 'DELETE' })).ok) setReminder(null);
  };

  if (reminder === undefined) return null;
  return (
    <div className={className}>
      {reminder ? (
        <p className="text-[12.5px] text-white/50">
          {DATE.format(new Date(`${reminder.date}T09:00:00`))} sabahı bir kez e-postayla hatırlatacağız.{' '}
          <button onClick={() => void cancel()} className="text-white/40 underline-offset-2 hover:text-white hover:underline">İptal et</button>
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-white/50">
          İstersen bir kez e-postayla hatırlatalım:
          <button onClick={() => void set(3)} className="rounded-full border border-white/10 px-2.5 py-1 hover:border-white/25 hover:text-white">3 gün sonra</button>
          <button onClick={() => void set(7)} className="rounded-full border border-white/10 px-2.5 py-1 hover:border-white/25 hover:text-white">1 hafta sonra</button>
        </p>
      )}
      {error && <p className="mt-1 text-[12px] text-red-300/90">{error}</p>}
    </div>
  );
}
