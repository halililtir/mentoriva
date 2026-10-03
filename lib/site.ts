/** Site genelinde kullanılan sabitler — alan adı tek yerden yönetilir. */

export const SITE_URL = (process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://mentoriva.com.tr').replace(/\/$/, '');
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
export const CONTACT_EMAIL = 'info@mentoriva.com.tr';
export const INSTAGRAM_URL = 'https://instagram.com/mentoriva_';
export const INSTAGRAM_HANDLE = '@mentoriva_';


/** Görsellerde ve tanıtımda gösterilen adres — her zaman markanın alan adı. */
export const DISPLAY_HOST = 'mentoriva.com.tr';
