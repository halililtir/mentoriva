/**
 * Rehberli çalışmalar — tanımlar (istemci ve sunucu ortak).
 *
 * Sabit bir soru listesi yoktur: yalnızca açılış sorusu sabittir; sonraki
 * sorular kişinin cevaplarına göre üretilir (`lib/studies/guided.ts`). `guide`
 * yapay zekâya hangi alanları keşfedebileceğini söyler, sırayı dayatmaz.
 * Hiçbir çalışma kişinin yerine karar vermez, doğru cevabı bilmez.
 */

export interface GuidedStudy {
  id: string;
  title: string;
  /** Kartta ve listede tek cümle. */
  tagline: string;
  /** Başlangıç ekranındaki kısa açıklama. */
  intro: string;
  /** İlk soru (sabit). */
  opening: string;
  /** İlk soru için örnek ipucu. */
  placeholder: string;
  /** Yapay zekâ için keşif alanları (İngilizce, talimat). */
  guide: string;
}

export const GUIDED_STUDIES: GuidedStudy[] = [
  {
    id: 'karar',
    title: 'Karar vermek',
    tagline: 'Seçenekler arasında sıkıştığında neyin senin için ağır bastığını görmek.',
    intro: 'Senin yerine karar vermeyeceğiz. Birkaç soruyla seçeneklerini, neyi kazanıp neyi bıraktığını ve asıl neyin önemli olduğunu kendi kelimelerinle ortaya koyacaksın.',
    opening: 'Hangi kararın eşiğindesin? Seçeneklerini kendi kelimelerinle yaz.',
    placeholder: 'Örneğin: Şehir değiştirip yeni işe mi geçeyim, yoksa burada mı kalayım…',
    guide: `Areas you may explore, in whatever order the answers call for:
- what each option would give them and what it would cost them, in their own terms;
- which of these matters most to them, and why;
- what they want versus what they fear; whose voice is in the decision (theirs or someone else's) only if they hint at it;
- how reversible each option is, and what they might regret;
- what they would need to know or try before deciding.
Never recommend an option or say which one is better.`,
  },
  {
    id: 'sinir',
    title: 'Sınır koymak',
    tagline: 'Neyin sana fazla geldiğini ve ne istediğini netleştirmek.',
    intro: 'Bir ilişkide, işte ya da ailede sana fazla gelen bir şey varsa, neyin sınırı aştığını, yerine ne istediğini ve bunu nasıl söyleyebileceğini birlikte açalım.',
    opening: 'Nerede, kiminle bir sınıra ihtiyaç duyuyorsun? Son seferinde ne oldu?',
    placeholder: 'Örneğin: İş arkadaşım sürekli işini bana bırakıyor ve ben hayır diyemiyorum…',
    guide: `Areas you may explore:
- what exactly crosses the line, concretely (what happened, not why the other person did it);
- what they want instead, as specifically as possible;
- what is in their control and what is not;
- what saying it would cost them and what not saying it costs them;
- how they might say it (they can later use the "Söyleyeceğimi hazırla" tool).
Do not assume the relationship should continue or end, do not diagnose the other person, do not push them to confront anyone.`,
  },
  {
    id: 'degerler',
    title: 'Neyin önemli olduğunu bulmak',
    tagline: 'Seni canlı hissettiren ve rahatsız eden anlardan kendi değerlerine bakmak.',
    intro: 'Hazır bir değerler listesi yok. Kendi anlarından yola çıkarak senin için neyin gerçekten önemli olduğunu ve bugünkü hayatınla arasındaki mesafeyi kendi kelimelerinle bulacaksın.',
    opening: 'Son zamanlarda seni gerçekten canlı hissettiren ya da içine dokunacak kadar rahatsız eden bir anı anlat.',
    placeholder: 'Örneğin: Geçen hafta bir arkadaşıma taşınmasında yardım ettim, günün sonunda tuhaf bir mutluluk vardı…',
    guide: `Areas you may explore:
- what exactly in that moment made it alive or painful;
- what that might say about what matters to them; let THEM name the value, do not hand them a list or a label;
- another moment that touches the same thing, if they have one;
- where their current life honours this and where it does not;
- one small way to give it more room.
Do not moralise, do not rank values, do not tell them what they should value.`,
  },
  {
    id: 'tekrar',
    title: 'Tekrar eden bir durum',
    tagline: 'Hayatında dönüp duran bir durumu yakından görmek.',
    intro: 'Bazı durumlar tekrar tekrar karşımıza çıkar. Somut örneklerden yola çıkarak neyin tekrarlandığını, senin o anda ne yaptığını ve neyi farklı denemek istediğini birlikte bakalım. Kesin bir neden bulmaya çalışmıyoruz.',
    opening: 'Hayatında tekrar tekrar karşına çıkan bir durum var mı? En son ne oldu?',
    placeholder: 'Örneğin: Yeni bir işe heyecanla başlıyorum, birkaç ay sonra hep sıkılıp bırakıyorum…',
    guide: `Areas you may explore:
- one or two concrete recent instances, in detail;
- what seems to repeat (let them decide what is common; offer a possibility at most);
- what they usually do, think or tell themselves at that point;
- what it gives them and what it costs them;
- one thing they would like to try differently next time.
Do not bring in childhood, parents, trauma or psychological causes unless they bring them up. Do not call it a pattern of their personality.`,
  },
];

export const GUIDED_BY_ID = new Map(GUIDED_STUDIES.map((s) => [s.id, s]));

/** Açılıştan sonra en fazla bu kadar üretilmiş soru. */
export const STUDY_MAX_QUESTIONS = 4;
/** "Bitir" için en az bu kadar cevap. */
export const STUDY_MIN_ANSWERS = 2;
export const STUDY_ANSWER_MAX = 800;
export const STUDY_TAKEAWAY_MAX = 400;
/** Bir çalışmanın hak bedeli (başlangıçta düşer, üretilemezse iade). */
export const STUDY_COST = 1;

export interface StudyTurn {
  q: string;
  a: string;
}

export interface StudyFinish {
  /** Kişinin söylediklerinin aynası; yeni yorum yok. */
  summary: string;
  /** Hâlâ açık kalan tek soru. */
  open: string;
  /** Söylenenlerden çıkan en fazla iki küçük adım fikri. */
  steps: string[];
}

/** Çalışmayı yarıda bırakıp mentora geçerken taslak soru. */
export function turnsToQuestion(title: string, turns: StudyTurn[], max: number): string {
  const lines = turns.filter((t) => t.a.trim()).map((t) => `- ${t.q}\n  ${t.a.trim()}`);
  return `"${title}" çalışmasında şunları yazdım:\n${lines.join('\n')}\n\nBunu birlikte düşünmeme yardım eder misin?`.slice(0, max);
}
