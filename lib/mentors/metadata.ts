/**
 * Mentor Metadata v2 — Aktif + Yakında mentorlar.
 *
 * Yeni mentor eklemek:
 * 1. types/index.ts: MENTOR_IDS'e ekle (aktif ise)
 * 2. Bu dosyada metadata gir (ACTIVE_MENTORS veya COMING_SOON_MENTORS)
 * 3. Aktif ise: prompts/ altında system prompt oluştur
 * 4. public/mentors/ altına görsel ekle
 */

import type { MentorId } from '@/types';

export type MentorStatus = 'active' | 'coming_soon';
export type MentorAccentColor = 'cyan' | 'amber' | 'gold' | 'slate' | 'purple' | 'sky' | 'sage' | 'honey' | 'terra';

export interface MentorMetadata {
  id: string;
  name: string;
  title: string;
  shortBio: string;
  traitTags: readonly string[];
  accentColor: MentorAccentColor;
  closingStyle: 'question' | 'challenge' | 'invitation' | 'action';
  portraitUrl: string;
  /** CSS object-position — görselin yüze odaklanması için. Default: 'center' */
  portraitPosition?: string;
  status: MentorStatus;
}

export interface AccentTheme {
  hex: string;
  border: string;
  glow: string;
  bg: string;
  bgHover: string;
  dark: string;
}

export const ACCENT_THEMES: Record<MentorAccentColor, AccentTheme> = {
  cyan:   { hex: '#00bcd4', border: 'rgba(0,188,212,0.3)',   glow: 'rgba(0,188,212,0.2)',   bg: 'rgba(0,188,212,0.08)',   bgHover: 'rgba(0,188,212,0.15)',   dark: '#0a2530' },
  amber:  { hex: '#e89a3c', border: 'rgba(232,154,60,0.3)',  glow: 'rgba(232,154,60,0.2)',  bg: 'rgba(232,154,60,0.08)',  bgHover: 'rgba(232,154,60,0.15)',  dark: '#2a1a08' },
  gold:   { hex: '#d4a574', border: 'rgba(212,165,116,0.3)', glow: 'rgba(212,165,116,0.2)', bg: 'rgba(212,165,116,0.08)', bgHover: 'rgba(212,165,116,0.15)', dark: '#1f1508' },
  slate:  { hex: '#8b9bb4', border: 'rgba(139,155,180,0.3)', glow: 'rgba(139,155,180,0.15)',bg: 'rgba(139,155,180,0.08)', bgHover: 'rgba(139,155,180,0.15)', dark: '#0e1218' },
  purple: { hex: '#b48eda', border: 'rgba(180,142,218,0.3)', glow: 'rgba(180,142,218,0.2)', bg: 'rgba(180,142,218,0.08)', bgHover: 'rgba(180,142,218,0.15)', dark: '#15102a' },
  sky:    { hex: '#6ba8c7', border: 'rgba(107,168,199,0.3)', glow: 'rgba(107,168,199,0.2)', bg: 'rgba(107,168,199,0.08)', bgHover: 'rgba(107,168,199,0.15)', dark: '#0a1820' },
  sage:   { hex: '#7eb89e', border: 'rgba(126,184,158,0.3)', glow: 'rgba(126,184,158,0.2)', bg: 'rgba(126,184,158,0.08)', bgHover: 'rgba(126,184,158,0.15)', dark: '#0a1a14' },
  honey:  { hex: '#c9a84c', border: 'rgba(201,168,76,0.3)',  glow: 'rgba(201,168,76,0.2)',  bg: 'rgba(201,168,76,0.08)',  bgHover: 'rgba(201,168,76,0.15)',  dark: '#1a1508' },
  terra:  { hex: '#c4816e', border: 'rgba(196,129,110,0.3)', glow: 'rgba(196,129,110,0.2)', bg: 'rgba(196,129,110,0.08)', bgHover: 'rgba(196,129,110,0.15)', dark: '#1a100a' },
};

export const ACTIVE_MENTORS: MentorMetadata[] = [
  {
    id: 'jung', name: 'Carl Gustav Jung', title: 'Analitik Psikolog',
    shortBio: 'Bilinçdışının, gölgenin ve arketipin haritasını çıkaran İsviçreli psikiyatrist.',
    traitTags: ['Psikoloji', 'Gölge', 'Arketip', 'Semboller'],
    accentColor: 'cyan', closingStyle: 'question',
    portraitUrl: '/mentors/jung.jpg', portraitPosition: 'center 20%', status: 'active',
  },
  {
    id: 'nietzsche', name: 'Friedrich Nietzsche', title: 'Değer Sorgulaştırıcı',
    shortBio: 'Sürü ahlâkını parçalayan, kendi değerlerini yaratmaya çağıran Alman filozof.',
    traitTags: ['Güç İstenci', 'Übermensch', 'Cesaret', 'Felsefe'],
    accentColor: 'amber', closingStyle: 'challenge',
    portraitUrl: '/mentors/nietzsche.png', portraitPosition: 'center 15%', status: 'active',
  },
  {
    id: 'mevlana', name: 'Mevlânâ Rûmî', title: 'Tasavvufî Şair',
    shortBio: 'Aşkı, teslimiyeti ve benlikten geçişi Mesnevi\'nin ritminde öğreten sûfî bilge.',
    traitTags: ['Aşk', 'Teslimiyet', 'Nefs', 'Şiir'],
    accentColor: 'gold', closingStyle: 'invitation',
    portraitUrl: '/mentors/mevlana.jpg', portraitPosition: 'center 10%', status: 'active',
  },
  {
    id: 'marcus', name: 'Marcus Aurelius', title: 'Stoik İmparator',
    shortBio: 'Roma\'yı yönetirken kendine notlar yazan imparator-filozof.',
    traitTags: ['Stoacılık', 'Disiplin', 'Dikotomi', 'Erdem'],
    accentColor: 'slate', closingStyle: 'action',
    portraitUrl: '/mentors/marcus.jpg', portraitPosition: 'center 20%', status: 'active',
  },
];

export const COMING_SOON_MENTORS: MentorMetadata[] = [
  {
    id: 'arabi', name: 'İbn Arabî', title: 'Şeyh-i Ekber',
    shortBio: 'Vahdet-i Vücud felsefesiyle varlığın birliğini öğreten tasavvuf bilgesi.',
    traitTags: ['Vahdet-i Vücud', 'İrfan', 'Fütuhat'],
    accentColor: 'purple', closingStyle: 'invitation',
    portraitUrl: '/mentors/arabi.webp', portraitPosition: 'center 15%', status: 'coming_soon',
  },
  {
    id: 'freud', name: 'Sigmund Freud', title: 'Psikanalizin Kurucusu',
    shortBio: 'Bilinçdışını, rüyaları ve bastırılmış dürtüleri keşfeden Viyanalı psikiyatrist.',
    traitTags: ['Psikanaliz', 'Bilinçdışı', 'Rüya Yorumu'],
    accentColor: 'sky', closingStyle: 'question',
    portraitUrl: '/mentors/freud.jpg', portraitPosition: 'center 15%', status: 'coming_soon',
  },
  {
    id: 'platon', name: 'Platon', title: 'İdealar Filozofu',
    shortBio: 'Mağara alegorisinden idealar dünyasına — hakikati arayan Atinalı düşünür.',
    traitTags: ['İdealar', 'Devlet', 'Diyalog'],
    accentColor: 'sage', closingStyle: 'question',
    portraitUrl: '/mentors/platon.jpg', portraitPosition: 'center 20%', status: 'coming_soon',
  },
  {
    id: 'sokrates', name: 'Sokrates', title: 'Sorgulayıcı',
    shortBio: 'Kendini bil. Her şeyi sorgula. Gerçek bilgelik, cehaletini bilmektir.',
    traitTags: ['Diyalektik', 'Öz-Bilgi', 'Erdem'],
    accentColor: 'honey', closingStyle: 'question',
    portraitUrl: '/mentors/sokrates.jpg', portraitPosition: 'center 20%', status: 'coming_soon',
  },
  {
    id: 'seneca', name: 'Seneca', title: 'Stoik Devlet Adamı',
    shortBio: 'Nero\'nun danışmanı, sürgünlerin bilgesi. Hayatın kısalığını yazdı.',
    traitTags: ['Stoacılık', 'Mektuplar', 'Erdem'],
    accentColor: 'terra', closingStyle: 'action',
    portraitUrl: '/mentors/seneca.jpeg', portraitPosition: 'center 20%', status: 'coming_soon',
  },
];

export const ALL_MENTORS = [...ACTIVE_MENTORS, ...COMING_SOON_MENTORS];

export function getActiveMentor(id: MentorId): MentorMetadata {
  const found = ACTIVE_MENTORS.find((m) => m.id === id);
  if (!found) throw new Error(`Aktif mentor bulunamadı: ${id}`);
  return found;
}

export function getAccent(color: MentorAccentColor): AccentTheme {
  return ACCENT_THEMES[color];
}

export function isActiveMentor(id: string): id is MentorId {
  return ACTIVE_MENTORS.some((m) => m.id === id);
}
