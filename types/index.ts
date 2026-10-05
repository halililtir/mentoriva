/**
 * Mentoriva — Merkezi Tip Sistemi
 *
 * API kontratları ve paylaşılan entity'ler burada tanımlı.
 * Mentor UI metadata'sı (isim, renk, portre) lib/mentors/metadata.ts içindedir.
 */

// -----------------------------------------------------------
// Mentor tipleri
// -----------------------------------------------------------

/** Aktif mentor ID'lerinin tek kaynağı. Yeni mentor eklemek için buraya eklenir. */
export const MENTOR_IDS = ['jung', 'nietzsche', 'mevlana', 'marcus', 'seneca', 'sokrates'] as const;
export type MentorId = (typeof MENTOR_IDS)[number];

// -----------------------------------------------------------
// Mesaj tipleri (Anthropic API ile uyumlu)
// -----------------------------------------------------------

export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  /** Client-side'da mesaj kimliği ve zaman damgası. */
  id?: string;
  timestamp?: number;
}

/** Tek bir mentorün cevap durumu (streaming sırasında kullanılır). */
export interface MentorResponseState {
  status: 'pending' | 'streaming' | 'completed' | 'error';
  content: string;
  error?: string;
}

// -----------------------------------------------------------
// API kontratları
// -----------------------------------------------------------

/** POST /api/v1/mentors/respond — SSE olayları. */
export type StreamEvent =
  | { type: 'quota'; remaining: number }
  /** Bu cevapla kazanılan yeni işaretler (lib/badges.ts). */
  | { type: 'badges'; ids: string[] }
  | { type: 'start'; mentorId: MentorId }
  | { type: 'delta'; mentorId: MentorId; text: string }
  | { type: 'end'; mentorId: MentorId }
  | { type: 'error'; mentorId: MentorId; message: string }
  | { type: 'crisis'; message: string }
  /** Birden fazla mentor cevap verince "nerede ayrışıyorlar" özeti (lib/mentors/synthesis.ts). */
  | { type: 'synthesis'; agree: string; differ: string; ask: string };

/** POST /api/v1/mentors/chat — SSE olayları (tek mentor, mentorId yok). */
export type ChatStreamEvent =
  | { type: 'quota'; remaining: number }
  | { type: 'badges'; ids: string[] }
  | { type: 'delta'; text: string }
  | { type: 'end' }
  | { type: 'error'; message: string }
  | { type: 'crisis'; message: string };

/** Mentor uçlarının JSON hata kodları. */
export type ApiErrorCode = 'UNAUTHORIZED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'INVALID_REQUEST' | 'GUEST_USED' | 'CONSENT_REQUIRED' | 'MENTOR_NOT_ALLOWED';
