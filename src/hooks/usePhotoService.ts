import { useSyncExternalStore } from 'react';
import { FavoritePhoto } from '../providers/types';
import { getPhotoService, PhotoServiceState } from '../services/photo-service';

export function usePhotoService(): PhotoServiceState & {
  refresh: () => Promise<void>;
  resetAndRefresh: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  toggleCarousel: () => Promise<void>;
  toggleCleanMode: () => Promise<void>;
  setAsBackground: (fav: FavoritePhoto) => Promise<void>;
  removeFavorite: (url: string) => Promise<{ item: FavoritePhoto; index: number } | null>;
  restoreFavorite: (item: FavoritePhoto, index: number) => Promise<void>;
  exportFavorites: () => void;
  importFavorites: (file: File) => Promise<{ imported: number; error?: string }>;
} {

  const service = getPhotoService();

  const state = useSyncExternalStore(
    service.subscribe,
    service.getState,
  );

  return {
    ...state,
    refresh: service.refresh,
    resetAndRefresh: service.resetAndRefresh,
    toggleFavorite: service.toggleFavorite,
    toggleCarousel: service.toggleCarousel,
    toggleCleanMode: service.toggleCleanMode,
    setAsBackground: service.setAsBackground,
    removeFavorite: service.removeFavorite,
    restoreFavorite: service.restoreFavorite,
    exportFavorites: service.exportFavorites,
    importFavorites: service.importFavorites,
  };
}
