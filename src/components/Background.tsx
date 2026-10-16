import React from 'react';
import { t } from '../i18n/translations';
import { sizedImageUrl, backgroundWidth } from '../lib/image-url';

interface BackgroundProps {
  url?: string;
  loading: boolean;
}

const Background: React.FC<BackgroundProps> = ({ url, loading }) => (
  <>
    {url && (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{
          backgroundImage: `url(${sizedImageUrl(url, backgroundWidth(), 85)})`,
          opacity: loading ? 0.7 : 1,
        }}
      />
    )}
    {loading && (
      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          <div className="text-white text-lg text-shadow">{t('loading')}</div>
        </div>
      </div>
    )}
  </>
);

export default Background;
