import { useSyncExternalStore } from 'react';
import { getPhotoService, PhotoServiceState } from '../services/photo-service';

export function usePhotoService(): PhotoServiceState & {
  refresh: () => Promise<void>;
  resetAndRefresh: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  toggleCarousel: () => Promise<void>;
  toggleCleanMode: () => Promise<void>;
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
    exportFavorites: service.exportFavorites,
    importFavorites: service.importFavorites,
  };
}
