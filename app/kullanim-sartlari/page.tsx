import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Kullanım Şartları' };

export default function KullanimSartlariPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/85 backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3 flex items-center gap-4">
          <Link href="/"><Logo /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-5 py-10 space-y-8">
        <h1 className="font-display text-3xl">Kullanım Şartları</h1>
        <p className="text-xs text-white/30">Son güncelleme: Nisan 2026</p>

        <section className="space-y-4 text-sm text-white/50 leading-relaxed">
          <h2 className="font-display text-lg text-white/80">1. Hizmet Tanımı</h2>
          <p>Mentoriva, yapay zeka teknolojisi kullanarak tarihî düşünür ve filozofların bakış açılarını simüle eden bir düşünce platformudur. Platform üzerindeki mentor cevapları yapay zeka tarafından üretilir ve ilgili tarihî figürlerin gerçek görüşlerini birebir yansıtmaz.</p>

          <h2 className="font-display text-lg text-white/80">2. Sorumluluk Reddi</h2>
          <p>Mentoriva bir eğlence ve düşünce aracıdır. Profesyonel psikolojik danışmanlık, terapi, tıbbi tavsiye veya hukuki danışmanlık yerine geçmez. Platform üzerinden alınan cevaplara dayanarak verilen kararların sorumluluğu tamamen kullanıcıya aittir. Acil durumlarda veya psikolojik destek ihtiyacında profesyonel bir uzmana başvurmanızı öneririz.</p>

          <h2 className="font-display text-lg text-white/80">3. Yapay Zeka İçeriği</h2>
          <p>Mentor cevapları Anthropic Claude yapay zeka modeli tarafından üretilir. Bu cevaplar ilgili düşünürlerin eserlerinden esinlenerek oluşturulmuş fiktif yorumlardır. Gerçek alıntılar içerebileceği gibi, yapay zeka tarafından üretilmiş ifadeler de içerebilir. Cevapların tarihî veya akademik doğruluğu garanti edilmez.</p>

          <h2 className="font-display text-lg text-white/80">4. Kullanıcı Yükümlülükleri</h2>
          <p>Platformu kullanırken yasalara uygun davranmayı kabul edersiniz. Nefret söylemi, şiddet teşviki veya yasa dışı içerik oluşturmak amacıyla kullanılamaz. Platformun teknik altyapısına zarar verecek eylemlerden kaçınılmalıdır. Hesap bilgileri kişiseldir ve başkalarıyla paylaşılmamalıdır.</p>

          <h2 className="font-display text-lg text-white/80">5. Fikri Mülkiyet</h2>
          <p>Mentoriva{"'"}nın tasarımı, logosu, arayüzü ve yazılımı fikri mülkiyet haklarıyla korunmaktadır. Platform üzerinden üretilen mentor cevapları kullanıcının kişisel kullanımı içindir. Ticari amaçla çoğaltılması, dağıtılması veya satılması yasaktır.</p>

          <h2 className="font-display text-lg text-white/80">6. Hizmet Değişiklikleri</h2>
          <p>Mentoriva, hizmeti önceden bildirim yapmaksızın değiştirme, askıya alma veya sonlandırma hakkını saklı tutar. Ücretsiz kullanım limitleri ve özellikleri değişebilir.</p>

          <h2 className="font-display text-lg text-white/80">7. İletişim</h2>
          <p>Kullanım şartları hakkında sorularınız için info@mentoriva.com.tr adresinden bize ulaşabilirsiniz.</p>
        </section>
      </main>
    </div>
  );
}
