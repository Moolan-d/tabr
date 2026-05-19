import { Photo, PhotoSource } from '../providers/types';
import { CacheLayer } from './cache';

const PRELOAD_CACHE_KEY = 'tabr_preload_cache';

interface QueuedPhoto {
  photo: Photo;
  fetchedAt: number;
}

export class PreloadQueue {
  static readonly CAPACITY = 2;
  static readonly IMAGE_TTL_MS = 60 * 60 * 1000; // 1 hour
  static readonly MAX_RETRY = 3;

  constructor(
    private cache: CacheLayer,
    private source: PhotoSource,
  ) {}

  async peek(): Promise<Photo | null> {
    const queue = await this.getQueue();
    return queue[0]?.photo ?? null;
  }

  async consume(): Promise<Photo | null> {
    const queue = await this.getQueue();
    if (queue.length === 0) return null;

    const next = queue.shift()!;
    await this.saveQueue(queue);
    return next.photo;
  }

  async refill(currentPhotoUrl: string): Promise<void> {
    const queue = await this.getQueue();
    const existingUrls = new Set([currentPhotoUrl, ...queue.map(q => q.photo.url)]);

    while (queue.length < PreloadQueue.CAPACITY) {
      let added = false;
      for (let attempt = 0; attempt < PreloadQueue.MAX_RETRY; attempt++) {
        const photo = await this.source.fetchRandom();
        if (!existingUrls.has(photo.url)) {
          await this.preloadImage(photo.url);
          queue.push({ photo, fetchedAt: Date.now() });
          existingUrls.add(photo.url);
          added = true;
          break;
        }
      }
      if (!added) break; // all retries exhausted for this slot
    }

    await this.saveQueue(queue);
  }

  async clear(): Promise<void> {
    await this.cache.remove(PRELOAD_CACHE_KEY);
  }

  async getAll(): Promise<Photo[]> {
    const queue = await this.getQueue();
    return queue.map(q => q.photo);
  }

  private async getQueue(): Promise<QueuedPhoto[]> {
    const raw = await this.cache.getRaw<QueuedPhoto[]>(PRELOAD_CACHE_KEY);
    if (!raw) return [];
    // filter out expired entries
    const now = Date.now();
    return raw.filter(entry => now - entry.fetchedAt < PreloadQueue.IMAGE_TTL_MS);
  }

  private async saveQueue(queue: QueuedPhoto[]): Promise<void> {
    await this.cache.setRaw(PRELOAD_CACHE_KEY, queue.slice(0, PreloadQueue.CAPACITY));
  }

  private preloadImage(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(false), 15_000);
      img.onload = () => { clearTimeout(timeout); resolve(true); };
      img.onerror = () => { clearTimeout(timeout); resolve(false); };
      img.src = url;
    });
  }
}
