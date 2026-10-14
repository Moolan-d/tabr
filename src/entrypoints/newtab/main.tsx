import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles.css';
import SettingsMenu from '../../components/SettingsMenu';
import FavoritesGallery from '../../components/FavoritesGallery';
import Background from '../../components/Background';
import BottomBar from '../../components/BottomBar';
import { usePhotoService } from '../../hooks/usePhotoService';
import { t } from '../../i18n/translations';

document.title = t('pageTitle');

const NewTab: React.FC = () => {
  const {
    photo,
    loading,
    isFavorite,
    carouselMode,
    favorites,
    quotaExceeded,
    cleanMode,
    refresh,
    resetAndRefresh,
    toggleFavorite,
    toggleCarousel,
    toggleCleanMode,
    setAsBackground,
    removeFavorite,
    restoreFavorite,
    exportFavorites,
    importFavorites,
  } = usePhotoService();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Background url={photo?.url} loading={loading} />

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Settings button — cross-fades with the gallery close in this corner */}
        <div className={`absolute top-4 right-4 transition-opacity duration-200 ${galleryOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button
            onClick={() => setSettingsOpen(true)}
            className={`p-2 rounded-full backdrop-blur-subtle transition-all duration-200 ${cleanMode ? 'bg-transparent text-white/15 hover:bg-black/20 hover:text-white/90' : 'bg-black/20 hover:bg-black/30 text-white'}`}
            title={t('settings')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Bottom bar */}
        {!cleanMode && (
          <BottomBar
            photo={photo}
            loading={loading}
            isFavorite={isFavorite}
            onRefresh={refresh}
            onToggleFavorite={toggleFavorite}
            onOpenGallery={() => setGalleryOpen(true)}
          />
        )}
      </div>

      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onKeySaved={resetAndRefresh}
        onExport={exportFavorites}
        onImport={importFavorites}
        quotaExceeded={quotaExceeded}
        cleanMode={cleanMode}
        onToggleCleanMode={toggleCleanMode}
        carouselMode={carouselMode}
        onToggleCarousel={toggleCarousel}
      />

      <FavoritesGallery
        isOpen={galleryOpen}
        favorites={favorites}
        currentUrl={photo?.url}
        onClose={() => setGalleryOpen(false)}
        onSetBackground={setAsBackground}
        onRemove={removeFavorite}
        onRestore={restoreFavorite}
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<NewTab />);
}
