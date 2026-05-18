## Why

User favorites are stored in `chrome.storage.local`, which is scoped to a single browser profile. Data is lost on extension uninstall, browser data clear, or device switch. Since favorites represent personal curation effort, losing them is a poor experience. Adding Google Drive sync preserves favorites across devices and survives local data loss.

## What Changes

- Simplify `FavoritePhoto` to `{ url, photoName, source }` — remove `photographerLink`, `originalLink`, `savedAt`
- Add `CloudProvider` interface for pluggable cloud backends
- Implement `GoogleDriveProvider` using `chrome.identity` + Google Drive API (`drive.file` scope)
- Add debounce sync: write local immediately, push to Drive after 5s idle
- Add conflict resolution: merge by URL (union of both sets)
- Graceful fallback: when Drive permission is denied, prompt user to export favorites as JSON
- Add export/import as a manual backup mechanism (always available, no cloud required)

## Capabilities

### New Capabilities
- `cloud-sync`: Google Drive sync for favorites — OAuth via `chrome.identity`, app-folder storage, debounce push, union-merge conflict resolution
- `favorites-export`: Manual export/import of favorites as JSON file (zero-dependency fallback)

### Modified Capabilities

## Impact

- `src/providers/types.ts` — `FavoritePhoto` interface changes (breaking for stored data, needs migration)
- `src/services/favorites.ts` — add cloud sync layer, adjust to new `FavoritePhoto` shape
- `src/components/SettingsMenu.tsx` — add sync status indicator and export/import controls
- `wxt.config.ts` — add `identity` permission and Drive API scope to manifest
- Existing favorites in `chrome.storage.local` need one-time migration to new schema
