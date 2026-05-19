import React, { useState, useEffect } from 'react';
import { getGreeting, formatTime } from '../i18n/greetings';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const lang = navigator.language || 'en';
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