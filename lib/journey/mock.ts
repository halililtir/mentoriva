/** Yerel geliştirme için sahte yolculuk cevapları (MENTORIVA_MOCK_AI=1). */

export function mockQuestions(): string {
  return JSON.stringify({
    questions: [
      'Bu durumda seni en çok yoran şey olayın kendisi mi, yoksa onun hakkında kurduğun düşünceler mi?',
      'Bu hikâyede kimden, ne bekliyordun ve bu beklentini açıkça söyleyebildin mi?',
      'Şu an kontrol edebildiğin en küçük alan hangisi?',
    ],
  });
}

export function mockResult(): string {
  return JSON.stringify({
    windows: {
      psychological:
        'Anlattıklarında hissettiğin yorgunluk ile aslında karşılanmasını istediğin ihtiyaç birbirine karışmış olabilir. Bazen “her şeyi ben toparlamalıyım” düşüncesi, sınır koymayı zorlaştırır. Bu bir tanı değil, kendini gözlemlemen için bir çerçevedir.',
      mentor: {
        mentorId: 'marcus',
        text: 'Marcus Aurelius’un düşüncelerinden ilhamla, olayın kendisiyle ona verdiğin tepkiyi ayırmak işe yarayabilir. Kontrol edebildiğin tek şey bugünkü tutumun ve atacağın küçük adım olabilir.',
      },
      reflection: 'Bu durumda seni yönlendiren şey gerçekten kendi niyetin mi, yoksa kaybetme korkun mu?',
    },
    map: {
      topic: 'Sorumluluklar arasında kendine yer açamamak',
      feelings: 'Yorgunluk, biraz kırgınlık ve belirsizlik',
      needs: 'Dinlenmek, görülmek ve sınırlarına saygı duyulması',
      pattern: 'Zorlandığında yardım istemek yerine daha çok yüklenmek olabilir',
      control: 'Bu hafta bir sorumluluğu devretmek ya da ertelemek',
      question: 'Bu yükün ne kadarını gerçekten taşımak zorundasın?',
    },
    mentors: {
      support: { mentorId: 'seneca', reason: 'Zamanını ve enerjini nereye verdiğine sakin bir gözle bakmana yardım edebilir.' },
      growth: { mentorId: 'nietzsche', reason: 'Başkalarının beklentileriyle kendi isteğini ayırmanı zorlayabilir.' },
    },
    steps: [
      { id: 'sinir', detail: 'Bu hafta bir isteğe “bu sefer olmaz” demeyi dene.' },
      { id: 'ihtiyac', detail: 'Yakın birine bugün neye ihtiyacın olduğunu tek cümleyle söyle.' },
      { id: 'dusunme', detail: 'Bu akşam 10 dakika ayır ve seni en çok yoran üç şeyi yaz.' },
    ],
    followUpQuestion: 'Herkese yetişmeye çalışırken kendimi nasıl unutmam?',
  });
}
