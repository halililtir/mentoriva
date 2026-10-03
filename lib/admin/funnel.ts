/**
 * Huni ve geri dönüş — üye kayıtlarından (createdAt, questionsUsed, lastSeen)
 * hesaplanır; ek veri tutmaz.
 *
 *   Kayıt → İlk soru → Başka bir gün geri geldi → 7+ gün sonra hâlâ aktif
 *
 * lastSeen son etkinlik olduğu için "kayıttan 7 gün sonra en az bir kez geldi"
 * ile "lastSeen ≥ kayıt + 7 gün" aynı şeydir. 7. gün oranı yalnızca kaydı en az
 * 7 gün önce olan üyeler üzerinden hesaplanır (yeni üyeler oranı düşürmesin).
 */

import type { StoredUser } from '@/lib/auth/users';
import { todayKey } from '@/lib/time';

const DAY_MS = 86_400_000;

export interface FunnelStep {
  label: string;
  count: number;
  /** Bir önceki adıma göre yüzde. */
  ofPrev: number | null;
}

export interface Cohort {
  /** Haftanın pazartesisi (YYYY-MM-DD). */
  week: string;
  signups: number;
  firstQuestion: number;
  returned: number;
  /** 7. gün oranının paydası: kaydı 7+ gün önce olanlar. */
  d7Eligible: number;
  d7: number;
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

function mondayOf(iso: string): string {
  const d = new Date(`${todayKey(new Date(iso))}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // pazartesi = 0
  return new Date(d.getTime() - dow * DAY_MS).toISOString().slice(0, 10);
}

function facts(u: StoredUser, now: number) {
  const signupDay = todayKey(new Date(u.createdAt));
  const seen = u.lastSeen ? new Date(u.lastSeen).getTime() : null;
  return {
    asked: (u.questionsUsed ?? 0) > 0,
    returned: !!u.lastSeen && todayKey(new Date(u.lastSeen)) > signupDay,
    d7Eligible: now - new Date(u.createdAt).getTime() >= 7 * DAY_MS,
    d7: seen !== null && seen - new Date(u.createdAt).getTime() >= 7 * DAY_MS,
  };
}

/** Son `days` günde kaydolanlar için huni. */
export function funnel(users: StoredUser[], days = 30, now = Date.now()): FunnelStep[] {
  const cohort = users.filter((u) => now - new Date(u.createdAt).getTime() <= days * DAY_MS);
  const f = cohort.map((u) => facts(u, now));
  const eligible = f.filter((x) => x.d7Eligible);
  const steps = [
    { label: 'Kayıt oldu', count: cohort.length },
    { label: 'İlk sorusunu sordu', count: f.filter((x) => x.asked).length },
    { label: 'Başka bir gün geri geldi', count: f.filter((x) => x.asked && x.returned).length },
  ];
  const out: FunnelStep[] = steps.map((s, i) => ({ ...s, ofPrev: i === 0 ? null : pct(s.count, steps[i - 1]!.count) }));
  out.push({
    label: '7 gün sonra hâlâ geliyor',
    count: eligible.filter((x) => x.d7).length,
    ofPrev: pct(eligible.filter((x) => x.d7).length, eligible.length),
  });
  return out;
}

/** Kayıt haftasına göre gruplar (en yeni önce). */
export function cohorts(users: StoredUser[], weeks = 8, now = Date.now()): Cohort[] {
  const map = new Map<string, Cohort>();
  for (const u of users) {
    if (now - new Date(u.createdAt).getTime() > weeks * 7 * DAY_MS) continue;
    const week = mondayOf(u.createdAt);
    const c = map.get(week) ?? { week, signups: 0, firstQuestion: 0, returned: 0, d7Eligible: 0, d7: 0 };
    const f = facts(u, now);
    c.signups++;
    if (f.asked) c.firstQuestion++;
    if (f.asked && f.returned) c.returned++;
    if (f.d7Eligible) { c.d7Eligible++; if (f.d7) c.d7++; }
    map.set(week, c);
  }
  return [...map.values()].sort((a, b) => b.week.localeCompare(a.week));
}
