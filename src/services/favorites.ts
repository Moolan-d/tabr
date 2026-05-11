import { FavoritePhoto } from '../providers/types';
import { CacheLayer } from './cache';

const FAVORITES_KEY = 'tabr_favorites';

export class FavoritesService {
  constructor(private cache: CacheLayer) {}

  async getAll(): Promise<FavoritePhoto[]> {
    return (await this.cache.getRaw<FavoritePhoto[]>(FAVORITES_KEY)) ?? [];
  }

  async add(photo: FavoritePhoto): Promise<void> {
    const list = await this.getAll();
    if (!list.some(item => item.url === photo.url)) {
      list.push(photo);
      await this.cache.setRaw(FAVORITES_KEY, list);
    }
  }

  async remove(url: string): Promise<void> {
    const list = await this.getAll();
    await this.cache.setRaw(
      FAVORITES_KEY,
      list.filter(item => item.url !== url),
    );
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
}
