import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Clock from './components/Clock';
import SettingsMenu from './components/SettingsMenu';
import { fetchUnsplashPhoto, PhotoData } from './api/fetchUnsplashPhoto';
import { fetchPixabayPhoto } from './api/fetchPixabayPhoto';
import { 
  addFavorite, 
  removeFavorite, 
  isFavorite, 
  getFavorites, 
  getRandomFavoritePhoto, 
  clearCarouselCache,
  preloadImage,
  getPreloadCache,
  setPreloadCache,
  clearPreloadCache,
  getCachedPhoto,
  setCachedPhoto
} from './api/photoCache';

// 常量定义
const API_CACHE_MAX_AGE = 2 * 60 * 1000; // 2分钟

const NewTab: React.FC = () => {
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [photoSource, setPhotoSource] = useState<'unsplash' | 'pixabay'>('unsplash');
  const [errorType, setErrorType] = useState<'no-key' | 'api-error' | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);
  const [carouselMode, setCarouselMode] = useState(false);
  const [carouselTimer, setCarouselTimer] = useState<number | null>(null);
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  // 预加载下一张图片
  const preloadNextPhoto = useCallback(async (forceMultiple: boolean = false) => {
    if (preloadStatus === 'loading' && !forceMultiple) return;
    
    setPreloadStatus('loading');
    try {
      const source = photoSource;
      const photosToPreload: PhotoData[] = [];
      const currentPhotoUrl = photoData?.url; // 获取当前显示的图片URL
      
      // 预加载逻辑：确保缓存中始终有足够的图片
      const preloadCache = await getPreloadCache();
      const maxCacheSize = 2;
      
      // 计算需要预加载的数量
      let needCount;
      if (forceMultiple) {
        // 强制预加载：补充到最大缓存数量
        needCount = maxCacheSize - preloadCache.length;
      } else {
        // 正常预加载：至少保持1张，最多2张
        needCount = preloadCache.length === 0 ? 2 : (preloadCache.length < maxCacheSize ? 1 : 0);
      }
      
      const actualNeedCount = Math.max(0, needCount);
      
      for (let i = 0; i < actualNeedCount; i++) {
        let attempts = 0;
        const maxAttempts = 5; // 最多尝试5次获取不同的图片
        let nextPhoto: PhotoData | null = null;
        
        // 循环获取图片，确保不与当前显示的图片相同
        do {
          attempts++;
          nextPhoto = source === 'unsplash' 
            ? await fetchUnsplashPhoto(true) // 预加载时强制跳过缓存
            : await fetchPixabayPhoto(true);
          
          // 如果获取到的图片与当前显示的图片相同，或与已预加载的图片相同，继续尝试
          if (nextPhoto && nextPhoto.url && 
              nextPhoto.url !== currentPhotoUrl && 
              !photosToPreload.some(p => p.url === nextPhoto!.url) &&
              !preloadCache.some(p => p.url === nextPhoto!.url)) {
            break;
          }
          
          // 如果尝试次数过多，等待一小段时间再重试
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } while (attempts < maxAttempts);
        
        if (nextPhoto && nextPhoto.url && nextPhoto.url !== currentPhotoUrl) {
          // 预加载图片到浏览器缓存
          const success = await preloadImage(nextPhoto.url);
          if (success) {
            photosToPreload.push(nextPhoto);
          }
        }
      }
      
      if (photosToPreload.length > 0) {
        // 更新预加载缓存，限制最多2张图片
        const newCache = [...photosToPreload, ...preloadCache].slice(0, 2);
        await setPreloadCache(newCache);
        setPreloadStatus('ready');
        console.log(`预加载完成：${photosToPreload.length}张图片，缓存总数：${newCache.length}`);
      } else {
        setPreloadStatus('idle');
      }
    } catch (error) {
      console.error('预加载失败:', error);
      setPreloadStatus('idle');
    }
  }, [photoSource, preloadStatus, photoData]);

  // 获取照片数据
  const fetchPhoto = async (source: 'unsplash' | 'pixabay' = photoSource, force: boolean = false) => {
    setLoading(true);
    setErrorType(undefined);
    
    try {
      let data: PhotoData;
      
      if (force) {
        // 强制刷新：直接获取新图片，清除所有缓存
        await clearPreloadCache();
        data = source === 'unsplash' 
          ? await fetchUnsplashPhoto(true)
          : await fetchPixabayPhoto(true);
        console.log('强制刷新，直接获取新图片');
        
        // 延迟500ms后开始预加载图片
        setTimeout(() => {
          preloadNextPhoto(true);
        }, 500);
        
      } else {
        // 正常加载：按优先级检查缓存
        
        // 1. 优先检查API缓存（2分钟内有效）
        console.log(`fetchPhoto: 检查API缓存 - source: ${source}`);
        const apiCached = await getCachedPhoto(source, API_CACHE_MAX_AGE);
          
        if (apiCached) {
          data = apiCached;
          console.log(`✅ 使用API缓存（2分钟内）- URL: ${apiCached.url.substring(0, 50)}...`);
          
          // 确保有预加载数据准备
          setTimeout(() => {
            preloadNextPhoto(false);
          }, 100);
          
        } else {
          console.log('❌ API缓存失效或不存在');
          
          // 2. 缓存失效后，优先读取预加载缓存 (tabr_preload_cache)
          const preloadCache = await getPreloadCache();
          console.log(`📦 检查预加载缓存，数量: ${preloadCache.length}`);
          
          if (preloadCache.length > 0) {
            // 🎯 优先使用预加载缓存中的资源
            data = preloadCache[0];
            await setPreloadCache(preloadCache.slice(1));
            console.log(`✅ 使用预加载缓存资源 - URL: ${data.url.substring(0, 50)}...`);
            
            // 设置新的API缓存，重置2分钟计时器（不缓存备用图片）
            if (!data.errorType) {
              await setCachedPhoto(source, data);
              console.log(`🔄 设置新的API缓存（来自预加载）`);
            } else {
              console.log(`⚠️ 跳过缓存备用图片`);
            }
            
            // 立即补充预加载缓存，确保后续有图片可用
            setTimeout(() => {
              preloadNextPhoto(false);
            }, 100);
            
          } else {
            // 3. 只有在预加载缓存为空时，才重新请求新的资源
            console.log('📦 预加载缓存为空，重新请求新的资源');
            data = source === 'unsplash' 
              ? await fetchUnsplashPhoto(true) // 跳过API内部缓存检查，因为我们已经检查过了
              : await fetchPixabayPhoto(true);
            console.log(`✅ 获取新资源 - URL: ${data.url.substring(0, 50)}...`);
            
            // 设置API缓存（不缓存备用图片）
            if (!data.errorType) {
              await setCachedPhoto(source, data);
              console.log(`🔄 设置新的API缓存（来自API调用）`);
            } else {
              console.log(`⚠️ 跳过缓存备用图片`);
            }
            
            // 重新建立预加载缓存池
            setTimeout(() => {
              preloadNextPhoto(true);
            }, 500);
          }
        }
      }
      
      setPhotoData(data);
      setErrorType((data as any).errorType);
      
      // 图片设置完成后重置预加载状态
      setPreloadStatus('idle');
      
    } catch (error) {
      setErrorType('api-error');
      console.error('获取图片失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    // 从存储中读取用户偏好
    chrome.storage.sync.get(['photoSource'], (result) => {
      const source = result.photoSource || 'unsplash';
      setPhotoSource(source);
      fetchPhoto(source);
    });
  }, []);

  // 检查当前图片是否已收藏
  useEffect(() => {
    if (photoData && photoData.url) {
      isFavorite(photoData.url).then(setFavorite);
    } else {
      setFavorite(false);
    }
  }, [photoData]);

  // 收藏/取消收藏
  const handleFavorite = async () => {
    if (!photoData) return;
    if (favorite) {
      await removeFavorite(photoData.url);
      setFavorite(false);
    } else {
      await addFavorite({ ...photoData, source: photoSource, savedAt: Date.now() });
      setFavorite(true);
    }
  };

  // 轮播模式下的图片获取逻辑
  const loadCarouselPhoto = async () => {
    if (!carouselMode) return;
    
    setLoading(true);
    setErrorType(undefined);
    
    try {
      const randomPhoto = await getRandomFavoritePhoto();
      if (randomPhoto) {
        setPhotoData(randomPhoto);
        setErrorType((randomPhoto as any).errorType);
      } else {
        // 如果没有收藏图片，自动关闭轮播模式
        setCarouselMode(false);
        console.log('轮播模式：没有收藏图片，自动关闭');
      }
    } catch (error) {
      console.error('轮播模式加载图片失败:', error);
      setErrorType('api-error');
      setCarouselMode(false);
    } finally {
      setLoading(false);
    }
  };

  // 轮播模式启动时加载图片
  useEffect(() => {
    if (carouselMode) {
      loadCarouselPhoto();
    }
  }, [carouselMode]);

  // 轮播模式定时器：2分钟后切换到下一张随机图片
  useEffect(() => {
    if (carouselMode) {
      // 清除之前的定时器
      if (carouselTimer) clearTimeout(carouselTimer);
      
      // 设置2分钟定时器，使用预加载逻辑
      const timer = window.setTimeout(async () => {
        // 轮播模式优先使用预加载数据，如果没有则加载收藏图片
        const preloadCache = await getPreloadCache();
        if (preloadCache.length > 0) {
          const preloadedPhoto = preloadCache[0];
          await setPreloadCache(preloadCache.slice(1));
          setPhotoData(preloadedPhoto);
          console.log('轮播模式：使用预加载图片');
          // 立即补充预加载缓存
          setTimeout(() => preloadNextPhoto(false), 100);
        } else {
          // 没有预加载数据时回退到收藏图片
          clearCarouselCache().then(() => {
            loadCarouselPhoto();
          });
        }
      }, 2 * 60 * 1000);
      
      setCarouselTimer(timer);
      
      return () => clearTimeout(timer);
    } else {
      // 关闭轮播模式时清理定时器
      if (carouselTimer) {
        clearTimeout(carouselTimer);
        setCarouselTimer(null);
      }
    }
  }, [carouselMode]);

  // 处理照片来源切换
  const handleSourceChange = (source: 'unsplash' | 'pixabay') => {
    setPhotoSource(source);
    if (!carouselMode) {
      // 清除预加载缓存，因为切换了来源
      clearPreloadCache();
      fetchPhoto(source, true);
    }
  };

  // 刷新照片 - 强制获取新图片，确保切换
  const handleRefreshPhoto = async () => {
    setLoading(true);
    setErrorType(undefined);
    
    try {
      const currentImageUrl = photoData?.url;
      let data: PhotoData;
      let attempts = 0;
      const maxAttempts = 3;
      
      // 清除所有相关缓存，确保获取新图片
      await clearPreloadCache();
      if (carouselMode) {
        await clearCarouselCache();
      }
      
      // 循环获取图片，直到获取到与当前不同的图片
      do {
        attempts++;
        console.log(`刷新尝试 ${attempts}：强制获取新图片`);
        
        if (carouselMode) {
          // 轮播模式：获取随机收藏图片
          const randomPhoto = await getRandomFavoritePhoto();
          if (randomPhoto) {
            data = randomPhoto;
          } else {
            // 如果没有收藏图片，关闭轮播模式并获取新图片（跳过缓存）
            setCarouselMode(false);
            data = photoSource === 'unsplash' 
              ? await fetchUnsplashPhoto(true)
              : await fetchPixabayPhoto(true);
          }
        } else {
          // 普通模式：直接调用API获取新图片（跳过缓存）
          data = photoSource === 'unsplash' 
            ? await fetchUnsplashPhoto(true)
            : await fetchPixabayPhoto(true);
        }
        
        // 如果获取到的图片和当前图片相同，并且还有尝试次数，继续获取
        if (data.url === currentImageUrl && attempts < maxAttempts) {
          console.log('获取到相同图片，重新尝试...');
          // 等待一小段时间再重试，避免API限制
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
        
        break;
      } while (attempts < maxAttempts);
      
      // 设置新图片数据
      setPhotoData(data);
      setErrorType((data as any).errorType);
      
      // 如果最终还是相同图片，给出提示
      if (data.url === currentImageUrl) {
        console.log('注意：刷新后仍是相同图片，可能是API返回了缓存数据');
      } else {
        console.log('刷新成功：获取到新图片');
      }
      
      // 图片设置完成后重置预加载状态
      setPreloadStatus('idle');
      
      // 延迟1秒后开始预加载多张图片（给API一些时间）
      setTimeout(() => {
        preloadNextPhoto(true);
      }, 1000);
      
    } catch (error) {
      console.error('刷新图片失败:', error);
      setErrorType('api-error');
    } finally {
      setLoading(false);
    }
  };

  // 轮播模式持久化
  useEffect(() => {
    chrome.storage.local.get(['tabr_carousel_mode'], result => {
      if (result.tabr_carousel_mode) {
        setCarouselMode(true);
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ tabr_carousel_mode: carouselMode });
  }, [carouselMode]);

  // 轮播模式开启时检查收藏数量
  useEffect(() => {
    if (carouselMode) {
      getFavorites().then(list => {
        if (list.length === 0) {
          setCarouselMode(false);
          alert('您还没有收藏任何图片，无法开启轮播模式');
        }
      });
    }
  }, [carouselMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 背景图片 */}
      {photoData && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url(${photoData.url})`,
            opacity: loading ? 0.7 : 1
          }}
        />
      )}

      {/* 加载中的遮罩 */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            <div className="text-white text-lg text-shadow">加载中...</div>
          </div>
        </div>
      )}



      {/* 主要内容 */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* 顶部设置按钮 */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full backdrop-blur-subtle transition-all duration-200"
            title="设置"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* 中央时钟 */}
        <div className="flex-1 flex items-center justify-center">
          <Clock />
        </div>

        {/* 底部信息栏 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-4">
          {/* 左下角：刷新按钮 */}
          <button
            onClick={handleRefreshPhoto}
            disabled={loading}
            className="p-2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full backdrop-blur-subtle transition-all duration-200 disabled:opacity-50"
            title="刷新图片"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 右下角：摄影师信息+收藏按钮+轮播按钮 */}
          <div className="text-white text-shadow flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-3">
                <a
                  href={photoData?.originalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm opacity-75 hover:opacity-100 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                 </svg>
                </a>
              </div>
            </div>
            {/* 收藏按钮 */}
            <button
              onClick={handleFavorite}
              title={favorite ? '取消收藏' : '收藏'}
              className="ml-2 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all"
              style={{ outline: 'none', border: 'none' }}
            >
              {favorite ? (
                <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </button>
            {/* 轮播模式 Switch 按钮 */}
            <button
              onClick={() => setCarouselMode(v => !v)}
              className="ml-2 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all flex items-center"
              style={{ outline: 'none', border: 'none' }}
              title={carouselMode ? '关闭收藏模式' : '开启收藏模式'}
            >
              {/* Switch icon */}
              <span className={`inline-block w-6 h-4 rounded-full transition-colors duration-200 ${carouselMode ? 'bg-blue-500' : 'bg-gray-400'}`}
                style={{ position: 'relative' }}>
                <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${carouselMode ? 'translate-x-2' : ''}`}></span>
              </span>
              <span className="ml-1 text-xs select-none">Heart</span>
            </button>
          </div>
        </div>
      </div>

      {/* 设置菜单 */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSourceChange={handleSourceChange}
      />
    </div>
  );
};

// 渲染应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<NewTab />);
} 