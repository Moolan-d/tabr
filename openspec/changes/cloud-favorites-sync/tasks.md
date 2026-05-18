## 1. Data Model & Migration

- [x] 1.1 Simplify `FavoritePhoto` in `src/providers/types.ts`: keep only `url`, `photoName`, `source`
- [x] 1.2 Update `FavoritesService` to work with new `FavoritePhoto` shape
- [x] 1.3 Add one-time migration logic: detect old format (has `savedAt` or `photographerLink`) → transform to new schema, default `photoName` to `""`
- [x] 1.4 Update all components that reference removed `FavoritePhoto` fields (`savedAt`, `photographerLink`, `originalLink`)

## 2. CloudProvider Interface & Google Drive

- [x] 2.1 Create `src/services/cloud/types.ts`: define `CloudProvider` interface (`id`, `isAvailable`, `pull`, `push`)
- [x] 2.2 Create `src/services/cloud/google-drive.ts`: implement `GoogleDriveProvider` using `chrome.identity.getAuthToken` and Drive API (`appDataFolder`, single file `tabr_favorites.json`)
- [x] 2.3 Create `src/services/cloud/none.ts`: `NoneProvider` that returns `isAvailable: false`
- [x] 2.4 Add `identity` permission and Drive host permission to manifest in `wxt.config.ts`

## 3. Sync Layer

- [x] 3.1 Add debounce push logic to `FavoritesService`: after any add/remove, set dirty flag and 5s debounce timer → push full list to Drive
- [x] 3.2 Add init sync: on extension load, pull from Drive and merge with local by URL (union)
- [x] 3.3 Handle Drive pull failures gracefully (network error → continue local-only, no data loss)
- [x] 3.4 Handle Drive file missing/empty → push local state as source of truth

## 4. Export / Import

- [x] 4.1 Add export function: collect all favorites → download as `tabr_favorites_<date>.json`
- [x] 4.2 Add import function: read JSON file → validate schema → merge by URL with existing favorites
- [x] 4.3 Show import result feedback (count of new favorites added, or error message for invalid file)

## 5. UI Integration

- [x] 5.1 Add sync status indicator in `SettingsMenu` (connected / local-only)
- [x] 5.2 Add "Export Favorites" and "Import Favorites" buttons in `SettingsMenu`
- [x] 5.3 Show backup recommendation prompt when Drive permission is denied

## 6. Testing & Cleanup

- [x] 6.1 Test migration: old-format favorites correctly transformed on first load
- [x] 6.2 Test sync: add favorite → verify Drive push after debounce
- [x] 6.3 Test conflict resolution: two different local states merge correctly by URL
- [x] 6.4 Test fallback: Drive denied → local-only mode works, export available
