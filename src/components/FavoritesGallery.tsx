import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FavoritePhoto } from '../providers/types';
import { t } from '../i18n/translations';
import { sizedImageUrl, THUMBNAIL_WIDTH } from '../lib/image-url';

interface FavoritesGalleryProps {
  isOpen: boolean;
  favorites: FavoritePhoto[];
  currentUrl?: string;
  onClose: () => void;
  onSetBackground: (fav: FavoritePhoto) => void;
  onRemove: (url: string) => Promise<{ item: FavoritePhoto; index: number } | null>;
  onRestore: (item: FavoritePhoto, index: number) => Promise<void>;
}

type UndoEntry = { item: FavoritePhoto; index: number };

const TrashIcon: React.FC = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4.5h10M6.5 4.5V3.5A1 1 0 017.5 2.5h1A1 1 0 019.5 3.5v1M5 4.5l.5 8a1 1 0 001 1h3a1 1 0 001-1l.5-8" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

const ChevronIcon: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
  <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'left' ? 'M10 3l-5 5 5 5' : 'M6 3l5 5-5 5'} />
  </svg>
);

const FavoritesGallery: React.FC<FavoritesGalleryProps> = ({
  isOpen,
  favorites,
  currentUrl,
  onClose,
  onSetBackground,
  onRemove,
  onRestore,
}) => {
  // Animation state (mirrors SettingsMenu)
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);

  // Lightbox index into the visible (newest-first) list; null = grid only
  const [lightbox, setLightbox] = useState<number | null>(null);

  const [undo, setUndo] = useState<UndoEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Newest first — carousel uses this same order
  const ordered = favorites.map((fav, index) => ({ fav, index })).reverse();

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setEntering(true)));
    } else if (visible) {
      setEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setLightbox(null);
      setUndo(null);
    }
  }, [isOpen]);

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const step = useCallback((delta: number) => {
    setLightbox(prev => {
      if (prev === null || ordered.length === 0) return prev;
      return (prev + delta + ordered.length) % ordered.length;
    });
  }, [ordered.length]);

  // Esc: close the lightbox first, otherwise close the gallery
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightbox !== null) closeLightbox();
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, lightbox, closeLightbox, onClose]);

  const handleDelete = async (fav: FavoritePhoto) => {
    const removed = await onRemove(fav.url);
    if (!removed) return;

    setLightbox(prev => {
      if (prev === null) return prev;
      // Keep the position, clamped to the shrunken list
      return Math.min(prev, Math.max(0, ordered.length - 2));
    });

    setUndo(removed);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 3000);
  };

  const handleUndo = async () => {
    if (!undo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const entry = undo;
    setUndo(null);
    await onRestore(entry.item, entry.index);
  };

  if (!visible) return null;

  const current = lightbox !== null ? ordered[lightbox] : undefined;
  const isCurrent = !!current && current.fav.url === currentUrl;

  return (
    <>
      {/* Backdrop — dims the photo, keeps it crisp */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ease-out
          ${entering ? 'bg-black/60 opacity-100' : 'bg-black/0 opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('gallery')}
        onTransitionEnd={() => { if (!entering) setVisible(false); }}
        className={`fixed inset-0 z-50 flex flex-col transition-all duration-200 ease-out
          ${entering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        {/* Header */}
        <div className="flex items-center pl-6 pr-16 pt-5 pb-3 shrink-0">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[15px] font-medium tracking-tight text-white/95">{t('gallery')}</h2>
            <span className="text-[11.5px] text-white/45">
              {t('favoritesCount').replace('{n}', String(favorites.length))}
            </span>
          </div>
        </div>

        {/* Close — sits exactly on the settings button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white backdrop-blur-subtle transition-colors duration-150 cursor-pointer"
        >
          <CloseIcon />
        </button>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-20 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.08] flex items-center justify-center mb-1">
              <svg className="w-6 h-6 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-white/90">{t('favoritesEmpty')}</p>
            <p className="text-[11.5px] text-white/45 max-w-xs leading-relaxed">{t('favoritesEmptyHint')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-28">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {ordered.map(({ fav }, i) => (
                <div key={fav.url} className="group relative aspect-video">
                  <button
                    type="button"
                    onClick={() => setLightbox(i)}
                    aria-label={fav.photoName || t('unknownPhotographer')}
                    className={`w-full h-full rounded-2xl overflow-hidden bg-white/[0.04] transition-all duration-150 cursor-pointer
                      ring-1 ${fav.url === currentUrl ? 'ring-white/70' : 'ring-white/[0.08] hover:ring-white/25'}`}
                  >
                    <img
                      src={sizedImageUrl(fav.url, THUMBNAIL_WIDTH, 70)}
                      alt={fav.photoName || t('unknownPhotographer')}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Bottom caption */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent
                      px-2.5 pt-6 pb-1.5 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <p className="text-[11.5px] text-white/90 truncate">
                        {fav.photoName || t('unknownPhotographer')}
                      </p>
                    </div>
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(fav)}
                    aria-label={t('deleteFavorite')}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/45 text-white/85
                      opacity-0 group-hover:opacity-100 hover:bg-black/65 transition-all duration-150 cursor-pointer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex flex-col bg-black/85"
          onClick={closeLightbox}
        >
          {/* Top bar */}
          <div
            className="flex items-center gap-4 pl-6 pr-16 py-4 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white/95 truncate">
                {current.fav.photoName || t('unknownPhotographer')}
              </p>
              <div className="flex gap-3 mt-1">
                {current.fav.photographerLink && (
                  <a
                    href={current.fav.photographerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] text-white/50 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    {current.fav.photoName}
                  </a>
                )}
                {current.fav.originalLink && (
                  <a
                    href={current.fav.originalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] text-white/50 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    {t('viewOriginal')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Close — same spot as the settings button */}
          <button
            type="button"
            onClick={closeLightbox}
            aria-label={t('close')}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-150 cursor-pointer"
          >
            <CloseIcon />
          </button>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center min-h-0 px-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t('prevPhoto')}
              className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-150 cursor-pointer disabled:opacity-30"
              disabled={ordered.length < 2}
            >
              <ChevronIcon dir="left" />
            </button>
            <img
              src={current.fav.url}
              alt={current.fav.photoName || t('unknownPhotographer')}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
            />
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t('nextPhoto')}
              className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-150 cursor-pointer disabled:opacity-30"
              disabled={ordered.length < 2}
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-center gap-2.5 py-5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onSetBackground(current.fav)}
              disabled={isCurrent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium
                bg-white text-neutral-900 hover:bg-white/90
                disabled:bg-white/10 disabled:text-white/45 disabled:cursor-default
                transition-colors duration-150 cursor-pointer"
            >
              {isCurrent && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8.5l3.5 3.5L13 4" />
                </svg>
              )}
              {isCurrent ? t('currentBackground') : t('setAsBackground')}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(current.fav)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium
                bg-white/[0.08] text-white/90 hover:bg-red-500/80 transition-colors duration-150 cursor-pointer"
            >
              <TrashIcon />
              {t('deleteFavorite')}
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4
          px-4 py-2.5 rounded-full bg-neutral-900/95 text-[13px] text-white/90 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)]">
          <span>{t('deletedFavorite')}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-medium text-white underline underline-offset-2 hover:text-white/70 transition-colors cursor-pointer"
          >
            {t('undo')}
          </button>
        </div>
      )}
    </>
  );
};

export default FavoritesGallery;
