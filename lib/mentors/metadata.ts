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
  /** Dar alanlarda kullanılan kısa ad (Jung, Mevlânâ…). */
  shortName: string;
  title: string;
  shortBio: string;
  traitTags: readonly string[];
  accentColor: MentorAccentColor;
  closingStyle: 'question' | 'challenge' | 'invitation' | 'action';
  portraitUrl: string;
  /** CSS object-position — görselin yüze odaklanması için. Default: 'center' */
  portraitPosition?: string;
  status: MentorStatus;
  /** Ziyaretçiye "bu mentoru ne zaman seçmeli" sorusunun kısa cevabı. */
  bestFor?: string;
  /** Temsil ettiği düşünce geleneği (ör. Stoacılık). */
  tradition?: string;
  /** Yaşadığı dönem, gösterim için (ör. "121–180"). */
  lifespan?: string;
  /** Cevap tarzının tek cümlelik özeti. */
  voice?: string;
}

export interface AccentTheme {
  /** Metin rengi (temaya göre: gündüzde koyulaşır). Arka plan/çizgi için hex kullan. */
  text: string;
  hex: string;
  border: string;
  glow: string;
  bg: string;
  bgHover: string;
  dark: string;
}

export const ACCENT_THEMES: Record<MentorAccentColor, AccentTheme> = {
  cyan:   { text: 'rgb(var(--acc-cyan))', hex: '#00bcd4', border: 'rgba(0,188,212,0.3)',   glow: 'rgba(0,188,212,0.2)',   bg: 'rgba(0,188,212,0.08)',   bgHover: 'rgba(0,188,212,0.15)',   dark: '#0a2530' },
  amber:  { text: 'rgb(var(--acc-amber))', hex: '#e89a3c', border: 'rgba(232,154,60,0.3)',  glow: 'rgba(232,154,60,0.2)',  bg: 'rgba(232,154,60,0.08)',  bgHover: 'rgba(232,154,60,0.15)',  dark: '#2a1a08' },
  gold:   { text: 'rgb(var(--acc-gold))', hex: '#d4a574', border: 'rgba(212,165,116,0.3)', glow: 'rgba(212,165,116,0.2)', bg: 'rgba(212,165,116,0.08)', bgHover: 'rgba(212,165,116,0.15)', dark: '#1f1508' },
  slate:  { text: 'rgb(var(--acc-slate))', hex: '#8b9bb4', border: 'rgba(139,155,180,0.3)', glow: 'rgba(139,155,180,0.15)',bg: 'rgba(139,155,180,0.08)', bgHover: 'rgba(139,155,180,0.15)', dark: '#0e1218' },
  purple: { text: 'rgb(var(--acc-purple))', hex: '#b48eda', border: 'rgba(180,142,218,0.3)', glow: 'rgba(180,142,218,0.2)', bg: 'rgba(180,142,218,0.08)', bgHover: 'rgba(180,142,218,0.15)', dark: '#15102a' },
  sky:    { text: 'rgb(var(--acc-sky))', hex: '#6ba8c7', border: 'rgba(107,168,199,0.3)', glow: 'rgba(107,168,199,0.2)', bg: 'rgba(107,168,199,0.08)', bgHover: 'rgba(107,168,199,0.15)', dark: '#0a1820' },
  sage:   { text: 'rgb(var(--acc-sage))', hex: '#7eb89e', border: 'rgba(126,184,158,0.3)', glow: 'rgba(126,184,158,0.2)', bg: 'rgba(126,184,158,0.08)', bgHover: 'rgba(126,184,158,0.15)', dark: '#0a1a14' },
  honey:  { text: 'rgb(var(--acc-honey))', hex: '#c9a84c', border: 'rgba(201,168,76,0.3)',  glow: 'rgba(201,168,76,0.2)',  bg: 'rgba(201,168,76,0.08)',  bgHover: 'rgba(201,168,76,0.15)',  dark: '#1a1508' },
  terra:  { text: 'rgb(var(--acc-terra))', hex: '#c4816e', border: 'rgba(196,129,110,0.3)', glow: 'rgba(196,129,110,0.2)', bg: 'rgba(196,129,110,0.08)', bgHover: 'rgba(196,129,110,0.15)', dark: '#1a100a' },
};

export const ACTIVE_MENTORS: MentorMetadata[] = [
  {
    id: 'jung', name: 'Carl Gustav Jung', shortName: 'Jung', title: 'Analitik Psikolog',
    shortBio: 'Bilinçdışının, gölgenin ve arketipin haritasını çıkaran İsviçreli psikiyatrist.',
    traitTags: ['Psikoloji', 'Gölge', 'Arketip', 'Semboller'],
    accentColor: 'cyan', closingStyle: 'question',
    portraitUrl: '/mentors/jung.jpg', portraitPosition: 'center 20%', status: 'active',
    bestFor: 'Tekrar eden kalıpları, rüyaları ve kendini anlamak istediğinde.',
    tradition: 'Analitik psikoloji',
    lifespan: '1875–1961',
    voice: 'Soruyu sana geri çevirir; altında yatanı sorgular.',
  },
  {
    id: 'nietzsche', name: 'Friedrich Nietzsche', shortName: 'Nietzsche', title: 'Değer Sorgulaştırıcı',
    shortBio: 'Sürü ahlâkını parçalayan, kendi değerlerini yaratmaya çağıran Alman filozof.',
    traitTags: ['Güç İstenci', 'Übermensch', 'Cesaret', 'Felsefe'],
    accentColor: 'amber', closingStyle: 'challenge',
    portraitUrl: '/mentors/nietzsche.png', portraitPosition: 'center 15%', status: 'active',
    bestFor: 'Cesaret, irade ve kendi yolunu çizmen gerektiğinde.',
    tradition: 'Varoluşçu felsefe',
    lifespan: '1844–1900',
    voice: 'Sert ve kışkırtıcıdır; seni rahat bölgenden iter.',
  },
  {
    id: 'mevlana', name: 'Mevlânâ Rûmî', shortName: 'Mevlânâ', title: 'Tasavvufî Şair',
    shortBio: 'Aşkı, teslimiyeti ve benlikten geçişi Mesnevi\'nin ritminde öğreten sûfî bilge.',
    traitTags: ['Aşk', 'Teslimiyet', 'Nefs', 'Şiir'],
    accentColor: 'gold', closingStyle: 'invitation',
    portraitUrl: '/mentors/mevlana.jpg', portraitPosition: 'center 10%', status: 'active',
    bestFor: 'Kayıp, sevgi, kırgınlık ve anlam arayışında.',
    tradition: 'Tasavvuf',
    lifespan: '1207–1273',
    voice: 'Şiirsel ve şefkatlidir; kalpten konuşur.',
  },
  {
    id: 'marcus', name: 'Marcus Aurelius', shortName: 'Marcus', title: 'Stoik İmparator',
    shortBio: 'Roma\'yı yönetirken kendine notlar yazan imparator-filozof.',
    traitTags: ['Stoacılık', 'Disiplin', 'Dikotomi', 'Erdem'],
    accentColor: 'slate', closingStyle: 'action',
    portraitUrl: '/mentors/marcus.jpg', portraitPosition: 'center 20%', status: 'active',
    bestFor: 'Kontrol edemediğin şeylerle boğuşurken ve karar anlarında.',
    tradition: 'Stoacılık',
    lifespan: '121–180',
    voice: 'Sakin ve pratiktir; bugün ne yapacağını söyler.',
  },
  {
    id: 'seneca', name: 'Seneca', shortName: 'Seneca', title: 'Stoacı Bilge',
    shortBio: 'Bir dostuna mektup yazar gibi konuşan Romalı filozof; zamanı, öfkeyi ve kaygıyı anlatır.',
    traitTags: ['Zaman', 'Öfke', 'Dostluk', 'Mektuplar'],
    accentColor: 'terra', closingStyle: 'invitation',
    portraitUrl: '/mentors/seneca.jpeg', portraitPosition: 'center 20%', status: 'active',
    bestFor: 'Zamanın yetmediğinde, öfke ve kaygıyla başa çıkmakta, dostluk sorularında.',
    voice: 'Sıcak ve sohbet eder; bir dosta mektup yazar gibi konuşur.',
    tradition: 'Stoacı ahlak',
    lifespan: 'MÖ 4 – MS 65',
  },
];

export const COMING_SOON_MENTORS: MentorMetadata[] = [
  {
    id: 'arabi', name: 'İbn Arabî', shortName: 'İbn Arabî', title: 'Şeyh-i Ekber',
    shortBio: 'Vahdet-i Vücud felsefesiyle varlığın birliğini öğreten tasavvuf bilgesi.',
    traitTags: ['Vahdet-i Vücud', 'İrfan', 'Fütuhat'],
    accentColor: 'purple', closingStyle: 'invitation',
    portraitUrl: '/mentors/arabi.webp', portraitPosition: 'center 15%', status: 'coming_soon',
  },
  {
    id: 'freud', name: 'Sigmund Freud', shortName: 'Freud', title: 'Psikanalizin Kurucusu',
    shortBio: 'Bilinçdışını, rüyaları ve bastırılmış dürtüleri keşfeden Viyanalı psikiyatrist.',
    traitTags: ['Psikanaliz', 'Bilinçdışı', 'Rüya Yorumu'],
    accentColor: 'sky', closingStyle: 'question',
    portraitUrl: '/mentors/freud.jpg', portraitPosition: 'center 15%', status: 'coming_soon',
  },
  {
    id: 'platon', name: 'Platon', shortName: 'Platon', title: 'İdealar Filozofu',
    shortBio: 'Mağara alegorisinden idealar dünyasına — hakikati arayan Atinalı düşünür.',
    traitTags: ['İdealar', 'Devlet', 'Diyalog'],
    accentColor: 'sage', closingStyle: 'question',
    portraitUrl: '/mentors/platon.jpg', portraitPosition: 'center 20%', status: 'coming_soon',
  },
  {
    id: 'sokrates', name: 'Sokrates', shortName: 'Sokrates', title: 'Sorgulayıcı',
    shortBio: 'Kendini bil. Her şeyi sorgula. Gerçek bilgelik, cehaletini bilmektir.',
    traitTags: ['Diyalektik', 'Öz-Bilgi', 'Erdem'],
    accentColor: 'honey', closingStyle: 'question',
    portraitUrl: '/mentors/sokrates.jpg', portraitPosition: 'center 20%', status: 'coming_soon',
  },
];

export const ALL_MENTORS = [...ACTIVE_MENTORS, ...COMING_SOON_MENTORS];

/**
 * Erken erişimdeki mentorlar: prompt'u hazır (MENTOR_IDS'te) ama şimdilik
 * yalnızca "erken-erisim" ayrıcalığı olanlar (Kurucu Üye, Destekçi) seçebilir.
 * Yeni bir mentoru önce buraya ekle; herkese açınca listeden çıkar.
 * Sunucu tarafı denetim: lib/mentors/access.ts.
 */
export const EARLY_ACCESS_MENTORS: readonly MentorId[] = [];

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
