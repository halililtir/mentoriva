'use client';

import { useEffect, useState } from 'react';
import { ACTIVE_MENTORS, getAccent, getActiveMentor } from '@/lib/mentors/metadata';
import { cn } from '@/lib/cn';
import { Card, adminFetch, inputCls, smallBtn } from './shared';
import type { LabQuestion } from '@/lib/admin/lab';
import type { MentorId } from '@/types';
import { GRADE_CRITERIA, type CriterionId, type Grade } from '@/lib/admin/grade-criteria';

type Grades = Partial<Record<MentorId, Grade | null>>;

/** Toplu çalıştırmada mentor başına ölçüt toplamları. */
interface SuiteRow { sums: Record<CriterionId, number>; n: number }
interface SuiteIssue { question: string; mentorId: MentorId; note: string; low: string[] }

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
  const [busy, setBusy] = useState<'first' | 'second' | 'grade' | 'suite' | null>(null);
  const [grades, setGrades] = useState<Grades | null>(null);
  const [suite, setSuite] = useState<{ done: number; total: number; rows: Partial<Record<MentorId, SuiteRow>>; issues: SuiteIssue[] } | null>(null);

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
    setBusy('first'); setFirst(null); setSecond(null); setFollowUp(''); setGrades(null);
    try {
      const d = await adminFetch<{ results: LabResult[] }>('/api/admin/lab', { method: 'POST', json: { question: q, mentorIds: selected } });
      setFirst(d.results); setAsked(q);
    } catch (e) { onError(e); } finally { setBusy(null); }
  };

  const grade = async (q: string, results: LabResult[]): Promise<Grades> => {
    const usable = results.filter((x) => x.text.trim());
    if (usable.length === 0) return {};
    const d = await adminFetch<{ grades: Array<{ mentorId: MentorId; grade: Grade | null }> }>('/api/admin/lab/grade', {
      method: 'POST',
      json: { question: q, results: usable.map(({ mentorId, text }) => ({ mentorId, text })) },
    });
    return Object.fromEntries(d.grades.map((g) => [g.mentorId, g.grade]));
  };

  const gradeCurrent = async () => {
    if (!first) return;
    setBusy('grade');
    try { setGrades(await grade(asked, first)); } catch (e) { onError(e); } finally { setBusy(null); }
  };

  const runSuite = async () => {
    const total = questions.length;
    const estimate = (total * selected.length * 0.025).toFixed(1);
    if (!window.confirm(`${total} soru × ${selected.length} mentor çalıştırılıp puanlanacak. Tahmini maliyet ~${estimate} $ ve birkaç dakika sürer. Devam?`)) return;
    setBusy('suite');
    const rows: Partial<Record<MentorId, SuiteRow>> = {};
    const issues: SuiteIssue[] = [];
    setSuite({ done: 0, total, rows: {}, issues: [] });
    try {
      for (let i = 0; i < total; i++) {
        const q = questions[i]!.text;
        const d = await adminFetch<{ results: LabResult[] }>('/api/admin/lab', { method: 'POST', json: { question: q, mentorIds: selected } });
        const g = await grade(q, d.results);
        for (const [mid, gr] of Object.entries(g) as Array<[MentorId, Grade | null]>) {
          if (!gr) continue;
          const row = (rows[mid] ??= { sums: Object.fromEntries(GRADE_CRITERIA.map((c) => [c.id, 0])) as Record<CriterionId, number>, n: 0 });
          for (const c of GRADE_CRITERIA) row.sums[c.id] += gr.scores[c.id];
          row.n += 1;
          const low = GRADE_CRITERIA.filter((c) => gr.scores[c.id] === 1).map((c) => c.label);
          if (low.length) issues.push({ question: q, mentorId: mid, note: gr.note, low });
        }
        setSuite({ done: i + 1, total, rows: { ...rows }, issues: [...issues] });
      }
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
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4 text-[12.5px] text-white/55">
          <span>Bütün soru setini seçili mentorlarla çalıştırıp hakemle puanla:</span>
          <button onClick={() => void runSuite()} disabled={busy !== null || questions.length === 0 || selected.length === 0} className={smallBtn}>
            {busy === 'suite' && suite ? `Çalışıyor… ${suite.done}/${suite.total}` : 'Tüm seti çalıştır'}
          </button>
        </div>
        {rubric.length > 0 && (
          <details className="mt-4 text-[12.5px] text-white/55">
            <summary className="cursor-pointer text-white/70">Okurken neye bakmalı?</summary>
            <ul className="mt-2 space-y-1 pl-4">
              {rubric.map((r) => <li key={r} className="list-disc">{r}</li>)}
            </ul>
            <p className="mt-3 text-white/70">Hakemin ölçütleri (1 sorun var · 2 kısmen · 3 iyi):</p>
            <ul className="mt-1 space-y-1 pl-4">
              {GRADE_CRITERIA.map((c) => <li key={c.id} className="list-disc"><b className="text-white/75">{c.label}:</b> {c.hint}</li>)}
            </ul>
          </details>
        )}
      </Card>

      {suite && <SuiteSummary suite={suite} />}

      {busy === 'first' && <div className="skeleton h-48 rounded-2xl" />}
      {first && (
        <>
          <div className="flex items-center justify-end">
            <button onClick={() => void gradeCurrent()} disabled={busy !== null} className={smallBtn}>
              {busy === 'grade' ? 'Puanlanıyor…' : 'Hakemle değerlendir'}
            </button>
          </div>
          <Results results={first} heading={`“${asked}”`} grades={grades} />
        </>
      )}

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

const tone = (v: number) => (v >= 2.6 ? 'text-emerald-400' : v >= 1.8 ? 'text-amber-400' : 'text-red-400');

function SuiteSummary({ suite }: { suite: { done: number; total: number; rows: Partial<Record<MentorId, SuiteRow>>; issues: SuiteIssue[] } }) {
  const mentors = ACTIVE_MENTORS.filter((m) => suite.rows[m.id as MentorId]);
  return (
    <Card title={`Set sonucu (${suite.done}/${suite.total} soru)`}>
      {mentors.length === 0 ? (
        <p className="text-[13px] text-white/55">İlk sonuçlar bekleniyor…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-white/50">
                <th className="py-1.5 pr-3 font-medium">Mentor</th>
                {GRADE_CRITERIA.map((c) => <th key={c.id} className="px-2 py-1.5 font-medium" title={c.hint}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {mentors.map((m) => {
                const row = suite.rows[m.id as MentorId]!;
                return (
                  <tr key={m.id} className="border-t border-white/[0.06]">
                    <td className="py-1.5 pr-3" style={{ color: getAccent(m.accentColor).text }}>{m.shortName}</td>
                    {GRADE_CRITERIA.map((c) => {
                      const v = row.sums[c.id] / row.n;
                      return <td key={c.id} className={cn('px-2 py-1.5 tabular-nums', tone(v))}>{v.toFixed(1)}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {suite.issues.length > 0 && (
        <details className="mt-4 text-[12.5px]">
          <summary className="cursor-pointer text-white/70">Sorunlu cevaplar ({suite.issues.length})</summary>
          <ul className="mt-2 space-y-2">
            {suite.issues.map((it, i) => (
              <li key={i} className="rounded-lg border border-white/[0.06] p-2.5">
                <p className="text-white/50">{getActiveMentor(it.mentorId).shortName} · “{it.question}”</p>
                <p className="mt-0.5 text-red-300/90">{it.low.join(', ')}</p>
                <p className="mt-0.5 text-white/70">{it.note}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function GradeRow({ grade }: { grade: Grade | null | undefined }) {
  if (grade === undefined) return null;
  if (grade === null) return <p className="mt-3 text-[11.5px] text-white/40">Hakem bu cevabı puanlayamadı.</p>;
  return (
    <div className="mt-3 border-t border-white/[0.06] pt-2.5">
      <div className="flex flex-wrap gap-1.5">
        {GRADE_CRITERIA.map((c) => (
          <span key={c.id} title={c.hint} className={cn('rounded-full border border-white/10 px-2 py-0.5 text-[11px]', tone(grade.scores[c.id]))}>
            {c.label} {grade.scores[c.id]}
          </span>
        ))}
      </div>
      {grade.note && <p className="mt-2 text-[12px] leading-relaxed text-white/65">{grade.note}</p>}
    </div>
  );
}

function Results({ results, heading, grades }: { results: LabResult[]; heading: string; grades?: Grades | null }) {
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
              {grades && <GradeRow grade={grades[r.mentorId]} />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
