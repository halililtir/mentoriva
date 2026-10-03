'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import type { Message } from '@/types';

/**
 * "Sohbeti saklama" ayrıcalığı (Derinleşen işareti): sohbeti metin olarak indir
 * ya da yazdırma penceresinden PDF kaydet. Her şey tarayıcıda olur; sohbet
 * sunucuya ayrıca gönderilmez. Ayrıcalığı olmayana kilitli görünür.
 */

const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function fileName(mentor: string) {
  const slug = mentor.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `mentoriva-${slug}-${new Date().toISOString().slice(0, 10)}`;
}

function asText(mentor: string, messages: Message[]): string {
  const lines = [`Mentoriva — ${mentor} ile sohbet`, DATE.format(new Date()), ''];
  for (const m of messages) {
    lines.push(m.role === 'user' ? 'Sen:' : `${mentor}:`, m.content.trim(), '');
  }
  lines.push('—', 'Mentor cevapları, düşünürlerin fikirlerinden ilham alan yapay zekâ yorumlarıdır; profesyonel destek yerine geçmez.');
  return lines.join('\n');
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function asPrintableHtml(mentor: string, messages: Message[]): string {
  const body = messages
    .map((m) => `<div class="m ${m.role}"><p class="who">${m.role === 'user' ? 'Sen' : esc(mentor)}</p><p>${esc(m.content.trim()).replace(/\n/g, '<br>')}</p></div>`)
    .join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(fileName(mentor))}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#14181f;max-width:640px;margin:40px auto;padding:0 24px;line-height:1.65}
  h1{font-size:22px;margin:0}.d{color:#667085;font-size:12px;margin:4px 0 28px;font-family:system-ui,sans-serif}
  .m{margin:0 0 18px;page-break-inside:avoid}.who{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#007c8c;margin:0 0 4px}
  .user .who{color:#667085}.user p:last-child{font-style:italic}
  footer{margin-top:32px;border-top:1px solid #e4e7ec;padding-top:12px;font:11px system-ui,sans-serif;color:#667085}
</style></head><body>
<h1>mentor<span style="color:#007c8c">iva</span> · ${esc(mentor)} ile sohbet</h1><p class="d">${esc(DATE.format(new Date()))}</p>
${body}
<footer>Mentor cevapları, düşünürlerin fikirlerinden ilham alan yapay zekâ yorumlarıdır; profesyonel destek yerine geçmez.</footer>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
}

export function ChatExport({ mentorName, messages, unlocked }: { mentorName: string; messages: Message[]; unlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const downloadText = () => {
    const blob = new Blob([asText(mentorName, messages)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName(mentorName)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    track('chat_export', { format: 'txt' });
    setOpen(false);
  };

  const printPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(asPrintableHtml(mentorName, messages));
    w.document.close();
    track('chat_export', { format: 'pdf' });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] text-white/65 transition-colors hover:text-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {unlocked ? <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" /> : <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>}
        </svg>
        İndir
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-64 glass rounded-2xl !bg-ink-50 p-2 animate-fade-down">
          {unlocked ? (
            <>
              <button role="menuitem" onClick={downloadText} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/[0.05]">Metin olarak indir (.txt)</button>
              <button role="menuitem" onClick={printPdf} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/[0.05]">PDF olarak kaydet</button>
              <p className="px-3 pb-1 pt-1.5 text-[11px] text-white/45">Sohbet yalnızca senin cihazına indirilir.</p>
            </>
          ) : (
            <div className="px-3 py-2.5">
              <p className={cn('text-sm text-white/85')}>Sohbeti saklama</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/60">
                Bir mentorla aynı sohbette beş mesaj yazınca <b className="text-white/80">Derinleşen</b> işaretini kazanırsın; sohbetlerini metin ya da PDF olarak indirebilirsin.
              </p>
              <Link href="/isaretlerim" className="mt-2 inline-block text-[12px] text-brand-300 hover:underline">İşaretlerime bak →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
