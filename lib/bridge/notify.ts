/**
 * Aramızda bildirimi: karşı tarafa yeni mesaj olduğunu söyleyen kısa e-posta.
 * Mesajı, konuyu ya da gönderenin adını yazmaz (bildirim önizlemesinde görünmesin);
 * konuşma başına kişi başı en fazla 6 saatte bir gider, kişi kapatabilir; kişi
 * o an sayfadaysa gitmez.
 * Hata fırlatmaz: e-posta gitmese de mesaj iletilmiştir.
 */

import { getKV } from '@/lib/kv';
import { SITE_URL } from '@/lib/site';
import { sendEmailDetailed } from '@/lib/email';
import { recordEvent } from '@/lib/admin/metrics';
import { getUser } from '@/lib/auth/users';
import { bridgeMailKey, isHere, isMuted, type Room } from './store';

const WINDOW_SEC = 6 * 3600;

export async function notifyOther(room: Room, from: 0 | 1): Promise<void> {
  try {
    const to: 0 | 1 = from === 0 ? 1 : 0;
    const member = room.members[to];
    if (!member || (await isMuted(room.id, to)) || (await isHere(room.id, to))) return;
    const kv = getKV();
    const key = bridgeMailKey(room.id, to);
    if (await kv.get(key)) return;
    await kv.set(key, '1', { ex: WINDOW_SEC });
    const user = await getUser(member.username);
    if (!user || !user.isActive) return;
    const link = `${SITE_URL}/aramizda/${room.id}`;
    const text = `Aramızda'da sana yeni bir mesaj var.

Okumak için: ${link}

Bu bildirimi konuşma sayfasından kapatabilirsin.
Mentoriva`;
    const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#14181f;line-height:1.6">
<p>Aramızda'da sana yeni bir mesaj var.</p>
<p><a href="${link}" style="color:#0e7c86">Mesajı oku</a></p>
<p style="color:#667085;font-size:13px">Bu bildirimi konuşma sayfasından kapatabilirsin.<br>Mentoriva</p>
</div>`;
    const res = await sendEmailDetailed({ to: user.email ?? member.username, subject: 'Aramızda\'da yeni bir mesajın var', text, html });
    if (res.ok) await recordEvent('bridge_mail');
    else await kv.del(key);
  } catch {
    // Bildirim isteğe bağlı bir kolaylık; gönderimi bozmamalı.
  }
}
