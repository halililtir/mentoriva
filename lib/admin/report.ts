/**
 * Haftalık özet — son 7 gün, önceki 7 günle kıyaslı.
 * Hem admin paneli (önizleme / şimdi gönder) hem pazartesi cron'u kullanır.
 * Kişisel veri içermez: yalnızca sayılar, konu ve mentor dağılımı.
 */

import { listUsers } from '@/lib/auth/users';
import { getSeries, lastDays } from '@/lib/admin/metrics';
import { topicTotals } from '@/lib/admin/topics';
import { ratingSummary } from '@/lib/admin/ratings';
import { getMany, scanKeys } from '@/lib/kv';
import { ACTIVE_MENTORS } from '@/lib/mentors/metadata';
import { MENTOR_IDS } from '@/types';
import { SITE_URL } from '@/lib/site';
import { sendEmail } from '@/lib/email';

export interface ReportLine {
  label: string;
  now: number;
  prev: number;
}

export interface WeeklyReport {
  range: { from: string; to: string };
  lines: ReportLine[];
  satisfaction: { up: number; down: number; pct: number | null };
  topMentors: Array<{ name: string; count: number }>;
  topTopics: Array<{ label: string; count: number }>;
  topDownReasons: Array<{ label: string; count: number }>;
  unreadFeedback: number;
  totalMembers: number;
}

const DAY_MS = 86_400_000;

export async function buildWeeklyReport(): Promise<WeeklyReport> {
  const days = lastDays(14);
  const prevDays = days.slice(0, 7);
  const thisDays = days.slice(7);

  const [series, users, topics, ratings, mentorDaily, feedbackKeys] = await Promise.all([
    getSeries(days),
    listUsers(),
    topicTotals(thisDays),
    ratingSummary(thisDays),
    getMany<number | string>(MENTOR_IDS.flatMap((id) => thisDays.map((d) => `stats:mentor:${id}:${d}`))),
    scanKeys('feedback:*'),
  ]);

  const sum = (key: string, half: 'now' | 'prev') => (series[key] ?? []).slice(half === 'prev' ? 0 : 7, half === 'prev' ? 7 : 14).reduce((a, b) => a + b, 0);
  const now = Date.now();
  const activeBetween = (from: number, to: number) =>
    users.filter((u) => u.lastSeen && now - +new Date(u.lastSeen) >= from && now - +new Date(u.lastSeen) < to).length;

  const lines: ReportLine[] = [
    { label: 'Yeni üye', now: sum('signup', 'now'), prev: sum('signup', 'prev') },
    { label: 'Aktif üye', now: activeBetween(0, 7 * DAY_MS), prev: activeBetween(7 * DAY_MS, 14 * DAY_MS) },
    { label: 'Soru', now: sum('question', 'now'), prev: sum('question', 'prev') },
    { label: 'Sohbet mesajı', now: sum('chat', 'now'), prev: sum('chat', 'prev') },
    { label: 'Kendine Yolculuk', now: sum('journey', 'now'), prev: sum('journey', 'prev') },
    { label: 'Paylaşım kartı', now: sum('share', 'now'), prev: sum('share', 'prev') },
    { label: 'Davetle üye', now: sum('referral', 'now'), prev: sum('referral', 'prev') },
    { label: 'Kriz filtresi', now: sum('crisis', 'now'), prev: sum('crisis', 'prev') },
    { label: 'Hata (mentor + sunucu + tarayıcı)', now: sum('mentor_error', 'now') + sum('server_error', 'now') + sum('client_error', 'now'), prev: sum('mentor_error', 'prev') + sum('server_error', 'prev') + sum('client_error', 'prev') },
  ];

  const up = ratings.mentors.reduce((s, m) => s + m.up, 0);
  const down = ratings.mentors.reduce((s, m) => s + m.down, 0);

  const nameOf = Object.fromEntries(ACTIVE_MENTORS.map((m) => [m.id, m.shortName]));
  const topMentors = MENTOR_IDS.map((id, i) => ({
    name: nameOf[id] ?? id,
    count: thisDays.reduce((s, _, di) => s + (Number(mentorDaily[i * thisDays.length + di]) || 0), 0),
  }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const feedbacks = await getMany<{ status?: string } | string>(feedbackKeys);
  const unreadFeedback = feedbacks.filter((f) => {
    const v = typeof f === 'string' ? (JSON.parse(f) as { status?: string }) : f;
    return v && v.status !== 'read';
  }).length;

  return {
    range: { from: thisDays[0]!, to: thisDays[thisDays.length - 1]! },
    lines,
    satisfaction: { up, down, pct: up + down > 0 ? Math.round((up / (up + down)) * 100) : null },
    topMentors,
    topTopics: topics.filter((t) => t.count > 0).slice(0, 5).map(({ label, count }) => ({ label, count })),
    topDownReasons: ratings.reasons.filter((r) => r.count > 0).slice(0, 3).map(({ label, count }) => ({ label, count })),
    unreadFeedback,
    totalMembers: users.length,
  };
}

function change(now: number, prev: number): string {
  if (prev === 0) return now === 0 ? '—' : 'yeni';
  const pct = Math.round(((now - prev) / prev) * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function renderWeeklyReport(r: WeeklyReport): { subject: string; text: string; html: string } {
  const subject = `Mentoriva haftalık özet · ${r.range.from} – ${r.range.to}`;
  const sat = r.satisfaction.pct === null ? 'henüz oy yok' : `%${r.satisfaction.pct} olumlu (${r.satisfaction.up} 👍 / ${r.satisfaction.down} 👎)`;

  const textLines = [
    subject,
    '',
    ...r.lines.map((l) => `${l.label}: ${l.now} (önceki hafta ${l.prev}, ${change(l.now, l.prev)})`),
    '',
    `Toplam üye: ${r.totalMembers}`,
    `Cevap memnuniyeti: ${sat}`,
    r.topMentors.length ? `En çok seçilen: ${r.topMentors.map((m) => `${m.name} (${m.count})`).join(', ')}` : '',
    r.topTopics.length ? `Öne çıkan konular: ${r.topTopics.map((t) => `${t.label} (${t.count})`).join(', ')}` : '',
    r.topDownReasons.length ? `👎 nedenleri: ${r.topDownReasons.map((t) => `${t.label} (${t.count})`).join(', ')}` : '',
    r.unreadFeedback ? `Okunmamış geri bildirim: ${r.unreadFeedback}` : '',
    '',
    `Panel: ${SITE_URL}/admin`,
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '');

  const row = (l: ReportLine) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e6edf3;color:#334155">${esc(l.label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e6edf3;text-align:right;font-weight:600;color:#0f172a">${l.now}</td>
      <td style="padding:8px 0 8px 12px;border-bottom:1px solid #e6edf3;text-align:right;color:#64748b;font-size:12px">${l.prev} · ${change(l.now, l.prev)}</td>
    </tr>`;
  const list = (title: string, items: Array<{ label?: string; name?: string; count: number }>) =>
    items.length
      ? `<p style="margin:20px 0 6px;font-weight:600;color:#0f172a">${title}</p><p style="margin:0;color:#334155">${items.map((i) => `${esc(i.label ?? i.name ?? '')} (${i.count})`).join(' · ')}</p>`
      : '';

  const html = `
  <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:16px">
    <p style="margin:0;font-size:20px;font-weight:600">mentor<span style="color:#00838f">iva</span> <span style="font-size:13px;color:#64748b;font-weight:400">haftalık özet</span></p>
    <p style="margin:4px 0 20px;color:#64748b;font-size:13px">${r.range.from} – ${r.range.to} · önceki 7 günle kıyas</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${r.lines.map(row).join('')}</table>
    <p style="margin:20px 0 6px;font-weight:600">Cevap memnuniyeti</p>
    <p style="margin:0;color:#334155">${esc(sat)}</p>
    ${list('En çok seçilen mentorlar', r.topMentors)}
    ${list('Öne çıkan konular', r.topTopics)}
    ${list('👎 nedenleri', r.topDownReasons)}
    ${r.unreadFeedback ? `<p style="margin:20px 0 0;color:#9a5200">${r.unreadFeedback} okunmamış geri bildirim var.</p>` : ''}
    <p style="margin:24px 0 0"><a href="${SITE_URL}/admin" style="display:inline-block;background:#007c8c;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px">Paneli aç</a></p>
    <p style="margin:20px 0 0;color:#94a3b8;font-size:11px">Toplam üye: ${r.totalMembers}. Bu e-posta ADMIN_EMAIL adresine her pazartesi gönderilir.</p>
  </div>`;

  return { subject, text: textLines.join('\n'), html };
}

/** Raporu ADMIN_EMAIL adresine gönderir. Adres yoksa false. */
export async function sendWeeklyReport(): Promise<{ sent: boolean; reason?: string }> {
  const to = process.env['ADMIN_EMAIL']?.trim();
  if (!to) return { sent: false, reason: 'ADMIN_EMAIL tanımlı değil' };
  const rendered = renderWeeklyReport(await buildWeeklyReport());
  const ok = await sendEmail({ to, ...rendered });
  return ok ? { sent: true } : { sent: false, reason: 'E-posta gönderilemedi (Resend ayarlarını kontrol et)' };
}
