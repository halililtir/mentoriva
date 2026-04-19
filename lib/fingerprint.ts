/**
 * Basit tarayıcı parmak izi — üçüncü parti kütüphane olmadan.
 *
 * Canvas fingerprint + screen + timezone + language + platform birleştirip
 * hash'leyerek benzersiz bir ID üretir. %100 güvenilir değil ama
 * casual bypass'ı (farklı tarayıcı, incognito) büyük ölçüde engeller.
 *
 * Rate limit: fingerprint + IP birlikte kullanılır.
 */

export async function getFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('mentoriva:fp', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('mentoriva:fp', 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch {
    components.push('no-canvas');
  }

  // Hash
  const raw = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
