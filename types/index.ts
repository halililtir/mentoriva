/**
 * Mentoriva — Merkezi Tip Sistemi
 *
 * Tüm uygulama entity'leri burada tanımlı.
 * Yeni bir tip eklerken: önce buraya, sonra kullan.
 *
 * Versiyonlama: v1.x'te breaking change yapmamaya dikkat.
 * Yeni alanlar optional (?) olarak eklenebilir.
 */

// -----------------------------------------------------------
// Mentor tipleri
// -----------------------------------------------------------

/** Tüm mentor ID'lerinin tek kaynağı. Yeni mentor eklemek için buraya eklenir. */
export const MENTOR_IDS = ['jung', 'nietzsche', 'mevlana', 'marcus'] as const;
export type MentorId = (typeof MENTOR_IDS)[number];

/** Bir mentorün statik metadata'sı (UI'da kullanılır). */
export interface MentorMetadata {
  id: MentorId;
  name: string;
  title: string; // "Analitik Psikolog" vb
  shortBio: string; // 1-2 cümlelik tanıtım (kart için)
  longBio: string; // daha uzun tanıtım (modal/about için)
  emoji: string;
  traitTags: readonly string[];
  /** Tailwind'de kullanılacak tema rengi sınıfı. */
  accentColor: MentorAccentColor;
  /** Kapanış tarzı — UI'da küçük hint olarak gösterilebilir. */
  closingStyle: 'question' | 'challenge' | 'invitation' | 'action';
  /** İsteğe bağlı portre görseli (v1.1'de eklenecek). */
  portraitUrl?: string;
}

export type MentorAccentColor = 'violet' | 'amber' | 'rose' | 'slate';

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

// -----------------------------------------------------------
// Konuşma tipleri
// -----------------------------------------------------------

/** Tek bir mentorla konuşma. */
export interface Conversation {
  mentorId: MentorId;
  messages: Message[];
  /** İlk soru — 4 mentora da ortak gönderilen. */
  initialQuestion: string;
  createdAt: number;
}

/** 4 mentorün ilk cevapları — landing sonrası gösterilen. */
export interface InitialResponses {
  question: string;
  responses: Partial<Record<MentorId, MentorResponseState>>;
  createdAt: number;
}

/** Tek bir mentorün cevap durumu (streaming sırasında kullanılır). */
export interface MentorResponseState {
  status: 'pending' | 'streaming' | 'completed' | 'error';
  content: string;
  error?: string;
  /** Streaming başladığında timestamp. */
  startedAt?: number;
  completedAt?: number;
}

// -----------------------------------------------------------
// API kontratları
// -----------------------------------------------------------

/** POST /api/v1/mentors/respond request body. */
export interface RespondRequest {
  question: string;
  /** Hangi mentorlere sorulacak. Default: hepsi. */
  mentorIds?: MentorId[];
}

/** SSE stream'de gönderilen event tipleri. */
export type StreamEvent =
  | { type: 'start'; mentorId: MentorId }
  | { type: 'delta'; mentorId: MentorId; text: string }
  | { type: 'end'; mentorId: MentorId }
  | { type: 'error'; mentorId: MentorId; message: string }
  | { type: 'crisis'; message: string }
  | { type: 'rate_limit'; retryAfterSeconds: number };

/** POST /api/v1/mentors/chat request body. */
export interface ChatRequest {
  mentorId: MentorId;
  messages: Message[];
  /** İlk soruda verilen orijinal soru — chat'te bağlam için. */
  initialQuestion?: string;
}

/** Hata yanıtı formatı (tüm API'ler için tutarlı). */
export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'CRISIS_DETECTED'
  | 'MODERATION_BLOCKED'
  | 'UPSTREAM_ERROR'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

// -----------------------------------------------------------
// UI State tipleri
// -----------------------------------------------------------

/** Uygulamanın ana state machine'i. */
export type AppView = 'landing' | 'responses' | 'chat';

export interface AppState {
  view: AppView;
  initialQuestion: string | null;
  responses: InitialResponses | null;
  activeConversation: Conversation | null;
}
