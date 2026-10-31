/** Karar takibi — istemci ve sunucunun ortak sabitleri ve tipleri. */

export const DECISION_DAYS = [7, 30, 90] as const;
export type DecisionDays = (typeof DECISION_DAYS)[number];
export const DECISION_DAY_LABELS: Record<DecisionDays, string> = { 7: '1 hafta sonra', 30: '1 ay sonra', 90: '3 ay sonra' };

export const MAX_DECISIONS = 20;
export const DECISION_LIMITS = { title: 160, choice: 200, why: 400, outcome: 800 } as const;

export interface SavedDecision {
  id: string;
  /** Neyin kararı (seçeneklerin adları). */
  title: string;
  /** Kişinin verdiği karar; "Henüz karar vermedim" de olabilir. */
  choice: string;
  why: string;
  createdAt: string;
  /** Takip e-postasının tarihi (YYYY-MM-DD). */
  checkDate: string;
  /** Takip e-postası gönderildiyse (bir kez gider). */
  notifiedAt?: string;
  outcome?: string;
  outcomeAt?: string;
}
