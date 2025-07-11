import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Clock from './components/Clock';
import SettingsMenu from './components/SettingsMenu';
import { fetchUnsplashPhoto, PhotoData } from './api/fetchUnsplashPhoto';
import { 
  addFavorite, 
  removeFavorite, 
  isFavorite, 
  getFavorites, 
  getRandomFavoritePhoto,
  getCarouselCachedPhoto,
  setCarouselCachedPhoto,
  clearCarouselCache,
  getCachedPhoto,
  setCachedPhoto,
  getPreloadCache,
  setPreloadCache,
  clearPreloadCache,
  getCarouselMode,
  setCarouselMode,
  preloadImage
} from './api/photoCache';

// 常量定义 - 按review-guide.md要求
const CACHE_MAX_AGE = 2 * 60 * 1000; // 2分钟

const NewTab: React.FC = () => {
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [errorType, setErrorType] = useState<'no-key' | 'api-error' | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);
  const [carouselMode, setCarouselModeState] = useState(false);
  const [preloadQueue, setPreloadQueueState] = useState<PhotoData[]>([]);
  const [debugMode, setDebugMode] = useState(false);

  // 初始化 - 读取用户设置
  useEffect(() => {
    const initializeApp = async () => {
      // 读取心动模式状态
      const carouselEnabled = await getCarouselMode();
      setCarouselModeState(carouselEnabled);

      // 根据模式加载图片
      if (carouselEnabled) {
        await loadCarouselModePhoto();
      } else {
        await loadNormalModePhoto();
      }
    };

    initializeApp();
  }, []);

  // 更新预加载队列状态显示
  const updatePreloadQueueDisplay = async () => {
    const queue = await getPreloadCache();
    setPreloadQueueState(queue);
  };

  // 初始化时更新预加载队列显示
  useEffect(() => {
    updatePreloadQueueDisplay();
  }, []);

  // 检查当前图片是否已收藏
  useEffect(() => {
    if (photoData?.url) {
      isFavorite(photoData.url).then(setFavorite);
    }
  }, [photoData]);

  // 非心动模式：按review-guide.md核心缓存逻辑
  const loadNormalModePhoto = async () => {
   
    setErrorType(undefined);

    try {
      // 1. 检查当前显示图片的2分钟缓存
      const cachedPhoto = await getCachedPhoto(CACHE_MAX_AGE);
      if (cachedPhoto) {
        setPhotoData(cachedPhoto);
        setErrorType((cachedPhoto as any).errorType);
       
        return;
      }
     

      // 2. 缓存过期，使用预加载队列第一张图片
      const preloadQueue = await getPreloadCache();
      if (preloadQueue.length > 0) {
        const nextPhoto = preloadQueue[0]; // 取第一张 (shift)
        const remainingQueue = preloadQueue.slice(1); // 移除第一张
        
        // 立即更新显示，减少白屏时间
        setPhotoData(nextPhoto);
        setErrorType((nextPhoto as any).errorType);
     
        
        // 同步处理缓存更新，确保队列正常工作
        await Promise.all([
          setCachedPhoto(nextPhoto),
          setPreloadCache(remainingQueue)
        ]);
        
        // 更新显示状态
        await updatePreloadQueueDisplay();
        
        // 异步补充新图片到队列
        refillPreloadQueue();
        
        return;
      }

      // 3. 首次使用或队列为空，获取新图片并建立队列
      await initializePreloadQueue();
      
    } catch (error) {
      console.error('加载图片失败:', error);
      setErrorType('api-error');
    } finally {
     
    }
  };

  // 心动模式：循环展示收藏图片
  const loadCarouselModePhoto = async () => {
    
    setErrorType(undefined);

    try {
      // 1. 检查心动模式的2分钟缓存
      const cachedCarouselPhoto = await getCarouselCachedPhoto(CACHE_MAX_AGE);
      if (cachedCarouselPhoto) {
        setPhotoData(cachedCarouselPhoto);
        
        return;
      }

      // 2. 缓存过期，从收藏列表随机选择新图片
      const randomPhoto = await getRandomFavoritePhoto();
      if (randomPhoto) {
        setPhotoData(randomPhoto);
      
        // 异步更新缓存，不阻塞UI
        setCarouselCachedPhoto(randomPhoto).catch(console.error);
      } else {
        // 没有收藏图片，关闭心动模式
        setCarouselModeState(false);
        await setCarouselMode(false);
        await loadNormalModePhoto();
      }
    } catch (error) {
      console.error('心动模式加载失败:', error);
      setErrorType('api-error');
    } finally {
      
    }
  };

  // 初始化预加载队列 - 获取两张图片
  const initializePreloadQueue = async () => {
    setLoading(true);
    // 获取第一张图片并立即显示
    const firstPhoto = await fetchUnsplashPhoto(true);
    setLoading(false);
    setPhotoData(firstPhoto);
    setErrorType((firstPhoto as any).errorType);
    
    // 同步处理缓存和第二张图片
    const [_, secondPhoto] = await Promise.all([
      setCachedPhoto(firstPhoto),
      fetchUnsplashPhoto(true) // 获取第二张图片
    ]);
    
    if (secondPhoto.url !== firstPhoto.url) {
      // 预加载第二张图片到浏览器缓存
      await preloadImage(secondPhoto.url);
      // 建立预加载队列
      await setPreloadCache([secondPhoto]);
      // 更新显示状态
      await updatePreloadQueueDisplay();
    }
  };

  // 补充预加载队列 - 保持队列长度为2
  const refillPreloadQueue = async () => {
    const currentQueue = await getPreloadCache();
    
    // 如果队列不满2张，补充新图片
    while (currentQueue.length < 2) {
      const newPhoto = await fetchUnsplashPhoto(true);
      
      // 确保不重复
      if (!currentQueue.some(p => p.url === newPhoto.url) && 
          photoData?.url !== newPhoto.url) {
        await preloadImage(newPhoto.url);
        currentQueue.push(newPhoto);
      }
    }
    
    await setPreloadCache(currentQueue);
    // 更新显示状态
    await updatePreloadQueueDisplay();
  };

  // 心动模式2分钟定时器
  useEffect(() => {
    if (!carouselMode) return;

    const timer = setInterval(async () => {
      await clearCarouselCache();
      await loadCarouselModePhoto();
    }, CACHE_MAX_AGE);

    return () => clearInterval(timer);
  }, [carouselMode]);

  // 处理心动模式切换
  const handleCarouselToggle = async () => {
    const newMode = !carouselMode;
    setCarouselModeState(newMode);
    await setCarouselMode(newMode);

    if (newMode) {
      // 开启心动模式
      const favorites = await getFavorites();
      if (favorites.length === 0) {
        alert('您还没有收藏任何图片，无法开启心动模式');
        setCarouselModeState(false);
        await setCarouselMode(false);
        return;
      }
      await loadCarouselModePhoto();
    } else {
      // 关闭心动模式
      await clearCarouselCache();
      await loadNormalModePhoto();
    }
  };

  // 刷新照片功能 - 简化为只使用Unsplash
  const handleRefreshPhoto = async () => {
    if (carouselMode) {
      await clearCarouselCache();
      await loadCarouselModePhoto();
    } else {
      await clearPreloadCache();
      await updatePreloadQueueDisplay();
      await initializePreloadQueue();
    }
  };

  // 收藏/取消收藏
  const handleFavorite = async () => {
    if (!photoData) return;
    
    if (favorite) {
      await removeFavorite(photoData.url);
      setFavorite(false);
    } else {
      await addFavorite({ ...photoData, source: 'unsplash', savedAt: Date.now() });
      setFavorite(true);
    }
  };

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

          {/* 右下角：摄影师信息+收藏按钮+心动模式按钮 */}
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
            
            {/* 心动模式按钮 */}
            <button
              onClick={handleCarouselToggle}
              className="ml-2 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all flex items-center"
              title={carouselMode ? '关闭心动模式' : '开启心动模式'}
            >
              <span className={`inline-block w-6 h-4 rounded-full transition-colors duration-200 ${carouselMode ? 'bg-blue-500' : 'bg-gray-400'}`}
                style={{ position: 'relative' }}>
                <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${carouselMode ? 'translate-x-2' : ''}`}></span>
              </span>
              <span className="ml-1 text-xs select-none">Heart</span>
            </button>
            
            {/* 调试模式按钮 */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="ml-2 p-1 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all"
              title={debugMode ? '关闭调试模式' : '开启调试模式'}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 预加载队列调试界面 */}
        {debugMode && !carouselMode && (
          <div className="absolute bottom-20 right-4 bg-black bg-opacity-60 backdrop-blur-lg rounded-lg p-3 text-white text-xs">
            <div className="text-center mb-2 font-semibold">预加载队列 ({preloadQueue.length}/2)</div>
            <div className="flex flex-col space-y-2">
              {preloadQueue.map((photo, index) => (
                <div key={photo.url} className="flex items-center space-x-2">
                  <div className="w-10 h-7 bg-gray-300 rounded overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`预加载图片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <div>Next {index + 1}</div>
                    <div className="text-gray-300">{photo.photographer}</div>
                  </div>
                </div>
              ))}
              {preloadQueue.length === 0 && (
                <div className="text-gray-400 text-center">队列为空</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 设置菜单 - 移除源选择功能 */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
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