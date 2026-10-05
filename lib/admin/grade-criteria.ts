/** Laboratuvar hakeminin ölçütleri (saf; admin arayüzü de okur). */

export const GRADE_CRITERIA = [
  { id: 'anlama', label: 'Anlamadan yorumlamadı', hint: 'Yorumunu kişinin gerçekten yazdıklarına dayandırdı; kısa/belirsiz mesajda uzun teori kurmadı.' },
  { id: 'uydurma', label: 'Neden uydurmadı', hint: 'Kişinin söylemediği geçmiş, aile, çocukluk, travma ya da niyet getirmedi; tek nedene indirgemedi.' },
  { id: 'yonlendirme', label: 'Yönlendirmedi', hint: 'Teşhis gibi algılanacak yönlendirici soru yok ("Babanla mı ilgili?").' },
  { id: 'onaylama', label: 'Gereksiz onaylamadı', hint: 'Duyguyu kabul etti ama kişinin başkaları hakkındaki doğrulanamaz yorumunu onaylamadı.' },
  { id: 'edebi', label: 'Dil netti', hint: 'Edebî/şiirsel dil anlamı açtı; varsayımı kesinmiş gibi göstermedi.' },
  { id: 'kalip', label: 'Kalıp yok', hint: 'Klişe öğüt, tekrar eden kavram/soru ya da karikatür üslup yok.' },
  { id: 'ozgunluk', label: 'Kendi düşüncesi', hint: 'Yalnızca üslup değil, bu mentora özgü bir düşünce ya da bakış sundu.' },
  { id: 'fayda', label: 'İşe yarar', hint: 'Kişinin kullanabileceği bir düşünce verdi; yalnızca soru sormakla yetinmedi.' },
] as const;

export type CriterionId = (typeof GRADE_CRITERIA)[number]['id'];

export interface Grade {
  scores: Record<CriterionId, 1 | 2 | 3>;
  /** Hakemin en önemli tek notu. */
  note: string;
}
