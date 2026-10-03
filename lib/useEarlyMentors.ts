'use client';

import { useEffect, useState } from 'react';
import { EARLY_ACCESS_MENTORS } from '@/lib/mentors/metadata';
import type { MentorId } from '@/types';

/** Erken erişimdeki mentorlar (admin panelinden yönetilir). Yüklenene kadar koddaki varsayılan. */
export function useEarlyMentors(): readonly MentorId[] {
  const [early, setEarly] = useState<readonly MentorId[]>(EARLY_ACCESS_MENTORS);
  useEffect(() => {
    fetch('/api/v1/access')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { earlyMentors?: MentorId[] } | null) => { if (d?.earlyMentors) setEarly(d.earlyMentors); })
      .catch(() => {});
  }, []);
  return early;
}
