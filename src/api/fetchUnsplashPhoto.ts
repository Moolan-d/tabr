import { getCachedPhoto, setCachedPhoto } from './photoCache';

export interface PhotoData {
  url: string;
  photographerName: string;
  photographerLink: string;
  originalLink: string;
  errorType?: 'no-key' | 'api-error';
}

const UNSPLASH_ACCESS_KEY = 'BoJHVX6gSqa6Hs_yJmAqZBMAclCMPcf_tXmCrujEVgg';
const API_CACHE_MAX_AGE = 2 * 60 * 1000; // 2分钟

export async function fetchUnsplashPhoto(skipCache: boolean = false): Promise<PhotoData> {
  // 2分钟缓存，但如果skipCache为true则跳过缓存
  if (!skipCache) {
    const cached = await getCachedPhoto('unsplash', API_CACHE_MAX_AGE);
    if (cached) {
      console.log(`fetchUnsplashPhoto: 使用API层缓存 - ${cached.url.substring(0, 50)}...`);
      return cached;
    } else {
      console.log('fetchUnsplashPhoto: API层缓存不存在或已失效');
    }
  } else {
    console.log('fetchUnsplashPhoto: 跳过缓存模式');
  }
  
  // 读取用户配置的Key
  const unsplashKeyFromUser: string = await new Promise(resolve => {
    chrome.storage.sync.get(['unsplashKey'], result => {
      resolve(result.unsplashKey || '');
    });
  });
  const unsplashKey = unsplashKeyFromUser || UNSPLASH_ACCESS_KEY;
  
  if (!unsplashKey) {
    return {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      photographerName: '备用图片',
      photographerLink: 'https://unsplash.com',
      originalLink: 'https://unsplash.com',
      errorType: 'no-key'
    };
  }
  
  try {
    // 优化API请求参数，提高响应速度
    // 添加时间戳参数确保每次请求都是新的
    const timestamp = skipCache ? `&t=${Date.now()}` : '';
    const response = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&w=1920&h=1080${timestamp}`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashKey}`
        },
        // 添加超时处理
        signal: AbortSignal.timeout(10000) // 10秒超时
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch from Unsplash`);
    }
    
    const data = await response.json();
    const photoData = Array.isArray(data) ? data[0] : data;
    
    const photo: PhotoData = {
      url: photoData.urls.full,        // 恢复使用full尺寸，保持最佳显示效果
      photographerName: photoData.user.name,
      photographerLink: photoData.user.links.html,
      originalLink: photoData.links.html
    };
    
    // 只有在不跳过缓存时才缓存结果
    if (!skipCache) {
      await setCachedPhoto('unsplash', photo);
      console.log(`fetchUnsplashPhoto: 新图片已缓存 - ${photo.url.substring(0, 50)}...`);
    } else {
      console.log(`fetchUnsplashPhoto: 跳过缓存，不保存 - ${photo.url.substring(0, 50)}...`);
    }
    return { ...photo, errorType: undefined };
    
  } catch (error) {
    console.error('Error fetching Unsplash photo:', error);
    
    // 返回备用图片
    return {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      photographerName: '备用图片',
      photographerLink: 'https://unsplash.com',
      originalLink: 'https://unsplash.com',
      errorType: 'api-error'
    };
  }
} 