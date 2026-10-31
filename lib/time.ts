/** Günlük kota Türkiye saatine göre sıfırlanır. */
const ISTANBUL_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD (Europe/Istanbul). */
export function todayKey(now: Date = new Date()): string {
  return ISTANBUL_DATE.format(now);
}

/** YYYY-MM-DD + n gün (takvim günü). */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
