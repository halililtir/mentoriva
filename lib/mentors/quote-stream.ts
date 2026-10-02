/**
 * Akış sırasında `[[alinti:<id>]]` etiketlerini doğrulanmış alıntıyla değiştirir.
 *
 * Model metni parça parça gönderdiği için etiket iki parçaya bölünebilir;
 * filtre `[` ile başlayan olası bir etiket başlangıcını, etiket kapanana ya da
 * etiket olmadığı anlaşılana kadar bekletir. Bilinmeyen kimlik → hiçbir şey.
 */

import { renderQuote } from '@/lib/mentors/quotes';

const TAG = /\[\[alinti:([a-z0-9-]{1,40})\]\]/g;
const MAX_TAG_LEN = 60;

export class QuoteTagFilter {
  private buffer = '';

  constructor(private readonly mentorId: string) {}

  /** Yeni gelen metni alır, güvenle gösterilebilecek kısmı döner. */
  push(chunk: string): string {
    this.buffer += chunk;
    let out = '';

    while (this.buffer.length > 0) {
      const start = this.buffer.indexOf('[');
      if (start === -1) {
        out += this.buffer;
        this.buffer = '';
        break;
      }
      out += this.buffer.slice(0, start);
      this.buffer = this.buffer.slice(start);

      const end = this.buffer.indexOf(']]');
      if (end === -1) {
        // Etiket henüz tamamlanmadı. Etiket olamayacağı kesinse serbest bırak.
        if (!'[[alinti:'.startsWith(this.buffer.slice(0, 9)) || this.buffer.length > MAX_TAG_LEN) {
          out += this.buffer[0];
          this.buffer = this.buffer.slice(1);
          continue;
        }
        break;
      }

      const candidate = this.buffer.slice(0, end + 2);
      TAG.lastIndex = 0;
      const match = TAG.exec(candidate);
      if (match && match.index === 0 && match[0].length === candidate.length) {
        out += renderQuote(match[1]!, this.mentorId) ?? '';
        this.buffer = this.buffer.slice(end + 2);
      } else {
        out += this.buffer[0];
        this.buffer = this.buffer.slice(1);
      }
    }
    return out;
  }

  /** Akış bittiğinde kalan metni döner; yarım kalmış etiket düşürülür. */
  flush(): string {
    const rest = this.buffer;
    this.buffer = '';
    return rest.startsWith('[[') ? '' : rest;
  }
}

/** Tamamlanmış bir metindeki etiketleri tek seferde çözer (testler ve önbellek için). */
export function resolveQuoteTags(text: string, mentorId: string): string {
  const f = new QuoteTagFilter(mentorId);
  return f.push(text) + f.flush();
}
