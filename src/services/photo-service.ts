import { Photo, FavoritePhoto } from '../providers/types';
import { sourceRegistry } from '../providers/registry';
import { t } from '../i18n/translations';
import { CacheLayer } from './cache';
import { FavoritesService } from './favorites';
import { PreloadQueue } from './preload-queue';

const DISPLAY_CACHE_KEY = 'tabr_display_cache';
const CAROUSEL_MODE_KEY = 'tabr_carousel_mode';
const CAROUSEL_CURSOR_KEY = 'tabr_carousel_cursor';
const CLEAN_MODE_KEY = 'tabr_clean_mode';
const DISPLAY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const CAROUSEL_THROTTLE_MS = 30 * 1000; // reuse the same favorite if opened again within 30s

interface CarouselCursor {
  url: string;
  at: number;
}

export interface PhotoServiceState {
  photo: Photo | null;
  loading: boolean;
  errorType?: 'no-key' | 'api-error' | 'quota-exceeded';
  isFavorite: boolean;
  carouselMode: boolean;
  favorites: FavoritePhoto[];
  quotaExceeded: boolean;
  cleanMode: boolean;
}

type Listener = () => void;

export class PhotoService {
  private state: PhotoServiceState = {
    photo: null,
    loading: false,
    isFavorite: false,
    carouselMode: false,
    favorites: [],
    quotaExceeded: false,
    cleanMode: false,
  };

  private listeners = new Set<Listener>();
  private initialized = false;

  private cache: CacheLayer;
  private favorites: FavoritesService;
  private queue: PreloadQueue;

  constructor() {
    this.cache = new CacheLayer();
    this.favorites = new FavoritesService(this.cache);
    this.queue = new PreloadQueue(this.cache, sourceRegistry.getCurrent());
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    if (!this.initialized) {
      this.initialize();
    }
    return () => this.listeners.delete(listener);
  };

  getState = (): PhotoServiceState => {
    return this.state;
  };

  resetAndRefresh = async (): Promise<void> => {
    await this.cache.remove(DISPLAY_CACHE_KEY);
    await this.queue.clear();
    await this.refresh();
  };

  refresh = async (): Promise<void> => {
    if (this.state.carouselMode) {
      // Manual refresh always advances, bypassing the 30s throttle
      await this.loadCarouselMode(true);
    } else {
      // Manual refresh: consume next from queue immediately
      const next = await this.queue.consume();
      if (next) {
        await this.setPhoto(next);
        // Background refill
        this.queue.refill(next.url);
      } else {
        // Queue empty, fetch fresh
        this.setState({ loading: true });
        const source = sourceRegistry.getCurrent();
        const photo = await source.fetchRandom();
        await this.setPhoto(photo);
        this.setState({ loading: false });
        // Rebuild queue
        this.queue.refill(photo.url);
      }
    }
  };

  toggleFavorite = async (): Promise<void> => {
    const { photo, isFavorite } = this.state;
    if (!photo) return;

    if (isFavorite) {
      await this.favorites.remove(photo.url);
      this.setState({ isFavorite: false });
    } else {
      await this.favorites.add({
        url: photo.url,
        photoName: photo.photographerName,
        photographerLink: photo.photographerLink,
        originalLink: photo.originalLink,
        source: photo.source,
      });
      this.setState({ isFavorite: true });
    }
    await this.updateFavorites();
  };

  /** Remove a favorite (from the gallery) and report it for undo. */
  removeFavorite = async (
    url: string,
  ): Promise<{ item: FavoritePhoto; index: number } | null> => {
    const removed = await this.favorites.removeWithIndex(url);
    if (!removed) return null;

    await this.updateFavorites();
    // The photo being displayed is unaffected; keep `isFavorite` in sync if needed.
    if (this.state.photo?.url === url) {
      this.setState({ isFavorite: false });
    }
    return removed;
  };

  /** Undo a gallery deletion, restoring the favorite at its original position. */
  restoreFavorite = async (item: FavoritePhoto, index: number): Promise<void> => {
    await this.favorites.insertAt(item, index);
    await this.updateFavorites();
    if (this.state.photo?.url === item.url) {
      this.setState({ isFavorite: true });
    }
  };

  /** Promote an existing favorite to the current background without leaving carousel mode. */
  setAsBackground = async (fav: FavoritePhoto): Promise<void> => {
    await this.setPhoto({
      url: fav.url,
      photographerName: fav.photoName,
      photographerLink: fav.photographerLink ?? '',
      originalLink: fav.originalLink ?? '',
      source: fav.source,
    });
  };

  toggleCarousel = async (): Promise<void> => {
    const newMode = !this.state.carouselMode;

    if (newMode) {
      const favorites = await this.favorites.getAll();
      if (favorites.length === 0) {
        alert(t('carouselNeedsFavorites'));
        return;
      }
    }

    await this.cache.setRaw(CAROUSEL_MODE_KEY, newMode);
    this.setState({ carouselMode: newMode });

    if (newMode) {
      await this.loadCarouselMode(true);
    } else {
      await this.loadNormalMode();
    }
  };

  toggleCleanMode = async (): Promise<void> => {
    const cleanMode = !this.state.cleanMode;
    await this.cache.setRaw(CLEAN_MODE_KEY, cleanMode);
    this.setState({ cleanMode });
  };

  exportFavorites = (): void => {
    this.favorites.exportJson();
  };

  importFavorites = async (file: File): Promise<{ imported: number; error?: string }> => {
    const result = await this.favorites.importJson(file);
    await this.updateFavorites();
    return result;
  };

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await this.updateFavorites();

    const cleanMode = await this.cache.getRaw<boolean>(CLEAN_MODE_KEY) ?? false;
    this.setState({ cleanMode });

    const carouselMode = await this.cache.getRaw<boolean>(CAROUSEL_MODE_KEY) ?? false;
    this.setState({ carouselMode });

    if (carouselMode) {
      await this.loadCarouselMode();
    } else {
      await this.loadNormalMode();
    }
  }

  private async loadNormalMode(): Promise<void> {
    // 1. Check display cache
    const cached = await this.cache.get<Photo>(DISPLAY_CACHE_KEY, DISPLAY_CACHE_TTL);
    if (cached) {
      await this.setPhoto(cached);
      return;
    }

    // 2. Try consuming from preload queue
    const next = await this.queue.consume();
    if (next) {
      await this.setPhoto(next);
      // Background refill
      this.queue.refill(next.url);
      return;
    }

    // 3. First time or empty queue — initialize queue
    await this.initializeQueue();
  }

  private async loadCarouselMode(force = false): Promise<void> {
    const favorites = await this.favorites.getAll();
    if (favorites.length === 0) {
      // No favorites, fall back to normal mode
      this.setState({ carouselMode: false });
      await this.cache.setRaw(CAROUSEL_MODE_KEY, false);
      await this.loadNormalMode();
      return;
    }

    // Carousel follows the gallery's visible order (newest first)
    const ordered = [...favorites].reverse();
    const cursor = await this.cache.getRaw<CarouselCursor>(CAROUSEL_CURSOR_KEY);
    const now = Date.now();

    // Opened again shortly after the last one — keep showing the same favorite
    if (!force && cursor && now - cursor.at < CAROUSEL_THROTTLE_MS) {
      const current = ordered.find(f => f.url === cursor.url);
      if (current) {
        this.setPhotoFromFavorite(current);
        return;
      }
    }

    const currentIndex = cursor ? ordered.findIndex(f => f.url === cursor.url) : -1;
    const next = ordered[(currentIndex + 1) % ordered.length];
    await this.cache.setRaw(CAROUSEL_CURSOR_KEY, { url: next.url, at: now });
    this.setPhotoFromFavorite(next);
  }

  private async initializeQueue(): Promise<void> {
    this.setState({ loading: true });
    const source = sourceRegistry.getCurrent();

    // Parallel fetch first two photos
    const firstPromise = source.fetchRandom();
    const secondPromise = source.fetchRandom();

    const first = await firstPromise;
    this.setState({ loading: false });
    await this.setPhoto(first);

    const second = await secondPromise;
    if (second.url !== first.url) {
      await this.queue.refill(first.url); // puts second into queue
    }
  }

  private async setPhoto(photo: Photo): Promise<void> {
    await this.cache.set(DISPLAY_CACHE_KEY, photo);
    const isFavorite = await this.favorites.isFavorite(photo.url);
    const errorType = (photo as any).errorType as PhotoServiceState['errorType'];
    const quotaExceeded = errorType === 'quota-exceeded';
    this.setState({ photo, isFavorite, errorType, quotaExceeded, loading: false });
  }

  private setPhotoFromFavorite(fav: FavoritePhoto): void {
    const photo: Photo = {
      url: fav.url,
      photographerName: fav.photoName,
      photographerLink: fav.photographerLink ?? '',
      originalLink: fav.originalLink ?? '',
      source: fav.source,
    };
    this.favorites.isFavorite(fav.url).then(isFavorite => {
      this.setState({ photo, isFavorite, loading: false });
    });
  }

  private async updateFavorites(): Promise<void> {
    const favorites = await this.favorites.getAll();
    this.setState({ favorites });
  }

  private setState(partial: Partial<PhotoServiceState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

let instance: PhotoService | null = null;

export function getPhotoService(): PhotoService {
  if (!instance) {
    instance = new PhotoService();
  }
  return instance;
}
