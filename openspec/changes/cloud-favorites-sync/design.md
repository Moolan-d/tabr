## Context

Tabr stores user favorites in `chrome.storage.local` via `FavoritesService`. This data is lost on extension uninstall, browser data clear, or device migration. The goal is to add cloud persistence with Google Drive as the primary backend, while keeping the extension fully functional offline.

## Goals / Non-Goals

**Goals:**
- Favorites persist across devices and survive local data loss
- Sync is invisible during normal use — local-first, cloud is background
- Works offline, degrades gracefully when Drive access is denied
- Manual export/import as zero-dependency backup

**Non-Goals:**
- Real-time multi-device sync (debounce push is sufficient)
- Syncing display cache or preload queue (only favorites)
- User accounts or custom backend (Google account is enough)
- Image file storage (only metadata, images stay on Unsplash)

## Decisions

### 1. Cloud backend: Google Drive API via `chrome.identity`

**Why:** Users are already signed into Google in Chrome. `chrome.identity.getAuthToken()` provides OAuth with zero registration flow. `drive.file` scope limits access to files the extension creates.

**Alternative considered:** Supabase/Firebase — requires separate auth, backend maintenance, and user registration. Overkill for this use case.

### 2. Storage location: Drive App Folder

The extension writes to a hidden app-specific folder (`appDataFolder`) that users don't see in their Drive. Single JSON file: `tabr_favorites.json`.

**Why:** Clean separation, no clutter in user's Drive root. File is ~40KB even at 100+ favorites.

### 3. Sync strategy: local-first with debounce push

```
User action (add/remove favorite)
    │
    ▼
Write to chrome.storage.local  ← immediate, always works
    │
    ▼
Set dirty flag + debounce timer (5s)
    │  (if more changes arrive, reset timer)
    ▼
Push full favorites JSON to Drive
    │
    ▼
Clear dirty flag
```

**Why:** Local writes never block on network. Debounce avoids hammering Drive API on rapid additions. Full-file push is simple and safe at this data size.

### 4. Conflict resolution: union merge by URL

On init (extension load), pull Drive file. Merge with local: any URL present in either set is kept. No deletes are lost.

**Why:** Favorites are additive by nature. Union merge is simple and correct — the worst case is a user sees a favorite they thought they removed, which is benign.

### 5. `CloudProvider` interface for extensibility

```typescript
interface CloudProvider {
  id: string;
  isAvailable(): Promise<boolean>;
  pull(): Promise<FavoritePhoto[] | null>;
  push(favorites: FavoritePhoto[]): Promise<void>;
}
```

Default implementation is `GoogleDriveProvider`. `NoneProvider` returns `isAvailable: false` for when user denies Drive permission.

### 6. `FavoritePhoto` schema simplification

```typescript
interface FavoritePhoto {
  url: string;
  photoName: string;
  source: string;
}
```

Remove `photographerLink`, `originalLink`, `savedAt`. Attribution links can be derived from the photo URL when needed. `savedAt` was unused for display or logic.

### 7. Data migration

On first load after upgrade, detect old-format favorites (have `savedAt` field) and transform to new format. `photoName` defaults to `""` for migrated entries (Unsplash doesn't expose a title per-photo via the random endpoint — this can be populated on next fetch).

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Drive API rate limit (200 req/100s per user) | Debounce push, not per-change. Single-file push, not incremental. |
| User denies Drive permission | Fall back to local-only + show export prompt in Settings |
| Drive file deleted externally | On pull failure, treat as empty cloud, push local state |
| Old favorites migration loses `savedAt` | Field was unused; no functional impact |
| `photoName` empty for migrated data | Populate lazily when photo is displayed again |
| OAuth token expiry | `chrome.identity.getAuthToken` handles refresh automatically |

## Migration Plan

1. Deploy code with migration logic (detect old schema → transform)
2. First extension load: migrate local data, attempt Drive pull + merge
3. Rollback: revert code, old favorites still intact in `chrome.storage.local`
