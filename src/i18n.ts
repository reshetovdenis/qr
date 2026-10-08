export const locales = ['ar','bn','de','en','es','fr','hi','id','it','ja','ko','ky','pt','sr','ru','ur','zh'] as const;
export type Locale = typeof locales[number];
export const languageNames: Record<Locale, string> = {
  ar:'العربية', bn:'বাংলা', de:'Deutsch', en:'English', es:'Español', fr:'Français', hi:'हिन्दी', id:'Bahasa Indonesia', it:'Italiano', ja:'日本語', ko:'한국어', ky:'Кыргызча', pt:'Português', sr:'Srpski', ru:'Русский', ur:'اردو', zh:'中文'
};
// Vite public assets are fetched at runtime so a translation never expands the JS bundle.
let strings: Record<string,string> = {};
const defaultStrings: Record<string,string> = {
  'Scan a QR code':'Scan a QR code','Point your camera at a QR code.':'Point your camera at a QR code.',
  'Start camera':'Start camera','Stop camera':'Stop camera','Switch camera':'Switch camera',
  'Camera':'Camera','Choose a camera':'Choose a camera','Try again':'Try again',
  'Open Slonig':'Open Slonig','This is not Slonig':'This is not Slonig',
  'This is not a web link':'This is not a web link','Web link':'Web link',
  'Copy link':'Copy link','Link copied!':'Link copied!','Scan another':'Scan another',
  'Camera blocked. Please allow camera access.':'Camera blocked. Please allow camera access.',
  'Camera not found.':'Camera not found.', 'Camera could not start.':'Camera could not start.',
  'Camera needs HTTPS or localhost.':'Camera needs HTTPS or localhost.',
  'Language':'Language', 'Camera is off':'Camera is off', 'Looking for a QR code…':'Looking for a QR code…',
  'Opening Slonig…':'Opening Slonig…', 'Check the link before you open it.':'Check the link before you open it.',
  'This QR code has no web link.':'This QR code has no web link.', 'Use the camera to scan again.':'Use the camera to scan again.',
  'Open link':'Open link', 'Copied text!':'Copied text!', 'Copy text':'Copy text',
  'Could not copy.':'Could not copy.'
};
export function detectLocale(): Locale {
  const saved = localStorage.getItem('slonig-scanner-language');
  const preferred = saved || navigator.language || 'en';
  const code = preferred.toLowerCase().split('-')[0];
  return locales.includes(code as Locale) ? code as Locale : 'en';
}
export async function loadLocale(lang: Locale): Promise<void> {
  strings = {};
  try { const response = await fetch(`${import.meta.env.BASE_URL}locales/${lang}/translation.json`);
    if (response.ok) strings = await response.json() as Record<string,string>;
  } catch { /* works in offline mode with English defaults */ }
  document.documentElement.lang = lang;
  document.documentElement.dir = ['ar','ur'].includes(lang) ? 'rtl' : 'ltr';
  localStorage.setItem('slonig-scanner-language', lang);
}
export function t(key: string): string { return strings[key] || defaultStrings[key] || key; }
