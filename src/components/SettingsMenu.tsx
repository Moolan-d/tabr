import React, { useState, useEffect, useRef } from 'react';
import { t } from '../i18n/translations';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => Promise<void>;
  onExport: () => void;
  onImport: (file: File) => Promise<{ imported: number; error?: string }>;
  quotaExceeded?: boolean;
  cleanMode?: boolean;
  onToggleCleanMode?: () => void;
  carouselMode?: boolean;
  onToggleCarousel?: () => void;
}

/**
 * Monochrome switch. Reads like the app mark: a solid dark shape on white when
 * on, a hollow trace when off — no brand colour, the wallpaper carries the colour.
 */
const Switch: React.FC<{ on: boolean; label: string; onToggle: () => void }> = ({
  on,
  label,
  onToggle,
}) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    aria-label={label}
    className={`relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full
      transition-colors duration-200 cursor-pointer ${on ? 'bg-white/90' : 'bg-white/20'}`}
  >
    <span
      className={`inline-block h-[13px] w-[13px] rounded-full transition-transform duration-200
        ${on ? 'translate-x-[15px] bg-neutral-900' : 'translate-x-[2.5px] bg-white'}`}
    />
  </button>
);

const ToggleRow: React.FC<{
  label: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}> = ({ label, description, on, onToggle }) => (
  <div className="flex items-center justify-between gap-4 px-3.5 py-3 rounded-2xl hover:bg-white/[0.04] transition-colors duration-150">
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-white/90 leading-tight">{label}</p>
      <p className="text-[11.5px] text-white/45 mt-1 leading-snug">{description}</p>
    </div>
    <Switch on={on} label={label} onToggle={onToggle} />
  </div>
);

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  onExport,
  onImport,
  quotaExceeded,
  cleanMode,
  onToggleCleanMode,
  carouselMode,
  onToggleCarousel,
}) => {
  const [unsplashKey, setUnsplashKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation state
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setEntering(true)));
    } else if (visible) {
      setEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    chrome.storage.sync.get(['unsplashKey'], (result) => {
      const key = result.unsplashKey ?? '';
      setUnsplashKey(key);
      setSavedKey(key);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const dirty = unsplashKey.trim() !== savedKey.trim();

  const handleKeySave = () => {
    if (!dirty) return;
    chrome.storage.sync.set({ unsplashKey: unsplashKey.trim() }, () => {
      setSavedKey(unsplashKey.trim());
      onKeySaved();
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImport(file);
    if (result.error) {
      setImportResult(result.error);
    } else {
      setImportResult(t('importedN').replace('{n}', String(result.imported)));
    }
    setTimeout(() => setImportResult(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop — dims the photo without blurring it */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ease-out
          ${entering ? 'bg-black/20 opacity-100' : 'bg-black/0 opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('settings')}
        onTransitionEnd={() => { if (!entering) setVisible(false); }}
        className={`fixed top-16 right-4 z-50 w-[344px]
          rounded-3xl overflow-hidden
          bg-neutral-950/35 backdrop-blur-xl
          shadow-[0_16px_50px_-20px_rgba(0,0,0,0.6)]
          text-white
          transition-all duration-200 ease-out
          ${entering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1.5 scale-[0.98]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pl-5 pr-3 pt-4 pb-1">
          <h3 className="text-[15px] font-medium tracking-tight text-white/95">{t('settings')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Modes */}
        <div className="px-1.5 py-1.5">
          <ToggleRow
            label={t('cleanMode')}
            description={t('cleanModeDesc')}
            on={!!cleanMode}
            onToggle={() => onToggleCleanMode?.()}
          />
          <ToggleRow
            label={t('carouselMode')}
            description={t('carouselModeDesc')}
            on={!!carouselMode}
            onToggle={() => onToggleCarousel?.()}
          />
        </div>

        {/* Source */}
        <div className="px-5 pt-3 pb-1">
          <label htmlFor="unsplash-key" className="block text-[11.5px] text-white/45 mb-2">
            {t('unsplashApiKey')}
          </label>
          <div className="flex gap-2">
            <input
              id="unsplash-key"
              type="text"
              spellCheck={false}
              autoComplete="off"
              className="flex-1 min-w-0 px-3 py-2 text-[13px] rounded-xl
                bg-white/[0.08] text-white/90 placeholder:text-white/30
                focus:outline-none focus:bg-white/[0.12] focus:ring-1 focus:ring-white/25
                transition-colors duration-150"
              placeholder={t('pasteKey')}
              value={unsplashKey}
              onChange={e => setUnsplashKey(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleKeySave(); }}
            />
            <button
              type="button"
              onClick={handleKeySave}
              disabled={!dirty}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap
                transition-colors duration-150 cursor-pointer
                ${dirty
                  ? 'bg-white text-neutral-900 hover:bg-white/90'
                  : 'bg-white/[0.06] text-white/35 cursor-default'}`}
            >
              {justSaved ? (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8.5l3.5 3.5L13 4" />
                </svg>
              ) : (
                t('save')
              )}
            </button>
          </div>

          {quotaExceeded && (
            <p className="flex items-start gap-2 mt-2.5 text-[11.5px] text-amber-200/80 leading-snug">
              <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-amber-300/80 shrink-0" />
              <span>
                {t('trialExhausted')}. {t('getOwnKeyPrefix')}{' '}
                <a
                  href="https://unsplash.com/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-amber-100 transition-colors"
                >
                  {t('unsplashDevelopers')}
                </a>{' '}
                {t('toContinue')}
              </span>
            </p>
          )}
        </div>

        {/* Favorites */}
        <div className="px-5 pt-4 pb-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExport}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px]
                bg-white/[0.08] text-white/85 hover:bg-white/[0.14] transition-colors duration-150 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8m0 0l-2.5-2.5M8 10l2.5-2.5M3 12.5v1a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5v-1" />
              </svg>
              {t('exportFavorites')}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px]
                bg-white/[0.08] text-white/85 hover:bg-white/[0.14] transition-colors duration-150 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 14V6m0 0L5.5 8.5M8 6l2.5 2.5M3 3.5v-1A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v1" />
              </svg>
              {t('importFavorites')}
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
            <p className="mt-2.5 text-[11.5px] text-white/60">{importResult}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsMenu;
