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
const CAROUSEL_CACHE_KEY = 'tabr_carousel_cache';
const PRELOAD_CACHE_KEY = 'tabr_preload_cache';

// 预加载缓存接口
interface PreloadCache {
  photos: PhotoData[];
  timestamp: number;
}

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

// 预加载图片到浏览器缓存
export async function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 15000); // 15秒超时
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    img.src = url;
  });
}

// 获取预加载缓存（无时间限制，永久有效）
export async function getPreloadCache(): Promise<PhotoData[]> {
  return new Promise(resolve => {
    chrome.storage.local.get([PRELOAD_CACHE_KEY], result => {
      const cache: PreloadCache = result[PRELOAD_CACHE_KEY];
      if (cache && cache.photos && cache.photos.length > 0) {
        resolve(cache.photos);
      } else {
        resolve([]);
      }
    });
  });
}

// 设置预加载缓存
export async function setPreloadCache(photos: PhotoData[]) {
  const cache: PreloadCache = { photos, timestamp: Date.now() };
  chrome.storage.local.set({ [PRELOAD_CACHE_KEY]: cache });
}

// 清除预加载缓存
export async function clearPreloadCache() {
  chrome.storage.local.remove([PRELOAD_CACHE_KEY]);
}

// 收藏管理
export interface FavoritePhoto extends PhotoData {
  source: 'unsplash' | 'pixabay';
  savedAt: number;
}

// 轮播缓存管理
interface CarouselCache {
  lastPhoto: FavoritePhoto;
  timestamp: number;
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

// 获取收藏轮播的随机图片（带2分钟缓存）
export async function getRandomFavoritePhoto(): Promise<FavoritePhoto | null> {
  const maxAge = 2 * 60 * 1000; // 2分钟
  
  // 检查缓存
  const cached = await new Promise<CarouselCache | null>(resolve => {
    chrome.storage.local.get([CAROUSEL_CACHE_KEY], result => {
      const cache: CarouselCache = result[CAROUSEL_CACHE_KEY];
      if (cache && Date.now() - cache.timestamp < maxAge) {
        resolve(cache);
      } else {
        resolve(null);
      }
    });
  });
  
  if (cached) {
    return cached.lastPhoto;
  }
  
  // 获取收藏列表并随机选择
  const favorites = await getFavorites();
  if (favorites.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * favorites.length);
  const randomPhoto = favorites[randomIndex];
  
  // 缓存选中的图片
  const carouselCache: CarouselCache = {
    lastPhoto: randomPhoto,
    timestamp: Date.now()
  };
  chrome.storage.local.set({ [CAROUSEL_CACHE_KEY]: carouselCache });
  
  return randomPhoto;
}

// 清除轮播缓存（用于强制刷新）
export async function clearCarouselCache() {
  chrome.storage.local.remove([CAROUSEL_CACHE_KEY]);
} 