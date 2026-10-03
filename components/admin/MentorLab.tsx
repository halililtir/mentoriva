'use client';

import { useEffect, useState } from 'react';
import { ACTIVE_MENTORS, getAccent } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';
import { Card, adminFetch, inputCls, smallBtn } from './shared';
import type { LabQuestion } from '@/lib/admin/lab';
import type { MentorId } from '@/types';

interface LabResult {
  mentorId: MentorId;
  text: string;
  ms: number;
  error?: string;
}

const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

/**
 * Mentor laboratuvarı: aynı soruyu bütün mentorlara sorup cevapları yan yana
 * okumak, ardından aynı devam mesajıyla sohbet modunu sınamak için.
 */
export function MentorLab({ onError }: { onError: (e: unknown) => void }) {
  const [questions, setQuestions] = useState<LabQuestion[]>([]);
  const [rubric, setRubric] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [selected, setSelected] = useState<MentorId[]>(ACTIVE_MENTORS.map((m) => m.id as MentorId));
  const [first, setFirst] = useState<LabResult[] | null>(null);
  const [asked, setAsked] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [second, setSecond] = useState<LabResult[] | null>(null);
  const [busy, setBusy] = useState<'first' | 'second' | null>(null);

  useEffect(() => {
    adminFetch<{ questions: LabQuestion[]; rubric: string[] }>('/api/admin/lab')
      .then((d) => { setQuestions(d.questions); setRubric(d.rubric); })
      .catch(onError);
  }, [onError]);

  const toggle = (id: MentorId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const run = async () => {
    const q = question.trim();
    if (!q || selected.length === 0) return;
    setBusy('first'); setFirst(null); setSecond(null); setFollowUp('');
    try {
      const d = await adminFetch<{ results: LabResult[] }>('/api/admin/lab', { method: 'POST', json: { question: q, mentorIds: selected } });
      setFirst(d.results); setAsked(q);
    } catch (e) { onError(e); } finally { setBusy(null); }
  };

  const runFollowUp = async () => {
    if (!first || !followUp.trim()) return;
    setBusy('second'); setSecond(null);
    try {
      const answers = Object.fromEntries(first.map((r) => [r.mentorId, r.text]));
      const d = await adminFetch<{ results: LabResult[] }>('/api/admin/lab', {
        method: 'POST',
        json: { question: asked, mentorIds: first.map((r) => r.mentorId), followUp: followUp.trim(), answers },
      });
      setSecond(d.results);
    } catch (e) { onError(e); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <Card title="Mentor laboratuvarı">
        <p className="mb-4 text-[13px] leading-relaxed text-white/60">
          Aynı soruyu seçtiğin mentorlara sorar, cevapları yan yana gösterir. Talimat değişikliklerini canlıda sınamak için.
          Kota düşmez; yapay zekâ maliyeti &ldquo;Diğer&rdquo; altında görünür (beş mentor için yaklaşık 5-12 cent).
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => setQuestion(q.text)}
              className={cn('rounded-full border px-2.5 py-1 text-[12px] transition-colors', question === q.text ? 'border-brand-400/60 bg-brand-500/15 text-white' : 'border-white/10 text-white/60 hover:text-white/90')}
              title={q.text}
            >
              {q.topic}
            </button>
          ))}
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Bir soru seç ya da kendin yaz"
          className={cn(inputCls, 'w-full resize-y')}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ACTIVE_MENTORS.map((m) => {
            const on = selected.includes(m.id as MentorId);
            const a = getAccent(m.accentColor);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id as MentorId)}
                aria-pressed={on}
                className={cn('rounded-full border px-3 py-1 text-[12.5px] transition-colors', on ? 'bg-white/[0.06]' : 'border-white/10 text-white/40')}
                style={on ? { borderColor: a.border, color: a.text } : undefined}
              >
                {m.shortName}
              </button>
            );
          })}
          <button onClick={() => void run()} disabled={busy !== null || !question.trim() || selected.length === 0} className={cn(smallBtn, 'ml-auto')}>
            {busy === 'first' ? 'Mentorlar yazıyor…' : 'Sor'}
          </button>
        </div>
        {rubric.length > 0 && (
          <details className="mt-4 text-[12.5px] text-white/55">
            <summary className="cursor-pointer text-white/70">Okurken neye bakmalı?</summary>
            <ul className="mt-2 space-y-1 pl-4">
              {rubric.map((r) => <li key={r} className="list-disc">{r}</li>)}
            </ul>
          </details>
        )}
      </Card>

      {busy === 'first' && <div className="skeleton h-48 rounded-2xl" />}
      {first && <Results results={first} heading={`“${asked}”`} />}

      {first && (
        <Card title="Sohbeti sına">
          <p className="mb-3 text-[13px] text-white/60">Aynı devam mesajı her mentora kendi ilk cevabının ardından gönderilir.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              maxLength={2000}
              placeholder="Örn. Ama ben zaten denedim, işe yaramadı."
              className={cn(inputCls, 'flex-1')}
            />
            <button onClick={() => void runFollowUp()} disabled={busy !== null || !followUp.trim()} className={smallBtn}>
              {busy === 'second' ? 'Yazıyorlar…' : 'Gönder'}
            </button>
          </div>
        </Card>
      )}
      {busy === 'second' && <div className="skeleton h-40 rounded-2xl" />}
      {second && <Results results={second} heading={`Devam: “${followUp}”`} />}
    </div>
  );
}

function Results({ results, heading }: { results: LabResult[]; heading: string }) {
  return (
    <section>
      <h3 className="mb-3 font-display text-lg text-white/85">{heading}</h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((r) => {
          const m = ACTIVE_MENTORS.find((x) => x.id === r.mentorId)!;
          const a = getAccent(m.accentColor);
          return (
            <article key={r.mentorId} className="glass flex flex-col rounded-2xl p-4">
              <header className="mb-2 flex items-baseline justify-between gap-2">
                <h4 className="font-display text-base" style={{ color: a.text }}>{m.name}</h4>
                <span className="text-[11px] tabular-nums text-white/45">{words(r.text)} kelime · {(r.ms / 1000).toFixed(1)} sn</span>
              </header>
              {r.error && <p className="mb-2 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-2.5 py-1.5 text-[12px] text-red-300">{r.error}</p>}
              <p className="whitespace-pre-wrap text-[14px] leading-[1.7] text-white/80">{r.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
