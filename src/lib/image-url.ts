/**
 * Helpers for working with imgix-style image URLs (Unsplash, Pixabay, ...).
 *
 * Unsplash serves photos through imgix, so `w`, `q` and `auto` query params
 * let us request a right-sized, modern-format variant of the same photo instead
 * of downloading the full-resolution original. URLs that don't support these
 * params are returned unchanged.
 */

/** Smallest width we'll ever request for a background. */
const MIN_BACKGROUND_WIDTH = 1280;
/** Largest width we'll request, to keep 5K/Retina screens from pulling giant files. */
const MAX_BACKGROUND_WIDTH = 3840;

/** Gallery grid thumbnails. */
export const THUMBNAIL_WIDTH = 400;

/**
 * Return `url` with resize params applied. Existing `w`/`q` params are
 * overridden, so this is safe to call on an already-processed URL (e.g. to
 * derive a thumbnail from a background-sized URL).
 */
export function sizedImageUrl(url: string, width: number, quality = 80): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(Math.round(width)));
    parsed.searchParams.set('q', String(quality));
    parsed.searchParams.set('auto', 'format');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Background width in device pixels for the current screen, clamped to a sane
 * range. Falls back to 1920 when there is no `window` (e.g. during build).
 */
export function backgroundWidth(): number {
  if (typeof window === 'undefined') return 1920;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(window.innerWidth * dpr);
  return Math.min(MAX_BACKGROUND_WIDTH, Math.max(MIN_BACKGROUND_WIDTH, width));
}
