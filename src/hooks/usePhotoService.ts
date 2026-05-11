import { useSyncExternalStore } from 'react';
import { getPhotoService, PhotoServiceState } from '../services/photo-service';

export function usePhotoService(): PhotoServiceState & {
  refresh: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  toggleCarousel: () => Promise<void>;
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
  };
}
