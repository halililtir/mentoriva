/**
 * Ana sayfanın tanıtım içerikleri — örnek cevaplar, kullanım alanları, SSS.
 * Metinleri değiştirmek için bileşenlere dokunmana gerek yok.
 */

import type { MentorId } from '@/types';

// -----------------------------------------------------------
// Hero'daki canlı örnek (gerçek API çağrısı değil, temsili)
// -----------------------------------------------------------

export interface DemoSample {
  question: string;
  /** Hero örneği bilerek dört mentorla gösterilir; arayüz metinlerinde mentor sayısı geçmez. */
  answers: Partial<Record<MentorId, string>>;
}

export const DEMO_SAMPLES: DemoSample[] = [
  {
    question: 'İşimi bırakıp kendi yolumu çizmeli miyim?',
    answers: {
      jung: 'Bu soruyu kim soruyor: sen mi, yıllardır susturduğun yanın mı? Önce o sesi tanı.',
      nietzsche: 'Güvenli olanı seçen, kendi hayatını başkasına emanet eder. Korkun, yönünü gösteriyor.',
      mevlana: 'Kalbin bir kapıyı çalıyorsa, o kapının ardında seni bekleyen bir şey vardır. Dinle.',
      marcus: 'Sonucu değil, kararını kontrol edebilirsin. Bugün atabileceğin en küçük adım ne?',
    },
  },
  {
    question: 'Neden hep aynı hataları tekrarlıyorum?',
    answers: {
      jung: 'Bilinçdışına çıkarılmayan şey, dışarıda kader olarak karşına çıkar.',
      nietzsche: 'Belki o hata, henüz aşmaya cesaret etmediğin eski bir sendir.',
      mevlana: 'Aynı yere tekrar tekrar düşüyorsan, o yer sana bir şey öğretmek istiyordur. Dur ve dinle.',
      marcus: 'Hatayı fark etmek yeter; ona bir de suçluluk ekleme. Bir dahakinde ne yapacaksın?',
    },
  },
  {
    question: 'Birini affetmek zorunda mıyım?',
    answers: {
      jung: 'Onda bu kadar öfkelendiğin şey, belki de kendinde görmek istemediğin bir şeydir.',
      nietzsche: 'Affetmek zayıflık değildir; ama hıncını taşımak seni küçültür.',
      mevlana: 'Affetmek, onu değil seni özgür bırakır. Yükünü yere koy, yolcu.',
      marcus: 'Onun davranışı onun meselesi, senin tepkin senin. Huzurunu ona teslim etme.',
    },
  },
];

// -----------------------------------------------------------
// "Ne sorabilirim?" — konu başlıkları ve örnek sorular
// -----------------------------------------------------------

export const USE_CASES: Array<{ id: string; label: string; questions: string[] }> = [
  {
    id: 'karar',
    label: 'Karar anları',
    questions: ['İşimi bırakıp kendi yolumu çizmeli miyim?', 'Güvenli olanı mı seçmeliyim, sevdiğimi mi?', 'Yanlış karar verme korkusundan nasıl kurtulurum?'],
  },
  {
    id: 'kendini-tanima',
    label: 'Kendini tanıma',
    questions: ['Neden hep aynı hataları tekrarlıyorum?', 'İnsan neden kendini sabote eder?', 'Gerçekten ne istediğimi nasıl bilebilirim?'],
  },
  {
    id: 'iliskiler',
    label: 'İlişkiler',
    questions: ['Birini affetmek zorunda mıyım?', 'Sevdiğim biri beni anlamıyorsa ne yapmalıyım?', 'Yalnız kalmaktan neden bu kadar korkuyorum?'],
  },
  {
    id: 'kayip',
    label: 'Kayıp ve değişim',
    questions: ['Bir şeyi kaybettiğimde nasıl devam ederim?', 'Değişimden neden korkuyorum?', 'Geçmişi nasıl geride bırakırım?'],
  },
  {
    id: 'anlam',
    label: 'Anlam ve amaç',
    questions: ['Hayatın bir anlamı var mı, yoksa onu ben mi yaratırım?', 'Başarı gerçekten mutlu eder mi?', 'Ölüm düşüncesiyle nasıl barışırım?'],
  },
];

// -----------------------------------------------------------
// Sık sorulan sorular
// -----------------------------------------------------------

export const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Mentoriva nedir, ne işe yarar?',
    a: 'Aklındaki bir soruyu Jung, Nietzsche, Mevlânâ, Marcus Aurelius ve Seneca gibi düşünürlerin bakış açısıyla ele alan bir yapay zekâ aracıdır. Tek bir "doğru cevap" vermek yerine aynı soruya farklı düşünce okullarından bakmanı, kendi cevabını bulmana yardım edecek soruları görmeni sağlar.',
  },
  {
    q: 'Ücretli mi?',
    a: 'Hayır. Üyelik ücretsizdir, kayıt olurken kredi kartı istenmez. Her gün 5 soru hakkın olur ve haklar her gece yarısı (Türkiye saati) yenilenir.',
  },
  {
    q: 'Bir "soru hakkı" neye harcanır?',
    a: 'Mentorlara sorduğun her yeni soru 1 hak kullanır; tek mentor da seçsen birkaç mentor da seçsen fark etmez (bir soruya en fazla 4 mentor seçilebilir). Bir mentorla sohbete devam ederken gönderdiğin her mesaj da 1 hak kullanır. Bir mentor teknik bir sorun yüzünden cevap veremezse hakkın iade edilir.',
  },
  {
    q: 'Hangi mentoru seçmeliyim?',
    a: 'Kararsızsan birkaç mentor seç ve cevapları yan yana karşılaştır; seni en çok düşündürenle sohbete devam et. Kendini daha iyi tanımak için Jung, cesaret için Nietzsche, kırgınlık ve anlam arayışı için Mevlânâ, kontrol edemediğin şeyler için Marcus, zaman, öfke ve kaygı için Seneca iyi bir başlangıçtır. Kişilik testi de sana en yakın mentoru gösterir.',
  },
  {
    q: 'Cevaplar gerçekten o düşünürlere mi ait?',
    a: 'Hayır. Cevaplar, bu düşünürlerin eserlerinden ve felsefi yaklaşımlarından ilham alan yapay zekâ üretimleridir. Tarihî figürlerin gerçek sözleri veya görüşleri olarak alıntılanmamalıdır.',
  },
  {
    q: 'Mentoriva terapi veya psikolojik destek yerine geçer mi?',
    a: 'Hayır. Mentoriva bir düşünme aracıdır; tanı koymaz, tedavi önermez. Zor bir dönemden geçiyorsan bir uzmana danışmanı öneririz. Kriz belirtisi taşıyan mesajlarda mentorlar cevap vermez, seni profesyonel desteğe yönlendirir.',
  },
  {
    q: 'Sorularım güvende mi?',
    a: 'Şifren geri döndürülemez biçimde saklanır, oturumun yalnızca tarayıcına özel bir çerezle tutulur. Soruların cevap üretmek için yapay zekâ sağlayıcımıza iletilir ve model eğitiminde kullanılmaz. Ayrıntılar Gizlilik Politikası’nda.',
  },
];
