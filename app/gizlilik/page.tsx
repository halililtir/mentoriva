import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Gizlilik Politikası' };

export default function GizlilikPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/85 backdrop-blur-md">
        <div className="mx-auto max-w-content px-5 py-3 flex items-center gap-4">
          <Link href="/"><Logo /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-5 py-10 space-y-8">
        <h1 className="font-display text-3xl">Gizlilik Politikası</h1>
        <p className="text-xs text-white/30">Son güncelleme: Nisan 2026</p>

        <section className="space-y-4 text-sm text-white/50 leading-relaxed">
          <h2 className="font-display text-lg text-white/80">1. Toplanan Veriler</h2>
          <p>Mentoriva, hizmet sunumu için aşağıdaki verileri toplar: kullanıcı adı, e-posta adresi, sorulan sorular ve mentor cevapları, IP adresi ve tarayıcı bilgileri, kullanım istatistikleri (soru sayısı, tercih edilen mentorlar).</p>

          <h2 className="font-display text-lg text-white/80">2. Verilerin Kullanımı</h2>
          <p>Toplanan veriler yalnızca şu amaçlarla kullanılır: hizmetin sunulması ve iyileştirilmesi, kullanıcı deneyiminin kişiselleştirilmesi, teknik sorunların tespiti ve giderilmesi, anonim kullanım istatistiklerinin oluşturulması.</p>

          <h2 className="font-display text-lg text-white/80">3. Yapay Zeka ve Veri İşleme</h2>
          <p>Mentoriva, mentor cevaplarını oluşturmak için Anthropic Claude API hizmetini kullanır. Sorularınız cevap üretimi amacıyla Anthropic sunucularına iletilir. Anthropic{"'"}in gizlilik politikası için anthropic.com adresini ziyaret edebilirsiniz. Sorularınız model eğitimi için kullanılmaz.</p>

          <h2 className="font-display text-lg text-white/80">4. Veri Saklama</h2>
          <p>Kullanıcı verileri Upstash Redis (bulut tabanlı veritabanı) üzerinde saklanır. Veriler şifrelenmiş bağlantılar üzerinden iletilir. Hesap silindiğinde ilgili tüm veriler kalıcı olarak kaldırılır.</p>

          <h2 className="font-display text-lg text-white/80">5. Üçüncü Taraflarla Paylaşım</h2>
          <p>Kişisel verileriniz üçüncü taraflarla satılmaz, kiralanmaz veya paylaşılmaz. Yalnızca hizmet sağlayıcılarımız (Anthropic, Vercel, Upstash) teknik hizmet sunumu kapsamında verilere erişebilir.</p>

          <h2 className="font-display text-lg text-white/80">6. KVKK Kapsamındaki Haklarınız</h2>
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında şu haklara sahipsiniz: kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme, verilerin silinmesini veya yok edilmesini isteme.</p>

          <h2 className="font-display text-lg text-white/80">7. İletişim</h2>
          <p>Gizlilik politikamız hakkında sorularınız için info@mentoriva.com.tr adresinden bize ulaşabilirsiniz.</p>
        </section>
      </main>
    </div>
  );
}
