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
