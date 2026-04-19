/**
 * Hazır "Tek Cümlelik Tokat" havuzu.
 *
 * Mentor sohbetinde Claude kendi tokat cümlesini üretiyor (prompt'ta tanımlı).
 * Ama TEST SONUÇLARINDA API çağrısı yapmadan buradaki havuzdan seçiyoruz.
 *
 * Her mentor için 15 cümle — kullanıcının skoruna göre rastgele seçilir.
 * Sıfır API maliyeti.
 */

import type { MentorId } from '@/types';

const SLAPS: Record<MentorId, string[]> = {
  jung: [
    'Kaçtığın gölge, aslında senin en güçlü yanın.',
    'Anlamak ile yaşamak arasında kaybolmuş birisin.',
    'Maskeni o kadar çok taktın ki, altındaki yüzü unuttun.',
    'Tekrar eden rüyan, uyandığında da devam ediyor.',
    'İçindeki yabancıyla tanışmadıkça dışarıda hep aynı kişiyi bulacaksın.',
    'Bilinçaltın konuşuyor, ama sen kulaklarını kapatıyorsun.',
    'Gölgenle barışmadıkça, ışığın yarım kalacak.',
    'Her ilişkin aslında kendinle olan ilişkinin aynası.',
    'Cevapları dışarıda arıyorsun, soru içeride.',
    'Bastırdığın duygu, başka bir kılıkta geri dönüyor.',
    'Kendini tanımak acıtır — ama tanımamak daha çok.',
    'Rüyalarını dinlemiyorsun, onlar da bağırmaya başlıyor.',
    'Mükemmeliyetçiliğin, yetersizlik korkunu gizlemenin yolu.',
    'Herkes için güçlü oluyorsun, ama kim senin için güçlü?',
    'Kontrol etmeye çalıştığın şey, aslında seni kontrol ediyor.',
  ],
  nietzsche: [
    'Güçlü görünmek için harcadığın enerji, seni zayıflatıyor.',
    'Düşünüyorsun ama hareket etmiyorsun.',
    'Sorunun bilgi eksikliği değil, kaçınma alışkanlığın.',
    'Özgürlükten korkuyorsun çünkü sorumluluk getirir.',
    'Acıdan kaçtıkça acı seni buluyor.',
    'Sürüye aitsin ve bundan memnunsun — asıl trajedi bu.',
    'Başkalarının değerleriyle yaşayıp neden mutsuz olduğunu soruyorsun.',
    'Konfor alanın, aslında kafesinin süslü adı.',
    'Risk almıyorsun çünkü kaybedecek bir şeyin olduğunu sanıyorsun.',
    'Hayattan şikayetin, aslında kendinle yüzleşmekten kaçışın.',
    'Başarısızlıktan değil, başarının getireceği sorumluluktan korkuyorsun.',
    'Evet diyorsun ama her evetin altında bir kaçış var.',
    'Zayıflığını erdem sanıyorsun — en tehlikeli yanılgı bu.',
    'Kendi kurallarını yazmadıkça başkasının hikâyesinin figüranısın.',
    'Acını kutsallaştırdın — şimdi onsuz yaşamaktan korkuyorsun.',
  ],
  mevlana: [
    'Teslim oluyorum derken, aslında kaçıyorsun.',
    'Aradığın huzur, bırakmadığın şeyin arkasında.',
    'Kalbini açman gerekiyor, aklını değil.',
    'Yara kapanmıyor çünkü sürekli kontrol ediyorsun.',
    'Sevgiyi hak etmek için çabalıyorsun — sevgi çaba istemez.',
    'Akış diyorsun ama her şeyi kontrol etmeye çalışıyorsun.',
    'İçindeki boşluk, aslında doluluk davetiyesi.',
    'Affetmiyorsun çünkü öfke sana güç veriyor sandın.',
    'Arıyorsun ama bulmaktan korkuyorsun.',
    'Yalnızlığın, kalabalıkta daha çok acıtıyor.',
    'Korkun sevgiden büyük olduğu sürece yolun dar.',
    'Kabuğunu kırmadan uçamazsın — ama kırılmak acıtır.',
    'Dışarıda aradığın cevap, içindeki sessizlikte.',
    'Nefsin sana doğruyu söylüyor, ama sen onu susturuyorsun.',
    'Yanmadan pişemezsin — ama yanmaktan bu kadar kaçma.',
  ],
  marcus: [
    'Kontrol ettiğini sanıyorsun, ama sadece hissetmekten kaçıyorsun.',
    'Şikâyet ettiğin şeyin çözümü elinde — ama harekete geçmiyorsun.',
    'Dışarıyı değiştiremezsin, ama tepkini seçebilirsin — seçiyor musun?',
    'Ertelediğin görev, ertelediğin hayatın.',
    'Duygularını bastırmak, kontrol etmek değildir.',
    'Başkalarının fikrini kendi değerin sanıyorsun.',
    'Bugünü yarına feda ediyorsun — yarın hiç gelmeyebilir.',
    'Adaletten bahsediyorsun ama kendi görevini yapmıyorsun.',
    'Acın gerçek, ama ona verdiğin anlam senin seçimin.',
    'Kontrol edemediğin şeye harcanan enerji, kontrol edebildiğinden çalınır.',
    'Ölüm her gün bir adım yaklaşıyor — bugünü nasıl harcadın?',
    'Disiplinsizliğin, özgürlük değil — sadece başka bir esaret.',
    'Herkes haksız olabilir, ama bu senin görevini değiştirmez.',
    'Rahatsızlıktan kaçmak, seni rahat ettirmiyor.',
    'Güçlü olan dayanıklı değil, doğru anda hareket edendir.',
  ],
};

/**
 * Mentor ID'sine göre rastgele bir tokat cümlesi döner.
 * Opsiyonel seed ile belirlenimci seçim yapılabilir (aynı skor → aynı tokat).
 */
export function getRandomSlap(mentorId: MentorId, seed?: number): string {
  const pool = SLAPS[mentorId];
  const index = seed !== undefined
    ? Math.abs(seed) % pool.length
    : Math.floor(Math.random() * pool.length);
  return pool[index]!;
}

/**
 * Skor objesi → seed üretir (aynı skor her zaman aynı tokat).
 */
export function scoresToSeed(scores: Record<string, number>): number {
  return Object.values(scores).reduce((acc, val) => acc * 31 + val, 7);
}
