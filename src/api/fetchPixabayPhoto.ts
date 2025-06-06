import { PhotoData } from './fetchUnsplashPhoto';
import { getCachedPhoto, setCachedPhoto } from './photoCache';

// Pixabay API 配置
const PIXABAY_API_KEY = '50657730-c8bf774e3f1885b805ba49629'; // 请在这里填入您的 Pixabay API Key
const PIXABAY_API_URL = 'https://pixabay.com/api/';

// Pixabay API 响应接口
interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  fullHDURL?: string;
  imageURL?: string;
  imageWidth: number;
  imageHeight: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

// 备用图片数据（当API不可用时使用）
const FALLBACK_PHOTOS: PhotoData[] = [
  {
    url: 'https://cdn.pixabay.com/photo/2021/08/25/20/42/field-6574455_1280.jpg',
    photographerName: 'Pixabay用户',
    photographerLink: 'https://pixabay.com',
    originalLink: 'https://pixabay.com'
  },
  {
    url: 'https://cdn.pixabay.com/photo/2018/01/14/23/12/nature-3082832_1280.jpg',
    photographerName: 'Pixabay社区',
    photographerLink: 'https://pixabay.com',
    originalLink: 'https://pixabay.com'
  },
  {
    url: 'https://cdn.pixabay.com/photo/2017/02/01/22/02/mountain-landscape-2031539_1280.jpg',
    photographerName: 'Pixabay摄影师',
    photographerLink: 'https://pixabay.com',
    originalLink: 'https://pixabay.com'
  }
];

const API_CACHE_MAX_AGE = 2 * 60 * 1000; // 2分钟

export async function fetchPixabayPhoto(skipCache: boolean = false): Promise<PhotoData> {
  // 2分钟缓存，但如果skipCache为true则跳过缓存
  if (!skipCache) {
    const cached = await getCachedPhoto('pixabay', API_CACHE_MAX_AGE);
    if (cached) {
      console.log('fetchPixabayPhoto: 使用API层缓存');
      return cached;
    }
  }
  
  // 读取用户配置的Key
  const pixabayKey: string = await new Promise(resolve => {
    chrome.storage.sync.get(['pixabayKey'], result => {
      resolve(result.pixabayKey || '');
    });
  });
  try {
    if (!pixabayKey) {
      console.log('使用备用图片，请配置 Pixabay API Key 以获取真实图片');
      const randomIndex = Math.floor(Math.random() * FALLBACK_PHOTOS.length);
      return { ...FALLBACK_PHOTOS[randomIndex], errorType: 'no-key' };
    }

    // 随机搜索关键词，用于获取不同类型的图片
    const searchTerms = [
      'nature landscape',
      'mountain sunset',
      'ocean beach',
      'forest trees',
      'sky clouds',
      'flowers garden',
      'city skyline',
      'winter snow',
      'autumn colors',
      'spring blossom'
    ];

    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    // 如果跳过缓存，使用更随机的页码和更多的随机性
    const randomPage = skipCache 
      ? Math.floor(Math.random() * 20) + 1  // 1-20页，增加随机性
      : Math.floor(Math.random() * 10) + 1; // 1-10页

    const params = new URLSearchParams({
      key: pixabayKey,
      q: randomTerm,
      image_type: 'photo',
      orientation: 'horizontal',
      category: 'nature,places,backgrounds',
      min_width: '1920',
      min_height: '1080',
      safesearch: 'true',
      order: skipCache ? 'latest' : 'popular', // 跳过缓存时使用最新排序
      page: randomPage.toString(),
      per_page: '20'
    });

    // 如果跳过缓存，添加时间戳参数
    if (skipCache) {
      params.append('t', Date.now().toString());
    }

    const response = await fetch(`${PIXABAY_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Pixabay API 请求失败: ${response.status}`);
    }

    const data: PixabayResponse = await response.json();

    if (!data.hits || data.hits.length === 0) {
      throw new Error('Pixabay API 返回空结果');
    }

    // 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * data.hits.length);
    const selectedImage = data.hits[randomIndex];

    // 转换为统一的 PhotoData 格式
    const photo: PhotoData = {
      url: selectedImage.fullHDURL || selectedImage.largeImageURL || selectedImage.webformatURL,
      photographerName: selectedImage.user,
      photographerLink: `https://pixabay.com/users/${selectedImage.user}-${selectedImage.user_id}/`,
      originalLink: selectedImage.pageURL
    };
    
    // 只有在不跳过缓存时才缓存结果
    if (!skipCache) {
      await setCachedPhoto('pixabay', photo);
    }
    return { ...photo, errorType: undefined };

  } catch (error) {
    console.error('获取 Pixabay 照片失败:', error);
    
    // 返回备用图片
    const randomIndex = Math.floor(Math.random() * FALLBACK_PHOTOS.length);
    return {
      ...FALLBACK_PHOTOS[randomIndex],
      photographerName: '备用图片',
      errorType: 'api-error'
    };
  }
}

// 导出别名以保持兼容性
export const fetch500pxPhoto = fetchPixabayPhoto; 