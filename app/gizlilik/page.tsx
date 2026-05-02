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
        <h1 className="font-display text-3xl">Gizlilik Politikası (MVP / Beta)</h1>
        <p className="text-xs text-white/30">Son güncelleme: Nisan 2026</p>
        <p className="text-sm text-white/45 leading-relaxed">
          Bu Gizlilik Politikası, Mentoriva platformu ({'\u201c'}Platform{'\u201d'}) tarafından toplanan verilerin nasıl işlendiğini açıklar. Platform şu an bir geliştirme aşamasında (MVP) olup, verileriniz aşağıda belirtilen şartlar çerçevesinde korunmaktadır.
        </p>

        <section className="space-y-6 text-sm text-white/50 leading-relaxed">
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">1. Toplanan Veriler</h2>
            <p>Hizmet sunumu için aşağıdaki veriler işlenmektedir:</p>
            <p className="mt-2"><span className="text-white/60">Kullanıcı Bilgileri:</span> Kullanıcı adı, e-posta adresi.</p>
            <p><span className="text-white/60">Etkileşim Verileri:</span> Sorulan sorular ve yapay zeka tarafından üretilen yanıtlar.</p>
            <p><span className="text-white/60">Teknik Veriler:</span> IP adresi, tarayıcı bilgileri ve kullanım istatistikleri (tercih edilen mentorlar, soru sayısı).</p>
          </div>

          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">2. Verilerin Kullanım Amaçları</h2>
            <p>Toplanan veriler münhasıran şu amaçlarla kullanılır: hizmetin sunulması, teknik sorunların tespiti ve kullanıcı deneyiminin iyileştirilmesi. Platformun yapay zeka algoritmalarının test edilmesi ve anonim istatistik oluşturulması.</p>
          </div>

          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">3. Yapay Zeka ve Yurt Dışına Veri Aktarımı</h2>
            <p>Mentoriva, yanıtları oluşturmak için Anthropic Claude API hizmetini kullanır. Sorularınız, işlenmek üzere Anthropic{"'"}in (ABD merkezli) sunucularına iletilmektedir. Bu platformu kullanarak, verilerinizin hizmet sunumu amacıyla yurt dışına aktarılmasına açık rıza vermektesiniz. Sorularınız model eğitimi için kullanılmaz.</p>
          </div>

          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">4. Veri Saklama ve Güvenlik</h2>
            <p>Kullanıcı verileri Upstash Redis (bulut tabanlı veri tabanı) üzerinde şifrelenmiş bağlantılar aracılığıyla saklanır. Hesap silindiğinde ilgili tüm kişisel veriler kalıcı olarak sistemden kaldırılır.</p>
          </div>

          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">5. Üçüncü Taraflarla Paylaşım</h2>
            <p>Kişisel verileriniz ticari amaçlarla satılmaz veya kiralanmaz. Sadece teknik altyapı sağlayıcılarımız (Anthropic, Vercel, Upstash) hizmetin sunumu kapsamında bu verilere erişebilir.</p>
          </div>

          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">6. KVKK Kapsamındaki Haklarınız</h2>
            <p>6698 sayılı KVKK kapsamında; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme veya verilerinizin silinmesini isteme haklarına sahipsiniz. Talepleriniz için iletişim adresimizi kullanabilirsiniz.</p>
          </div>

          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">7. İletişim</h2>
            <p>Gizlilik politikamız hakkındaki sorularınız için: <a href="mailto:info@mentoriva.com.tr" className="text-brand-400 hover:text-brand-300">info@mentoriva.com.tr</a></p>
          </div>
        </section>
      </main>
    </div>
  );
}
