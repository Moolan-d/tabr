import React from 'react';
import { Photo } from '../providers/types';
import { t } from '../i18n/translations';

interface BottomBarProps {
  photo: Photo | null;
  loading: boolean;
  isFavorite: boolean;
  onRefresh: () => void;
  onToggleFavorite: () => void;
  onOpenGallery: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  photo,
  loading,
  isFavorite,
  onRefresh,
  onToggleFavorite,
  onOpenGallery,
}) => (
  <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-4">
    {/* Refresh button */}
    <button
      onClick={onRefresh}
      disabled={loading}
      className="p-2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full backdrop-blur-subtle transition-all duration-200 disabled:opacity-50"
      title={t('refreshPhoto')}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>

    {/* Right side: photographer credit + gallery + favorite */}
    <div className="text-white text-shadow flex items-center space-x-4">
      {photo?.photographerName && (
        <a
          href={photo.photographerLink || photo.originalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 max-w-[14rem] text-sm opacity-75 hover:opacity-100 hover:underline"
        >
          <span className="truncate">{photo.photographerName}</span>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
      {/* Gallery button */}
      <button
        onClick={onOpenGallery}
        title={t('gallery')}
        className="ml-2 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all"
      >
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>

      {/* Favorite button */}
      <button
        onClick={onToggleFavorite}
        title={isFavorite ? t('removeFav') : t('addFav')}
        className="ml-2 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all"
      >
        {isFavorite ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}
      </button>
    </div>
  </div>
);

export default BottomBar;
