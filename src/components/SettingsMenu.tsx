import React, { useState, useEffect, useRef } from 'react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => Promise<void>;
  onExport: () => void;
  onImport: (file: File) => Promise<{ imported: number; error?: string }>;
  quotaExceeded?: boolean;
  cleanMode?: boolean;
  onToggleCleanMode?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  onExport,
  onImport,
  quotaExceeded,
  cleanMode,
  onToggleCleanMode,
}) => {
  const [unsplashKey, setUnsplashKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [keyEditing, setKeyEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.sync.get(['unsplashKey'], (result) => {
      if (result.unsplashKey) {
        setUnsplashKey(result.unsplashKey);
        setKeyEditing(false);
      } else {
        setKeyEditing(true);
      }
    });
  }, []);

  const handleKeySave = () => {
    chrome.storage.sync.set({ unsplashKey }, () => {
      onKeySaved();
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setKeyEditing(false);
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-16 right-4 z-50 w-96
        bg-white/80 backdrop-blur-xl
        border border-white/40
        rounded-2xl shadow-2xl shadow-black/10
        overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">Settings</h3>
        </div>

        {/* Quota exceeded warning */}
        {quotaExceeded && (
          <div className="mx-5 mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <div>
                <p className="text-xs font-medium text-amber-800">Trial requests exhausted</p>
                <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                  Get your own free key from{' '}
                  <a
                    href="https://unsplash.com/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-amber-900 transition-colors"
                  >Unsplash Developers</a>
                  {' '}to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Key section */}
        <div className="px-5 pb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
            Unsplash API Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className={`flex-1 min-w-0 px-3 py-2 text-sm rounded-lg transition-all duration-150
                ${keyEditing
                  ? 'bg-white/60 border border-gray-200/80 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300'
                  : 'bg-gray-100/60 border border-transparent text-gray-500 cursor-default'
                }`}
              placeholder={keyEditing ? 'Paste your Access Key' : 'Double-click to edit'}
              value={unsplashKey}
              readOnly={!keyEditing}
              onChange={e => setUnsplashKey(e.target.value)}
              onDoubleClick={() => setKeyEditing(true)}
              onBlur={() => { if (unsplashKey) setTimeout(() => setKeyEditing(false), 100); }}
            />
            {keyEditing && (
              <button
                onClick={handleKeySave}
                className="px-3.5 py-2 text-sm font-medium whitespace-nowrap
                  bg-violet-600 text-white rounded-lg
                  hover:bg-violet-700 active:bg-violet-800
                  transition-colors duration-150 cursor-pointer"
              >
                {saved ? (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 8.5l3.5 3.5L13 4"/>
                  </svg>
                ) : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-5" />

        {/* Clean Mode */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clean Mode
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Hide all UI for immersive wallpaper
            </p>
          </div>
          <button
            onClick={onToggleCleanMode}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${cleanMode ? "bg-violet-600" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${cleanMode ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-5" />

        {/* Favorites backup */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wider">
            Favorites Backup
          </p>
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm
                bg-white/60 border border-gray-200/80 rounded-lg text-gray-700
                hover:bg-white hover:border-gray-300
                transition-all duration-150 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8m0 0l-2.5-2.5M8 10l2.5-2.5M3 12.5v1a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5v-1"/>
              </svg>
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm
                bg-white/60 border border-gray-200/80 rounded-lg text-gray-700
                hover:bg-white hover:border-gray-300
                transition-all duration-150 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 14V6m0 0L5.5 8.5M8 6l2.5 2.5M3 3.5v-1A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v1"/>
              </svg>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          {importResult && (
            <p className="mt-2.5 text-xs text-center text-gray-600 bg-gray-100/60 rounded-lg py-1.5">
              {importResult}
            </p>
          )}
        </div>

        {/* Close */}
        <div className="px-5 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600
              transition-colors duration-150 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default SettingsMenu;
