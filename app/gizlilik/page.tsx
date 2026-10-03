'use client';

import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { CONTACT_EMAIL } from '@/lib/site';
import { LEGAL_UPDATED, MIN_AGE } from '@/lib/legal';

const Mail = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-400 hover:text-brand-300">{CONTACT_EMAIL}</a>
);

/**
 * Gizlilik Politikası ve KVKK aydınlatma metni. Metindeki her saklama süresi
 * koddaki gerçek değerle aynı olmalı (oturum 30 gün, paylaşım cevapları 48 saat,
 * doğrulama kodu 10 dk, bekleyen kayıt 7 gün, metrikler 120 gün, son 100 soru).
 * Değiştirirsen lib/legal.ts → LEGAL_VERSION'ı da güncelle.
 */
export default function GizlilikPage() {
  return (
    <div className="min-h-dvh">
      <Header />

      <main className="mx-auto max-w-[680px] space-y-8 px-5 py-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-white/30 transition-colors hover:text-white/60">← Ana Sayfa</Link>
        </div>

        <h1 className="font-display text-3xl">Gizlilik Politikası ve Aydınlatma Metni</h1>
        <p className="text-xs text-white/30">Son güncelleme: {LEGAL_UPDATED} · Kapalı beta</p>
        <p className="text-sm leading-relaxed text-white/55">
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında Mentoriva&apos;nın ({'“'}Platform{'”'})
          hangi kişisel verileri, hangi amaçla ve ne kadar süreyle işlediğini açıklar. Kısa özet: yalnızca hizmeti sunmak için
          gereken veriyi tutarız, yazdıklarını satmayız ve reklam için kullanmayız, model eğitimine verilmez.
        </p>

        <section className="space-y-6 text-sm leading-relaxed text-white/55">
          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">1. Veri sorumlusu</h2>
            <p>Kişisel verileriniz, veri sorumlusu sıfatıyla Mentoriva platformunun işletmecisi tarafından işlenir. Her türlü soru ve başvuru için: <Mail />.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">2. İşlenen veriler</h2>
            <p><span className="text-white/70">Hesap bilgileri:</span> adın, e-posta adresin, parolanın geri döndürülemez özeti (scrypt), kayıt ve son giriş tarihi, kayıtta verdiğin onaylar (yaş beyanı, şartların kabulü, yurt dışı aktarım rızası) ve davet bilgisi.</p>
            <p className="mt-2"><span className="text-white/70">Yazdıkların:</span> mentorlara sorduğun sorular, sohbet mesajların ve üretilen cevaplar. Bunlar cevap üretilirken işlenir; aşağıda sayılan durumlar dışında sunucularımızda saklanmaz.</p>
            <p className="mt-2"><span className="text-white/70">Kullanım verileri:</span> günlük soru sayın, hangi mentorları tercih ettiğin, kazandığın işaretler, cevaplara verdiğin 👍/👎 (cevap metni olmadan).</p>
            <p className="mt-2"><span className="text-white/70">Teknik veriler:</span> kötüye kullanımı önlemek için IP adresin kısa süreli sayaçlarda; hata kayıtlarında sayfa adresi ve hata mesajı (e-posta, parola ve yazdığın metin çıkarılarak).</p>
            <p className="mt-2"><span className="text-white/70">Geri bildirim:</span> geri bildirim formuna yazdığın ad, e-posta ve mesaj.</p>
            <p className="mt-2">Lütfen sorularında sağlık bilgisi, kimlik numarası, başkalarının adı gibi hassas ya da kimliği belirleyici bilgileri paylaşmamaya özen göster. Bu tür verileri bilerek istemeyiz ve ayrıca işlemeyiz.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">3. Neyi, ne kadar saklıyoruz?</h2>
            <p><span className="text-white/70">Hesabın:</span> hesabını silene kadar.</p>
            <p className="mt-1"><span className="text-white/70">Oturum:</span> 30 gün (tarayıcında JavaScript&apos;in okuyamadığı tek bir oturum çerezi).</p>
            <p className="mt-1"><span className="text-white/70">Doğrulama kodu:</span> 10 dakika; tamamlanmamış kayıt 7 gün.</p>
            <p className="mt-1"><span className="text-white/70">Paylaşım kartı için son cevapların:</span> en fazla 30 cevap, 48 saat. Yalnızca paylaşım kartındaki cümlenin gerçekten bir mentor cevabından geldiğini doğrulamak için.</p>
            <p className="mt-1"><span className="text-white/70">Kaydettiğin sohbetler:</span> yalnızca sen &ldquo;Kaydet&rdquo; dersen; sen silene ya da hesabın silinene kadar. Ücretsiz üyelikte en fazla 5 sohbet.</p>
            <p className="mt-1"><span className="text-white/70">Kayıt olmadan deneme:</span> aynı gün ikinci denemeyi engellemek için IP adresinin geri döndürülemez özeti (düz IP değil) 48 saat; deneme onayın yalnızca kendi tarayıcında. Deneme sorusu, cevap üretmek için yapay zekâ sağlayıcısına iletilir ve sana bağlanmadan anonim istatistiklere girer.</p>
            <p className="mt-1"><span className="text-white/70">Kendine Yolculuk:</span> anlatımın ve cevapların saklanmaz; yalnızca sen kaydedersen düşünce haritan ve seçtiğin küçük adım hesabında tutulur, istediğin an silebilirsin.</p>
            <p className="mt-1"><span className="text-white/70">Anonim istatistikler:</span> günlük sayılar ve konu başlıkları 120 gün. Hizmeti geliştirmek için son 100 soru, <b className="text-white/70">kimin sorduğu bilgisi olmadan</b> yönetim panelinde görüntülenebilir.</p>
            <p className="mt-2">Kaydettiğin sohbetler ve yolculuk kayıtların yönetim panelinde gösterilmez.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">4. Amaçlar ve hukuki sebepler</h2>
            <p>Verilerin; üyeliğin kurulması ve hizmetin sunulması (KVKK m.5/2-c, sözleşmenin kurulması ve ifası), güvenliğin sağlanması ve kötüye kullanımın önlenmesi (m.5/2-f, meşru menfaat), hukuki yükümlülüklerin yerine getirilmesi (m.5/2-ç) ve hizmetin anonim istatistiklerle geliştirilmesi (m.5/2-f) amaçlarıyla işlenir. Yurt dışına aktarım için ayrıca açık rızan alınır (aşağıda).</p>
          </div>

          <div id="yurt-disi" className="scroll-mt-24">
            <h2 className="mb-2 font-display text-lg text-white/80">5. Yapay zekâ ve yurt dışına aktarım</h2>
            <p>Mentor cevapları, Anthropic PBC&apos;nin (ABD) Claude yapay zekâ hizmetiyle üretilir. Bunun için sorduğun soru, sohbet geçmişin ve Kendine Yolculuk&apos;ta yazdıkların, cevap üretilmesi amacıyla Anthropic&apos;in sunucularına iletilir. Kayıt formunda (üye olmadan denerken soru ekranında) bu aktarım için ayrı bir onay kutusuyla <b className="text-white/70">açık rızan</b> alınır. Cevapların altındaki Kayıt sırasında bu aktarım için ayrı bir onay kutusuyla <b className="text-white/70">açık rızan</b> alınır.ldquo;nerede ayrışıyorlarKayıt sırasında bu aktarım için ayrı bir onay kutusuyla <b className="text-white/70">açık rızan</b> alınır.rdquo; özeti de aynı hizmetle, yalnızca o cevaplardan üretilir. Anthropic, ticari API kullanımında bu verileri kendi modellerini eğitmek için kullanmadığını taahhüt eder. Rızanı geri alabilirsin; ancak cevaplar bu hizmetle üretildiği için rızan olmadan mentorlarla konuşma özelliği çalışmaz (bu durumda hesabını silebiliriz).</p>
            <p className="mt-2">Altyapı sağlayıcılarımızın sunucuları da yurt dışında bulunabilir: Vercel (barındırma, ABD), Upstash (veritabanı), Resend (doğrulama e-postaları).</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">6. Kimlerle paylaşılır?</h2>
            <p>Kişisel verilerin satılmaz, kiralanmaz, reklam amacıyla paylaşılmaz. Yalnızca hizmeti sunmak için yukarıdaki altyapı sağlayıcılarıyla, ve kanunen zorunlu olduğunda yetkili kamu kurumlarıyla paylaşılabilir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">7. Çerezler ve ölçüm</h2>
            <p>Yalnızca oturumunu açık tutan zorunlu bir çerez kullanılır. Reklam ya da takip çerezi yoktur. Ziyaret istatistikleri için çerez kullanmayan ve kişiyi tanımlamayan Vercel Web Analytics kullanılır; yazdıkların istatistiklere eklenmez. Tema tercihin gibi küçük ayarlar yalnızca kendi tarayıcında saklanır.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">8. Yaş sınırı</h2>
            <p>Mentoriva {MIN_AGE} yaşından büyükler içindir. {MIN_AGE} yaşından küçük birine ait olduğunu fark ettiğimiz hesaplar ve verileri silinir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">9. Güvenlik</h2>
            <p>Bağlantılar şifrelidir (HTTPS), parolalar geri döndürülemez biçimde saklanır, yönetim paneline erişim ayrı bir yetkiyle sınırlıdır. Hiçbir sistem kusursuz değildir; bir ihlal olursa Kanun&apos;un öngördüğü şekilde seni ve Kurul&apos;u bilgilendiririz.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">10. Hakların (KVKK m.11)</h2>
            <p>Verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi isteme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde ya da yurt dışında aktarıldığı kişileri bilme, eksik ya da yanlış işlenmişse düzeltilmesini, silinmesini ya da yok edilmesini isteme ve bu işlemlerin aktarıldığı kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğrarsan zararının giderilmesini talep etme haklarına sahipsin.</p>
            <p className="mt-2">Başvurunu kayıtlı e-posta adresinden <Mail /> adresine yazabilirsin; en geç 30 gün içinde ücretsiz olarak yanıtlanır. Hesabının ve bütün verilerinin silinmesini de aynı yolla isteyebilirsin.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">11. Değişiklikler</h2>
            <p>Bu metin güncellendiğinde tarih değişir; esaslı bir değişiklik olursa sana ayrıca haber veririz.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
