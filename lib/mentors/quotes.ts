/**
 * Doğrulanmış alıntı kütüphanesi.
 *
 * Mentorlar cevabın sonuna alıntıyı KENDİLERİ YAZMAZ; yalnızca buradaki
 * bir kimliği `[[alinti:<id>]]` etiketiyle seçer. Sunucu (lib/mentors/quote-stream.ts)
 * etiketi aşağıdaki doğrulanmış metin ve kaynakla değiştirir. Listede olmayan
 * kimlikler sessizce düşürülür — böylece uydurma alıntı kullanıcıya ulaşamaz.
 *
 * Bir alıntıyı eklemenin kuralları:
 *  1. `original` alanı, kamuya açık güvenilir bir edisyonda BİREBİR aranıp
 *     bulunmuş olmalı (`verifiedFrom` alanına kaynak yazılır).
 *  2. `text` Mentoriva'nın KENDİ çevirisidir. Yayınlanmış Türkçe çeviriler
 *     çevirmenin telifindedir; birebir kullanılmaz.
 *  3. Yazarı ölümünün üzerinden 70 yıl geçmemiş eserlerde (ör. Jung, 2031'e
 *     kadar) yalnızca kısa alıntı + kaynak gösterimi yapılır (FSEK md. 35).
 */

export interface VerifiedQuote {
  id: string;
  /** Mentoriva çevirisi (kullanıcıya gösterilen). */
  text: string;
  /** Orijinal dildeki metin — doğrulama için. */
  original: string;
  /** Eser adı (Türkçe). */
  work: string;
  /** Eser içindeki konum (ör. "1.1"). */
  ref: string;
  /** Modelin uygun alıntıyı seçebilmesi için konular. */
  themes: string[];
  /** Orijinalin doğrulandığı edisyon. */
  verifiedFrom: string;
}

const LATIN_LIBRARY = 'The Latin Library (thelatinlibrary.com), 2026-10-02';

const SENECA: VerifiedQuote[] = [
  {
    id: 'sen-01',
    text: 'Kendini kendine geri kazan; şimdiye dek ya elinden alınan ya gizlice çalınan ya da elinden kayıp giden zamanı topla ve sakla.',
    original: 'vindica te tibi, et tempus quod adhuc aut auferebatur aut subripiebatur aut excidebat collige et serva.',
    work: "Lucilius'a Mektuplar",
    ref: '1.1',
    themes: ['zaman', 'öncelikler', 'kendine vakit ayırmak', 'tükenmişlik'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-02',
    text: 'Her yerde olan, hiçbir yerde değildir.',
    original: 'Nusquam est qui ubique est.',
    work: "Lucilius'a Mektuplar",
    ref: '2.2',
    themes: ['dağınıklık', 'odaklanmak', 'çok iş', 'yüzeysellik'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-03',
    text: 'Yoksul olan, az şeyi olan değil, daha fazlasını isteyendir.',
    original: 'non qui parum habet, sed qui plus cupit, pauper est.',
    work: "Lucilius'a Mektuplar",
    ref: '2.6',
    themes: ['para', 'hırs', 'yetinmek', 'kıyaslama', 'tatminsizlik'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-04',
    text: 'Birini dostluğuna kabul edip etmeyeceğini uzun uzun düşün; kabul etmeye karar verdiğinde ise onu bütün kalbinle içeri al.',
    original: 'Diu cogita an tibi in amicitiam aliquis recipiendus sit. Cum placuerit fieri, toto illum pectore admitte',
    work: "Lucilius'a Mektuplar",
    ref: '3.2',
    themes: ['dostluk', 'güven', 'ilişkiler', 'yakınlık'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-05',
    text: 'Öğütlerle yol uzundur; örneklerle kısa ve etkili.',
    original: 'longum iter est per praecepta, breve et efficax per exempla.',
    work: "Lucilius'a Mektuplar",
    ref: '6.5',
    themes: ['öğrenmek', 'örnek olmak', 'ebeveynlik', 'liderlik', 'değişim'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-06',
    text: 'İnsanlar öğretirken öğrenir.',
    original: 'homines dum docent discunt.',
    work: "Lucilius'a Mektuplar",
    ref: '7.8',
    themes: ['öğretmek', 'paylaşmak', 'gelişim', 'yardım etmek'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-07',
    text: 'Bizi korkutan şeyler, gerçekten ezenlerden daha çoktur; çoğu zaman gerçeklikten değil, kendi sanılarımızdan acı çekeriz.',
    original: 'Plura sunt, Lucili, quae nos terrent quam quae premunt, et saepius opinione quam re laboramus.',
    work: "Lucilius'a Mektuplar",
    ref: '13.4',
    themes: ['kaygı', 'korku', 'endişe', 'belirsizlik', 'felaket senaryoları'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-08',
    text: 'Gerçek sevinç ciddi bir şeydir.',
    original: 'verum gaudium res severa est.',
    work: "Lucilius'a Mektuplar",
    ref: '23.4',
    themes: ['mutluluk', 'haz', 'anlam', 'yüzeysel eğlence'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-09',
    text: 'Değiştirmen gereken gökyüzü değil, ruhun.',
    original: 'Animum debes mutare, non caelum.',
    work: "Lucilius'a Mektuplar",
    ref: '28.1',
    themes: ['kaçış', 'taşınmak', 'yeni başlangıç', 'huzursuzluk', 'yer değiştirmek'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-10',
    text: 'Zor oldukları için cesaret edemiyor değiliz; cesaret edemediğimiz için zordurlar.',
    original: 'Non quia difficilia sunt non audemus, sed quia non audemus difficilia sunt.',
    work: "Lucilius'a Mektuplar",
    ref: '104.26',
    themes: ['cesaret', 'erteleme', 'korku', 'adım atmak', 'karar'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-11',
    text: 'Kısa bir zamanımız yok; asıl biz çok zaman yitirdik.',
    original: 'Non exiguum temporis habemus, sed multum perdidimus.',
    work: 'Hayatın Kısalığı Üzerine',
    ref: '1.3',
    themes: ['zaman', 'pişmanlık', 'hayatın kısalığı', 'boşa geçen yıllar'],
    verifiedFrom: LATIN_LIBRARY,
  },
  {
    id: 'sen-12',
    text: 'Öfkenin en büyük ilacı beklemektir.',
    original: 'Maximum remedium irae mora est.',
    work: 'Öfke Üzerine',
    ref: '2.29.1',
    themes: ['öfke', 'tartışma', 'kırgınlık', 'tepki vermek'],
    verifiedFrom: LATIN_LIBRARY,
  },
];

// Yunanca: el.wikisource "Τα εις εαυτόν"; bölüm numaraları George Long çevirisiyle
// (1862, Project Gutenberg #15877) eşleştirildi.
const MARCUS_SRC = 'el.wikisource (Τὰ εἰς ἑαυτόν) + G. Long çevirisi, Gutenberg #15877, 2026-10-02';

const MARCUS: VerifiedQuote[] = [
  {
    id: 'mar-01',
    text: 'Sabah kendine önceden söyle: bugün işgüzar, nankör, küstah, hilekâr, kıskanç ve bencil insanlarla karşılaşacağım.',
    original: 'Ἕωθεν προλέγειν ἑαυτῷ˙ συντεύξομαι περιέργῳ, ἀχαρίστῳ, ὑβριστῇ, δολερῷ, βασκάνῳ, ἀκοινωνήτῳ',
    work: 'Kendime Düşünceler',
    ref: '2.1',
    themes: ['zor insanlar', 'iş yeri', 'sabır', 'öfke', 'hayal kırıklığı'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-02',
    text: 'Evren değişimdir; hayat ise ona dair kanaatimizdir.',
    original: 'ὁ κόσμος ἀλλοίωσις, ὁ βίος ὑπόληψις',
    work: 'Kendime Düşünceler',
    ref: '4.3',
    themes: ['değişim', 'bakış açısı', 'algı', 'yorum'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-03',
    text: 'İnsan hiçbir yere kendi ruhundan daha sakin ve daha dertsiz bir yere çekilemez.',
    original: 'οὐδαμοῦ γὰρ οὔτε ἡσυχιώτερον οὔτε ἀπραγμονέστερον ἄνθρωπος ἀναχωρεῖ ἢ εἰς τὴν ἑαυτοῦ ψυχήν',
    work: 'Kendime Düşünceler',
    ref: '4.3',
    themes: ['huzur', 'kaçış isteği', 'yorgunluk', 'iç dinginlik'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-04',
    text: 'İşi durduran şey işi ilerletir; yolu kesen engel yolu açar.',
    original: 'πρὸ ἔργου γίνεται τὸ τοῦ ἔργου τούτου ἐφεκτικὸν καὶ πρὸ ὁδοῦ τὸ τῆς ὁδοῦ ταύτης ἐνστατικόν',
    work: 'Kendime Düşünceler',
    ref: '5.20',
    themes: ['engel', 'başarısızlık', 'aksilik', 'zorluk', 'plan bozulması'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-05',
    text: 'Zihnin, sık sık düşlediğin şeylerin rengini alır; çünkü ruh düşüncelerle boyanır.',
    original: 'Οἷα ἂν πολλάκις φαντασθῇς, τοιαύτη σοι ἔσται ἡ διάνοια˙ βάπτεται γὰρ ὑπὸ τῶν φαντασιῶν ἡ ψυχή.',
    work: 'Kendime Düşünceler',
    ref: '5.16',
    themes: ['düşünceler', 'kaygı döngüsü', 'alışkanlık', 'olumsuz düşünce'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-06',
    text: 'Öç almanın en iyi yolu, sana kötülük yapana benzememektir.',
    original: 'Ἄριστος τρόπος τοῦ ἀμύνεσθαι τὸ μὴ ἐξομοιοῦσθαι',
    work: 'Kendime Düşünceler',
    ref: '6.6',
    themes: ['intikam', 'ihanet', 'kırgınlık', 'haksızlık'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-07',
    text: 'İçini kaz; iyiliğin kaynağı içindedir.',
    original: 'Ἔνδον σκάπτε, ἔνδον ἡ πηγὴ τοῦ ἀγαθοῦ',
    work: 'Kendime Düşünceler',
    ref: '7.59',
    themes: ['içe dönmek', 'kendini tanımak', 'öz değer', 'onay arayışı'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-08',
    text: 'Olmayanları zaten varmış gibi düşleme; var olanların en güzellerini say.',
    original: 'Μὴ τὰ ἀπόντα ἐννοεῖν ὡς ἤδη ὄντα, ἀλλὰ τῶν παρόντων τὰ δεξιώτατα ἐκλογίζεσθαι',
    work: 'Kendime Düşünceler',
    ref: '7.27',
    themes: ['şükür', 'kıyaslama', 'yetinmek', 'tatminsizlik'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-09',
    text: 'Dışarıdaki bir şey yüzünden üzülüyorsan, seni rahatsız eden o şey değil, onun hakkındaki kendi yargındır; o yargıyı silmek ise şimdi senin elinde.',
    original: 'Εἰ μὲν διά τι τῶν ἐκτὸς λυπῇ, οὐκ ἐκεῖνό σοι ἐνοχλεῖ, ἀλλὰ τὸ σὸν περὶ αὐτοῦ κρῖμα, τοῦτο δὲ ἤδη ἐξαλεῖψαι ἐπὶ σοί ἐστιν',
    work: 'Kendime Düşünceler',
    ref: '8.47',
    themes: ['üzüntü', 'yargı', 'kontrol', 'kaygı', 'olaylar'],
    verifiedFrom: MARCUS_SRC,
  },
  {
    id: 'mar-10',
    text: 'İyi bir insanın nasıl olması gerektiğini tartışmayı artık tamamen bırak; öyle ol.',
    original: 'Μηκέθ ὅλως περὶ τοῦ οἷόν τινα εἶναι τὸν ἀγαθὸν ἄνδρα διαλέγεσθαι, ἀλλὰ εἶναι τοιοῦτον',
    work: 'Kendime Düşünceler',
    ref: '10.16',
    themes: ['eylem', 'erteleme', 'söz değil iş', 'kararlılık'],
    verifiedFrom: MARCUS_SRC,
  },
];

// Almanca: Project Gutenberg Almanca edisyonları (#7205 Zarathustra, #7203 Götzen-Dämmerung,
// #7204 Jenseits von Gut und Böse, #7202 Ecce homo). Eski imla (Irrthum, giebt) korunmuştur.
const NIETZSCHE_SRC = 'Project Gutenberg Almanca edisyonları, 2026-10-02';

const NIETZSCHE: VerifiedQuote[] = [
  {
    id: 'nie-01',
    text: 'İnsan hayatının bir "neden"ini bulduysa, neredeyse her "nasıl"a katlanabilir.',
    original: 'Hat man sein warum? des Lebens, so verträgt man sich fast mit jedem wie?',
    work: 'Putların Alacakaranlığı, Özdeyişler ve Oklar',
    ref: '12',
    themes: ['anlam', 'amaç', 'zorluk', 'dayanmak', 'motivasyon kaybı'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-02',
    text: 'Müziksiz hayat bir yanılgı olurdu.',
    original: 'Ohne Musik wäre das Leben ein Irrthum.',
    work: 'Putların Alacakaranlığı, Özdeyişler ve Oklar',
    ref: '33',
    themes: ['neşe', 'sanat', 'tutku', 'hayattan zevk almak', 'renksizlik'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-03',
    text: 'Dans eden bir yıldız doğurabilmek için insanın içinde hâlâ kaos taşıması gerekir.',
    original: 'man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.',
    work: 'Böyle Buyurdu Zerdüşt, Önsöz',
    ref: '5',
    themes: ['kaos', 'karmaşa', 'yaratıcılık', 'kriz dönemi', 'kafa karışıklığı'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-04',
    text: 'İnsanda büyük olan, onun bir amaç değil bir köprü olmasıdır.',
    original: 'Was gross ist am Menschen, das ist, dass er eine Brücke und kein Zweck ist',
    work: 'Böyle Buyurdu Zerdüşt, Önsöz',
    ref: '4',
    themes: ['değişim', 'gelişim', 'geçiş dönemi', 'kendini aşmak'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-05',
    text: 'Ol, olduğun kişi!',
    original: 'Werde, der du bist!',
    work: 'Böyle Buyurdu Zerdüşt IV, Bal Sunusu',
    ref: '',
    themes: ['kimlik', 'kendin olmak', 'başkalarının beklentileri', 'aile baskısı'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-06',
    text: '"İşte bu benim yolum; sizinki nerede?" Çünkü tek bir doğru yol diye bir şey yoktur.',
    original: '„Das—ist nun mein Weg,—wo ist der eure?“ […] Den Weg nämlich—den giebt es nicht!',
    work: 'Böyle Buyurdu Zerdüşt III, Ağırlık Ruhu Üzerine',
    ref: '2',
    themes: ['kendi yolunu bulmak', 'kariyer', 'karar', 'taklit', 'onay arayışı'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-07',
    text: 'İnsan kendini sevmeyi öğrenmelidir; sağlıklı ve bütün bir sevgiyle.',
    original: 'Man muss sich selber lieben lernen—also lehre ich—mit einer heilen und gesunden Liebe',
    work: 'Böyle Buyurdu Zerdüşt III, Ağırlık Ruhu Üzerine',
    ref: '2',
    themes: ['özsaygı', 'kendini sevmek', 'özeleştiri', 'yetersizlik hissi'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-08',
    text: 'İnsandaki büyüklük için formülüm amor fati’dir: hiçbir şeyin başka türlü olmasını istememek; ne ileride, ne geride, ne de sonsuza dek.',
    original: 'Meine Formel für die Grösse am Menschen ist amor fati: dass man Nichts anders haben will, vorwärts nicht, rückwärts nicht, in alle Ewigkeit nicht.',
    work: 'Ecce Homo, Neden Bu Kadar Akıllıyım',
    ref: '10',
    themes: ['kabullenmek', 'geçmiş', 'pişmanlık', 'kader', 'hayata evet demek'],
    verifiedFrom: NIETZSCHE_SRC,
  },
  {
    id: 'nie-09',
    text: 'İnsan, bağımsızlık ve kendi yolunu çizmek için doğduğunu kendine kendisi kanıtlamalıdır.',
    original: 'Man muss sich selbst seine Proben geben, dafür dass man zur Unabhängigkeit und zum Befehlen bestimmt ist',
    work: 'İyinin ve Kötünün Ötesinde',
    ref: '41',
    themes: ['bağımsızlık', 'özgüven', 'kendini sınamak', 'liderlik'],
    verifiedFrom: NIETZSCHE_SRC,
  },
];

// Farsça: Ganjoor (ganjoor.net, Mesnevî-i Ma'nevî, 1. defter, 1. bölüm "Ney-nâme").
// Beyit numaraları I. cildin baştan sayımıdır. Mevlânâ'ya yaygın olarak yanlış atfedilen
// "Ne olursan ol yine gel" ve "Yara ışığın girdiği yerdir" bilinçli olarak YOKTUR.
const MEVLANA_SRC = 'Ganjoor (ganjoor.net) Mesnevî I. defter, 2026-10-02';

const MEVLANA: VerifiedQuote[] = [
  {
    id: "mev-01",
    text: "Dinle bu neyi, nasıl şikâyet ediyor; ayrılıkları anlatıyor.",
    original: "بشنو این نی چون شکایت می‌کند / از جدایی‌ها حکایت می‌کند",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "1",
    themes: ["ayrılık", "özlem", "kayıp", "yalnızlık"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-02",
    text: "Ayrılıktan parça parça olmuş bir yürek isterim ki özlemin derdini ona anlatayım.",
    original: "سینه خواهم شَرحه‌شَرحه از فراق / تا بگویم شرحِ دردِ اشتیاق",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "3",
    themes: ["acı", "anlaşılmak", "dert ortağı", "yas"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-03",
    text: "Aslından uzak düşen herkes, yeniden kavuşacağı günü arar.",
    original: "هر کسی کو دور ماند از اصلِ خویش / باز جوید روزگارِ وصلِ خویش",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "4",
    themes: ["özlem", "aidiyet", "köklere dönüş", "gurbet"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-04",
    text: "Herkes kendi zannınca dostum oldu; içimdeki sırları arayan olmadı.",
    original: "هر کسی از ظَنّ خود شد یار من / از درون من نجُست اَسرار من",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "6",
    themes: ["anlaşılmamak", "yalnızlık", "yüzeysel ilişkiler", "dostluk"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-05",
    text: "Günler geçip gittiyse de ki: “Gidin, ne gam! Yeter ki sen kal, ey eşsiz ve temiz olan.”",
    original: "روزها گر رفت، گو «رو، باک نیست / تو بمان، ای آنکه چون تو پاک نیست»",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "16",
    themes: ["geçen zaman", "pişmanlık", "sevgi", "kayıp"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-06",
    text: "Ham olan, pişmişin hâlini anlayamaz; öyleyse sözü kısa kesmek gerek, vesselam.",
    original: "در نیابد حالِ پُخته هیچ خام / پس سخن کوتاه باید والسّلام",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "18",
    themes: ["olgunluk", "tecrübe", "anlaşılmamak", "sabır"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-07",
    text: "Bağı kopar, özgür ol evlat! Ne zamana dek gümüşün ve altının esiri kalacaksın?",
    original: "بندْ بُگسَل، باش آزاد، ای پسر! / چند باشی بندِ سیم و بندِ زر",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "19",
    themes: ["para", "hırs", "özgürlük", "bağımlılık"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-08",
    text: "Denizi bir testiye döksen, ne kadarı sığar? Bir günlük pay kadar.",
    original: "گر بریزی بَحر را در کوزه‌ای / چند گنجد‌ قسمتِ یک روزه‌ای؟",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "20",
    themes: ["açgözlülük", "yetinmek", "sınırlar", "telaş"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-09",
    text: "Hırslıların göz testisi hiç dolmadı; istiridye kanaat etmedikçe inciyle dolmadı.",
    original: "کوزه‌ٔ چشمِ حریصان پُر نشد / تا صدف قانع نشد پُر دُر نشد",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "21",
    themes: ["kanaat", "hırs", "sabır", "şükür"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-10",
    text: "Ne mutlu sana, ey güzel sevdalı aşkımız; ey bütün dertlerimizin hekimi!",
    original: "شاد باش ای عشقِ خوش‌سودای ما / ای طبیبِ جمله علّت‌هایِ ما",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "23",
    themes: ["aşk", "iyileşmek", "umut", "sevgi"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-11",
    text: "Dilinden anlayandan ayrı düşen, yüz nağmesi olsa da dilsiz kalır.",
    original: "هر که او از هم‌زبانی شد جدا / بی‌زبان شد گر چه دارد صد نوا",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "28",
    themes: ["anlaşılmamak", "yalnızlık", "ait olamamak", "ilişkiler"],
    verifiedFrom: MEVLANA_SRC,
  },
  {
    id: "mev-12",
    text: "Aynan neden gerçeği göstermiyor, bilir misin? Çünkü yüzündeki pas silinmemiş.",
    original: "آینه‌ت دانی چرا غمّاز نیست؟ / زآن که زَنگار از رُخَش مُمتاز نیست",
    work: "Mesnevî, I. Cilt, beyit",
    ref: "34",
    themes: ["kendini tanımak", "iç temizlik", "öz eleştiri", "farkındalık"],
    verifiedFrom: MEVLANA_SRC,
  },
];

// ---------------------------------------------------------------------------
// 2026-10-05 genişletmesi. Her `original` kaynak metinde birebir aranıp bulundu
// (vurgu/noktalama farkları dışında). Çeviriler Mentoriva'nındır.
// Bilinçli olarak eklenmeyenler: Seneca Ep. 16.7 (Epikuros'un sözü),
// Marcus 5.18 (yas içindekine acısını küçümseyen teselli gibi okunabilir),
// Nietzsche "beni öldürmeyen…" (ölüm imgesi, klişe), "sevgiyle yapılan…"
// (zararı aklamak için kullanılabilir), Sokrates Savunma 38a "sorgulanmamış
// hayat yaşanmaya değmez" (hayatını anlamsız bulan birine yanlış okunabilir).
// ---------------------------------------------------------------------------

const LATIN_LIBRARY_2 = 'The Latin Library (thelatinlibrary.com), 2026-10-05';

const SENECA_2: VerifiedQuote[] = [
  { id: 'sen-13', text: 'Her şey başkasınındır, Lucilius; yalnızca zaman bizimdir.', original: 'Omnia, Lucili, aliena sunt, tempus tantum nostrum est', work: "Lucilius'a Mektuplar", ref: '1.3', themes: ['zaman', 'sahip olmak', 'öncelikler', 'tükenmişlik'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-14', text: 'Biz erteledikçe hayat geçip gider.', original: 'Dum differtur vita transcurrit.', work: "Lucilius'a Mektuplar", ref: '1.3', themes: ['erteleme', 'yarına bırakmak', 'zaman', 'pişmanlık'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-15', text: 'Hiçbir şey iyileşmeyi, ilaçları sık sık değiştirmek kadar engellemez.', original: 'nihil aeque sanitatem impedit quam remediorum crebra mutatio', work: "Lucilius'a Mektuplar", ref: '2.3', themes: ['sabır', 'sık fikir değiştirmek', 'kararsızlık', 'odaklanmak'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-16', text: 'Herkese güvenmek de kusurdur, kimseye güvenmemek de.', original: 'utrumque enim vitium est, et omnibus credere et nulli', work: "Lucilius'a Mektuplar", ref: '3.4', themes: ['güven', 'ilişkiler', 'şüphe', 'kırgınlık'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-17', text: 'Elinden geldiğince kendi içine çekil; seni daha iyi biri yapacak insanlarla bir arada ol.', original: 'Recede in te ipse quantum potes; cum his versare qui te meliorem facturi sunt', work: "Lucilius'a Mektuplar", ref: '7.8', themes: ['çevre', 'arkadaşlar', 'kalabalık', 'kötü etki'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-18', text: 'Kötülüğümüz dışarıda değil, içimizdedir.', original: 'non est extrinsecus malum nostrum: intra nos est', work: "Lucilius'a Mektuplar", ref: '50.4', themes: ['sorumluluk', 'başkalarını suçlamak', 'alışkanlık', 'kendini değiştirmek'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-19', text: 'Bir dostu yitirdiğinde gözlerin ne kuru kalsın ne sel olsun; gözyaşı dökülür, ama feryat edilmez.', original: 'Nec sicci sint oculi amisso amico nec fluant; lacrimandum est, non plorandum.', work: "Lucilius'a Mektuplar", ref: '63.1', themes: ['yas', 'kayıp', 'ağlamak', 'sevilen birini yitirmek'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-20', text: 'Hangi limana gideceğini bilmeyene hiçbir rüzgâr uygun değildir.', original: 'ignoranti quem portum petat nullus suus ventus est.', work: "Lucilius'a Mektuplar", ref: '71.3', themes: ['yön', 'karar', 'kariyer', 'amaçsızlık'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-21', text: 'İnsan, mutsuz olduğuna inandığı kadar mutsuzdur.', original: 'Tam miser est quisque quam credidit.', work: "Lucilius'a Mektuplar", ref: '78.14', themes: ['üzüntü', 'bakış açısı', 'yorum', 'şikâyet'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-22', text: 'Vakti gelmeden acı çeken, gerektiğinden fazla acı çeker.', original: 'Plus dolet quam necesse est qui ante dolet quam necesse est', work: "Lucilius'a Mektuplar", ref: '98.8', themes: ['kaygı', 'endişe', 'felaket senaryoları', 'beklemek'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-23', text: 'Parasını başkalarıyla paylaşmak isteyen kimse bulunmaz; ama herkes hayatını ne çok kişiye dağıtır!', original: 'nemo inuenitur qui pecuniam suam diuidere uelit, uitam unusquisque quam multis distribuit!', work: 'Hayatın Kısalığı Üzerine', ref: '3.1', themes: ['zaman', 'sınır koymak', 'hayır diyememek', 'herkese yetişmek'], verifiedFrom: LATIN_LIBRARY_2 },
  { id: 'sen-24', text: 'Ben de bu imkândan yararlanırım ve her gün kendi davamı kendi önümde görürüm.', original: 'Vtor hac potestate et cotidie apud me causam dico', work: 'Öfke Üzerine', ref: '3.36.3', themes: ['öz değerlendirme', 'günü gözden geçirmek', 'hata', 'gelişim'], verifiedFrom: LATIN_LIBRARY_2 },
];

const MARCUS_SRC_2 = 'el.wikisource (Τὰ εἰς ἑαυτόν), 2026-10-05; standart bölüm numaraları';

const MARCUS_2: VerifiedQuote[] = [
  { id: 'mar-11', text: 'On bin yıl yaşayacakmış gibi yaşama. Kaçınılmaz olan başının üstünde duruyor; yaşadıkça, elinden geldikçe iyi bir insan ol.', original: 'Μὴ ὡς μύρια μέλλων ἔτη ζῆν. τὸ χρεὼν ἐπήρτηται˙ ἕως ζῇς, ἕως ἔξεστιν, ἀγαθὸς γενοῦ.', work: 'Kendime Düşünceler', ref: '4.17', themes: ['erteleme', 'şimdi', 'iyi bir insan olmak', 'zaman'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-12', text: 'Dalgaların durmadan çarptığı kayalık burun gibi ol; o yerinde durur, çevresindeki köpüklü su da onun etrafında yatışır.', original: 'Ὅμοιον εἶναι τῇ ἄκρᾳ, ᾗ διηνεκῶς τὰ κύματα προσρήσσεται˙ ἡ δὲ ἕστηκε καὶ περὶ αὐτὴν κοιμίζεται τὰ φλεγμήναντα τοῦ ὕδατος.', work: 'Kendime Düşünceler', ref: '4.49', themes: ['dayanıklılık', 'eleştiri', 'baskı', 'sakin kalmak'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-13', text: 'Sabah kalkmakta zorlandığında şunu aklında tut: bir insanın işini yapmak için uyanıyorum.', original: 'Ὄρθρου, ὅταν δυσόκνως ἐξεγείρῃ, πρόχειρον ἔστω ὅτι ἐπὶ ἀνθρώπου ἔργον ἐγείρομαι', work: 'Kendime Düşünceler', ref: '5.1', themes: ['erteleme', 'isteksizlik', 'iş', 'sabah'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-14', text: 'Sakın Sezarlaşma, o boyaya bulanma; çünkü bu olur.', original: 'Ὅρα μὴ ἀποκαισαρωθῇς, μὴ βαφῇς˙ γίνεται γάρ.', work: 'Kendime Düşünceler', ref: '6.30', themes: ['kibir', 'güç', 'başarı', 'yükselince değişmek'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-15', text: 'Gelecek seni sarsmasın; gerekirse ona da bugün elindekilere karşı kullandığın aynı akılla varacaksın.', original: 'Τὰ μέλλοντα μὴ ταρασσέτω˙ ἥξεις γὰρ ἐπ αὐτά, ἐὰν δεήσῃ, φέρων τὸν αὐτὸν λόγον ᾧ νῦν πρὸς τὰ παρόντα χρᾷ.', work: 'Kendime Düşünceler', ref: '7.8', themes: ['kaygı', 'gelecek', 'belirsizlik', 'sınav'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-16', text: 'Hata yapanları bile sevmek insana özgüdür.', original: 'Ἴδιον ἀνθρώπου φιλεῖν καὶ τοὺς πταίοντας.', work: 'Kendime Düşünceler', ref: '7.22', themes: ['affetmek', 'hata', 'ilişkiler', 'kırgınlık'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-17', text: 'Tutkulardan özgür bir zihin bir kaledir; insanın elinde bundan daha sağlam bir şey yoktur.', original: 'ἀκρόπολίς ἐστιν ἡ ἐλευθέρα παθῶν διάνοια˙ οὐδὲν γὰρ ὀχυρώτερον ἔχει ἄνθρωπος', work: 'Kendime Düşünceler', ref: '8.48', themes: ['iç huzur', 'içsel güç', 'kaygı', 'kontrol'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-18', text: 'İnsanlar birbirleri için var oldu; öyleyse ya öğret ya katlan.', original: 'Οἱ ἄνθρωποι γεγόνασιν ἀλλήλων ἕνεκεν˙ ἢ δίδασκε οὖν ἢ φέρε.', work: 'Kendime Düşünceler', ref: '8.59', themes: ['ilişkiler', 'zor insanlar', 'sabır', 'aile'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-19', text: 'Sahici olduğu sürece iyi niyet yenilmezdir.', original: 'τὸ εὐμενὲς ἀνίκητον, ἐὰν γνήσιον ᾖ', work: 'Kendime Düşünceler', ref: '11.18', themes: ['öfke', 'zor insanlar', 'nezaket', 'tartışma'], verifiedFrom: MARCUS_SRC_2 },
  { id: 'mar-20', text: 'Uygun değilse yapma; doğru değilse söyleme.', original: 'Εἰ μὴ καθήκει, μὴ πράξῃς˙ εἰ μὴ ἀληθές ἐστι, μὴ εἴπῃς.', work: 'Kendime Düşünceler', ref: '12.17', themes: ['dürüstlük', 'karar', 'söz', 'vicdan'], verifiedFrom: MARCUS_SRC_2 },
];

const NIETZSCHE_SRC_2 = 'Project Gutenberg Almanca edisyonları (#7202-7205), 2026-10-05';

const NIETZSCHE_2: VerifiedQuote[] = [
  { id: 'nie-10', text: 'Canavarlarla savaşan, bu sırada kendisinin de canavara dönüşmemesine dikkat etsin. Ve uzun süre bir uçuruma bakarsan, uçurum da sana bakar.', original: 'Wer mit Ungeheuern kämpft, mag zusehn, dass er nicht dabei zum Ungeheuer wird. Und wenn du lange in einen Abgrund blickst, blickt der Abgrund auch in dich hinein.', work: 'İyinin ve Kötünün Ötesinde', ref: '146', themes: ['intikam', 'öfke', 'nefret', 'kavga'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-11', text: 'Beni sarsan, bana yalan söylemen değil; artık sana inanamamam.', original: 'Nicht dass du mich belogst, sondern dass ich dir nicht mehr glaube, hat mich erschüttert.', work: 'İyinin ve Kötünün Ötesinde', ref: '183', themes: ['ihanet', 'yalan', 'güven', 'aldatılmak'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-12', text: '"Bunu ben yaptım" der hafızam. "Bunu ben yapmış olamam" der gururum ve inatla direnir. Sonunda hafıza geri adım atar.', original: '"Das habe ich gethan" sagt mein Gedächtniss. Das kann ich nicht gethan haben - sagt mein Stolz und bleibt unerbittlich. Endlich - giebt das Gedächtniss nach.', work: 'İyinin ve Kötünün Ötesinde', ref: '68', themes: ['suçluluk', 'gurur', 'kendini kandırmak', 'hata'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-13', text: 'Kendini küçümseyen, bunu yaparken bile küçümseyen olarak kendine saygı duyar.', original: 'Wer sich selbst verachtet, achtet sich doch immer noch dabei als Verächter.', work: 'İyinin ve Kötünün Ötesinde', ref: '78', themes: ['kendini küçümsemek', 'özeleştiri', 'yetersizlik', 'utanç'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-14', text: 'En cesurumuzun bile aslında bildiği şeyi göze alacak cesareti nadiren vardır.', original: 'Auch der Muthigste von uns hat nur selten den Muth zu dem, was er eigentlich weiss', work: 'Putların Alacakaranlığı, Özdeyişler ve Oklar', ref: '2', themes: ['cesaret', 'bildiğini yapamamak', 'erteleme', 'karar'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-15', text: 'Dostum, yalnızlığına kaç!', original: 'Fliehe, mein Freund, in deine Einsamkeit!', work: 'Böyle Buyurdu Zerdüşt I, Pazar Yerinin Sinekleri Üzerine', ref: '', themes: ['yalnızlık', 'kalabalık', 'gürültü', 'kendine dönmek'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-16', text: 'Hep öğrenci kalan, öğretmenine kötü karşılık vermiş olur.', original: 'Man vergilt einem Lehrer schlecht, wenn man immer nur der Schüler bleibt.', work: 'Böyle Buyurdu Zerdüşt I, Bağışlayan Erdem Üzerine', ref: '3', themes: ['bağımsızlık', 'öğretmen', 'kendi yolu', 'taklit'], verifiedFrom: NIETZSCHE_SRC_2 },
  { id: 'nie-17', text: 'Kardeşim, yalnızlığa mı gitmek istiyorsun? Kendine giden yolu mu aramak istiyorsun? Biraz daha bekle ve beni dinle.', original: 'Willst du, mein Bruder, in die Vereinsamung gehen? Willst du den Weg zu dir selber suchen? Zaudere noch ein Wenig und höre mich.', work: 'Böyle Buyurdu Zerdüşt I, Yaratanın Yolu Üzerine', ref: '', themes: ['kendi yolu', 'kendini aramak', 'yalnızlık', 'büyük karar'], verifiedFrom: NIETZSCHE_SRC_2 },
];

const PLATO_SRC = 'Platon, Burnet edisyonu (Oxford 1903), el.wikisource, 2026-10-05';

const SOKRATES: VerifiedQuote[] = [
  { id: 'sok-01', text: 'Anlaşılan, ondan şu küçük farkla daha bilgeyim: bilmediğim şeyi bildiğimi de sanmıyorum.', original: 'ἔοικα γοῦν τούτου γε σμικρῷ τινι αὐτῷ τούτῳ σοφώτερος εἶναι, ὅτι ἃ μὴ οἶδα οὐδὲ οἴομαι εἰδέναι', work: 'Platon, Savunma', ref: '21d', themes: ['bilmemek', 'kesinlik', 'alçakgönüllülük', 'öğrenmek'], verifiedFrom: PLATO_SRC },
  { id: 'sok-02', text: 'Erdem paradan doğmaz; para da, insanlar için iyi olan diğer her şey de erdemden doğar.', original: 'οὐκ ἐκ χρημάτων ἀρετὴ γίγνεται, ἀλλ᾽ ἐξ ἀρετῆς χρήματα καὶ τὰ ἄλλα ἀγαθὰ τοῖς ἀνθρώποις ἅπαντα', work: 'Platon, Savunma', ref: '30b', themes: ['para', 'başarı', 'değerler', 'hırs'], verifiedFrom: PLATO_SRC },
  { id: 'sok-03', text: 'En çok önem vermemiz gereken yaşamak değil, iyi yaşamaktır.', original: 'οὐ τὸ ζῆν περὶ πλείστου ποιητέον ἀλλὰ τὸ εὖ ζῆν', work: 'Platon, Kriton', ref: '48b', themes: ['değerler', 'öncelikler', 'anlam', 'iyi bir hayat'], verifiedFrom: PLATO_SRC },
  { id: 'sok-04', text: 'Başına ne gelirse gelsin, ne haksızlığa haksızlıkla karşılık vermeli ne de hiçbir insana kötülük etmeli.', original: 'Οὔτε ἄρα ἀνταδικεῖν δεῖ οὔτε κακῶς ποιεῖν οὐδένα ἀνθρώπων, οὐδ᾽ ἂν ὁτιοῦν πάσχῃ ὑπ᾽ αὐτῶν', work: 'Platon, Kriton', ref: '49c', themes: ['intikam', 'haksızlık', 'öfke', 'ihanet'], verifiedFrom: PLATO_SRC },
  { id: 'sok-05', text: 'Haksızlık etmekle haksızlığa uğramak arasında seçmek zorunda kalsaydım, haksızlığa uğramayı seçerdim.', original: "εἰ δ' ἀναγκαῖον εἴη ἀδικεῖν ἢ ἀδικεῖσθαι, ἑλοίμην ἂν μᾶλλον ἀδικεῖσθαι ἢ ἀδικεῖν", work: 'Platon, Gorgias', ref: '469c', themes: ['dürüstlük', 'vicdan', 'adalet', 'zor seçim'], verifiedFrom: PLATO_SRC },
  { id: 'sok-06', text: 'Hayret etmek tam da bir filozofun duygusudur; felsefenin bundan başka bir başlangıcı yoktur.', original: 'μάλα γὰρ φιλοσόφου τοῦτο τὸ πάθος, τὸ θαυμάζειν· οὐ γὰρ ἄλλη ἀρχὴ φιλοσοφίας ἢ αὕτη', work: 'Platon, Theaitetos', ref: '155d', themes: ['merak', 'öğrenmek', 'şaşırmak', 'başlangıç'], verifiedFrom: PLATO_SRC },
  { id: 'sok-07', text: 'Delfi\'deki yazının buyurduğu gibi kendimi henüz tanıyamadım; bunu bilmezken başka şeyleri araştırmak bana gülünç geliyor.', original: 'οὐ δύναμαί πω κατὰ τὸ Δελφικὸν γράμμα γνῶναι ἐμαυτόν· γελοῖον δή μοι φαίνεται τοῦτο ἔτι ἀγνοοῦντα τὰ ἀλλότρια σκοπεῖν', work: 'Platon, Phaidros', ref: '229e', themes: ['kendini tanımak', 'öncelikler', 'merak', 'dağınıklık'], verifiedFrom: PLATO_SRC },
];

const MEVLANA_SRC_2 = 'Ganjoor (ganjoor.net) Mesnevî I-III. defterler, 2026-10-05';

const MEVLANA_2: VerifiedQuote[] = [
  { id: 'mev-13', text: 'Herkesin avucunda bir mum olsaydı, sözlerindeki ayrılık ortadan kalkardı.', original: 'در کف هر کس اگر شمعی بدی / اختلاف از گفتشان بیرون شدی', work: 'Mesnevî, III. Cilt, Karanlıkta Fil hikâyesi', ref: '', themes: ['anlaşmazlık', 'farklı bakış açıları', 'tartışma', 'yanlış anlaşılmak'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-14', text: 'Peygamber yüksek sesle dedi ki: Tevekkül et, ama devenin dizini de bağla.', original: 'گفت پیغامبر به آواز بلند / با توکل زانوی اشتر ببند', work: 'Mesnevî, I. Cilt, Aslan ile Av Hayvanları hikâyesi', ref: '', themes: ['her şeyi kadere bırakıp beklemek', 'tevekkül ile çaba arasında kalmak'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-15', text: 'Kardeşim, sen o düşüncenin ta kendisisin; gerisi kemikten, liften ibaret. Düşüncen gülse gül bahçesisin, dikense külhana atılacak odunsun.', original: 'ای برادر تو همان اندیشه‌ای / ما بقی تو استخوان و ریشه‌ای / گر گلست اندیشه تو گلشنی / ور بود خاری تو هیمه گلخنی', work: 'Mesnevî, II. Cilt', ref: '', themes: ['düşünceler', 'zihin', 'olumsuz düşünce', 'kendini tanımak'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-16', text: 'Bu dünya bir dağdır, yaptıklarımız bir sesleniş; seslenişlerin yankısı yine bize döner.', original: 'این جهان کوه است و فعل ما ندا / سوی ما آید نداها را صدا', work: 'Mesnevî, I. Cilt, Padişah ile Cariye hikâyesi', ref: '', themes: ['yaptıklarının sonucu', 'sorumluluk', 'ilişkiler', 'davranış'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-17', text: 'Bir renk peşindeki aşklar aşk değildir; sonunda utanca döner.', original: 'عشق‌هایی کز پی رنگی بود / عشق نبود عاقبت ننگی بود', work: 'Mesnevî, I. Cilt, Padişah ile Cariye hikâyesi', ref: '', themes: ['yüzeysel ilişki', 'dış görünüş', 'tutku', 'hayal kırıklığı'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-18', text: 'Öfke ve arzu insanı şaşı eder, ruhu doğruluktan saptırır. Çıkar araya girince erdem gizlenir; gönülden göze yüz perde iner.', original: 'خشم و شهوت مرد را احول کند / ز استقامت روح را مبدل کند / چون غرض آمد هنر پوشیده شد / صد حجاب از دل به سوی دیده شد', work: 'Mesnevî, I. Cilt', ref: '', themes: ['öfke', 'önyargı', 'yanlış yargı', 'çıkar'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-19', text: 'Nerede bir dert varsa deva oraya gider; nerede bir yoksulluk varsa nimet oraya akar.', original: 'هر کجا دردی دوا آنجا رود / هر کجا فقری نوا آنجا رود', work: 'Mesnevî, III. Cilt', ref: '', themes: ['acı', 'zor dönem', 'umut', 'çaresizlik'], verifiedFrom: MEVLANA_SRC_2 },
  { id: 'mev-20', text: 'Su arama, susuzluk edin; ta ki su yukarıdan da aşağıdan da fışkırsın.', original: 'آب کم جو تشنگی آور به دست / تا بجوشد آب از بالا و پست', work: 'Mesnevî, III. Cilt', ref: '', themes: ['arayış', 'özlem', 'içten istemek', 'motivasyon'], verifiedFrom: MEVLANA_SRC_2 },
];

/** Mentor kimliği → doğrulanmış alıntılar. Listesi olmayan mentor alıntı eklemez. */
export const VERIFIED_QUOTES: Record<string, { author: string; quotes: VerifiedQuote[] }> = {
  seneca: { author: 'Seneca', quotes: [...SENECA, ...SENECA_2] },
  marcus: { author: 'Marcus Aurelius', quotes: [...MARCUS, ...MARCUS_2] },
  nietzsche: { author: 'Nietzsche', quotes: [...NIETZSCHE, ...NIETZSCHE_2] },
  mevlana: { author: 'Mevlânâ', quotes: [...MEVLANA, ...MEVLANA_2] },
  sokrates: { author: 'Sokrates', quotes: SOKRATES },
};

const BY_ID = new Map<string, { author: string; quote: VerifiedQuote }>(
  Object.values(VERIFIED_QUOTES).flatMap(({ author, quotes }) => quotes.map((q) => [q.id, { author, quote: q }] as const)),
);

/** Etiketteki kimliği kullanıcıya gösterilecek alıntı bloğuna çevirir; bilinmiyorsa null. */
export function renderQuote(id: string, mentorId: string): string | null {
  const entry = BY_ID.get(id);
  if (!entry || !VERIFIED_QUOTES[mentorId]?.quotes.some((q) => q.id === id)) return null;
  const { author, quote } = entry;
  return `“${quote.text}”\n— ${author}, ${`${quote.work} ${quote.ref}`.trim()}`;
}

/**
 * System prompt'a eklenen alıntı kataloğu. Model yalnızca kimlik ve konuları
 * görür; böylece metni kendisi yeniden yazmaya çalışmaz.
 */
export function quoteCatalogPrompt(mentorId: string): string {
  const entry = VERIFIED_QUOTES[mentorId];
  if (!entry || entry.quotes.length === 0) {
    // Doğrulanmış listesi henüz hazır olmayan mentor: hiç alıntı yok.
    return `

# NO QUOTATIONS
Do not end with, or include anywhere, a quotation attributed to yourself
or anyone else. Your verified quote library is not ready yet; any quote
you write from memory could be inaccurate. End with your own closing
line instead.`;
  }
  const lines = entry.quotes.map((q) => `- ${q.id}: ${q.themes.join(', ')} — (${q.text})`).join('\n');
  return `

# CLOSING QUOTE (VERIFIED SOURCES ONLY)
You MAY end a response with a verified quote from your own works, chosen
from the catalog below. Do NOT write the quote text yourself. Instead,
put this tag alone on the LAST line: [[alinti:<id>]]
The system replaces the tag with the exact, source-checked quote.
Pick the id whose MEANING directly continues the point you just made for
this person — read the meaning, not only the theme words. The quote should
feel like the natural last word of your answer, not a decoration.
When to include one (2026-10-05):
- In your FIRST answer to a real question, include a quote whenever one in the
  catalog genuinely completes your thought for this person. This is the right
  moment for it; do look for one.
- Skip it when the message was very short or vague and you are still trying to
  understand, when only a loosely related quote exists, or when it would repeat
  an image you just used.
- In a continuing conversation, add one only rarely: at most once in the whole
  conversation, when a thread comes to a natural close.
Never invent ids, never write any other quotation, never say
"bir eserimde yazdığım gibi" followed by words that are not in the catalog.
Earlier messages in the conversation may show quotes already expanded;
still use ONLY the tag yourself, and prefer an id not used before.

Catalog (id: themes — meaning):
${lines}`;
}

/** Bir cevap metninde geçen doğrulanmış alıntıyı (varsa) bulur — paylaşım kartı için. */
export function findQuoteInText(mentorId: string, text: string): { text: string; source: string } | null {
  const entry = VERIFIED_QUOTES[mentorId];
  if (!entry) return null;
  const q = entry.quotes.find((x) => text.includes(x.text));
  return q ? { text: q.text, source: `${entry.author}, ${`${q.work} ${q.ref}`.trim()}` } : null;
}
