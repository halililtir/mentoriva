'use client';

import { useEffect, useState } from 'react';
import { Card, adminFetch, smallBtn } from './shared';

interface ReportResponse {
  text: string;
  recipient: string | null;
}

/** Haftalık özetin önizlemesi ve "şimdi gönder". Otomatik gönderim pazartesi 09:00. */
export function WeeklyReportPanel({ onError }: { onError: (e: unknown) => void }) {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminFetch<ReportResponse>('/api/admin/report').then(setData).catch(onError);
  }, [onError]);

  const send = async () => {
    setBusy(true); setMsg('');
    try {
      await adminFetch('/api/admin/report', { method: 'POST' });
      setMsg('Gönderildi.');
    } catch (e) { onError(e); } finally { setBusy(false); }
  };

  return (
    <Card
      title="Haftalık özet"
      action={
        <button onClick={send} disabled={busy || !data?.recipient} className={smallBtn}>
          {busy ? 'Gönderiliyor…' : 'Şimdi gönder'}
        </button>
      }
    >
      <p className="mb-3 text-[13px] text-white/60">
        Her pazartesi 09:00’da{' '}
        {data?.recipient ? <b className="text-white/85">{data.recipient}</b> : <span className="text-amber-400">ADMIN_EMAIL tanımlanınca</span>} adresine gider.
        {msg && <span className="ml-2 text-emerald-400">{msg}</span>}
      </p>
      {data ? (
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-ink-0/50 p-4 font-sans text-[13px] leading-relaxed text-white/80">{data.text}</pre>
      ) : (
        <div className="skeleton h-40 rounded-xl" />
      )}
    </Card>
  );
}
