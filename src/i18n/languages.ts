export type TextDirection = 'ltr' | 'rtl';

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  region: string;
  speechLocale: string;
  status: 'active' | 'seeded';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // ─── Major Indian Languages ───
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', region: 'India / Global', speechLocale: 'en-IN', status: 'active', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', region: 'Andhra Pradesh & Telangana', speechLocale: 'te-IN', status: 'active', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', region: 'Northern & Central India', speechLocale: 'hi-IN', status: 'active', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', region: 'Tamil Nadu & Puducherry', speechLocale: 'ta-IN', status: 'active', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr', region: 'Karnataka', speechLocale: 'kn-IN', status: 'active', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', region: 'Kerala', speechLocale: 'ml-IN', status: 'active', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', region: 'West Bengal & Tripura', speechLocale: 'bn-IN', status: 'active', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', region: 'Maharashtra', speechLocale: 'mr-IN', status: 'active', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', region: 'Gujarat', speechLocale: 'gu-IN', status: 'active', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', region: 'Punjab', speechLocale: 'pa-IN', status: 'active', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', region: 'India & South Asia', speechLocale: 'ur-IN', status: 'active', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', direction: 'ltr', region: 'Odisha', speechLocale: 'or-IN', status: 'active', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', direction: 'ltr', region: 'Assam', speechLocale: 'as-IN', status: 'active', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', direction: 'ltr', region: 'Classical India', speechLocale: 'sa-IN', status: 'active', flag: '🇮🇳' },

  // ─── European Languages ───
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', region: 'Spain & Latin America', speechLocale: 'es-ES', status: 'active', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', region: 'France & Western Europe', speechLocale: 'fr-FR', status: 'active', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', region: 'Germany, Austria, Switzerland', speechLocale: 'de-DE', status: 'active', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', region: 'Portugal & Brazil', speechLocale: 'pt-BR', status: 'active', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', region: 'Italy', speechLocale: 'it-IT', status: 'active', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', region: 'Netherlands & Belgium', speechLocale: 'nl-NL', status: 'active', flag: '🇳🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', region: 'Eastern Europe & Central Asia', speechLocale: 'ru-RU', status: 'active', flag: '🇷🇺' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr', region: 'Poland', speechLocale: 'pl-PL', status: 'active', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr', region: 'Ukraine', speechLocale: 'uk-UA', status: 'active', flag: '🇺🇦' },

  // ─── Middle Eastern & RTL Languages ───
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', region: 'Middle East & North Africa', speechLocale: 'ar-SA', status: 'active', flag: '🇸🇦' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', direction: 'rtl', region: 'Iran & Central Asia', speechLocale: 'fa-IR', status: 'active', flag: '🇮🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', region: 'Israel', speechLocale: 'he-IL', status: 'active', flag: '🇮🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', region: 'Turkey', speechLocale: 'tr-TR', status: 'active', flag: '🇹🇷' },

  // ─── East & Southeast Asian Languages ───
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr', region: 'China & East Asia', speechLocale: 'zh-CN', status: 'active', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', region: 'Japan', speechLocale: 'ja-JP', status: 'active', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', region: 'Korea', speechLocale: 'ko-KR', status: 'active', flag: '🇰🇷' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', region: 'Indonesia', speechLocale: 'id-ID', status: 'active', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr', region: 'Malaysia & Singapore', speechLocale: 'ms-MY', status: 'active', flag: '🇲🇾' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr', region: 'Thailand', speechLocale: 'th-TH', status: 'active', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', region: 'Vietnam', speechLocale: 'vi-VN', status: 'active', flag: '🇻🇳' },

  // ─── African Languages ───
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr', region: 'East & Central Africa', speechLocale: 'sw-KE', status: 'active', flag: '🇰🇪' },
];

export function getLanguageMeta(code: string): LanguageMeta {
  const found = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return found || SUPPORTED_LANGUAGES[0];
}

export function isRTL(code: string): boolean {
  return getLanguageMeta(code).direction === 'rtl';
}
