import { FavoritePhoto } from '../providers/types';
import { CacheLayer } from './cache';
import type { CloudProvider } from './cloud/types';

const FAVORITES_KEY = 'tabr_favorites';
const DEBOUNCE_MS = 5_000;

function isOldFormat(item: any): boolean {
  return 'savedAt' in item || 'photographerLink' in item || 'originalLink' in item;
}

function migrateOne(item: any): FavoritePhoto {
  return {
    url: item.url,
    photoName: item.photoName ?? '',
    source: item.source ?? 'unknown',
  };
}

function mergeByUrl(local: FavoritePhoto[], remote: FavoritePhoto[]): FavoritePhoto[] {
  const seen = new Set(local.map(f => f.url));
  const merged = [...local];
  for (const fav of remote) {
    if (!seen.has(fav.url)) {
      merged.push(fav);
      seen.add(fav.url);
    }
  }
  return merged;
}

export class FavoritesService {
  private migrated = false;
  private dirty = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private cloudAvailable = false;
  private syncing = false;

  constructor(
    private cache: CacheLayer,
    private cloud: CloudProvider,
  ) {}

  async getAll(): Promise<FavoritePhoto[]> {
    if (!this.migrated) {
      await this.migrateIfNeeded();
    }
    return (await this.cache.getRaw<FavoritePhoto[]>(FAVORITES_KEY)) ?? [];
  }

  async initSync(): Promise<void> {
    try {
      this.cloudAvailable = await this.cloud.isAvailable();
      if (!this.cloudAvailable) return;

      const remote = await this.cloud.pull();
      if (!remote) {
        // No file on Drive — push local as source of truth
        const local = await this.getAll();
        if (local.length > 0) {
          await this.cloud.push(local);
        }
        return;
      }

      const local = await this.getAll();
      const merged = mergeByUrl(local, remote);
      await this.cache.setRaw(FAVORITES_KEY, merged);

      if (merged.length !== local.length || merged.length !== remote.length) {
        await this.cloud.push(merged);
      }
    } catch {
      // Network error or Drive failure — continue local-only
      this.cloudAvailable = false;
    }
  }

  async add(photo: FavoritePhoto): Promise<void> {
    const list = await this.getAll();
    if (!list.some(item => item.url === photo.url)) {
      list.push(photo);
      await this.cache.setRaw(FAVORITES_KEY, list);
      this.schedulePush();
    }
  }

  async remove(url: string): Promise<void> {
    const list = await this.getAll();
    const filtered = list.filter(item => item.url !== url);
    await this.cache.setRaw(FAVORITES_KEY, filtered);
    this.schedulePush();
  }

  async isFavorite(url: string): Promise<boolean> {
    const list = await this.getAll();
    return list.some(item => item.url === url);
  }

  async getRandom(excludeUrl?: string): Promise<FavoritePhoto | null> {
    const list = await this.getAll();
    if (list.length === 0) return null;
    if (list.length === 1) return list[0];

    const candidates = excludeUrl
      ? list.filter(item => item.url !== excludeUrl)
      : list;

    const pool = candidates.length > 0 ? candidates : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async getCloudStatus(): Promise<'connected' | 'local-only'> {
    return this.cloudAvailable ? 'connected' : 'local-only';
  }

  exportJson(): void {
    this.getAll().then(list => {
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tabr_favorites_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async importJson(file: File): Promise<{ imported: number; error?: string }> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        return { imported: 0, error: 'Invalid format: expected a JSON array' };
      }

      const valid: FavoritePhoto[] = [];
      for (const item of data) {
        if (typeof item?.url === 'string' && typeof item?.source === 'string') {
          valid.push({
            url: item.url,
            photoName: typeof item.photoName === 'string' ? item.photoName : '',
            source: item.source,
          });
        }
      }

      if (valid.length === 0) {
        return { imported: 0, error: 'No valid favorites found in file' };
      }

      const local = await this.getAll();
      const before = local.length;
      const merged = mergeByUrl(local, valid);
      await this.cache.setRaw(FAVORITES_KEY, merged);
      this.schedulePush();

      return { imported: merged.length - before };
    } catch {
      return { imported: 0, error: 'Failed to read file' };
    }
  }

  private schedulePush(): void {
    this.dirty = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => { this.doPush(); }, DEBOUNCE_MS);
  }

  private async doPush(): Promise<void> {
    if (!this.dirty || !this.cloudAvailable || this.syncing) return;
    this.syncing = true;
    try {
      const list = await this.getAll();
      await this.cloud.push(list);
      this.dirty = false;
    } catch {
      // Push failed silently — will retry on next change
    } finally {
      this.syncing = false;
    }
  }

  private async migrateIfNeeded(): Promise<void> {
    this.migrated = true;
    const raw = await this.cache.getRaw<any[]>(FAVORITES_KEY);
    if (!raw || raw.length === 0) return;
    if (!raw.some(isOldFormat)) return;

    const migrated = raw.map(migrateOne);
    await this.cache.setRaw(FAVORITES_KEY, migrated);
  }
}
