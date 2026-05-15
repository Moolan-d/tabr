import { useSyncExternalStore } from 'react';
import { getPhotoService, PhotoServiceState } from '../services/photo-service';

export function usePhotoService(): PhotoServiceState & {
  refresh: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  toggleCarousel: () => Promise<void>;
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
    toggleFavorite: service.toggleFavorite,
    toggleCarousel: service.toggleCarousel,
    exportFavorites: service.exportFavorites,
    importFavorites: service.importFavorites,
  };
}
