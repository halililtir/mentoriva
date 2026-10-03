/** Sayfalar arası akış için sekme içi (sessionStorage) anahtarlar. */

/** Testten gelen kullanıcının seçili açılacak mentoru (app/test → app/page). */
export const PRESELECT_KEY = 'mentoriva_preselect';

/** Örnek sorulardan seçilen taslak soru; kayıt sırasında kaybolmasın. */
export const DRAFT_KEY = 'mentoriva_draft';

/** Davet linkinden (?ref=) gelen kod; kayıt olunana kadar saklanır (localStorage). */
export const REF_KEY = 'mentoriva_ref';

/** Misafir denemesinin kullanıldığı gün (localStorage; asıl denetim sunucuda, IP ile). */
export const GUEST_TRIAL_KEY = 'mentoriva_guest_trial';

/** Misafirin soru ekranında verdiği 18+ ve yurt dışı aktarım onayı (localStorage). */
export const GUEST_CONSENT_KEY = 'mentoriva_guest_consent';
