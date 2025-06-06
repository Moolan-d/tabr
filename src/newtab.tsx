import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Clock from './components/Clock';
import SettingsMenu from './components/SettingsMenu';
import { fetchUnsplashPhoto, PhotoData } from './api/fetchUnsplashPhoto';
import { fetchPixabayPhoto } from './api/fetchPixabayPhoto';
import { addFavorite, removeFavorite, isFavorite, getFavorites, FavoritePhoto } from './api/photoCache';

const NewTab: React.FC = () => {
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [photoSource, setPhotoSource] = useState<'unsplash' | 'pixabay'>('unsplash');
  const [errorType, setErrorType] = useState<'no-key' | 'api-error' | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);
  const [carouselMode, setCarouselMode] = useState(false);
  const [carouselList, setCarouselList] = useState<FavoritePhoto[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselTimer, setCarouselTimer] = useState<number | null>(null);

  // 获取照片数据
  const fetchPhoto = async (source: 'unsplash' | 'pixabay' = photoSource) => {
    setLoading(true);
    setErrorType(undefined);
    try {
      const data = source === 'unsplash' 
        ? await fetchUnsplashPhoto()
        : await fetchPixabayPhoto();
      setPhotoData(data);
      setErrorType((data as any).errorType);
    } catch (error) {
      setErrorType('api-error');
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

  // 轮播模式下定时切换图片，2分钟缓存
  useEffect(() => {
    if (carouselMode && carouselList.length > 0) {
      setPhotoData(carouselList[carouselIndex]);
      if (carouselTimer) clearTimeout(carouselTimer);
      const timer = window.setTimeout(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselList.length);
      }, 2 * 60 * 1000);
      setCarouselTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [carouselMode, carouselIndex, carouselList]);

  // 轮播索引变化时切换图片
  useEffect(() => {
    if (carouselMode && carouselList.length > 0) {
      setPhotoData(carouselList[carouselIndex]);
    }
  }, [carouselIndex]);

  // 处理照片来源切换
  const handleSourceChange = (source: 'unsplash' | 'pixabay') => {
    setPhotoSource(source);
    fetchPhoto(source);
  };

  // 刷新照片
  const handleRefreshPhoto = () => {
    fetchPhoto();
  };

  // 轮播模式持久化
  useEffect(() => {
    chrome.storage.local.get(['tabr_carousel_mode'], result => {
      if (result.tabr_carousel_mode) {
        setCarouselMode(true);
        getFavorites().then(list => {
          if (list.length > 0) {
            setCarouselList(list);
            setCarouselIndex(0);
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ tabr_carousel_mode: carouselMode });
  }, [carouselMode]);

  // 只要轮播模式开启，始终读取收藏数据
  useEffect(() => {
    if (carouselMode) {
      getFavorites().then(list => {
        if (list.length > 0) {
          setCarouselList(list);
          setCarouselIndex(0);
        } else {
          setCarouselMode(false);
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
            opacity: loading ? 0.5 : 1
          }}
        />
      )}

      {/* 加载中的遮罩 */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="text-white text-xl text-shadow">加载中...</div>
        </div>
      )}

      {/* API Key/错误提示 */}
      {/* {errorType === 'no-key' && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg px-6 py-4 text-center">
            <div className="text-lg font-semibold text-gray-800 mb-2">未检测到有效的 API Key</div>
            <div className="text-gray-600 mb-3">请点击右上角设置按钮，填写并保存您的 Unsplash 或 Pixabay API Key。</div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >前往设置</button>
          </div>
        </div>
      )}
      {errorType === 'api-error' && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg px-6 py-4 text-center">
            <div className="text-lg font-semibold text-gray-800 mb-2">API 请求失败</div>
            <div className="text-gray-600 mb-3">API Key 可能无效、被限制，或网络异常。请检查后重试。</div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >前往设置</button>
          </div>
        </div>
      )} */}

      {/* 主要内容 */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* 顶部设置按钮 */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-3 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full backdrop-blur-subtle transition-all duration-200"
            title="设置"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="p-3 bg-black bg-opacity-20 hover:bg-opacity-30 text-white rounded-full backdrop-blur-subtle transition-all duration-200 disabled:opacity-50"
            title="刷新图片"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 右下角：摄影师信息+收藏按钮+轮播按钮 */}
          <div className="text-white text-shadow flex items-center space-x-4">
            <div>
              <div className="text-sm opacity-75 mb-1">摄影师</div>
              <div className="flex items-center space-x-3">
                <a
                  href={photoData?.photographerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {photoData?.photographerName}
                </a>
                <span className="opacity-50">•</span>
                <a
                  href={photoData?.originalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm opacity-75 hover:opacity-100 hover:underline"
                >
                  查看原图
                </a>
              </div>
            </div>
            {/* 收藏按钮 */}
            <button
              onClick={handleFavorite}
              title={favorite ? '取消收藏' : '收藏'}
              className="ml-2 p-2 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all"
              style={{ outline: 'none', border: 'none' }}
            >
              {favorite ? (
                <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </button>
            {/* 轮播模式 Switch 按钮 */}
            <button
              onClick={() => setCarouselMode(v => !v)}
              className="ml-2 p-2 rounded-full bg-black bg-opacity-20 hover:bg-opacity-40 transition-all flex items-center"
              style={{ outline: 'none', border: 'none' }}
              title={carouselMode ? '关闭收藏模式' : '开启收藏模式'}
            >
              {/* Switch icon */}
              <span className={`inline-block w-10 h-6 rounded-full transition-colors duration-200 ${carouselMode ? 'bg-blue-500' : 'bg-gray-400'}`}
                style={{ position: 'relative' }}>
                <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${carouselMode ? 'translate-x-4' : ''}`}></span>
              </span>
              <span className="ml-2 text-sm select-none">收藏</span>
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