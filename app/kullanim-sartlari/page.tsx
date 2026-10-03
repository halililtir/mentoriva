'use client';

import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { CONTACT_EMAIL } from '@/lib/site';
import { LEGAL_UPDATED, MIN_AGE } from '@/lib/legal';

/** Kullanım Şartları. Esaslı değişiklikte lib/legal.ts → LEGAL_VERSION güncellenir. */
export default function KullanimSartlariPage() {
  return (
    <div className="min-h-dvh">
      <Header />

      <main className="mx-auto max-w-[680px] space-y-8 px-5 py-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-white/30 transition-colors hover:text-white/60">← Ana Sayfa</Link>
        </div>

        <h1 className="font-display text-3xl">Kullanım Şartları</h1>
        <p className="text-xs text-white/30">Son güncelleme: {LEGAL_UPDATED} · Kapalı beta</p>

        <section className="space-y-6 text-sm leading-relaxed text-white/55">
          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">1. Hizmet</h2>
            <p>Mentoriva, tarihî düşünürlerin eserlerinden esinlenen yapay zekâ karakterleriyle düşünmeye yardımcı olan bir platformdur. Hizmet kapalı beta aşamasındadır; özellikler, sınırlar ve kullanılabilirlik değişebilir ve hizmet {'“'}olduğu gibi{'”'} sunulur.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">2. Yaş sınırı ve hesap</h2>
            <p>Mentoriva&apos;yı kullanmak için {MIN_AGE} yaşından büyük olmalısın; kayıt olurken bunu beyan edersin. Hesap bilgilerini doğru vermek, parolanı korumak ve hesabını başkasıyla paylaşmamak senin sorumluluğundadır. Bir kişi yalnızca bir hesap açabilir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">3. Mentoriva ne değildir?</h2>
            <p>Mentoriva bir düşünme ve kişisel gelişim aracıdır; <b className="text-white/75">psikolojik danışmanlık, terapi, tıbbi, hukuki ya da mali tavsiye yerine geçmez</b> ve tanı koymaz. Cevaplar yapay zekâ tarafından üretilir; hatalı, eksik ya da sana uygun olmayan olabilir. Verdiğin kararlar senin sorumluluğundadır; önemli kararlarda bir uzmana danışmanı öneririz.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">4. Kriz ve acil durumlar</h2>
            <p>Mentoriva acil durumlar için uygun değildir. Kendine ya da başkasına zarar verme düşüncen varsa ya da hayati bir tehlike söz konusuysa hemen <a href="tel:112" className="font-semibold text-white/80 underline underline-offset-2">112</a>&apos;yi ara ya da en yakın acil servise başvur. Böyle bir durum fark edildiğinde mentorlar cevap vermez ve seni profesyonel desteğe yönlendiririz; bu sırada soru hakkın düşmez.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">5. Yapay zekâ karakterleri ve alıntılar</h2>
            <p>Mentorlar, düşünürlerin belgelenmiş eserlerinden esinlenen yapay zekâ karakterleridir; gerçek kişiler değildir ve onların gerçek görüşlerini birebir yansıtmayabilir. Mentor cevapları düşünürlerin sözleri olarak alıntılanmamalıdır. Cevapların sonundaki kaynaklı alıntılar ise eserlerin orijinal metninden doğrulanmış olup Türkçeye Mentoriva tarafından çevrilmiştir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">6. Kullanım kuralları</h2>
            <p>Platformu yasalara ve başkalarının haklarına uygun kullanmayı kabul edersin. Nefret söylemi, taciz, şiddete teşvik, yasa dışı içerik üretmeye çalışmak, sistemi otomatik araçlarla zorlamak, sınırları aşmak için sahte hesap açmak ve güvenlik önlemlerini aşmaya çalışmak yasaktır. Bu kurallara aykırı kullanımda hesabın uyarı yapılmaksızın askıya alınabilir ya da kapatılabilir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">7. Ücretsiz üyelik ve sınırlar</h2>
            <p>Ücretsiz üyelikte günlük soru hakkı ve kaydedilebilecek sohbet sayısı (şu an 5) sınırlıdır. Bu sınırlar hizmetin sürdürülebilirliği için değişebilir. İleride ek özellikler sunan ücretli bir üyelik (Premium) gelebilir; ücretli bir hizmet başlatılırsa koşulları, fiyatı ve cayma hakkı satın almadan önce ayrıca ve açıkça bildirilir. Şu an hiçbir ücret alınmaz.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">8. Davet ve bonus haklar</h2>
            <p>Davet linkiyle kayıt olan ve e-posta adresini doğrulayan her yeni kullanıcı için davet edene ve yeni kullanıcıya bonus soru hakkı tanımlanır. Bonus haklar nakde çevrilemez, devredilemez ve günlük haklar bittikten sonra kullanılır. Kişi başı ödüllendirilen davet sayısı sınırlıdır. Kötüye kullanım tespit edilirse bonuslar iptal edilebilir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">9. Kaydedilen sohbetler ve Kendine Yolculuk</h2>
            <p>Sohbetler ve yolculuk sonuçları yalnızca sen kaydedersen saklanır ve istediğin an silinebilir. Kendine Yolculuk bir öz-gözlem aracıdır; sonuçları kesin bir kişilik ya da ruh sağlığı değerlendirmesi değildir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">10. İçerik ve fikrî haklar</h2>
            <p>Mentoriva&apos;nın tasarımı, logosu, yazılımı, mentor karakterleri ve çevirileri Mentoriva&apos;ya aittir. Sana üretilen cevapları kişisel amaçla kullanabilir ve paylaşım kartlarıyla paylaşabilirsin; toplu biçimde kopyalamak, ticari amaçla çoğaltmak ya da satmak yasaktır. Yazdıklarının sorumluluğu sana aittir.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">11. Sorumluluğun sınırı</h2>
            <p>Mentoriva, yürürlükteki mevzuatın izin verdiği ölçüde; yapay zekâ cevaplarına dayanılarak alınan kararlardan, hizmetteki kesinti ya da veri kayıplarından doğan dolaylı zararlardan sorumlu tutulamaz. Bu sınırlama, kast ve ağır kusur hâllerini ve tüketici olarak sahip olduğun yasal hakları kapsamaz.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">12. Değişiklik, fesih ve uygulanacak hukuk</h2>
            <p>Bu şartlar güncellenebilir; esaslı değişikliklerde sana haber verilir ve kullanmaya devam etmen yeni şartları kabul ettiğin anlamına gelir. Hesabını istediğin zaman silebilirsin. Bu şartlara Türkiye Cumhuriyeti hukuku uygulanır; tüketici olarak ikametgâhındaki tüketici hakem heyetleri ve tüketici mahkemelerine başvurma hakkın saklıdır.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg text-white/80">13. İletişim</h2>
            <p>Sorular ve hesap silme talepleri için: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-400 hover:text-brand-300">{CONTACT_EMAIL}</a>. Kişisel verilerin nasıl işlendiği <Link href="/gizlilik" className="text-brand-400 hover:text-brand-300">Gizlilik ve Aydınlatma Metni</Link>&apos;nde anlatılır.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
