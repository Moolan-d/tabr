// 图片缓存与收藏工具
import { PhotoData } from './fetchUnsplashPhoto';

export interface CachedPhoto {
  data: PhotoData;
  timestamp: number;
  source: 'unsplash';
}

// 缓存键定义 - 按review-guide.md要求
const CACHE_KEY = 'tabr_cache_unsplash'; // 统一缓存键
const FAVORITES_KEY = 'tabr_favorites';
const CAROUSEL_CACHE_KEY = 'tabr_carousel_cache';
const PRELOAD_CACHE_KEY = 'tabr_preload_cache';
const CAROUSEL_MODE_KEY = 'tabr_carousel_mode';

// 获取当前显示图片的缓存（非心动模式）
export async function getCachedPhoto(maxAgeMs: number): Promise<PhotoData | null> {
  return new Promise(resolve => {
    chrome.storage.local.get([CACHE_KEY], result => {
      const cache: CachedPhoto = result[CACHE_KEY];
      if (cache && Date.now() - cache.timestamp < maxAgeMs) {
        resolve(cache.data);
      } else {
        resolve(null);
      }
    });
  });
}

// 设置当前显示图片的缓存（非心动模式）
export async function setCachedPhoto(data: PhotoData) {
  const cache: CachedPhoto = { data, timestamp: Date.now(), source: 'unsplash' };
  chrome.storage.local.set({ [CACHE_KEY]: cache });
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

// 获取预加载队列（非心动模式）- 简化为直接存储PhotoData数组
export async function getPreloadCache(): Promise<PhotoData[]> {
  return new Promise(resolve => {
    chrome.storage.local.get([PRELOAD_CACHE_KEY], result => {
      resolve(result[PRELOAD_CACHE_KEY] || []);
    });
  });
}

// 设置预加载队列（非心动模式）- 限制最多2张
export async function setPreloadCache(photos: PhotoData[]) {
  const limitedPhotos = photos.slice(0, 2); // 按review-guide限制为2张
  chrome.storage.local.set({ [PRELOAD_CACHE_KEY]: limitedPhotos });
}

// 清除预加载队列
export async function clearPreloadCache() {
  chrome.storage.local.remove([PRELOAD_CACHE_KEY]);
}

// 收藏管理
export interface FavoritePhoto extends PhotoData {
  source: 'unsplash';
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

// 获取心动模式的缓存图片（2分钟缓存）
export async function getCarouselCachedPhoto(maxAgeMs: number): Promise<FavoritePhoto | null> {
  return new Promise(resolve => {
    chrome.storage.local.get([CAROUSEL_CACHE_KEY], result => {
      const cache: CarouselCache = result[CAROUSEL_CACHE_KEY];
      if (cache && Date.now() - cache.timestamp < maxAgeMs) {
        resolve(cache.lastPhoto);
      } else {
        resolve(null);
      }
    });
  });
}

// 设置心动模式的缓存图片
export async function setCarouselCachedPhoto(photo: FavoritePhoto) {
  const cache: CarouselCache = {
    lastPhoto: photo,
    timestamp: Date.now()
  };
  chrome.storage.local.set({ [CAROUSEL_CACHE_KEY]: cache });
}

// 获取收藏列表中的随机图片（不带缓存）
export async function getRandomFavoritePhoto(): Promise<FavoritePhoto | null> {
  const favorites = await getFavorites();
  if (favorites.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * favorites.length);
  return favorites[randomIndex];
}

// 清除心动模式缓存
export async function clearCarouselCache() {
  chrome.storage.local.remove([CAROUSEL_CACHE_KEY]);
}

// 获取/设置心动模式状态
export async function getCarouselMode(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get([CAROUSEL_MODE_KEY], result => {
      resolve(result[CAROUSEL_MODE_KEY] || false);
    });
  });
}

export async function setCarouselMode(enabled: boolean) {
  chrome.storage.local.set({ [CAROUSEL_MODE_KEY]: enabled });
} 