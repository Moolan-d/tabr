import React, { useState, useEffect } from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceChange: (source: 'unsplash' | 'pixabay') => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, onSourceChange }) => {
  const [currentSource, setCurrentSource] = useState<'unsplash' | 'pixabay'>('unsplash');
  const [unsplashKey, setUnsplashKey] = useState('');
  const [pixabayKey, setPixabayKey] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['photoSource', 'unsplashKey', 'pixabayKey'], (result) => {
      if (result.photoSource) setCurrentSource(result.photoSource);
      if (result.unsplashKey) setUnsplashKey(result.unsplashKey);
      if (result.pixabayKey) setPixabayKey(result.pixabayKey);
    });
  }, []);

  const handleSourceChange = (source: 'unsplash' | 'pixabay') => {
    setCurrentSource(source);
    chrome.storage.sync.set({ photoSource: source });
    onSourceChange(source);
    onClose();
  };

  const handleKeySave = () => {
    if (currentSource === 'unsplash') {
      chrome.storage.sync.set({ unsplashKey });
    } else {
      chrome.storage.sync.set({ pixabayKey });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />
      
      {/* 设置菜单 */}
      <div className="fixed top-16 right-4 bg-white bg-opacity-90 backdrop-blur-subtle rounded-lg shadow-lg p-4 z-50 min-w-48">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">图片来源设置</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => handleSourceChange('unsplash')}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              currentSource === 'unsplash'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Unsplash</span>
              {currentSource === 'unsplash' && (
                <span className="text-xs">✓</span>
              )}
            </div>
            <div className="text-xs opacity-75 mt-1">
              高质量摄影作品
            </div>
          </button>
          
          <button
            onClick={() => handleSourceChange('pixabay')}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              currentSource === 'pixabay'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Pixabay</span>
              {currentSource === 'pixabay' && (
                <span className="text-xs">✓</span>
              )}
            </div>
            <div className="text-xs opacity-75 mt-1">
              免费高清图片库
            </div>
          </button>
        </div>
        
        <div className="mt-4">
          {currentSource === 'unsplash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unsplash API Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
                  placeholder="请输入您的 Unsplash Access Key"
                  value={unsplashKey}
                  onChange={e => setUnsplashKey(e.target.value)}
                />
                <button
                  onClick={handleKeySave}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
                  style={{ minWidth: '80px' }}
                >保存 Key</button>
              </div>
            </div>
          )}
          {currentSource === 'pixabay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pixabay API Key</label>
              <div className="flex items-center space-x-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
                placeholder="请输入您的 Pixabay API Key"
                value={pixabayKey}
                onChange={e => setPixabayKey(e.target.value)}
              />
              <button
                onClick={handleKeySave}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
                >保存 Key</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            关闭设置
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsMenu; 