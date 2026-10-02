'use client';

import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';

export default function KullanimSartlariPage() {
  return (
    <div className="min-h-dvh">
      <Header />

      <main className="mx-auto max-w-[680px] px-5 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/30 hover:text-white/60 transition-colors text-sm">← Ana Sayfa</Link>
        </div>

        <h1 className="font-display text-3xl">Kullanım Şartları (MVP / Beta)</h1>
        <p className="text-xs text-white/30">Son güncelleme: Nisan 2026</p>

        <section className="space-y-6 text-sm text-white/50 leading-relaxed">
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">1. Hizmet Tanımı ve Durumu</h2>
            <p>Mentoriva, yapay zeka teknolojisi kullanarak tarihi figürlerin bakış açılarını simüle eden bir MVP (Minimum Uygulanabilir Ürün) aşamasındaki düşünce platformudur. Platformdaki tüm hizmetler deneme amaçlı ve {'\u201c'}olduğu gibi{'\u201d'} sunulmaktadır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">2. Sorumluluk Reddi</h2>
            <p className="text-amber-400/70 font-medium mb-2">DİKKAT:</p>
            <p>Mentoriva bir eğlence ve kişisel gelişim aracıdır. Profesyonel psikolojik danışmanlık, tıbbi veya hukuki tavsiye yerine geçmez. Yapay zeka yanıtları hatalı bilgi (halüsinasyon) üretebilir. Alınan cevaplara dayanarak verilen kararların sorumluluğu tamamen kullanıcıya aittir. Geliştiriciler, sistemdeki hatalardan veya içeriklerden kaynaklı hiçbir zarardan sorumlu tutulamaz.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">3. Yapay Zeka İçeriği</h2>
            <p>Mentor cevapları Anthropic Claude modelleri tarafından üretilen kurgusal yorumlardır. Tarihi figürlerin gerçek görüşlerini birebir yansıtmayabilir ve akademik bir doğruluk garantisi verilmez.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">4. Kullanıcı Yükümlülükleri</h2>
            <p>Kullanıcılar, platformu yasalara ve genel ahlaka uygun kullanmayı kabul eder. Nefret söylemi, şiddet teşviki veya yasa dışı içerik üretimi yasaktır. Hesap bilgileri üçüncü şahıslarla paylaşılmamalıdır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">5. Fikri Mülkiyet</h2>
            <p>Mentoriva projesinin tüm tasarım, logo ve yazılım hakları geliştirici ekibe aittir. Kullanıcılar içerikleri sadece kişisel amaçlarla kullanabilir; ticari amaçlı çoğaltma ve satış yasaktır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">6. Değişiklik Hakları</h2>
            <p>Geliştiriciler, hizmeti önceden bildirim yapmaksızın değiştirme, kısıtlama veya sonlandırma hakkını saklı tutar. Ücretsiz kullanım limitleri her zaman güncellenebilir.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">7. Davet ve Bonus Haklar</h2>
            <p>Davet linkiyle kayıt olan ve e-posta adresini doğrulayan her yeni kullanıcı için davet eden kişiye ve yeni kullanıcıya bonus soru hakkı tanımlanır. Bonus haklar nakde çevrilemez, devredilemez ve günlük haklar bittikten sonra kullanılır. Kişi başı ödüllendirilen davet sayısı sınırlıdır. Sahte veya toplu hesap açılması gibi kötüye kullanım tespit edildiğinde ilgili bonus haklar iptal edilebilir ve hesaplar askıya alınabilir.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">8. Paylaşım Kartları ve Alıntılar</h2>
            <p>Paylaşım kartları yalnızca platformun ürettiği mentor cevaplarından oluşturulabilir. Kartlardaki ve cevaplardaki alıntılar, düşünürlerin eserlerinin orijinal metinlerinden doğrulanmış olup Mentoriva tarafından Türkçeye çevrilmiştir; kaynak eser ve bölüm bilgisiyle birlikte gösterilir. Mentor cevaplarının kendisi yapay zekâ üretimidir ve düşünürlerin gerçek sözleri olarak alıntılanmamalıdır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">9. Kendine Yolculuk</h2>
            <p>Kendine Yolculuk bir öz-gözlem ve düşünme aracıdır; psikolojik danışmanlık, terapi veya tıbbi hizmet değildir, tanı koymaz. Sonuçlar kullanıcının yazdıklarına dayanan geçici değerlendirmelerdir ve kesin kişilik veya ruh sağlığı yorumu olarak kabul edilmemelidir. Kriz belirtisi taşıyan yazılarda yolculuk durdurulur ve kullanıcı profesyonel desteğe yönlendirilir. Bir yolculuk, sorular aşamasında belirtilen sayıda soru hakkı kullanır.</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-white/80 mb-2">10. İletişim</h2>
            <p>Kullanım şartları hakkındaki geri bildirimleriniz için: <a href="mailto:info@mentoriva.com.tr" className="text-brand-400 hover:text-brand-300">info@mentoriva.com.tr</a></p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
