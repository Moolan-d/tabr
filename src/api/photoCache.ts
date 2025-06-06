// 图片缓存与收藏工具
import { PhotoData } from './fetchUnsplashPhoto';

export interface CachedPhoto {
  data: PhotoData;
  timestamp: number;
  source: 'unsplash' | 'pixabay';
}

const CACHE_KEY = {
  unsplash: 'tabr_cache_unsplash',
  pixabay: 'tabr_cache_pixabay',
};
const FAVORITES_KEY = 'tabr_favorites';

// 获取缓存图片（maxAgeMs 毫秒内有效）
export async function getCachedPhoto(source: 'unsplash' | 'pixabay', maxAgeMs: number): Promise<PhotoData | null> {
  return new Promise(resolve => {
    chrome.storage.local.get([CACHE_KEY[source]], result => {
      const cache: CachedPhoto = result[CACHE_KEY[source]];
      if (cache && Date.now() - cache.timestamp < maxAgeMs) {
        resolve(cache.data);
      } else {
        resolve(null);
      }
    });
  });
}

// 设置缓存图片
export async function setCachedPhoto(source: 'unsplash' | 'pixabay', data: PhotoData) {
  const cache: CachedPhoto = { data, timestamp: Date.now(), source };
  chrome.storage.local.set({ [CACHE_KEY[source]]: cache });
}

// 收藏管理
export interface FavoritePhoto extends PhotoData {
  source: 'unsplash' | 'pixabay';
  savedAt: number;
}

// 获取所有收藏
export async function getFavorites(): Promise<FavoritePhoto[]> {
  return new Promise(resolve => {
    chrome.storage.local.get([FAVORITES_KEY], result => {
      resolve(result[FAVORITES_KEY] || []);
    });
  });
}

// 添加收藏
export async function addFavorite(photo: FavoritePhoto) {
  const list = await getFavorites();
  // 避免重复收藏
  if (!list.find(item => item.url === photo.url)) {
    list.push(photo);
    chrome.storage.local.set({ [FAVORITES_KEY]: list });
  }
}

// 移除收藏
export async function removeFavorite(url: string) {
  const list = await getFavorites();
  const newList = list.filter(item => item.url !== url);
  chrome.storage.local.set({ [FAVORITES_KEY]: newList });
}

// 判断是否已收藏
export async function isFavorite(url: string): Promise<boolean> {
  const list = await getFavorites();
  return list.some(item => item.url === url);
} 