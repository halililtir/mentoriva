/**
 * "İçimde ne var?" — sabit metinler: giriş cümleleri, duygu sözlüğü, beden
 * notları ve "benim için önemli olan" olasılıkları.
 *
 * Bütün açıklamalar ve gruplama Mentoriva'nın kendi metnidir. Herhangi bir
 * kitabın, testin ya da bilinen bir duygu çarkının/ihtiyaç listesinin
 * sınıflandırması, metni veya düzeni kullanılmaz. Duygu adları ortak dildir.
 *
 * İlkeler:
 * - Gruplar iyi/kötü değil, duygunun insanda nasıl bir hareket yarattığıdır.
 * - Duygudan ihtiyaca otomatik eşleştirme yoktur; olasılıklar ayrı listelenir.
 * - Beden notlarından duygu ya da sağlık sonucu çıkarılmaz.
 */

export const FEELING_GROUPS = {
  daraltan: { label: 'İçe çeken', hint: 'İnsanı içine kapatır, ağırlaştırır, sessizleştirir.', hex: '#7c8db5' },
  kabartan: { label: 'Dışa iten', hint: 'Bir şeye karşı yükselir, söylenmek ya da yapılmak ister.', hex: '#d9825b' },
  tetikte: { label: 'Tetikte tutan', hint: 'Dikkati ileriye, olabilecek şeylere çevirir; dinlendirmez.', hex: '#c9a54a' },
  yavaslatan: { label: 'Yavaşlatan', hint: 'Enerjiyi çeker; istemek ve başlamak zorlaşır.', hex: '#8a9a9a' },
  genisleten: { label: 'Genişleten', hint: 'İçeriyi açar; insanı dünyaya ve başkalarına doğru açar.', hex: '#4fb3a9' },
} as const;

export type FeelingGroup = keyof typeof FEELING_GROUPS;

export interface Feeling {
  id: string;
  name: string;
  group: FeelingGroup;
  /** Nasıl hissettirebilir; tek, sade cümle. */
  desc: string;
  /** Yakın bir duygudan farkı (isteğe bağlı derinleşme). */
  near?: { id: string; diff: string };
}

export const FEELINGS: Feeling[] = [
  // İçe çeken
  { id: 'uzuntu', name: 'Üzüntü', group: 'daraltan', desc: 'Değer verdiğin bir şey kaybolduğunda ya da olmadığında gelen ağırlık.', near: { id: 'kirginlik', diff: 'Üzüntü kayba bakar; kırgınlık ise birinin sana yaptığına ya da yapmadığına.' } },
  { id: 'kirginlik', name: 'Kırgınlık', group: 'daraltan', desc: 'Önemsediğin birinden beklediğini göremeyince içinde kalan sızı.', near: { id: 'ofke', diff: 'Öfke karşılık vermek ister; kırgınlık daha çok geri çekilir ve susar.' } },
  { id: 'hayal-kirikligi', name: 'Hayal kırıklığı', group: 'daraltan', desc: 'Umduğun ile olan arasındaki farkın bıraktığı boşluk.', near: { id: 'uzuntu', diff: 'Hayal kırıklığında bir beklenti vardı ve karşılanmadı; üzüntü beklenti olmadan da gelebilir.' } },
  { id: 'yalnizlik', name: 'Yalnızlık', group: 'daraltan', desc: 'Görülmediğini ya da anlaşılmadığını hissetmek; kalabalıkta da olabilir.', near: { id: 'ozlem', diff: 'Yalnızlıkta genel bir bağ eksikliği var; özlemde belirli bir kişi ya da yer.' } },
  { id: 'ozlem', name: 'Özlem', group: 'daraltan', desc: 'Uzakta kalan birine, bir yere ya da bir zamana doğru çekilmek.' },
  { id: 'utanc', name: 'Utanç', group: 'daraltan', desc: 'Görünmek istemediğin bir yanının görüldüğünü hissedip saklanma isteği.', near: { id: 'sucluluk', diff: 'Suçluluk "kötü bir şey yaptım" der; utanç "ben kötüyüm" gibi kendine dönebilir.' } },
  { id: 'sucluluk', name: 'Suçluluk', group: 'daraltan', desc: 'Bir davranışının birine ya da kendi değerlerine zarar verdiğini düşünmek.' },
  { id: 'caresizlik', name: 'Çaresizlik', group: 'daraltan', desc: 'Ne yapsan değişmeyecekmiş gibi gelen, elinin bağlı olduğu hissi.' },

  // Dışa iten
  { id: 'ofke', name: 'Öfke', group: 'kabartan', desc: 'Bir sınırın aşıldığını ya da haksızlık yapıldığını hissedince yükselen güç.', near: { id: 'sinirlilik', diff: 'Öfkenin çoğu zaman belli bir nedeni vardır; sinirlilik her şeye dağılır.' } },
  { id: 'sinirlilik', name: 'Sinirlilik', group: 'kabartan', desc: 'Küçük şeylerin bile batması; sabrın inceldiği bir hâl.' },
  { id: 'icerleme', name: 'İçerleme', group: 'kabartan', desc: 'Söylenmemiş bir haksızlığın içinde biriktirdiği acı tat.', near: { id: 'kirginlik', diff: 'Kırgınlık yaralanmaya, içerleme biriktirilmiş bir hesaba daha yakındır.' } },
  { id: 'kiskanclik', name: 'Kıskançlık', group: 'kabartan', desc: 'Değer verdiğin bir şeyi ya da kişiyi kaybetme, geride kalma korkusuyla gelen huzursuzluk.' },
  { id: 'tahammulsuzluk', name: 'Tahammülsüzlük', group: 'kabartan', desc: 'Bir şeyin artık daha fazla sürmesine dayanamamak.', near: { id: 'bikkinlik', diff: 'Tahammülsüzlük itmek ister; bıkkınlık ise sadece uzaklaşmak.' } },

  // Tetikte tutan
  { id: 'kaygi', name: 'Kaygı', group: 'tetikte', desc: 'Adını tam koyamadığın, olabilecek şeylere dönük yaygın tedirginlik.', near: { id: 'endise', diff: 'Endişenin belli bir konusu vardır; kaygı daha yaygındır, konusu değişip durabilir.' } },
  { id: 'endise', name: 'Endişe', group: 'tetikte', desc: 'Belirli bir şeyin kötü gitmesinden duyulan tedirginlik.' },
  { id: 'korku', name: 'Korku', group: 'tetikte', desc: 'Bir tehlikeyi yakın ve gerçek hissettiğinde gelen geri çekilme ya da donma.', near: { id: 'kaygi', diff: 'Korku şimdiki ya da çok yakın bir tehlikeye, kaygı daha çok belirsiz bir geleceğe bakar.' } },
  { id: 'huzursuzluk', name: 'Huzursuzluk', group: 'tetikte', desc: 'Bir şeylerin yerinde olmadığı, yerinde duramama hissi.' },
  { id: 'gerginlik', name: 'Gerginlik', group: 'tetikte', desc: 'Her an bir şey olacakmış gibi gerilmiş bekleyiş.' },
  { id: 'saskinlik', name: 'Şaşkınlık', group: 'tetikte', desc: 'Beklemediğin bir şey karşısında ne düşüneceğini bilememek.' },

  // Yavaşlatan
  { id: 'yorgunluk', name: 'Yorgunluk', group: 'yavaslatan', desc: 'Taşıdıklarının ağırlığının bedende ya da zihinde birikmesi.', near: { id: 'isteksizlik', diff: 'Yorgunlukta güç yoktur; isteksizlikte güç olsa da yönelecek bir istek yoktur.' } },
  { id: 'bikkinlik', name: 'Bıkkınlık', group: 'yavaslatan', desc: 'Aynı şeyin tekrarından usanmak; "yine mi" duygusu.' },
  { id: 'isteksizlik', name: 'İsteksizlik', group: 'yavaslatan', desc: 'Normalde sevdiğin şeylere bile uzanmanın zorlaşması.' },
  { id: 'bosluk', name: 'Boşluk', group: 'yavaslatan', desc: 'Bir şey hissetmekte zorlanmak; içinin sessiz ya da uzak gelmesi.' },

  // Genişleten
  { id: 'sevinc', name: 'Sevinç', group: 'genisleten', desc: 'İyi bir şey olduğunda içinin açılması, hafiflemesi.', near: { id: 'heyecan', diff: 'Sevinç olana sevinir; heyecan olacak olana doğru kıpırdar.' } },
  { id: 'heyecan', name: 'Heyecan', group: 'genisleten', desc: 'Yaklaşan bir şeyin içte yarattığı canlı kıpırtı.' },
  { id: 'merak', name: 'Merak', group: 'genisleten', desc: 'Bir şeyi anlamak, bilmek, yakından görmek isteği.' },
  { id: 'umut', name: 'Umut', group: 'genisleten', desc: 'Bir şeyin iyiye dönebileceğine dair içindeki küçük açıklık.' },
  { id: 'huzur', name: 'Huzur', group: 'genisleten', desc: 'İçinin yerli yerinde olduğu, acele etmeyen sakinlik.', near: { id: 'rahatlama', diff: 'Rahatlama bir yük kalkınca gelir; huzur yük olmadan da olabilir.' } },
  { id: 'rahatlama', name: 'Rahatlama', group: 'genisleten', desc: 'Bir gerginlik ya da yük kalkınca gelen gevşeme.' },
  { id: 'sefkat', name: 'Şefkat', group: 'genisleten', desc: 'Birinin acısını görünce ona iyi gelmek istemek; kendine de yönelebilir.' },
  { id: 'yakinlik', name: 'Yakınlık', group: 'genisleten', desc: 'Biriyle aranda bağ olduğunu, görüldüğünü hissetmek.' },
  { id: 'minnet', name: 'Minnet', group: 'genisleten', desc: 'Sana iyi gelen bir şeyin ya da birinin değerini içten fark etmek.' },
  { id: 'gurur', name: 'Gurur', group: 'genisleten', desc: 'Emek verdiğin bir şeyin karşılığını görmekten gelen doyum.' },
];

export const FEELING_BY_ID = new Map(FEELINGS.map((f) => [f.id, f]));

/** Giriş: duygunun adını bilmek gerekmez. Birden fazlası seçilebilir. */
export const START_PHRASES = [
  { id: 'sikisma', text: 'İçim sıkışıyor', hints: ['kaygi', 'huzursuzluk', 'gerginlik', 'uzuntu'] },
  { id: 'dolu', text: 'Aklım çok dolu', hints: ['kaygi', 'endise', 'gerginlik', 'yorgunluk'] },
  { id: 'tepkili', text: 'Bir şeylere tepkiliyim', hints: ['ofke', 'sinirlilik', 'kirginlik', 'tahammulsuzluk'] },
  { id: 'enerji', text: 'Enerjim çekilmiş gibi', hints: ['yorgunluk', 'isteksizlik', 'bosluk', 'bikkinlik'] },
  { id: 'agirlik', text: 'İçimde bir ağırlık var', hints: ['uzuntu', 'hayal-kirikligi', 'sucluluk', 'ozlem'] },
  { id: 'hareket', text: 'İçimde güzel bir hareketlilik var', hints: ['sevinc', 'heyecan', 'umut', 'merak'] },
  { id: 'yumusak', text: 'İçim yumuşak, birine yakın hissediyorum', hints: ['yakinlik', 'sefkat', 'minnet', 'huzur'] },
  { id: 'anlatamiyorum', text: 'Bir şey hissediyorum ama anlatamıyorum', hints: [] },
] as const;

export type StartPhraseId = (typeof START_PHRASES)[number]['id'];

/** Beden notları — isteğe bağlı; bunlardan sonuç çıkarılmaz. */
export const BODY_NOTES = [
  'Göğsümde sıkışma',
  'Boğazımda düğüm',
  'Midemde kıpırtı',
  'Omuzlarımda ağırlık',
  'Kalbim hızlı',
  'Yüzüm ısınıyor',
  'Bedenim yorgun',
  'İçim hafif',
] as const;

/** "Bu durumda senin için önemli olan ne?" — olasılıklar; duygudan türetilmez. */
export const MATTERS = [
  'Anlaşılmak',
  'Yakınlık',
  'Dinlenmek',
  'Destek görmek',
  'Kendi alanım',
  'Netlik',
  'Güven',
  'Emeğimin görülmesi',
  'Adil davranılmak',
  'Kendi kararımı vermek',
  'Sakinlik',
  'Anlam',
  'Biraz keyif',
  'İlerlemek',
] as const;

/** Kart alanlarının sınırları (istemci ve sunucu ortak). */
export const CARD_LIMITS = {
  situation: 600,
  thought: 300,
  note: 300,
  item: 40,
  items: 8,
} as const;

/** Öneri isteğinde anlatım sınırı. */
export const FEELINGS_TEXT_MAX = 1200;
