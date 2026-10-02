'use client';

import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';

export default function GizlilikPage() {
  return (
    <div className="min-h-dvh">
      <Header />

      <main className="mx-auto max-w-[680px] px-5 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/30 hover:text-white/60 transition-colors text-sm">← Ana Sayfa</Link>
        </div>

        <h1 className="font-display text-3xl">Gizlilik Politikası (MVP / Beta)</h1>
        <p className="text-xs text-white/30">Son güncelleme: Ekim 2026</p>
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
            <p>Kullanıcı verileri Upstash Redis (bulut tabanlı veri tabanı) üzerinde şifrelenmiş bağlantılar aracılığıyla saklanır. Şifreler geri döndürülemez biçimde (scrypt ile) özetlenerek tutulur; düz metin olarak saklanmaz. Oturum için yalnızca tarayıcınıza yerleştirilen, JavaScript tarafından okunamayan (httpOnly) tek bir oturum çerezi kullanılır; reklam veya takip çerezi kullanılmaz. Ziyaret istatistikleri için çerez kullanmayan ve kişiyi tanımlamayan Vercel Web Analytics kullanılır; sorularının içeriği istatistiklere eklenmez. Hesap silindiğinde ilgili tüm kişisel veriler kalıcı olarak sistemden kaldırılır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">4a. Kendine Yolculuk</h2>
            <p>Kendine Yolculuk bölümünde yazdığın anlatım ve cevaplar, yalnızca sana soru ve geri bildirim üretmek için yapay zekâ sağlayıcımıza iletilir; sunucularımızda saklanmaz, kayıt dosyalarına yazılmaz ve yönetim panelinde görüntülenmez. Yolculuk sonunda yalnızca sen açıkça &ldquo;kaydet&rdquo; dersen, oluşan geçici düşünce haritası ve seçtiğin küçük adım hesabında saklanır. Bu kayıtları Kendine Yolculuk sayfasından tek tek ya da tamamen silebilirsin; hesabın silindiğinde de kalıcı olarak kaldırılır. Bu bölümde paylaştığın bilgiler duygu ve düşüncelerine ilişkin olabileceğinden, kayıt işlemi yalnızca senin açık tercihinle yapılır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">5. Üçüncü Taraflarla Paylaşım</h2>
            <p>Kişisel verileriniz ticari amaçlarla satılmaz veya kiralanmaz. Sadece teknik altyapı sağlayıcılarımız (Anthropic, Vercel, Upstash ve doğrulama e-postaları için Resend) hizmetin sunumu kapsamında bu verilere erişebilir.</p>
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
      <Footer />
    </div>
  );
}
