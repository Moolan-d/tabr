export type AppLocale = 'zh-TW' | 'zh-CN' | 'ja' | 'en';

export function detectLocale(lang: string): AppLocale {
  if (lang.startsWith('zh') && (lang.includes('TW') || lang.includes('Hant') || lang.includes('HK') || lang.includes('MO')))
    return 'zh-TW';
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('ja')) return 'ja';
  return 'en';
}

interface TimeSlot {
  start: number;
  end: number;
  greeting: string;
}

interface LocaleConfig {
  locale: AppLocale;
  timeSlots: TimeSlot[];
  timeLocale: string;
  hour12: boolean;
}

const localeConfigs: LocaleConfig[] = [
  {
    locale: 'zh-TW',
    timeSlots: [
      { start: 5, end: 12, greeting: '早安' },
      { start: 12, end: 18, greeting: '午安' },
      { start: 18, end: 22, greeting: '晚安' },
      { start: 22, end: 5, greeting: '晚安' },
    ],
    timeLocale: 'zh-TW',
    hour12: false,
  },
  {
    locale: 'zh-CN',
    timeSlots: [
      { start: 5, end: 9, greeting: '早上好' },
      { start: 9, end: 12, greeting: '上午好' },
      { start: 12, end: 14, greeting: '中午好' },
      { start: 14, end: 18, greeting: '下午好' },
      { start: 18, end: 22, greeting: '晚上好' },
      { start: 22, end: 5, greeting: '深夜好' },
    ],
    timeLocale: 'zh-CN',
    hour12: false,
  },
  {
    locale: 'ja',
    timeSlots: [
      { start: 5, end: 12, greeting: 'おはようございます' },
      { start: 12, end: 18, greeting: 'こんにちは' },
      { start: 18, end: 22, greeting: 'こんばんは' },
      { start: 22, end: 5, greeting: 'こんばんは' },
    ],
    timeLocale: 'ja-JP',
    hour12: false,
  },
  {
    locale: 'en',
    timeSlots: [
      { start: 5, end: 12, greeting: 'Good morning' },
      { start: 12, end: 18, greeting: 'Good afternoon' },
      { start: 18, end: 22, greeting: 'Good evening' },
      { start: 22, end: 5, greeting: 'Good night' },
    ],
    timeLocale: 'en-US',
    hour12: true,
  },
];

function resolveLocale(lang: string): LocaleConfig {
  const locale = detectLocale(lang);
  return localeConfigs.find((c) => c.locale === locale)!;
}

function getGreeting(hour: number, lang: string): string {
  const config = resolveLocale(lang);
  const slot = config.timeSlots.find((s) => {
    if (s.start < s.end) return hour >= s.start && hour < s.end;
    return hour >= s.start || hour < s.end;
  });
  return slot?.greeting ?? '';
}

function formatTime(date: Date, lang: string): string {
  const config = resolveLocale(lang);
  return date.toLocaleTimeString(config.timeLocale, {
    hour12: config.hour12,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export { getGreeting, formatTime };
