import { Photo, FavoritePhoto } from '../providers/types';
import { sourceRegistry } from '../providers/registry';
import { CacheLayer } from './cache';
import { FavoritesService } from './favorites';
import { PreloadQueue } from './preload-queue';

const DISPLAY_CACHE_KEY = 'tabr_display_cache';
const CAROUSEL_CACHE_KEY = 'tabr_carousel_cache';
const CAROUSEL_MODE_KEY = 'tabr_carousel_mode';
const CLEAN_MODE_KEY = 'tabr_clean_mode';
const DISPLAY_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const CAROUSEL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export interface PhotoServiceState {
  photo: Photo | null;
  loading: boolean;
  errorType?: 'no-key' | 'api-error' | 'quota-exceeded';
  isFavorite: boolean;
  carouselMode: boolean;
  preloadQueue: Photo[];
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
    preloadQueue: [],
    quotaExceeded: false,
    cleanMode: false,
  };

  private listeners = new Set<Listener>();
  private carouselTimer: ReturnType<typeof setInterval> | null = null;
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
      await this.loadCarouselMode();
    } else {
      // Manual refresh: consume next from queue immediately
      const next = await this.queue.consume();
      if (next) {
        await this.setPhoto(next);
        // Background refill
        this.queue.refill(next.url).then(() => this.updateQueueDisplay());
      } else {
        // Queue empty, fetch fresh
        this.setState({ loading: true });
        const source = sourceRegistry.getCurrent();
        const photo = await source.fetchRandom();
        await this.setPhoto(photo);
        this.setState({ loading: false });
        // Rebuild queue
        this.queue.refill(photo.url).then(() => this.updateQueueDisplay());
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
        source: photo.source,
      });
      this.setState({ isFavorite: true });
    }
  };

  toggleCarousel = async (): Promise<void> => {
    const newMode = !this.state.carouselMode;

    if (newMode) {
      const favorites = await this.favorites.getAll();
      if (favorites.length === 0) {
        alert('您还没有收藏任何图片，无法开启心动模式');
        return;
      }
    }

    await this.cache.setRaw(CAROUSEL_MODE_KEY, newMode);
    this.setState({ carouselMode: newMode });

    if (newMode) {
      await this.loadCarouselMode();
      this.startCarouselTimer();
    } else {
      this.stopCarouselTimer();
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
    return this.favorites.importJson(file);
  };

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const cleanMode = await this.cache.getRaw<boolean>(CLEAN_MODE_KEY) ?? false;
    this.setState({ cleanMode });

    const carouselMode = await this.cache.getRaw<boolean>(CAROUSEL_MODE_KEY) ?? false;
    this.setState({ carouselMode });

    if (carouselMode) {
      await this.loadCarouselMode();
      this.startCarouselTimer();
    } else {
      await this.loadNormalMode();
    }
  }

  private async loadNormalMode(): Promise<void> {
    // 1. Check display cache
    const cached = await this.cache.get<Photo>(DISPLAY_CACHE_KEY, DISPLAY_CACHE_TTL);
    if (cached) {
      await this.setPhoto(cached);
      await this.updateQueueDisplay();
      return;
    }

    // 2. Try consuming from preload queue
    const next = await this.queue.consume();
    if (next) {
      await this.setPhoto(next);
      await this.updateQueueDisplay();
      // Background refill
      this.queue.refill(next.url).then(() => this.updateQueueDisplay());
      return;
    }

    // 3. First time or empty queue — initialize queue
    await this.initializeQueue();
  }

  private async loadCarouselMode(): Promise<void> {
    // 1. Check carousel cache
    const cached = await this.cache.get<FavoritePhoto>(CAROUSEL_CACHE_KEY, DISPLAY_CACHE_TTL);
    if (cached) {
      this.setPhotoFromFavorite(cached);
      return;
    }

    // 2. Random from favorites (exclude last shown)
    const lastUrl = this.state.photo?.url;
    const photo = await this.favorites.getRandom(lastUrl);
    if (photo) {
      this.setPhotoFromFavorite(photo);
      await this.cache.set(CAROUSEL_CACHE_KEY, photo);
    } else {
      // No favorites, fall back to normal
      this.setState({ carouselMode: false });
      await this.cache.setRaw(CAROUSEL_MODE_KEY, false);
      this.stopCarouselTimer();
      await this.loadNormalMode();
    }
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
      await this.updateQueueDisplay();
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
      photographerLink: '',
      originalLink: '',
      source: fav.source,
    };
    this.favorites.isFavorite(fav.url).then(isFavorite => {
      this.setState({ photo, isFavorite, loading: false });
    });
  }

  private async updateQueueDisplay(): Promise<void> {
    const queue = await this.queue.getAll();
    this.setState({ preloadQueue: queue });
  }

  private startCarouselTimer(): void {
    this.stopCarouselTimer();
    this.carouselTimer = setInterval(async () => {
      await this.cache.remove(CAROUSEL_CACHE_KEY);
      await this.loadCarouselMode();
    }, CAROUSEL_INTERVAL);
  }

  private stopCarouselTimer(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
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
