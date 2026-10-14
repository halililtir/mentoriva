'use client';

import { useEffect, useState } from 'react';
import { getAccent, getActiveMentor } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';
import { Card, adminFetch, inputCls, smallBtn } from './shared';
import type { LabQuestion } from '@/lib/admin/lab';
import type { MentorId } from '@/types';

type Winner = 'legacy' | 'current' | 'tie';
type Tally = Partial<Record<MentorId, Record<Winner, number>>>;
interface Pair { mentorId: MentorId; a: string; b: string; aIs: Winner }

/**
 * Eski / Yeni körlemesine karşılaştırma: aynı soru eski (2026-10-05 öncesi) ve
 * yeni talimatla üretilir, sıra rastgeledir. Hangisinin daha iyi geldiğini
 * seçince hangisinin hangisi olduğu açılır ve oy sayılır.
 */
export function VoiceCompare({ questions, onError }: { questions: LabQuestion[]; onError: (e: unknown) => void }) {
  const [mentors, setMentors] = useState<MentorId[]>([]);
  const [tally, setTally] = useState<Tally>({});
  const [mentorId, setMentorId] = useState<MentorId>('mevlana');
  const [question, setQuestion] = useState('');
  const [pair, setPair] = useState<Pair | null>(null);
  const [voted, setVoted] = useState<Winner | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch<{ mentors: MentorId[]; tally: Tally }>('/api/admin/lab/compare')
      .then((d) => { setMentors(d.mentors); setTally(d.tally); })
      .catch(onError);
  }, [onError]);

  const run = async () => {
    if (!question.trim()) return;
    setBusy(true);
    setPair(null);
    setVoted(null);
    try {
      setPair(await adminFetch<Pair>('/api/admin/lab/compare', { method: 'POST', json: { question, mentorId } }));
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  };

  const vote = async (choice: 'a' | 'b' | 'tie') => {
    if (!pair || voted) return;
    const winner: Winner = choice === 'tie' ? 'tie' : choice === 'a' ? pair.aIs : pair.aIs === 'legacy' ? 'current' : 'legacy';
    setVoted(winner);
    try {
      const d = await adminFetch<{ tally: Tally }>('/api/admin/lab/compare', { method: 'PUT', json: { mentorId: pair.mentorId, winner } });
      setTally(d.tally);
    } catch (e) {
      onError(e);
    }
  };

  const label = (side: 'a' | 'b') => {
    if (!pair || !voted) return side === 'a' ? 'A' : 'B';
    const is = side === 'a' ? pair.aIs : pair.aIs === 'legacy' ? 'current' : 'legacy';
    return `${side.toUpperCase()} · ${is === 'legacy' ? 'Eski talimat' : 'Yeni talimat'}`;
  };

  return (
    <Card title="Eski / Yeni ses karşılaştırması">
      <p className="mb-4 text-[13px] leading-relaxed text-white/60">
        Aynı soruyu eski (5 Ekim öncesi) ve yeni talimatla üretir; hangisinin hangisi olduğunu görmeden daha iyi geleni seç. Seçince açılır ve sayılır.
        Ölçüt senin hissin: sıcaklık, ses, &ldquo;sohbete devam etmek ister miydim?&rdquo;.
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {mentors.map((m) => {
          const meta = getActiveMentor(m);
          return (
            <button
              key={m}
              onClick={() => setMentorId(m)}
              className={cn('rounded-full border px-3 py-1 text-[12px]', mentorId === m ? 'border-white/30 bg-white/[0.07] text-white' : 'border-white/10 text-white/60')}
              style={mentorId === m ? { borderColor: getAccent(meta.accentColor).hex } : undefined}
            >
              {meta.shortName}
            </button>
          );
        })}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {questions.map((q) => (
          <button key={q.id} onClick={() => setQuestion(q.text)} title={q.text} className={cn('rounded-full border px-2.5 py-1 text-[12px]', question === q.text ? 'border-brand-400/60 bg-brand-500/15 text-white' : 'border-white/10 text-white/55')}>
            {q.topic}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Soru seç ya da yaz" className={inputCls} />
        <button onClick={() => void run()} disabled={busy || !question.trim()} className={smallBtn}>{busy ? 'Üretiliyor…' : 'Karşılaştır'}</button>
      </div>

      {pair && (
        <div className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(['a', 'b'] as const).map((side) => (
              <div key={side} className="rounded-xl border border-white/[0.08] p-3">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-white/45">{label(side)}</p>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/85">{side === 'a' ? pair.a : pair.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void vote('a')} disabled={!!voted} className={smallBtn}>A daha iyi</button>
            <button onClick={() => void vote('b')} disabled={!!voted} className={smallBtn}>B daha iyi</button>
            <button onClick={() => void vote('tie')} disabled={!!voted} className={smallBtn}>Eşit</button>
            {voted && <span className="self-center text-[12px] text-white/50">Seçimin: {voted === 'tie' ? 'eşit' : voted === 'legacy' ? 'eski talimat' : 'yeni talimat'}</span>}
          </div>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead className="text-white/40">
            <tr><th className="py-1 pr-3 font-normal">Mentor</th><th className="pr-3 font-normal">Yeni</th><th className="pr-3 font-normal">Eski</th><th className="font-normal">Eşit</th></tr>
          </thead>
          <tbody className="text-white/75">
            {mentors.map((m) => (
              <tr key={m} className="border-t border-white/[0.06]">
                <td className="py-1 pr-3">{getActiveMentor(m).shortName}</td>
                <td className="pr-3">{tally[m]?.current ?? 0}</td>
                <td className="pr-3">{tally[m]?.legacy ?? 0}</td>
                <td>{tally[m]?.tie ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
