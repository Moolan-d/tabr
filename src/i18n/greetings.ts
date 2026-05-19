interface TimeSlot {
  start: number;
  end: number;
  greeting: string;
}

interface LocaleConfig {
  match: (lang: string) => boolean;
  timeSlots: TimeSlot[];
  timeLocale: string;
  hour12: boolean;
}

const localeConfigs: LocaleConfig[] = [
  {
    match: (lang) =>
      lang.startsWith('zh') &&
      (lang.includes('TW') || lang.includes('Hant') || lang.includes('HK') || lang.includes('MO')),
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
    match: (lang) => lang.startsWith('zh'),
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
    match: (lang) => lang.startsWith('ja'),
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
    match: () => true,
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
  return localeConfigs.find((c) => c.match(lang))!;
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
