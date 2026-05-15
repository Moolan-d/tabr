import React, { useState, useEffect, useRef } from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<{ imported: number; error?: string }>;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, onExport, onImport }) => {
  const [unsplashKey, setUnsplashKey] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.sync.get(['unsplashKey'], (result) => {
      if (result.unsplashKey) setUnsplashKey(result.unsplashKey);
    });
  }, []);

  const handleKeySave = () => {
    chrome.storage.sync.set({ unsplashKey });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImport(file);
    if (result.error) {
      setImportResult(result.error);
    } else {
      setImportResult(`Imported ${result.imported} new favorite(s)`);
    }
    setTimeout(() => setImportResult(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      <div className="fixed top-16 right-4 bg-white bg-opacity-90 backdrop-blur-subtle rounded-lg shadow-lg p-4 z-50 min-w-48">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Settings</h3>

        <div className="space-y-2">
          <div className="w-full text-left px-3 py-2 rounded-md bg-blue-500 text-white">
            <div className="flex items-center justify-between">
              <span>Unsplash</span>
              <span className="text-xs">✓</span>
            </div>
            <div className="text-xs opacity-75 mt-1">
              High quality photography
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
                placeholder="Enter your Unsplash Access Key"
                value={unsplashKey}
                onChange={e => setUnsplashKey(e.target.value)}
              />
              <button
                onClick={handleKeySave}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
                style={{ minWidth: '80px' }}
              >Save Key</button>
            </div>
          </div>
        </div>

        {/* Favorites backup */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={onExport}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >Export</button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >Import</button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          {importResult && (
            <div className="mt-2 text-xs text-gray-600">{importResult}</div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsMenu;