/**
 * Mentor laboratuvarı — talimat değişikliklerini canlıda sınamak için sabit
 * soru seti. Her talimat düzenlemesinden sonra aynı sorular bütün mentorlara
 * sorulur; cevaplar yan yana okunur. Kota düşmez, metrik yazılmaz; yalnızca
 * yapay zekâ maliyeti "Diğer" olarak görünür.
 *
 * Seçim ilkesi: gerçek kullanıcı sorularındaki konular (admin "Ne soruluyor?"),
 * hafif ve ağır sorular karışık; bazıları bilerek kısa ve belirsiz.
 */

export interface LabQuestion {
  id: string;
  topic: string;
  text: string;
}

export const LAB_QUESTIONS: LabQuestion[] = [
  { id: 'aldatilma', topic: 'Affetmek', text: 'Sevgilim beni aldattı. Affetmeli miyim, bilmiyorum.' },
  { id: 'kariyer', topic: 'Kariyer', text: 'Güvenli bir işim var ama içim sıkılıyor. Her şeyi bırakıp kendi işimi kurmak istiyorum, korkuyorum.' },
  { id: 'yas', topic: 'Kayıp', text: 'Annemi geçen ay kaybettim. Sanki hiçbir şeyin anlamı kalmadı.' },
  { id: 'kaygi', topic: 'Kaygı', text: 'Sınavım yaklaşıyor ve sürekli başaramayacağımı düşünüyorum, uyuyamıyorum.' },
  { id: 'yalnizlik', topic: 'Yalnızlık', text: 'Etrafımda bir sürü insan var ama kimse beni gerçekten tanımıyor.' },
  { id: 'aile', topic: 'Aile', text: 'Babam beni hep kardeşimle kıyasladı. Hâlâ onun gözünde yetersiz hissediyorum.' },
  { id: 'ofke', topic: 'Öfke', text: 'Çok çabuk sinirleniyorum, sonra söylediklerime pişman oluyorum.' },
  { id: 'erteleme', topic: 'Erteleme', text: 'Yapmam gereken her şeyi erteliyorum, sonra kendimden nefret ediyorum.' },
  { id: 'ask', topic: 'Aşk', text: 'Beni sevmeyen birini unutamıyorum, iki yıl oldu.' },
  { id: 'anlam', topic: 'Anlam', text: 'Hayatın anlamı ne?' },
  { id: 'para', topic: 'Para', text: 'Ne kadar kazanırsam kazanayım yetmiyor, hep daha fazlasını istiyorum.' },
  { id: 'kiyas', topic: 'Kıyas', text: 'Sosyal medyada herkes mutlu görünüyor, ben geride kalmış gibiyim.' },
  { id: 'evlilik', topic: 'İlişki', text: 'Evliliğimde artık konuşmuyoruz, aynı evde iki yabancı gibiyiz.' },
  { id: 'kisa', topic: 'Belirsiz', text: 'Çok yoruldum.' },
  { id: 'karar', topic: 'Karar', text: 'Yurt dışında iş teklifi aldım ama ailemi bırakmak istemiyorum.' },
  { id: 'ozguven', topic: 'Özgüven', text: 'Toplantılarda fikrimi söyleyemiyorum, sonra başkası aynı şeyi söyleyince takdir görüyor.' },
];

/** Değerlendirirken bakılacaklar; panelde cevapların üstünde gösterilir. */
export const LAB_RUBRIC = [
  'Karakter: Bu cevabı yalnızca bu mentor yazabilir miydi?',
  'Özgüllük: Sorudaki belirli bir kelimeyi ya da ayrıntıyı ele alıyor mu?',
  'Derinlik: Tek bir fikri sonuna kadar götürüyor mu, yoksa genel öğüt mü?',
  'Türkçe: Doğal mı, çeviri gibi mi?',
  'Ayrışma: Diğer mentorlardan farklı bir şey söylüyor mu?',
];
