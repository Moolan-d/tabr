import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = (hour: number, lang: string): string => {
    if (lang.startsWith('zh')) {
      if (hour >= 5 && hour < 9) return '早上好';
      if (hour >= 9 && hour < 12) return '上午好';
      if (hour >= 12 && hour < 14) return '中午好';
      if (hour >= 14 && hour < 18) return '下午好';
      if (hour >= 18 && hour < 22) return '晚上好';
      return '深夜好';
    } else {
      if (hour >= 5 && hour < 9) return 'Good morning';
      if (hour >= 9 && hour < 12) return 'Good forenoon';
      if (hour >= 12 && hour < 14) return 'Good noon';
      if (hour >= 14 && hour < 18) return 'Good afternoon';
      if (hour >= 18 && hour < 22) return 'Good evening';
      return 'Good night';
    }
  };

  const getLang = () => {
    return navigator.language || 'en';
  };

  const formatTime = (date: Date, lang: string): string => {
    if (lang.startsWith('zh')) {
      return date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const lang = getLang();
  const greeting = getGreeting(time.getHours(), lang);
  const timeString = formatTime(time, lang);

  const showTime = true; // 如需只显示问候语可设为false

  return (
    <div
      className="absolute left-6 bottom-20 z-20"
      style={{
        fontFamily: `PingFang SC, '苹方-简', 'PingFang SC Light', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif`,
        color: 'rgba(234, 240, 247, 0.9)',
        textShadow: '0 1px 4px rgba(0,0,0,0.10)'
      }}
    >
      <span className="text-base md:text-lg font-light align-middle select-none">
        {greeting}
      </span>
      {showTime && (
        <span className="mx-2 text-base font-light align-middle opacity-80" style={{ fontSize: '0.95em' }}>
          |
        </span>
      )}
      {showTime && (
        <span className="text-sm font-light align-middle opacity-80" style={{ fontSize: '0.92em' }}>
          {timeString}
        </span>
      )}
    </div>
  );
};

export default Clock; 