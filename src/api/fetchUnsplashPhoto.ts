import { getCachedPhoto, setCachedPhoto } from './photoCache';

export interface PhotoData {
  url: string;
  photographerName: string;
  photographerLink: string;
  originalLink: string;
  errorType?: 'no-key' | 'api-error';
}
const UNSPLASH_ACCESS_KEY = 'BoJHVX6gSqa6Hs_yJmAqZBMAclCMPcf_tXmCrujEVgg'; // 请在这里填入您的 Unsplash Access Key

export async function fetchUnsplashPhoto(): Promise<PhotoData> {
  // 2分钟缓存
  const maxAge = 2 * 60 * 1000;
  const cached = await getCachedPhoto('unsplash', maxAge);
  if (cached) return cached;
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
    const response = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&w=1920&h=1080`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashKey}`
        }
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash');
    }
    const data = await response.json();
    const photo: PhotoData = {
      url: data.urls.full,
      photographerName: data.user.name,
      photographerLink: data.user.links.html,
      originalLink: data.links.html
    };
    await setCachedPhoto('unsplash', photo);
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