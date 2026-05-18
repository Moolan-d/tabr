import { Photo, PhotoSource } from './types';

const DEFAULT_ACCESS_KEY = 'BoJHVX6gSqa6Hs_yJmAqZBMAclCMPcf_tXmCrujEVgg';
const QUOTA_KEY = 'tabr_meta_v2';
const QUOTA_LIMIT = 10;
const QUOTA_SALT = (c: number) => c * 7 + 3;

const FALLBACK_PHOTO: Photo = {
  url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  photographerName: 'Fallback',
  photographerLink: 'https://unsplash.com',
  originalLink: 'https://unsplash.com',
  source: 'unsplash',
};

export class UnsplashSource implements PhotoSource {
  id = 'unsplash' as const;

  async fetchRandom(): Promise<Photo> {
    const key = await this.getApiKey();
    if (!key) {
      return { ...FALLBACK_PHOTO, errorType: 'no-key' } as Photo & { errorType: string };
    }

    const isBuiltin = key === DEFAULT_ACCESS_KEY;
    if (isBuiltin && (await this.isQuotaExceeded())) {
      return { ...FALLBACK_PHOTO, errorType: 'quota-exceeded' } as Photo & { errorType: string };
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?orientation=landscape&w=1920&h=1080`,
        {
          headers: { Authorization: `Client-ID ${key}` },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (isBuiltin) {
        await this.incrementQuota();
      }

      const data = await response.json();
      const photo = Array.isArray(data) ? data[0] : data;

      return {
        url: photo.urls.full,
        photographerName: photo.user.name,
        photographerLink: photo.user.links.html,
        originalLink: photo.links.html,
        source: 'unsplash',
      };
    } catch (error) {
      console.error('Unsplash fetch failed:', error);
      return { ...FALLBACK_PHOTO, errorType: 'api-error' } as Photo & { errorType: string };
    }
  }

  private async getApiKey(): Promise<string> {
    return new Promise(resolve => {
      chrome.storage.sync.get(['unsplashKey'], result => {
        resolve(result.unsplashKey || DEFAULT_ACCESS_KEY);
      });
    });
  }

  private async isQuotaExceeded(): Promise<boolean> {
    const raw = await new Promise<{ c?: number; s?: number } | undefined>(resolve => {
      chrome.storage.local.get([QUOTA_KEY], result => resolve(result[QUOTA_KEY]));
    });
    if (!raw) return false; // first use, no record yet
    const c = raw.c ?? 0;
    if (raw.s !== QUOTA_SALT(c)) return true; // tampered → treat as exceeded
    return c >= QUOTA_LIMIT;
  }

  private async incrementQuota(): Promise<void> {
    const raw = await new Promise<{ c?: number; s?: number }>(resolve => {
      chrome.storage.local.get([QUOTA_KEY], result => resolve(result[QUOTA_KEY] ?? {}));
    });
    const prev = (raw.s === QUOTA_SALT(raw.c ?? 0)) ? (raw.c ?? 0) : QUOTA_LIMIT;
    const c = prev + 1;
    chrome.storage.local.set({ [QUOTA_KEY]: { c, s: QUOTA_SALT(c) } });
  }
}
