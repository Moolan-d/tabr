import React, { useState, useEffect } from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const [unsplashKey, setUnsplashKey] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['unsplashKey'], (result) => {
      if (result.unsplashKey) setUnsplashKey(result.unsplashKey);
    });
  }, []);

  const handleKeySave = () => {
    chrome.storage.sync.set({ unsplashKey });
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
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Unsplash 设置</h3>
        
        <div className="space-y-2">
          <div className="w-full text-left px-3 py-2 rounded-md bg-blue-500 text-white">
            <div className="flex items-center justify-between">
              <span>Unsplash</span>
              <span className="text-xs">✓</span>
            </div>
            <div className="text-xs opacity-75 mt-1">
              高质量摄影作品
            </div>
          </div>
        </div>
        
        <div className="mt-4">
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