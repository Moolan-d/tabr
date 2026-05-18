import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles.css';
import Clock from '../../components/Clock';
import SettingsMenu from '../../components/SettingsMenu';
import Background from '../../components/Background';
import BottomBar from '../../components/BottomBar';
import DebugPanel from '../../components/DebugPanel';
import { usePhotoService } from '../../hooks/usePhotoService';

const NewTab: React.FC = () => {
  const {
    photo,
    loading,
    isFavorite,
    carouselMode,
    preloadQueue,
    quotaExceeded,
    refresh,
    resetAndRefresh,
    toggleFavorite,
    toggleCarousel,
    exportFavorites,
    importFavorites,
  } = usePhotoService();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Background url={photo?.url} loading={loading} />

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Settings button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full backdrop-blur-subtle transition-all duration-200"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Clock */}
        <div className="flex-1 flex items-center justify-center">
          <Clock />
        </div>

        {/* Bottom bar */}
        <BottomBar
          photo={photo}
          loading={loading}
          isFavorite={isFavorite}
          carouselMode={carouselMode}
          debugMode={debugMode}
          onRefresh={refresh}
          onToggleFavorite={toggleFavorite}
          onToggleCarousel={toggleCarousel}
          onToggleDebug={() => setDebugMode(prev => !prev)}
        />

        {/* Debug panel */}
        {debugMode && !carouselMode && <DebugPanel queue={preloadQueue} />}
      </div>

      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onKeySaved={resetAndRefresh}
        onExport={exportFavorites}
        onImport={importFavorites}
        quotaExceeded={quotaExceeded}
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<NewTab />);
}
