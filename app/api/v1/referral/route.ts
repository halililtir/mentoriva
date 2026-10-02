import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';
import { getBonus } from '@/lib/auth/bonus';
import {
  MAX_REWARDED_REFERRALS,
  NEW_USER_BONUS,
  REFERRER_BONUS,
  getOrCreateReferralCode,
  getRewardedReferralCount,
} from '@/lib/auth/referral';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Oturum sahibinin davet kodu ve davet istatistikleri. */
export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return jsonError(401, 'Giriş yapmalısın');
  const [code, rewarded, bonus] = await Promise.all([
    getOrCreateReferralCode(user),
    getRewardedReferralCount(user.username),
    getBonus(user.username),
  ]);
  return NextResponse.json({
    code,
    rewarded,
    maxRewarded: MAX_REWARDED_REFERRALS,
    referrerBonus: REFERRER_BONUS,
    newUserBonus: NEW_USER_BONUS,
    bonus,
  });
}
